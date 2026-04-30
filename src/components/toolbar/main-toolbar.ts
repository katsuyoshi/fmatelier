import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bankStore, type BankState } from '../../store/bank-store.ts';
import { parseSyxFile, generateSyxFile } from '../../sysex/bulk-dump.ts';

@customElement('dx-toolbar')
export class MainToolbar extends LitElement {
  @state() declare fileName: string | null;
  @state() declare dirty: boolean;

  private _unsub?: () => void;

  constructor() {
    super();
    this.fileName = null;
    this.dirty = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsub = bankStore.subscribe((s: BankState) => {
      this.fileName = s.fileName;
      this.dirty = s.dirty;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
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

    input[type='file'] {
      display: none;
    }
  `;

  render() {
    return html`
      <span class="title">DXEdit</span>
      <span class="filename">
        ${this.fileName ?? 'New Bank'}${this.dirty ? html`<span class="dirty"> *</span>` : ''}
      </span>
      <div class="actions">
        <button @click=${this._newBank}>New</button>
        <button @click=${this._openFile}>Open</button>
        <button @click=${this._saveFile}>Save</button>
        <button @click=${() => bankStore.undo()} ?disabled=${!bankStore.canUndo}>Undo</button>
        <button @click=${() => bankStore.redo()} ?disabled=${!bankStore.canRedo}>Redo</button>
      </div>
      <input type="file" accept=".syx" id="file-input" @change=${this._onFileSelected} />
    `;
  }

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

  private _saveFile() {
    const state = bankStore.getState();
    const data = generateSyxFile(state.bank);
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.fileName ?? 'bank.syx';
    a.click();
    URL.revokeObjectURL(url);
  }
}
