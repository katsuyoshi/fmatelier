import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { breakpointToNoteName } from '../../utils/note-names.ts';

/**
 * SVG visualization of DX7 keyboard level scaling.
 *
 * Shows how operator output level is modified across the keyboard:
 * - Breakpoint divides keyboard into left and right zones
 * - Each zone has its own curve type and depth
 * - Curve types: -LIN, -EXP (reduce level), +EXP, +LIN (boost level)
 */
@customElement('dx-kbd-scaling-graph')
export class KbdScalingGraph extends LitElement {
  /** Breakpoint position (0-99, maps to A-1 through C8) */
  @property({ type: Number }) declare breakpoint: number;
  /** Left side scaling depth (0-99) */
  @property({ type: Number }) declare leftDepth: number;
  /** Right side scaling depth (0-99) */
  @property({ type: Number }) declare rightDepth: number;
  /** Left curve type: 0=-LIN, 1=-EXP, 2=+EXP, 3=+LIN */
  @property({ type: Number }) declare leftCurve: number;
  /** Right curve type: 0=-LIN, 1=-EXP, 2=+EXP, 3=+LIN */
  @property({ type: Number }) declare rightCurve: number;

  constructor() {
    super();
    this.breakpoint = 39;
    this.leftDepth = 0;
    this.rightDepth = 0;
    this.leftCurve = 0;
    this.rightCurve = 0;
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

    .scale-line {
      fill: none;
      stroke: var(--color-accent);
      stroke-width: 1.5;
      stroke-linejoin: round;
    }

    .scale-fill {
      fill: var(--color-accent);
      opacity: 0.08;
    }

    .bp-line {
      stroke: var(--color-text-muted);
      stroke-width: 0.5;
      stroke-dasharray: 2 2;
    }

    .zero-line {
      stroke: var(--color-border);
      stroke-width: 0.5;
    }

    .bp-label {
      fill: var(--color-text);
      font-family: var(--font-mono);
      font-size: 7px;
    }

    .edge-label {
      fill: var(--color-text-muted);
      font-family: var(--font-mono);
      font-size: 6px;
    }
  `;

  render() {
    const W = 200;
    const H = 70;
    const PAD_X = 8;
    const PAD_Y = 12;
    const graphW = W - PAD_X * 2;
    const graphH = H - PAD_Y * 2;
    const zeroY = PAD_Y + graphH / 2;

    const keyToX = (key: number) => PAD_X + (key / 99) * graphW;
    const scaleToY = (s: number) => zeroY - s * (graphH / 2);

    const points: { x: number; y: number }[] = [];
    for (let key = 0; key <= 99; key++) {
      let scale: number;
      if (key < this.breakpoint) {
        scale = this._computeScale(this.breakpoint - key, this.leftDepth, this.leftCurve);
      } else if (key > this.breakpoint) {
        scale = this._computeScale(key - this.breakpoint, this.rightDepth, this.rightCurve);
      } else {
        scale = 0;
      }
      points.push({ x: keyToX(key), y: scaleToY(scale) });
    }

    const linePath = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
    ).join(' ');
    const fillPath = `${linePath} L${points[99]!.x.toFixed(1)},${zeroY} L${points[0]!.x.toFixed(1)},${zeroY} Z`;

    const bpX = keyToX(this.breakpoint);
    const bpNote = breakpointToNoteName(this.breakpoint);

    return html`
      <svg viewBox="0 0 ${W} ${H}">
        <!-- Zero line -->
        ${svg`<line class="zero-line" x1="${PAD_X}" y1="${zeroY}" x2="${PAD_X + graphW}" y2="${zeroY}" />`}
        <!-- Breakpoint line -->
        ${svg`<line class="bp-line" x1="${bpX}" y1="${PAD_Y}" x2="${bpX}" y2="${PAD_Y + graphH}" />`}
        <!-- Fill -->
        ${svg`<path class="scale-fill" d="${fillPath}" />`}
        <!-- Curve -->
        ${svg`<path class="scale-line" d="${linePath}" />`}
        <!-- Breakpoint label -->
        ${svg`<text class="bp-label" x="${bpX}" y="${PAD_Y - 3}" text-anchor="middle">${bpNote}</text>`}
        <!-- Edge labels -->
        ${svg`<text class="edge-label" x="${PAD_X}" y="${H - 1}" text-anchor="start">A-1</text>`}
        ${svg`<text class="edge-label" x="${PAD_X + graphW}" y="${H - 1}" text-anchor="end">C8</text>`}
      </svg>
    `;
  }

  /**
   * Compute scaling value for a given distance from breakpoint.
   * Returns -1..+1 range for visualization.
   */
  private _computeScale(distance: number, depth: number, curve: number): number {
    if (depth === 0 || distance <= 0) return 0;
    const t = Math.min(distance / 99, 1);
    const d = depth / 99;
    let magnitude: number;
    if (curve === 0 || curve === 3) {
      // Linear: proportional to distance
      magnitude = d * t;
    } else {
      // Exponential: steep near breakpoint, levels off far away
      magnitude = d * Math.pow(t, 0.5);
    }
    // Curves 0 (-LIN) and 1 (-EXP) reduce level; 2 (+EXP) and 3 (+LIN) boost
    return curve < 2 ? -magnitude : magnitude;
  }
}
