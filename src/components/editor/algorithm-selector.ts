import { LitElement, html, css, svg, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ALGORITHMS, type AlgorithmDef } from '../../model/algorithms.ts';

/**
 * Clickable algorithm display that opens a popover grid of all 32 algorithms.
 * Shows the current algorithm diagram; click to open the selection grid.
 */
@customElement('dx-algorithm-selector')
export class AlgorithmSelector extends LitElement {
  @property({ type: Number }) declare algorithm: number;
  @state() declare _open: boolean;

  private _onDocClick = (e: MouseEvent) => {
    if (!this._open) return;
    if (!e.composedPath().includes(this)) {
      this._open = false;
    }
  };

  constructor() {
    super();
    this.algorithm = 0;
    this._open = false;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick, true);
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .current {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      padding: 4px 8px;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }

    .current:hover {
      border-color: var(--color-accent-hover);
    }

    .current.open {
      border-color: var(--color-accent);
    }

    .current-label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-text-muted);
      flex-shrink: 0;
    }

    .current-diagram {
      flex: 1;
      min-width: 0;
    }

    .current-diagram svg {
      width: 100%;
      height: 200px;
    }

    .arrow {
      font-size: 0.6rem;
      color: var(--color-text-muted);
      flex-shrink: 0;
    }

    .overlay {
      position: fixed;
      inset: 0;
      z-index: 99;
      background: rgba(0, 0, 0, 0.5);
    }

    .dropdown {
      position: fixed;
      inset: var(--spacing-lg);
      z-index: 100;
      background: var(--color-bg-panel);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 6px;
      flex: 1;
      min-height: 0;
    }

    @media (max-width: 600px) {
      .grid {
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(8, 1fr);
      }
    }

    .cell {
      background: var(--color-bg-control);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      position: relative;
      padding: 6px;
      min-height: 0;
    }

    .cell-num {
      position: absolute;
      top: 2px;
      right: 3px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--color-text-muted);
      line-height: 1;
      pointer-events: none;
    }

    .cell.selected .cell-num {
      color: var(--color-text);
    }

    .cell svg {
      width: 100%;
      height: 100%;
    }

    .cell:hover {
      border-color: var(--color-accent-hover);
      background: var(--color-bg-card);
    }

    .cell.selected {
      border-color: var(--color-accent);
      background: var(--color-bg-card-selected);
      box-shadow: 0 0 6px rgba(233, 69, 96, 0.3);
    }

    .cell svg {
      width: 100%;
      height: 100%;
    }

    /* Current diagram SVG styles */
    .cur-box {
      fill: var(--color-bg-control);
      stroke: var(--color-modulator);
      stroke-width: 1.5;
      rx: 3;
    }

    .cur-box.carrier {
      stroke: var(--color-carrier);
      stroke-width: 2;
    }

    .cur-box.feedback {
      fill: var(--color-modulator);
      fill-opacity: 0.5;
    }

    .cur-box.carrier.feedback {
      fill: var(--color-carrier);
    }

    .cur-label {
      fill: var(--color-text);
      font-family: var(--font-mono);
      font-size: 12px;
      text-anchor: middle;
      dominant-baseline: central;
    }

    .cur-conn {
      stroke: var(--color-text-muted);
      stroke-width: 1;
      fill: none;
    }

    .cur-fb {
      stroke: var(--color-text-muted);
      stroke-width: 1;
      fill: none;
    }

    /* Mini diagram SVG styles */
    .mini-box {
      fill: var(--color-bg-card);
      stroke: var(--color-modulator);
      stroke-width: 1;
    }

    .mini-box.carrier {
      stroke: var(--color-carrier);
      stroke-width: 1.5;
    }

    .mini-box.feedback {
      fill: var(--color-modulator);
      fill-opacity: 0.5;
    }

    .mini-box.carrier.feedback {
      fill: var(--color-carrier);
    }

    .mini-conn {
      stroke: var(--color-text-muted);
      stroke-width: 0.6;
      fill: none;
    }

    .mini-fb {
      stroke: var(--color-text-muted);
      stroke-width: 0.6;
      fill: none;
    }

    .mini-label {
      fill: var(--color-text);
      font-family: var(--font-mono);
      font-size: 5.5px;
      text-anchor: middle;
      dominant-baseline: central;
    }
  `;

  render() {
    const algo = ALGORITHMS[this.algorithm];
    if (!algo) return html``;

    return html`
      <div class="current ${this._open ? 'open' : ''}" @click=${this._toggle}>
        <span class="current-label">ALG ${algo.id}</span>
        <div class="current-diagram">${this._renderCurrent(algo)}</div>
        <span class="arrow">${this._open ? '\u25B2' : '\u25BC'}</span>
      </div>
      ${this._open ? html`
        <div class="overlay" @click=${(e: Event) => { e.stopPropagation(); this._open = false; }}></div>
        <div class="dropdown">
          <div class="grid">
            ${ALGORITHMS.map((a, i) => html`
              <div
                class="cell ${i === this.algorithm ? 'selected' : ''}"
                @click=${(e: Event) => { e.stopPropagation(); this._select(i); }}
              >
                <span class="cell-num">${a.id}</span>
                ${this._renderMini(a)}
              </div>
            `)}
          </div>
        </div>
      ` : ''}
    `;
  }

  private _renderCurrent(algo: AlgorithmDef): TemplateResult {
    const BOX_W = 30;
    const BOX_H = 22;
    const GAP_X = 10;
    const GAP_Y = 8;
    const PAD = 12;

    const opPositions = new Map<number, { x: number; y: number }>();
    const maxRows = Math.max(...algo.layout.map((col) => col.length));

    let colX = PAD;
    for (const column of algo.layout) {
      const colHeight = column.length * (BOX_H + GAP_Y) - GAP_Y;
      const startY = PAD + (maxRows * (BOX_H + GAP_Y) - GAP_Y) - colHeight;
      for (let row = 0; row < column.length; row++) {
        const opNum = column[row]!;
        if (opNum > 0 && !opPositions.has(opNum)) {
          opPositions.set(opNum, { x: colX, y: startY + row * (BOX_H + GAP_Y) });
        }
      }
      colX += BOX_W + GAP_X;
    }

    const viewW = colX + PAD - GAP_X;
    const carrierSet = new Set(algo.carriers);
    const BUS_GAP = 4;
    const hasBus = algo.carriers.length > 1;
    const viewH = PAD * 2 + maxRows * (BOX_H + GAP_Y) - GAP_Y + (hasBus ? BUS_GAP + 1 : 0);

    const connections = algo.connections.map((conn) => {
      const fromPos = opPositions.get(conn.from);
      const toPos = opPositions.get(conn.to);
      if (!fromPos || !toPos) return svg``;
      const x1 = fromPos.x + BOX_W / 2;
      const y1 = fromPos.y + BOX_H;
      const x2 = toPos.x + BOX_W / 2;
      const y2 = toPos.y;
      if (Math.abs(x1 - x2) < 2) {
        return svg`<line class="cur-conn" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
      }
      const midY = (y1 + y2) / 2;
      return svg`<path class="cur-conn" d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}" />`;
    });

    let fbSvg = svg``;
    if (algo.feedbackFrom) {
      const OFF = 6;
      const fromPos = opPositions.get(algo.feedbackFrom);
      const toPos = opPositions.get(algo.feedbackTo);
      if (fromPos && toPos) {
        if (algo.feedbackFrom === algo.feedbackTo) {
          fbSvg = svg`<path class="cur-fb" d="M${fromPos.x + BOX_W},${fromPos.y + BOX_H / 2} h${OFF} v-${BOX_H / 2 + OFF} h-${BOX_W / 2 + OFF} v${OFF}" />`;
        } else {
          fbSvg = svg`<path class="cur-fb" d="M${fromPos.x + BOX_W},${fromPos.y + BOX_H / 2} h${OFF} V${toPos.y + BOX_H / 2} H${toPos.x + BOX_W}" />`;
        }
      }
    }

    // Carrier bus line at the bottom
    let busSvg = svg``;
    if (hasBus) {
      const carrierPositions = algo.carriers
        .map((c) => opPositions.get(c))
        .filter((p): p is { x: number; y: number } => !!p);
      const busY = Math.max(...carrierPositions.map((p) => p.y)) + BOX_H + BUS_GAP;
      const xs = carrierPositions.map((p) => p.x + BOX_W / 2).sort((a, b) => a - b);
      const stubs = carrierPositions.map((p) => {
        const cx = p.x + BOX_W / 2;
        return svg`<line class="cur-conn" x1="${cx}" y1="${p.y + BOX_H}" x2="${cx}" y2="${busY}" />`;
      });
      busSvg = svg`${stubs}<line class="cur-conn" x1="${xs[0]}" y1="${busY}" x2="${xs[xs.length - 1]}" y2="${busY}" />`;
    }

    const boxes = [...opPositions.entries()].map(([opNum, pos]) => {
      const isCarrier = carrierSet.has(opNum);
      const isFb = opNum === algo.feedbackTo;
      return svg`
        <rect class="cur-box ${isCarrier ? 'carrier' : ''} ${isFb ? 'feedback' : ''}"
              x="${pos.x}" y="${pos.y}"
              width="${BOX_W}" height="${BOX_H}" />
        <text class="cur-label" x="${pos.x + BOX_W / 2}" y="${pos.y + BOX_H / 2}">${opNum}</text>
      `;
    });

    return html`
      <svg viewBox="0 0 ${viewW} ${viewH}" preserveAspectRatio="xMidYMax meet">
        ${connections}
        ${fbSvg}
        ${busSvg}
        ${boxes}
      </svg>
    `;
  }

  private _renderMini(algo: AlgorithmDef): TemplateResult {
    const BOX_W = 12;
    const BOX_H = 9;
    const GAP_X = 4;
    const GAP_Y = 3;
    const PAD = 4;

    const opPositions = new Map<number, { x: number; y: number }>();
    const maxRows = Math.max(...algo.layout.map((col) => col.length));

    let colX = PAD;
    for (const column of algo.layout) {
      const colHeight = column.length * (BOX_H + GAP_Y) - GAP_Y;
      const startY = PAD + (maxRows * (BOX_H + GAP_Y) - GAP_Y) - colHeight;
      for (let row = 0; row < column.length; row++) {
        const opNum = column[row]!;
        if (opNum > 0 && !opPositions.has(opNum)) {
          opPositions.set(opNum, { x: colX, y: startY + row * (BOX_H + GAP_Y) });
        }
      }
      colX += BOX_W + GAP_X;
    }

    const viewW = colX + PAD - GAP_X;
    const carrierSet = new Set(algo.carriers);
    const BUS_GAP = 2;
    const hasBus = algo.carriers.length > 1;
    const viewH = PAD * 2 + maxRows * (BOX_H + GAP_Y) - GAP_Y + (hasBus ? BUS_GAP + 1 : 0);

    const connections = algo.connections.map((conn) => {
      const fromPos = opPositions.get(conn.from);
      const toPos = opPositions.get(conn.to);
      if (!fromPos || !toPos) return svg``;
      const x1 = fromPos.x + BOX_W / 2;
      const y1 = fromPos.y + BOX_H;
      const x2 = toPos.x + BOX_W / 2;
      const y2 = toPos.y;
      if (Math.abs(x1 - x2) < 2) {
        return svg`<line class="mini-conn" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
      }
      const midY = (y1 + y2) / 2;
      return svg`<path class="mini-conn" d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}" />`;
    });

    let fbSvg = svg``;
    if (algo.feedbackFrom) {
      const OFF = 3;
      const fromPos = opPositions.get(algo.feedbackFrom);
      const toPos = opPositions.get(algo.feedbackTo);
      if (fromPos && toPos) {
        if (algo.feedbackFrom === algo.feedbackTo) {
          fbSvg = svg`<path class="mini-fb" d="M${fromPos.x + BOX_W},${fromPos.y + BOX_H / 2} h${OFF} v-${BOX_H / 2 + OFF} h-${BOX_W / 2 + OFF} v${OFF}" />`;
        } else {
          fbSvg = svg`<path class="mini-fb" d="M${fromPos.x + BOX_W},${fromPos.y + BOX_H / 2} h${OFF} V${toPos.y + BOX_H / 2} H${toPos.x + BOX_W}" />`;
        }
      }
    }

    // Carrier bus line
    let busSvg = svg``;
    if (hasBus) {
      const carrierPositions = algo.carriers
        .map((c) => opPositions.get(c))
        .filter((p): p is { x: number; y: number } => !!p);
      const busY = Math.max(...carrierPositions.map((p) => p.y)) + BOX_H + BUS_GAP;
      const xs = carrierPositions.map((p) => p.x + BOX_W / 2).sort((a, b) => a - b);
      const stubs = carrierPositions.map((p) => {
        const cx = p.x + BOX_W / 2;
        return svg`<line class="mini-conn" x1="${cx}" y1="${p.y + BOX_H}" x2="${cx}" y2="${busY}" />`;
      });
      busSvg = svg`${stubs}<line class="mini-conn" x1="${xs[0]}" y1="${busY}" x2="${xs[xs.length - 1]}" y2="${busY}" />`;
    }

    const boxes = [...opPositions.entries()].map(([opNum, pos]) => {
      const isCarrier = carrierSet.has(opNum);
      const isFb = opNum === algo.feedbackTo;
      return svg`
        <rect class="mini-box ${isCarrier ? 'carrier' : ''} ${isFb ? 'feedback' : ''}"
              x="${pos.x}" y="${pos.y}"
              width="${BOX_W}" height="${BOX_H}" rx="1.5" />
        <text class="mini-label" x="${pos.x + BOX_W / 2}" y="${pos.y + BOX_H / 2}">${opNum}</text>
      `;
    });

    return html`
      <svg viewBox="0 0 ${viewW} ${viewH}" preserveAspectRatio="xMidYMid meet">
        ${connections}
        ${fbSvg}
        ${busSvg}
        ${boxes}
      </svg>
    `;
  }

  private _toggle() {
    this._open = !this._open;
  }

  private _select(index: number) {
    this._open = false;
    this.dispatchEvent(
      new CustomEvent('param-change', {
        detail: { path: 'common.algorithm', value: index },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
