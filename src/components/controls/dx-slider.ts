import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('dx-slider')
export class DxSlider extends LitElement {
  @property({ type: Number }) declare value: number;
  @property({ type: Number }) declare min: number;
  @property({ type: Number }) declare max: number;
  @property() declare label: string;
  @property() declare path: string;

  constructor() {
    super();
    this.value = 0;
    this.min = 0;
    this.max = 99;
    this.label = '';
    this.path = '';
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      min-width: 0;
    }

    label {
      min-width: 28px;
      flex-shrink: 0;
      color: var(--color-text-label);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-align: right;
    }

    input[type='range'] {
      flex: 1;
      min-width: 40px;
      height: 4px;
      appearance: none;
      background: var(--color-slider-track);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }

    input[type='range']::-webkit-slider-thumb {
      appearance: none;
      width: 14px;
      height: 14px;
      background: var(--color-slider-thumb);
      border-radius: 50%;
      cursor: pointer;
    }

    @media (pointer: coarse) {
      input[type='range'] {
        height: 8px;
      }

      input[type='range']::-webkit-slider-thumb {
        width: 24px;
        height: 24px;
      }
    }

    .value {
      min-width: 24px;
      text-align: right;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-text);
    }
  `;

  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ''}
      <input
        type="range"
        aria-label=${this.label}
        .min=${String(this.min)}
        .max=${String(this.max)}
        .value=${String(this.value)}
        @input=${this._onInput}
      />
      <span class="value">${this.value}</span>
    `;
  }

  private _onInput(e: Event) {
    const val = Number((e.target as HTMLInputElement).value);
    this.dispatchEvent(
      new CustomEvent('param-change', {
        detail: { path: this.path, value: val },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
