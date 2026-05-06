import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bankStore, type BankState } from '../../store/bank-store.ts';
import type { DX7Voice } from '../../model/types.ts';

@customElement('dx-voice-list')
export class VoiceList extends LitElement {
  @state() declare voices: DX7Voice[];
  @state() declare selectedIndex: number;
  @state() declare compact: boolean;

  private _unsub?: () => void;
  private _mql?: MediaQueryList;

  constructor() {
    super();
    this.voices = [];
    this.selectedIndex = 0;
    this.compact = false;
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

    this._mql = window.matchMedia('(max-width: 700px)');
    this.compact = this._mql.matches;
    this._mql.addEventListener('change', this._onMqlChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
    this._mql?.removeEventListener('change', this._onMqlChange);
  }

  private _onMqlChange = (e: MediaQueryListEvent) => {
    this.compact = e.matches;
  };

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

    .voice-card:active {
      opacity: 0.7;
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

    select {
      width: 100%;
      padding: 8px;
      background: var(--color-bg-control);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }
  `;

  render() {
    if (this.compact) {
      return html`
        <h2>VOICE BANK</h2>
        <select @change=${this._onSelect}>
          ${this.voices.map(
            (voice, i) => html`
              <option value=${i} ?selected=${i === this.selectedIndex}>
                ${i + 1}. ${voice.common.name || 'INIT VOICE'}
              </option>
            `,
          )}
        </select>
      `;
    }

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

  private _onSelect(e: Event) {
    bankStore.selectVoice(Number((e.target as HTMLSelectElement).value));
  }
}
