import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { midiService, type MidiState } from '../../midi/midi-service.ts';

@customElement('dx-midi-panel')
export class MidiPanel extends LitElement {
  @state() declare midiState: MidiState;

  private _unsub?: () => void;

  constructor() {
    super();
    this.midiState = midiService.getState();
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsub = midiService.subscribe((s: MidiState) => {
      this.midiState = s;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  static styles = css`
    :host {
      display: block;
      background: var(--color-bg-panel);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      min-width: 240px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }

    h3 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .field {
      margin-bottom: var(--spacing-sm);
    }

    .field label {
      display: block;
      color: var(--color-text-muted);
      font-size: 0.7rem;
      margin-bottom: 2px;
    }

    select {
      width: 100%;
      padding: 4px 6px;
      background: var(--color-bg-control);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }

    .actions {
      display: flex;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-sm);
    }

    button {
      flex: 1;
      padding: 4px 12px;
      background: var(--color-bg-control);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: var(--color-bg-card);
      border-color: var(--color-accent);
    }

    button:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .error {
      color: var(--color-accent);
      font-size: 0.7rem;
      margin-top: var(--spacing-xs);
    }

    .hint {
      color: var(--color-text-muted);
      font-size: 0.65rem;
      margin-top: var(--spacing-sm);
    }
  `;

  render() {
    if (!this.midiState.available) {
      return html`
        <h3>MIDI</h3>
        <p class="error">${this.midiState.lastError ?? 'Web MIDI not available'}</p>
        <p class="hint">MIDI requires Chrome or Edge with SysEx permission.
          File editing (Open / Save .syx) works in any browser.</p>
      `;
    }

    const { inputs, outputs, selectedInputId, selectedOutputId, channel, connected } = this.midiState;

    return html`
      <h3>MIDI</h3>

      <div class="field">
        <label>Input</label>
        <select @change=${this._onInputChange}>
          <option value="">-- None --</option>
          ${inputs.map(p => html`
            <option value=${p.id} ?selected=${p.id === selectedInputId}>${p.name}</option>
          `)}
        </select>
      </div>

      <div class="field">
        <label>Output</label>
        <select @change=${this._onOutputChange}>
          <option value="">-- None --</option>
          ${outputs.map(p => html`
            <option value=${p.id} ?selected=${p.id === selectedOutputId}>${p.name}</option>
          `)}
        </select>
      </div>

      <div class="field">
        <label>Channel</label>
        <select @change=${this._onChannelChange}>
          ${Array.from({ length: 16 }, (_, i) => html`
            <option value=${i} ?selected=${i === channel}>${i + 1}</option>
          `)}
        </select>
      </div>

      <div class="actions">
        <button ?disabled=${!connected} @click=${this._sendVoice}>Send Voice</button>
        <button ?disabled=${!connected} @click=${this._sendBank}>Send Bank</button>
      </div>

      <div class="actions">
        <button ?disabled=${!connected} @click=${this._rcvVoice}>Rcv Voice</button>
        <button ?disabled=${!connected} @click=${this._rcvBank}>Rcv Bank</button>
      </div>

      ${this.midiState.lastError ? html`<p class="error">${this.midiState.lastError}</p>` : ''}
    `;
  }

  private _onInputChange(e: Event) {
    midiService.selectInput((e.target as HTMLSelectElement).value || null);
  }

  private _onOutputChange(e: Event) {
    midiService.selectOutput((e.target as HTMLSelectElement).value || null);
  }

  private _onChannelChange(e: Event) {
    midiService.setChannel(Number((e.target as HTMLSelectElement).value));
  }

  private _sendVoice() {
    midiService.sendCurrentVoice();
  }

  private _sendBank() {
    midiService.sendBank();
  }

  private _rcvVoice() {
    midiService.requestVoiceDump();
  }

  private _rcvBank() {
    midiService.requestBankDump();
  }
}
