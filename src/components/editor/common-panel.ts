import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DX7VoiceCommon } from '../../model/types.ts';
import { LFO_WAVE_NAMES } from '../../model/types.ts';
import '../controls/dx-slider.ts';
import '../controls/dx-switch.ts';
import '../controls/dx-select.ts';

@customElement('dx-common-panel')
export class CommonPanel extends LitElement {
  @property({ type: Object }) declare common: DX7VoiceCommon | null;

  constructor() {
    super();
    this.common = null;
  }

  static styles = css`
    :host {
      display: block;
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
    if (!this.common) return html``;

    return html`
      <div class="section">
        <div class="section-title">Global</div>
        <div class="grid-2">
          <dx-slider label="FBK" .value=${this.common.feedback} path="common.feedback" min="0" max="7"></dx-slider>
          <dx-switch label="Sync" .value=${this.common.oscKeySync} path="common.oscKeySync"></dx-switch>
          <dx-slider label="Trans" .value=${this.common.transpose} path="common.transpose" min="0" max="48"></dx-slider>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Pitch EG</div>
        <div class="row">
          <dx-slider label="R1" .value=${this.common.pitchEgRate[0]} path="common.pitchEgRate.0" min="0" max="99"></dx-slider>
          <dx-slider label="R2" .value=${this.common.pitchEgRate[1]} path="common.pitchEgRate.1" min="0" max="99"></dx-slider>
          <dx-slider label="R3" .value=${this.common.pitchEgRate[2]} path="common.pitchEgRate.2" min="0" max="99"></dx-slider>
          <dx-slider label="R4" .value=${this.common.pitchEgRate[3]} path="common.pitchEgRate.3" min="0" max="99"></dx-slider>
        </div>
        <div class="row">
          <dx-slider label="L1" .value=${this.common.pitchEgLevel[0]} path="common.pitchEgLevel.0" min="0" max="99"></dx-slider>
          <dx-slider label="L2" .value=${this.common.pitchEgLevel[1]} path="common.pitchEgLevel.1" min="0" max="99"></dx-slider>
          <dx-slider label="L3" .value=${this.common.pitchEgLevel[2]} path="common.pitchEgLevel.2" min="0" max="99"></dx-slider>
          <dx-slider label="L4" .value=${this.common.pitchEgLevel[3]} path="common.pitchEgLevel.3" min="0" max="99"></dx-slider>
        </div>
      </div>

      <div class="section">
        <div class="section-title">LFO</div>
        <div class="grid-2">
          <dx-slider label="Speed" .value=${this.common.lfoSpeed} path="common.lfoSpeed" min="0" max="99"></dx-slider>
          <dx-slider label="Delay" .value=${this.common.lfoDelay} path="common.lfoDelay" min="0" max="99"></dx-slider>
          <dx-slider label="PMD" .value=${this.common.lfoPitchModDepth} path="common.lfoPitchModDepth" min="0" max="99"></dx-slider>
          <dx-slider label="AMD" .value=${this.common.lfoAmpModDepth} path="common.lfoAmpModDepth" min="0" max="99"></dx-slider>
          <dx-select label="Wave" .value=${this.common.lfoWave} path="common.lfoWave" .options=${[...LFO_WAVE_NAMES]}></dx-select>
          <dx-switch label="Sync" .value=${this.common.lfoSync} path="common.lfoSync"></dx-switch>
          <dx-slider label="PMS" .value=${this.common.lfoPitchModSensitivity} path="common.lfoPitchModSensitivity" min="0" max="7"></dx-slider>
        </div>
      </div>
    `;
  }
}
