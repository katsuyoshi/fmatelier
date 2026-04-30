import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DX7Operator } from '../../model/types.ts';
import { KBD_CURVE_NAMES } from '../../model/types.ts';
import { bankStore } from '../../store/bank-store.ts';
import '../controls/dx-slider.ts';
import '../controls/dx-switch.ts';
import '../controls/dx-select.ts';
import '../visualizations/envelope-graph.ts';
import '../visualizations/kbd-scaling-graph.ts';

@customElement('dx-operator-panel')
export class OperatorPanel extends LitElement {
  @property({ type: Object }) declare op: DX7Operator | null;
  @property({ type: Number }) declare opIndex: number;

  constructor() {
    super();
    this.op = null;
    this.opIndex = 0;
  }

  static styles = css`
    :host {
      display: block;
    }

    .op-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }

    h3 {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--color-carrier);
      margin: 0;
    }

    .op-actions {
      display: flex;
      gap: 2px;
      margin-left: auto;
    }

    .op-actions button {
      padding: 2px 8px;
      background: var(--color-bg-control);
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.65rem;
      cursor: pointer;
    }

    .op-actions button:hover {
      background: var(--color-bg-card);
      border-color: var(--color-accent);
      color: var(--color-text);
    }

    .section {
      margin-bottom: var(--spacing-md);
    }

    .section-title {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 2px;
    }

    .row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 4px var(--spacing-sm);
      margin-bottom: 4px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 4px var(--spacing-sm);
    }
  `;

  render() {
    if (!this.op) return html`<p>No operator selected</p>`;

    const prefix = `operators.${this.opIndex}`;

    return html`
      <div class="op-header">
        <h3>OP${this.opIndex + 1}</h3>
        <div class="op-actions">
          <button @click=${this._copyOp}>Copy</button>
          <button @click=${this._pasteOp}>Paste</button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Envelope Generator</div>
        <dx-envelope-graph
          .rates=${[...this.op.egRate]}
          .levels=${[...this.op.egLevel]}
        ></dx-envelope-graph>
        <div class="row">
          <dx-slider label="R1" .value=${this.op.egRate[0]} path="${prefix}.egRate.0" min="0" max="99"></dx-slider>
          <dx-slider label="R2" .value=${this.op.egRate[1]} path="${prefix}.egRate.1" min="0" max="99"></dx-slider>
          <dx-slider label="R3" .value=${this.op.egRate[2]} path="${prefix}.egRate.2" min="0" max="99"></dx-slider>
          <dx-slider label="R4" .value=${this.op.egRate[3]} path="${prefix}.egRate.3" min="0" max="99"></dx-slider>
        </div>
        <div class="row">
          <dx-slider label="L1" .value=${this.op.egLevel[0]} path="${prefix}.egLevel.0" min="0" max="99"></dx-slider>
          <dx-slider label="L2" .value=${this.op.egLevel[1]} path="${prefix}.egLevel.1" min="0" max="99"></dx-slider>
          <dx-slider label="L3" .value=${this.op.egLevel[2]} path="${prefix}.egLevel.2" min="0" max="99"></dx-slider>
          <dx-slider label="L4" .value=${this.op.egLevel[3]} path="${prefix}.egLevel.3" min="0" max="99"></dx-slider>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Oscillator</div>
        <div class="grid-2">
          <dx-switch label="Mode" .value=${this.op.oscMode} path="${prefix}.oscMode" .options=${['Ratio', 'Fixed']}></dx-switch>
          <dx-slider label="Level" .value=${this.op.outputLevel} path="${prefix}.outputLevel" min="0" max="99"></dx-slider>
          <dx-slider label="Coarse" .value=${this.op.freqCoarse} path="${prefix}.freqCoarse" min="0" max="31"></dx-slider>
          <dx-slider label="Fine" .value=${this.op.freqFine} path="${prefix}.freqFine" min="0" max="99"></dx-slider>
          <dx-slider label="Detune" .value=${this.op.detune} path="${prefix}.detune" min="0" max="14"></dx-slider>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Keyboard Level Scaling</div>
        <dx-kbd-scaling-graph
          .breakpoint=${this.op.kbdLevelScalingBreakpoint}
          .leftDepth=${this.op.kbdLevelScalingLeftDepth}
          .rightDepth=${this.op.kbdLevelScalingRightDepth}
          .leftCurve=${this.op.kbdLevelScalingLeftCurve}
          .rightCurve=${this.op.kbdLevelScalingRightCurve}
        ></dx-kbd-scaling-graph>
        <div class="grid-2">
          <dx-slider label="BP" .value=${this.op.kbdLevelScalingBreakpoint} path="${prefix}.kbdLevelScalingBreakpoint" min="0" max="99"></dx-slider>
          <dx-slider label="L Depth" .value=${this.op.kbdLevelScalingLeftDepth} path="${prefix}.kbdLevelScalingLeftDepth" min="0" max="99"></dx-slider>
          <dx-slider label="R Depth" .value=${this.op.kbdLevelScalingRightDepth} path="${prefix}.kbdLevelScalingRightDepth" min="0" max="99"></dx-slider>
          <dx-select label="L Curve" .value=${this.op.kbdLevelScalingLeftCurve} path="${prefix}.kbdLevelScalingLeftCurve" .options=${[...KBD_CURVE_NAMES]}></dx-select>
          <dx-select label="R Curve" .value=${this.op.kbdLevelScalingRightCurve} path="${prefix}.kbdLevelScalingRightCurve" .options=${[...KBD_CURVE_NAMES]}></dx-select>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Sensitivity</div>
        <div class="grid-2">
          <dx-slider label="KRS" .value=${this.op.kbdRateScaling} path="${prefix}.kbdRateScaling" min="0" max="7"></dx-slider>
          <dx-slider label="AMS" .value=${this.op.ampModSensitivity} path="${prefix}.ampModSensitivity" min="0" max="3"></dx-slider>
          <dx-slider label="KVS" .value=${this.op.keyVelocitySensitivity} path="${prefix}.keyVelocitySensitivity" min="0" max="7"></dx-slider>
        </div>
      </div>
    `;
  }

  private _copyOp() {
    bankStore.copyCurrentOperator();
  }

  private _pasteOp() {
    bankStore.pasteOperator();
  }
}
