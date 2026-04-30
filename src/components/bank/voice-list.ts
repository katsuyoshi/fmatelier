import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bankStore, type BankState } from '../../store/bank-store.ts';
import type { DX7Voice } from '../../model/types.ts';

@customElement('dx-voice-list')
export class VoiceList extends LitElement {
  @state() declare voices: DX7Voice[];
  @state() declare selectedIndex: number;

  private _unsub?: () => void;

  constructor() {
    super();
    this.voices = [];
    this.selectedIndex = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsub = bankStore.subscribe((s: BankState) => {
      this.voices = s.bank.voices;
      this.selectedIndex = s.selectedVoiceIndex;
    });
    const s = bankStore.getState();
    this.voices = s.bank.voices;
    this.selectedIndex = s.selectedVoiceIndex;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  static styles = css`
    :host {
      display: block;
    }

    h2 {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      margin-bottom: var(--spacing-sm);
      font-family: var(--font-mono);
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2px;
    }

    .voice-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: transparent;
      border: 1px solid transparent;
      transition: background 0.1s;
    }

    .voice-card:hover {
      background: var(--color-bg-card);
    }

    .voice-card.selected {
      background: var(--color-bg-card-selected);
      border-color: var(--color-accent);
    }

    .num {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--color-text-muted);
      min-width: 20px;
      text-align: right;
    }

    .name {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--color-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  render() {
    return html`
      <h2>VOICE BANK</h2>
      <div class="grid">
        ${this.voices.map(
          (voice, i) => html`
            <div
              class="voice-card ${i === this.selectedIndex ? 'selected' : ''}"
              @click=${() => bankStore.selectVoice(i)}
            >
              <span class="num">${i + 1}</span>
              <span class="name">${voice.common.name || 'INIT VOICE'}</span>
            </div>
          `,
        )}
      </div>
    `;
  }
}
