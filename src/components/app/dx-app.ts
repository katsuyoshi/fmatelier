import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { bankStore } from '../../store/bank-store.ts';
import { parseSyxFile, generateSyxFile } from '../../sysex/bulk-dump.ts';
import '../toolbar/main-toolbar.ts';
import '../bank/voice-list.ts';
import '../editor/voice-editor.ts';

@customElement('dx-app')
export class DxApp extends LitElement {
  static styles = css`
    :host {
      display: grid;
      height: 100vh;
      grid-template-rows: auto 1fr;
      grid-template-columns: 220px 1fr;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
    }

    header {
      grid-column: 1 / -1;
      padding: var(--spacing-xs) var(--spacing-md);
      background: var(--color-bg-panel);
      border-radius: var(--radius-md);
    }

    .sidebar {
      background: var(--color-bg-panel);
      border-radius: var(--radius-md);
      padding: var(--spacing-sm);
      overflow-y: auto;
      min-height: 0;
    }

    .main {
      background: var(--color-bg-panel);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      overflow-y: auto;
      min-height: 0;
    }

    @media (max-width: 900px) {
      :host {
        grid-template-columns: 180px 1fr;
      }
    }

    @media (max-width: 700px) {
      :host {
        height: auto;
        min-height: 100vh;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr;
      }

      .sidebar {
        max-height: 30vh;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dragover', this._onDragOver);
    this.addEventListener('drop', this._onDrop);
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('dragover', this._onDragOver);
    this.removeEventListener('drop', this._onDrop);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  render() {
    return html`
      <header>
        <dx-toolbar></dx-toolbar>
      </header>
      <aside class="sidebar">
        <dx-voice-list></dx-voice-list>
      </aside>
      <main class="main">
        <dx-voice-editor></dx-voice-editor>
      </main>
    `;
  }

  private _onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  private _onDrop = async (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file || !file.name.endsWith('.syx')) return;

    const buffer = await file.arrayBuffer();
    try {
      const bank = parseSyxFile(new Uint8Array(buffer));
      bankStore.loadBank(bank, file.name);
    } catch (err) {
      alert(`Failed to load file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  private _onKeyDown = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    switch (e.key) {
      case 'z':
        e.preventDefault();
        if (e.shiftKey) bankStore.redo();
        else bankStore.undo();
        break;
      case 's':
        e.preventDefault();
        this._saveFile();
        break;
      case 'c':
        // Don't intercept if user is in a text input
        if (this._isTextInput(e)) return;
        e.preventDefault();
        bankStore.copyCurrentVoice();
        break;
      case 'v':
        if (this._isTextInput(e)) return;
        e.preventDefault();
        bankStore.pasteVoice();
        break;
    }
  };

  private _isTextInput(e: KeyboardEvent): boolean {
    const tag = (e.target as HTMLElement)?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
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
