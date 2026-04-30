import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DX7Operator } from '../../model/types.ts';

@customElement('dx-operator-strip')
export class OperatorStrip extends LitElement {
  @property({ type: Array }) declare operators: DX7Operator[];
  @property({ type: Number }) declare selectedOp: number;

  constructor() {
    super();
    this.operators = [];
    this.selectedOp = 0;
  }

  static styles = css`
    :host {
      display: flex;
      gap: 4px;
    }

    .op {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: var(--color-bg-control);
      border: 2px solid transparent;
      transition: border-color 0.1s;
    }

    .op:hover {
      border-color: var(--color-border);
    }

    .op.selected {
      border-color: var(--color-accent);
    }

    .op-num {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--color-text-muted);
      margin-bottom: 2px;
    }

    .level-bar {
      width: 20px;
      height: 40px;
      background: var(--color-slider-track);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
    }

    .level-fill {
      position: absolute;
      bottom: 0;
      width: 100%;
      background: var(--color-carrier);
      border-radius: 2px;
      transition: height 0.1s;
    }

    .level-val {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }
  `;

  render() {
    return html`
      ${this.operators.map(
        (op, i) => html`
          <div
            class="op ${i === this.selectedOp ? 'selected' : ''}"
            @click=${() => this._selectOp(i)}
          >
            <span class="op-num">OP${i + 1}</span>
            <div class="level-bar">
              <div class="level-fill" style="height: ${(op.outputLevel / 99) * 100}%"></div>
            </div>
            <span class="level-val">${op.outputLevel}</span>
          </div>
        `,
      )}
    `;
  }

  private _selectOp(index: number) {
    bankStore.selectOperator(index);
  }
}

import { bankStore } from '../../store/bank-store.ts';
