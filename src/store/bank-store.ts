import type { DX7Bank, DX7Voice, DX7Operator } from '../model/types.ts';
import { createDefaultBank, createDefaultVoice } from '../model/defaults.ts';

export interface BankState {
  bank: DX7Bank;
  selectedVoiceIndex: number;
  selectedOperator: number;
  dirty: boolean;
  fileName: string | null;
}

type StateListener = (state: BankState) => void;

const MAX_UNDO = 100;

class BankStore {
  private state: BankState;
  private undoStack: BankState[] = [];
  private redoStack: BankState[] = [];
  private listeners: Set<StateListener> = new Set();
  private voiceClipboard: DX7Voice | null = null;
  private opClipboard: DX7Operator | null = null;

  constructor() {
    this.state = {
      bank: createDefaultBank(),
      selectedVoiceIndex: 0,
      selectedOperator: 0,
      dirty: false,
      fileName: null,
    };
  }

  getState(): Readonly<BankState> {
    return this.state;
  }

  getCurrentVoice(): DX7Voice {
    return this.state.bank.voices[this.state.selectedVoiceIndex]!;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  selectVoice(index: number): void {
    if (index < 0 || index >= this.state.bank.voices.length) return;
    this.state = { ...this.state, selectedVoiceIndex: index };
    this.notify();
  }

  selectOperator(index: number): void {
    if (index < 0 || index >= 6) return;
    this.state = { ...this.state, selectedOperator: index };
    this.notify();
  }

  /** Set a parameter by dot-path. Example: "operators.0.egRate.2" or "common.algorithm" */
  setParam(path: string, value: number): void {
    this.pushUndo();
    const idx = this.state.selectedVoiceIndex;
    const voice = structuredClone(this.state.bank.voices[idx]!);
    setNestedValue(voice, path, value);
    this.state.bank.voices[idx] = voice;
    this.state = { ...this.state, dirty: true };
    this.notify();
  }

  /** Set voice name */
  setVoiceName(name: string): void {
    this.pushUndo();
    const idx = this.state.selectedVoiceIndex;
    const voice = structuredClone(this.state.bank.voices[idx]!);
    voice.common.name = name;
    this.state.bank.voices[idx] = voice;
    this.state = { ...this.state, dirty: true };
    this.notify();
  }

  /** Load a bank from parsed SysEx data */
  loadBank(bank: DX7Bank, fileName: string): void {
    this.pushUndo();
    this.state = {
      ...this.state,
      bank,
      fileName,
      dirty: false,
      selectedVoiceIndex: 0,
      selectedOperator: 0,
    };
    this.redoStack = [];
    this.notify();
  }

  /** Copy voice from one slot to another */
  copyVoice(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    this.pushUndo();
    this.state.bank.voices[toIndex] = structuredClone(this.state.bank.voices[fromIndex]!);
    this.state = { ...this.state, dirty: true };
    this.notify();
  }

  /** Create a new empty bank (all INIT VOICE) */
  newBank(): void {
    this.pushUndo();
    this.state = {
      bank: createDefaultBank(),
      selectedVoiceIndex: 0,
      selectedOperator: 0,
      dirty: false,
      fileName: null,
    };
    this.redoStack = [];
    this.notify();
  }

  /** Copy current voice to clipboard */
  copyCurrentVoice(): void {
    this.voiceClipboard = structuredClone(this.getCurrentVoice());
  }

  /** Paste clipboard voice to current slot */
  pasteVoice(): void {
    if (!this.voiceClipboard) return;
    this.pushUndo();
    this.state.bank.voices[this.state.selectedVoiceIndex] = structuredClone(this.voiceClipboard);
    this.state = { ...this.state, dirty: true };
    this.notify();
  }

  get hasClipboard(): boolean {
    return this.voiceClipboard !== null;
  }

  /** Copy current operator to clipboard */
  copyCurrentOperator(): void {
    const voice = this.getCurrentVoice();
    this.opClipboard = structuredClone(voice.operators[this.state.selectedOperator]!);
  }

  /** Paste clipboard operator to current operator slot */
  pasteOperator(): void {
    if (!this.opClipboard) return;
    this.pushUndo();
    const idx = this.state.selectedVoiceIndex;
    const voice = structuredClone(this.state.bank.voices[idx]!);
    voice.operators[this.state.selectedOperator] = structuredClone(this.opClipboard);
    this.state.bank.voices[idx] = voice;
    this.state = { ...this.state, dirty: true };
    this.notify();
  }

  get hasOpClipboard(): boolean {
    return this.opClipboard !== null;
  }

  /** Load a single voice into the current slot (e.g., from MIDI receive) */
  loadVoice(voice: DX7Voice): void {
    this.pushUndo();
    this.state.bank.voices[this.state.selectedVoiceIndex] = voice;
    this.state = { ...this.state, dirty: true };
    this.notify();
  }

  /** Initialize current voice to default */
  initVoice(): void {
    this.pushUndo();
    this.state.bank.voices[this.state.selectedVoiceIndex] = createDefaultVoice();
    this.state = { ...this.state, dirty: true };
    this.notify();
  }

  undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(structuredClone(this.state));
    this.state = prev;
    this.notify();
  }

  redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(structuredClone(this.state));
    this.state = next;
    this.notify();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private pushUndo(): void {
    this.undoStack.push(structuredClone(this.state));
    this.redoStack = [];
    if (this.undoStack.length > MAX_UNDO) {
      this.undoStack.shift();
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

/** Set a value at a dot-separated path on an object */
function setNestedValue(obj: unknown, path: string, value: number): void {
  const keys = path.split('.');
  let current: unknown = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (current !== null && typeof current === 'object') {
      current = (current as Record<string, unknown>)[key];
    }
  }
  const lastKey = keys[keys.length - 1]!;
  if (current !== null && typeof current === 'object') {
    (current as Record<string, unknown>)[lastKey] = value;
  }
}

/** Singleton store instance */
export const bankStore = new BankStore();
