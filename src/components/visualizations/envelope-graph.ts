import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * SVG visualization of a DX7 4-stage envelope.
 *
 * DX7 envelope stages:
 *   Start at L4 (previous note's release level, shown as 0 for simplicity)
 *   Stage 1: → L1 at rate R1
 *   Stage 2: → L2 at rate R2
 *   Stage 3: → L3 at rate R3 (sustain)
 *   Stage 4: → L4 at rate R4 (release, on key-up)
 *
 * Rate maps to time duration inversely: higher rate = shorter time.
 */
@customElement('dx-envelope-graph')
export class EnvelopeGraph extends LitElement {
  @property({ type: Array }) declare rates: number[];
  @property({ type: Array }) declare levels: number[];

  constructor() {
    super();
    this.rates = [99, 99, 99, 99];
    this.levels = [99, 99, 99, 0];
  }

  static styles = css`
    :host {
      display: block;
    }

    svg {
      width: 100%;
      height: 80px;
      background: var(--color-bg-control);
      border-radius: var(--radius-sm);
    }

    .env-line {
      fill: none;
      stroke: var(--color-carrier);
      stroke-width: 2;
      stroke-linejoin: round;
    }

    .env-fill {
      fill: var(--color-carrier);
      opacity: 0.1;
    }

    .point {
      fill: var(--color-carrier);
    }

    .label {
      fill: var(--color-text-muted);
      font-family: var(--font-mono);
      font-size: 8px;
    }

    .sustain-line {
      stroke: var(--color-text-muted);
      stroke-width: 0.5;
      stroke-dasharray: 2 2;
    }
  `;

  render() {
    const W = 200;
    const H = 70;
    const PAD_X = 5;
    const PAD_Y = 8;
    const graphW = W - PAD_X * 2;
    const graphH = H - PAD_Y * 2;

    // Convert rate to time segment width (higher rate = shorter)
    const rateToWidth = (rate: number) => {
      const minW = graphW * 0.02;
      const maxW = graphW * 0.28;
      return maxW - ((rate / 99) * (maxW - minW));
    };

    // Convert level to Y position (99 = top, 0 = bottom)
    const levelToY = (level: number) => {
      return PAD_Y + graphH - (level / 99) * graphH;
    };

    const r1w = rateToWidth(this.rates[0] ?? 99);
    const r2w = rateToWidth(this.rates[1] ?? 99);
    const r3w = rateToWidth(this.rates[2] ?? 99);
    const r4w = rateToWidth(this.rates[3] ?? 99);

    const startX = PAD_X;
    const startY = levelToY(0); // Start from 0
    const x1 = startX + r1w;
    const y1 = levelToY(this.levels[0] ?? 99);
    const x2 = x1 + r2w;
    const y2 = levelToY(this.levels[1] ?? 99);
    const x3 = x2 + r3w;
    const y3 = levelToY(this.levels[2] ?? 99);
    // Sustain hold
    const sustainEnd = x3 + graphW * 0.1;
    const x4 = sustainEnd + r4w;
    const y4 = levelToY(this.levels[3] ?? 0);

    const linePath = `M${startX},${startY} L${x1},${y1} L${x2},${y2} L${x3},${y3} L${sustainEnd},${y3} L${x4},${y4}`;
    const fillPath = `${linePath} L${x4},${PAD_Y + graphH} L${startX},${PAD_Y + graphH} Z`;

    const points = [
      { x: x1, y: y1, label: 'L1' },
      { x: x2, y: y2, label: 'L2' },
      { x: x3, y: y3, label: 'L3' },
      { x: x4, y: y4, label: 'L4' },
    ];

    return html`
      <svg viewBox="0 0 ${W} ${H}">
        <!-- Sustain indicator -->
        ${svg`<line class="sustain-line" x1="${x3}" y1="${PAD_Y}" x2="${x3}" y2="${PAD_Y + graphH}" />`}
        ${svg`<line class="sustain-line" x1="${sustainEnd}" y1="${PAD_Y}" x2="${sustainEnd}" y2="${PAD_Y + graphH}" />`}
        <!-- Fill -->
        ${svg`<path class="env-fill" d="${fillPath}" />`}
        <!-- Line -->
        ${svg`<path class="env-line" d="${linePath}" />`}
        <!-- Points -->
        ${points.map(
          (p) => svg`
            <circle class="point" cx="${p.x}" cy="${p.y}" r="3" />
            <text class="label" x="${p.x}" y="${p.y - 6}" text-anchor="middle">${p.label}</text>
          `,
        )}
      </svg>
    `;
  }
}
