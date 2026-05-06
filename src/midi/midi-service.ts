import { bankStore } from '../store/bank-store.ts';
import { parseSyxFile, generateSyxFile } from '../sysex/bulk-dump.ts';
import { parseSingleVoiceSysEx, generateSingleVoiceSysEx } from '../sysex/single-voice.ts';
import { SYSEX_START, SYSEX_END, YAMAHA_ID } from '../sysex/constants.ts';
import type { DX7Voice } from '../model/types.ts';
import { toDX7Name } from '../utils/ascii.ts';

export interface MidiPortInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: MIDIPortDeviceState;
}

export interface MidiState {
  available: boolean;
  inputs: MidiPortInfo[];
  outputs: MidiPortInfo[];
  selectedInputId: string | null;
  selectedOutputId: string | null;
  connected: boolean;
  channel: number;
  lastError: string | null;
}

type MidiStateListener = (state: MidiState) => void;

const STORAGE_KEY = 'fmatelier-midi';

/** Convert a DX7Voice to a flat array of 155 VCED parameter values.
 *  VCED order: OP6, OP5, OP4, OP3, OP2, OP1, then common + name. */
function voiceToVCEDParams(voice: DX7Voice): number[] {
  const params: number[] = [];
  for (let op = 5; op >= 0; op--) {
    const o = voice.operators[op]!;
    params.push(
      o.egRate[0], o.egRate[1], o.egRate[2], o.egRate[3],
      o.egLevel[0], o.egLevel[1], o.egLevel[2], o.egLevel[3],
      o.kbdLevelScalingBreakpoint,
      o.kbdLevelScalingLeftDepth,
      o.kbdLevelScalingRightDepth,
      o.kbdLevelScalingLeftCurve,
      o.kbdLevelScalingRightCurve,
      o.kbdRateScaling,
      o.ampModSensitivity,
      o.keyVelocitySensitivity,
      o.outputLevel,
      o.oscMode,
      o.freqCoarse,
      o.freqFine,
      o.detune,
    );
  }
  const c = voice.common;
  params.push(
    c.pitchEgRate[0], c.pitchEgRate[1], c.pitchEgRate[2], c.pitchEgRate[3],
    c.pitchEgLevel[0], c.pitchEgLevel[1], c.pitchEgLevel[2], c.pitchEgLevel[3],
    c.algorithm,
    c.feedback,
    c.oscKeySync,
    c.lfoSpeed,
    c.lfoDelay,
    c.lfoPitchModDepth,
    c.lfoAmpModDepth,
    c.lfoSync,
    c.lfoWave,
    c.lfoPitchModSensitivity,
    c.transpose,
  );
  const name = toDX7Name(c.name);
  for (let i = 0; i < 10; i++) {
    params.push(name.charCodeAt(i));
  }
  return params;
}

class MidiService {
  private state: MidiState;
  private listeners: Set<MidiStateListener> = new Set();
  private access: MIDIAccess | null = null;
  private currentInput: MIDIInput | null = null;
  private currentOutput: MIDIOutput | null = null;
  private sendMuteUntil = 0;
  private pendingVoiceSend: ReturnType<typeof setTimeout> | null = null;
  private lastVoiceSnapshot: number[] | null = null;
  private lastVoiceIndex = -1;
  private suppressParamSend = false;

  constructor() {
    this.state = {
      available: false,
      inputs: [],
      outputs: [],
      selectedInputId: null,
      selectedOutputId: null,
      connected: false,
      channel: 0,
      lastError: null,
    };
  }

  getState(): Readonly<MidiState> {
    return this.state;
  }

  subscribe(listener: MidiStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  async init(): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      this.state = { ...this.state, available: false, lastError: 'Web MIDI not supported' };
      this.notify();
      return;
    }

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: true });
      this.state = { ...this.state, available: true, lastError: null };
      this.refreshPorts();
      this.access.addEventListener('statechange', this._onStateChange);
      this.restoreFromStorage();
      this.initStoreSubscription();
    } catch (err) {
      this.state = {
        ...this.state,
        available: false,
        lastError: err instanceof Error ? err.message : 'MIDI access denied',
      };
      this.notify();
    }
  }

  selectInput(id: string | null): void {
    if (this.currentInput) {
      this.currentInput.removeEventListener('midimessage', this._onMidiMessage);
      this.currentInput.close();
      this.currentInput = null;
    }

    this.state = { ...this.state, selectedInputId: id };

    if (id && this.access) {
      const port = this.access.inputs.get(id);
      if (port) {
        port.open().then(() => {
          this.currentInput = port;
          port.addEventListener('midimessage', this._onMidiMessage);
          this.updateConnected();
        });
      }
    }

    this.saveToStorage();
    this.updateConnected();
    this.notify();
  }

  selectOutput(id: string | null): void {
    if (this.currentOutput) {
      this.currentOutput.close();
      this.currentOutput = null;
    }

    this.state = { ...this.state, selectedOutputId: id };

    if (id && this.access) {
      const port = this.access.outputs.get(id);
      if (port) {
        port.open().then(() => {
          this.currentOutput = port;
          this.updateConnected();
        });
      }
    }

    this.saveToStorage();
    this.updateConnected();
    this.notify();
  }

  setChannel(ch: number): void {
    this.state = { ...this.state, channel: Math.max(0, Math.min(15, ch)) };
    this.saveToStorage();
    this.notify();
  }

  sendCurrentVoice(): void {
    if (!this.currentOutput) return;
    this.sendMuteUntil = Date.now() + 500;
    const voice = bankStore.getCurrentVoice();
    const sysex = generateSingleVoiceSysEx(voice, this.state.channel);
    this.currentOutput.send(sysex);
    this.lastVoiceSnapshot = voiceToVCEDParams(voice);
  }

  sendBank(): void {
    if (!this.currentOutput) return;
    this.sendMuteUntil = Date.now() + 5000;
    const { bank } = bankStore.getState();
    const sysex = generateSyxFile(bank);
    sysex[2] = this.state.channel;
    // Schedule 200ms in future to give OS MIDI driver time to prepare buffer
    this.currentOutput.send(sysex, performance.now() + 200);
  }

  sendProgramChange(program: number): void {
    if (!this.currentOutput) return;
    this.currentOutput.send([0xc0 | this.state.channel, program & 0x7f]);
  }

  /** Request single voice dump (edit buffer) from connected device */
  requestVoiceDump(): void {
    if (!this.currentOutput) return;
    this.currentOutput.send([SYSEX_START, YAMAHA_ID, 0x20 | this.state.channel, 0x00, SYSEX_END]);
  }

  /** Request bulk dump (all 32 voices) from connected device */
  requestBankDump(): void {
    if (!this.currentOutput) return;
    this.currentOutput.send([SYSEX_START, YAMAHA_ID, 0x20 | this.state.channel, 0x09, SYSEX_END]);
  }

  /** Subscribe to bankStore and send parameter changes on edits */
  private initStoreSubscription(): void {
    bankStore.subscribe(() => {
      if (!this.currentOutput || this.suppressParamSend) return;

      const state = bankStore.getState();
      const voiceIndex = state.selectedVoiceIndex;

      // Voice selection changed — send Program Change, then voice after delay.
      // The 200ms gap between PC and Voice SysEx avoids collision with the
      // DX7's SYS INFO AVAIL response triggered by Program Change.
      if (voiceIndex !== this.lastVoiceIndex) {
        this.lastVoiceIndex = voiceIndex;
        const voice = bankStore.getCurrentVoice();
        this.lastVoiceSnapshot = voiceToVCEDParams(voice);
        this.sendProgramChange(voiceIndex);
        const sysex = generateSingleVoiceSysEx(voice, this.state.channel);
        // Use setTimeout for reliable delay (timestamp scheduling can be unreliable)
        if (this.pendingVoiceSend) clearTimeout(this.pendingVoiceSend);
        this.pendingVoiceSend = setTimeout(() => {
          this.pendingVoiceSend = null;
          this.currentOutput?.send(sysex);
        }, 200);
        this.sendMuteUntil = Date.now() + 800;
        return;
      }

      const currentParams = voiceToVCEDParams(bankStore.getCurrentVoice());
      if (this.lastVoiceSnapshot) {
        for (let i = 0; i < currentParams.length; i++) {
          if (currentParams[i] !== this.lastVoiceSnapshot[i]) {
            this.sendParamChange(i, currentParams[i]!);
          }
        }
      }
      this.lastVoiceSnapshot = currentParams;
    });
  }

  /** Send a DX7 parameter change SysEx: F0 43 1n gg pp dd F7 */
  private sendParamChange(paramNumber: number, value: number): void {
    if (!this.currentOutput) return;
    const ch = this.state.channel;
    if (paramNumber <= 127) {
      this.currentOutput.send([SYSEX_START, YAMAHA_ID, 0x10 | ch, 0x00, paramNumber, value & 0x7f, SYSEX_END]);
    } else {
      this.currentOutput.send([SYSEX_START, YAMAHA_ID, 0x10 | ch, 0x01, paramNumber - 128, value & 0x7f, SYSEX_END]);
    }
  }

  private refreshPorts(): void {
    if (!this.access) return;

    const inputs: MidiPortInfo[] = [];
    for (const [id, port] of this.access.inputs) {
      inputs.push({
        id,
        name: port.name ?? 'Unknown',
        manufacturer: port.manufacturer ?? '',
        state: port.state,
      });
    }

    const outputs: MidiPortInfo[] = [];
    for (const [id, port] of this.access.outputs) {
      outputs.push({
        id,
        name: port.name ?? 'Unknown',
        manufacturer: port.manufacturer ?? '',
        state: port.state,
      });
    }

    this.state = { ...this.state, inputs, outputs };

    if (this.state.selectedInputId && !this.access.inputs.has(this.state.selectedInputId)) {
      this.selectInput(null);
    }
    if (this.state.selectedOutputId && !this.access.outputs.has(this.state.selectedOutputId)) {
      this.selectOutput(null);
    }

    this.notify();
  }

  private updateConnected(): void {
    const connected = this.currentInput !== null && this.currentOutput !== null;
    if (this.state.connected !== connected) {
      this.state = { ...this.state, connected };
      this.notify();
    }
  }

  private _onStateChange = (): void => {
    this.refreshPorts();

    if (this.state.selectedInputId && !this.currentInput) {
      this.selectInput(this.state.selectedInputId);
    }
    if (this.state.selectedOutputId && !this.currentOutput) {
      this.selectOutput(this.state.selectedOutputId);
    }
  };

  private _onMidiMessage = (e: Event): void => {
    const midiEvent = e as MIDIMessageEvent;
    const data = midiEvent.data;
    if (!data || data.length === 0) return;
    // Skip Active Sensing (0xFE) and Clock (0xF8)
    if (data[0] === 0xfe || data[0] === 0xf8) return;

    // Suppress receive processing during/after send to avoid feedback
    if (Date.now() < this.sendMuteUntil) return;

    // Program Change: sync voice selection
    const status = data[0]! & 0xf0;
    if (status === 0xc0 && data.length >= 2) {
      const program = data[1]! & 0x7f;
      if (program < 32) {
        this.suppressParamSend = true;
        bankStore.selectVoice(program);
        this.suppressParamSend = false;
        this.lastVoiceIndex = program;
        this.lastVoiceSnapshot = voiceToVCEDParams(bankStore.getCurrentVoice());
      }
      return;
    }

    // Only process SysEx
    if (data[0] !== SYSEX_START) return;
    if (data[data.length - 1] !== 0xf7) return;
    if (data[1] !== YAMAHA_ID) return;

    // Ignore dump request messages (sub-status high nibble = 0x20)
    // Only process data messages (sub-status high nibble = 0x00)
    const subStatus = data[2] ?? 0;
    if ((subStatus & 0xf0) !== 0x00) {
      return;
    }

    const format = data[3];

    // Bulk dump: format byte = 0x09
    if (format === 0x09) {
      try {
        const bank = parseSyxFile(new Uint8Array(data));
        const prevIdx = bankStore.getState().selectedVoiceIndex;
        this.suppressParamSend = true;
        bankStore.loadBank(bank, 'MIDI Receive');
        // Restore voice selection from before the bulk receive
        if (prevIdx > 0) bankStore.selectVoice(prevIdx);
        this.suppressParamSend = false;
        const selectedIdx = bankStore.getState().selectedVoiceIndex;
        this.lastVoiceIndex = selectedIdx;
        this.lastVoiceSnapshot = voiceToVCEDParams(bankStore.getCurrentVoice());
        this.sendMuteUntil = Date.now() + 2000;
        // After DX7 transmits a bulk dump, the first PC+Voice send is
        // sometimes ignored. Send a priming PC+Voice to absorb this,
        // so the user's first voice selection works reliably.
        setTimeout(() => {
          if (!this.currentOutput) return;
          const voice = bankStore.getCurrentVoice();
          this.sendProgramChange(selectedIdx);
          setTimeout(() => {
            this.currentOutput?.send(generateSingleVoiceSysEx(voice, this.state.channel));
          }, 200);
        }, 500);
      } catch { /* ignore malformed bulk dump */ }
      return;
    }

    // Single voice: format 0x00, byte count 0x01 0x1B
    if (format === 0x00 && data[4] === 0x01 && data[5] === 0x1b) {
      try {
        const voice = parseSingleVoiceSysEx(new Uint8Array(data));
        const bankState = bankStore.getState();

        // Try to match received voice to a bank voice by name (sync selection)
        const matchIndex = bankState.bank.voices.findIndex(
          (v) => v.common.name === voice.common.name,
        );
        this.suppressParamSend = true;
        if (matchIndex >= 0) {
          if (matchIndex !== bankState.selectedVoiceIndex) {
            bankStore.selectVoice(matchIndex);
          }
          this.lastVoiceIndex = matchIndex;
        } else {
          // No match — load into current slot (e.g. importing a new voice)
          bankStore.loadVoice(voice);
        }
        this.suppressParamSend = false;
        this.lastVoiceSnapshot = voiceToVCEDParams(bankStore.getCurrentVoice());
      } catch { /* ignore malformed single voice */ }
      return;
    }
  };

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        inputId: this.state.selectedInputId,
        outputId: this.state.selectedOutputId,
        channel: this.state.channel,
      }));
    } catch { /* ignore */ }
  }

  private restoreFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { inputId?: string; outputId?: string; channel?: number };
      if (saved.channel !== undefined) {
        this.state = { ...this.state, channel: saved.channel };
      }
      if (saved.inputId) this.selectInput(saved.inputId);
      if (saved.outputId) this.selectOutput(saved.outputId);
    } catch { /* ignore */ }
  }
}

export const midiService = new MidiService();
