import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('dx-switch')
export class DxSwitch extends LitElement {
  @property({ type: Number }) declare value: number;
  @property() declare label: string;
  @property() declare path: string;
  @property({ type: Array }) declare options: string[];

  constructor() {
    super();
    this.value = 0;
    this.label = '';
    this.path = '';
    this.options = ['OFF', 'ON'];
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
    }

    label {
      min-width: 32px;
      color: var(--color-text-label);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-align: right;
    }

    .options {
      display: flex;
      gap: 2px;
    }

    button {
      padding: 4px 10px;
      min-height: 28px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-control);
      color: var(--color-text-muted);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      cursor: pointer;
      border-radius: var(--radius-sm);
    }

    button.active {
      background: var(--color-accent);
      color: white;
      border-color: var(--color-accent);
    }

    button:active {
      opacity: 0.7;
    }

    @media (pointer: coarse) {
      button {
        padding: 6px 12px;
        min-height: 36px;
        font-size: 0.8rem;
      }
    }
  `;

  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ''}
      <div class="options">
        ${this.options.map(
          (opt, i) => html`
            <button
              class=${i === this.value ? 'active' : ''}
              @click=${() => this._select(i)}
            >
              ${opt}
            </button>
          `,
        )}
      </div>
    `;
  }

  private _select(index: number) {
    this.dispatchEvent(
      new CustomEvent('param-change', {
        detail: { path: this.path, value: index },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
