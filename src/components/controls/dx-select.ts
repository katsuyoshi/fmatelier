import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('dx-select')
export class DxSelect extends LitElement {
  @property({ type: Number }) declare value: number;
  @property() declare label: string;
  @property() declare path: string;
  @property({ type: Array }) declare options: string[];
  @property({ type: Number }) declare offset: number;

  constructor() {
    super();
    this.value = 0;
    this.label = '';
    this.path = '';
    this.options = [];
    this.offset = 0;
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

    select {
      flex: 1;
      padding: 2px 4px;
      background: var(--color-bg-control);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      cursor: pointer;
    }
  `;

  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ''}
      <select @change=${this._onChange}>
        ${this.options.map(
          (opt, i) => html`
            <option value=${i} ?selected=${i === this.value}>
              ${this.offset ? `${i + this.offset}: ` : ''}${opt}
            </option>
          `,
        )}
      </select>
    `;
  }

  private _onChange(e: Event) {
    const val = Number((e.target as HTMLSelectElement).value);
    this.dispatchEvent(
      new CustomEvent('param-change', {
        detail: { path: this.path, value: val },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
