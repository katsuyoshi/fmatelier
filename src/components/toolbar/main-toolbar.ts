import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bankStore, type BankState } from '../../store/bank-store.ts';
import { parseSyxFile, generateSyxFile } from '../../sysex/bulk-dump.ts';
import { midiService, type MidiState } from '../../midi/midi-service.ts';
import './midi-panel.ts';

@customElement('dx-toolbar')
export class MainToolbar extends LitElement {
  @state() declare fileName: string | null;
  @state() declare dirty: boolean;
  @state() declare midiConnected: boolean;
  @state() declare midiAvailable: boolean;
  @state() declare midiPanelOpen: boolean;

  private _unsub?: () => void;
  private _midiUnsub?: () => void;

  constructor() {
    super();
    this.fileName = null;
    this.dirty = false;
    this.midiConnected = false;
    this.midiAvailable = false;
    this.midiPanelOpen = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsub = bankStore.subscribe((s: BankState) => {
      this.fileName = s.fileName;
      this.dirty = s.dirty;
    });
    this._midiUnsub = midiService.subscribe((s: MidiState) => {
      this.midiConnected = s.connected;
      this.midiAvailable = s.available;
    });
    midiService.init();
    document.addEventListener('click', this._onDocClick, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
    this._midiUnsub?.();
    document.removeEventListener('click', this._onDocClick, true);
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .title {
      font-family: var(--font-mono);
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--color-accent);
    }

    .filename {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }

    .dirty {
      color: var(--color-accent);
    }

    .actions {
      display: flex;
      gap: var(--spacing-xs);
      margin-left: auto;
    }

    button {
      padding: 4px 12px;
      background: var(--color-bg-control);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      cursor: pointer;
    }

    button:hover {
      background: var(--color-bg-card);
      border-color: var(--color-accent);
    }

    button:active {
      opacity: 0.7;
    }

    @media (pointer: coarse) {
      button {
        padding: 8px 14px;
        font-size: 0.85rem;
      }
    }

    input[type='file'] {
      display: none;
    }

    .midi-wrapper {
      position: relative;
    }

    .midi-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .midi-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-text-muted);
    }

    .midi-dot.on {
      background: #4caf50;
      box-shadow: 0 0 4px #4caf50;
    }

    .midi-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 100;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
  `;

  render() {
    return html`
      <span class="title">FMAtelier</span>
      <span class="filename">
        ${this.fileName ?? 'New Bank'}${this.dirty ? html`<span class="dirty"> *</span>` : ''}
      </span>
      <div class="actions">
        <button @click=${this._newBank}>New</button>
        <button @click=${this._openFile}>Open</button>
        <button @click=${this._saveFile}>Save</button>
        <button @click=${() => bankStore.undo()} ?disabled=${!bankStore.canUndo}>Undo</button>
        <button @click=${() => bankStore.redo()} ?disabled=${!bankStore.canRedo}>Redo</button>
        <div class="midi-wrapper">
          <button class="midi-btn" @click=${this._toggleMidi}>
            <span class="midi-dot ${this.midiConnected ? 'on' : ''}"></span>
            MIDI
          </button>
          ${this.midiPanelOpen ? html`<dx-midi-panel class="midi-dropdown"></dx-midi-panel>` : ''}
        </div>
      </div>
      <input type="file" accept=".syx" id="file-input" @change=${this._onFileSelected} />
    `;
  }

  private _toggleMidi() {
    this.midiPanelOpen = !this.midiPanelOpen;
  }

  private _onDocClick = (e: MouseEvent) => {
    if (!this.midiPanelOpen) return;
    const wrapper = this.shadowRoot?.querySelector('.midi-wrapper');
    if (wrapper && !e.composedPath().includes(wrapper)) {
      this.midiPanelOpen = false;
    }
  };

  private _newBank() {
    if (this.dirty && !confirm('Unsaved changes will be lost. Continue?')) return;
    bankStore.newBank();
  }

  private _openFile() {
    this.shadowRoot?.querySelector<HTMLInputElement>('#file-input')?.click();
  }

  private async _onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    try {
      const bank = parseSyxFile(data);
      bankStore.loadBank(bank, file.name);
    } catch (err) {
      alert(`Failed to load file: ${err instanceof Error ? err.message : String(err)}`);
    }

    input.value = '';
  }

  private async _saveFile() {
    const state = bankStore.getState();
    const data = generateSyxFile(state.bank);

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: state.fileName ?? 'bank.syx',
          types: [{
            description: 'DX7 SysEx Bank',
            accept: { 'application/octet-stream': ['.syx'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }

    // Fallback for browsers without File System Access API
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.fileName ?? 'bank.syx';
    a.click();
    URL.revokeObjectURL(url);
  }
}
