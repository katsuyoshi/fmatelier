import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bankStore, type BankState } from '../../store/bank-store.ts';
import type { DX7Voice } from '../../model/types.ts';
import './operator-strip.ts';
import './operator-panel.ts';
import './common-panel.ts';
import './algorithm-selector.ts';

@customElement('dx-voice-editor')
export class VoiceEditor extends LitElement {
  @state() declare voice: DX7Voice | null;
  @state() declare selectedOp: number;

  private _unsub?: () => void;

  constructor() {
    super();
    this.voice = null;
    this.selectedOp = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsub = bankStore.subscribe((s: BankState) => {
      this.voice = s.bank.voices[s.selectedVoiceIndex] ?? null;
      this.selectedOp = s.selectedOperator;
    });
    const s = bankStore.getState();
    this.voice = s.bank.voices[s.selectedVoiceIndex] ?? null;
    this.selectedOp = s.selectedOperator;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .voice-name {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .voice-name input {
      font-family: var(--font-mono);
      font-size: 1rem;
      background: var(--color-bg-control);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 4px 8px;
      width: 12ch;
      text-transform: uppercase;
    }

    .voice-name label {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }

    .operator-section {
      background: var(--color-bg-card);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
    }

    .common-section {
      background: var(--color-bg-card);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
    }

    @media (max-width: 900px) {
      .panels {
        grid-template-columns: 1fr;
      }
    }
  `;

  render() {
    if (!this.voice) return html`<p>No voice selected</p>`;

    return html`
      <div class="voice-name">
        <label>NAME</label>
        <input
          type="text"
          .value=${this.voice.common.name}
          maxlength="10"
          @input=${this._onNameInput}
        />
      </div>

      <dx-algorithm-selector
        .algorithm=${this.voice.common.algorithm}
        @param-change=${this._onParamChange}
      ></dx-algorithm-selector>

      <dx-operator-strip
        .operators=${this.voice.operators}
        .selectedOp=${this.selectedOp}
      ></dx-operator-strip>

      <div class="panels" @param-change=${this._onParamChange}>
        <div class="operator-section">
          <dx-operator-panel
            .op=${this.voice.operators[this.selectedOp] ?? null}
            .opIndex=${this.selectedOp}
          ></dx-operator-panel>
        </div>
        <div class="common-section">
          <dx-common-panel
            .common=${this.voice.common}
          ></dx-common-panel>
        </div>
      </div>
    `;
  }

  private _onParamChange(e: CustomEvent<{ path: string; value: number }>) {
    e.stopPropagation();
    bankStore.setParam(e.detail.path, e.detail.value);
  }

  private _onNameInput(e: Event) {
    const name = (e.target as HTMLInputElement).value.toUpperCase();
    bankStore.setVoiceName(name);
  }
}
