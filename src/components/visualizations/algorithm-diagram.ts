import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ALGORITHMS } from '../../model/algorithms.ts';

/**
 * SVG diagram of a DX7 algorithm showing operator routing.
 * Operators are drawn as boxes connected by lines.
 * Carriers are highlighted with a distinct color.
 */
@customElement('dx-algorithm-diagram')
export class AlgorithmDiagram extends LitElement {
  @property({ type: Number }) declare algorithm: number;
  @property({ type: Number }) declare feedback: number;

  constructor() {
    super();
    this.algorithm = 0;
    this.feedback = 0;
  }

  static styles = css`
    :host {
      display: block;
    }

    svg {
      width: 100%;
      height: 120px;
    }

    .op-box {
      fill: var(--color-bg-control);
      stroke: var(--color-modulator);
      stroke-width: 1.5;
      rx: 3;
    }

    .op-box.carrier {
      stroke: var(--color-carrier);
      stroke-width: 2;
    }

    .op-label {
      fill: var(--color-text);
      font-family: var(--font-mono);
      font-size: 10px;
      text-anchor: middle;
      dominant-baseline: central;
    }

    .connection {
      stroke: var(--color-text-muted);
      stroke-width: 1;
      fill: none;
    }

    .fb-loop {
      stroke: var(--color-text-muted);
      stroke-width: 1;
      fill: none;
    }

    .algo-label {
      fill: var(--color-text-muted);
      font-family: var(--font-mono);
      font-size: 9px;
    }
  `;

  render() {
    const algo = ALGORITHMS[this.algorithm];
    if (!algo) return html``;

    const BOX_W = 24;
    const BOX_H = 18;
    const GAP_X = 8;
    const GAP_Y = 6;
    const PAD = 10;

    // Compute positions from layout
    const opPositions = new Map<number, { x: number; y: number }>();
    const maxRows = Math.max(...algo.layout.map((col) => col.length));

    let colX = PAD;
    for (const column of algo.layout) {
      // Center column vertically
      const colHeight = column.length * (BOX_H + GAP_Y) - GAP_Y;
      const startY = PAD + ((maxRows * (BOX_H + GAP_Y) - GAP_Y) - colHeight) / 2;

      for (let row = 0; row < column.length; row++) {
        const opNum = column[row]!;
        // Skip if already positioned (shared operator across columns)
        if (opNum > 0 && !opPositions.has(opNum)) {
          opPositions.set(opNum, {
            x: colX,
            y: startY + row * (BOX_H + GAP_Y),
          });
        }
      }
      colX += BOX_W + GAP_X;
    }

    const viewW = colX + PAD - GAP_X;
    const carrierSet = new Set(algo.carriers);
    const BUS_GAP = 3;
    const hasBus = algo.carriers.length > 1;
    const viewH = PAD * 2 + maxRows * (BOX_H + GAP_Y) - GAP_Y + (hasBus ? BUS_GAP + 1 : 0);

    // Render connections
    const connectionLines = algo.connections.map((conn) => {
      const fromPos = opPositions.get(conn.from);
      const toPos = opPositions.get(conn.to);
      if (!fromPos || !toPos) return svg``;

      const x1 = fromPos.x + BOX_W / 2;
      const y1 = fromPos.y + BOX_H;
      const x2 = toPos.x + BOX_W / 2;
      const y2 = toPos.y;

      if (Math.abs(x1 - x2) < 2) {
        return svg`<line class="connection" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
      }
      const midY = (y1 + y2) / 2;
      return svg`<path class="connection" d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}" />`;
    });

    // Render feedback loop
    let fbSvg = svg``;
    if (algo.feedbackFrom) {
      const OFF = 5;
      const fromPos = opPositions.get(algo.feedbackFrom);
      const toPos = opPositions.get(algo.feedbackTo);
      if (fromPos && toPos) {
        if (algo.feedbackFrom === algo.feedbackTo) {
          fbSvg = svg`<path class="fb-loop" d="M${fromPos.x + BOX_W},${fromPos.y + BOX_H / 2} h${OFF} v-${BOX_H / 2 + OFF} h-${BOX_W / 2 + OFF} v${OFF}" />`;
        } else {
          fbSvg = svg`<path class="fb-loop" d="M${fromPos.x + BOX_W},${fromPos.y + BOX_H / 2} h${OFF} V${toPos.y + BOX_H / 2} H${toPos.x + BOX_W}" />`;
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
        return svg`<line class="connection" x1="${cx}" y1="${p.y + BOX_H}" x2="${cx}" y2="${busY}" />`;
      });
      busSvg = svg`${stubs}<line class="connection" x1="${xs[0]}" y1="${busY}" x2="${xs[xs.length - 1]}" y2="${busY}" />`;
    }

    // Render operator boxes
    const opBoxes = [...opPositions.entries()].map(([opNum, pos]) => {
      const isCarrier = carrierSet.has(opNum);
      return svg`
        <rect class="op-box ${isCarrier ? 'carrier' : ''}"
              x="${pos.x}" y="${pos.y}"
              width="${BOX_W}" height="${BOX_H}" />
        <text class="op-label" x="${pos.x + BOX_W / 2}" y="${pos.y + BOX_H / 2}">${opNum}</text>
      `;
    });

    return html`
      <svg viewBox="0 0 ${viewW} ${viewH}">
        <text class="algo-label" x="${PAD}" y="${viewH - 2}">ALG ${this.algorithm + 1}</text>
        ${connectionLines}
        ${fbSvg}
        ${busSvg}
        ${opBoxes}
      </svg>
    `;
  }
}
