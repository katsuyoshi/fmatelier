import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

const ja = navigator.language.startsWith('ja');

@customElement('dx-help-panel')
export class HelpPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-bg-panel);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      min-width: 300px;
      max-height: 70vh;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      line-height: 1.6;
    }

    h3 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    h4 {
      margin: var(--spacing-md) 0 var(--spacing-xs) 0;
      font-size: 0.75rem;
      color: var(--color-accent);
    }

    h4:first-of-type {
      margin-top: 0;
    }

    p {
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--color-text);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: var(--spacing-xs) 0;
    }

    td {
      padding: 2px 8px 2px 0;
      color: var(--color-text);
    }

    td:first-child {
      white-space: nowrap;
      color: var(--color-text-muted);
    }

    .note {
      color: var(--color-text-muted);
      font-size: 0.65rem;
    }

    .sponsor {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--color-border);
    }

    .warn {
      color: var(--color-text-muted);
      font-size: 0.7rem;
    }

    .warn a, .sponsor a {
      color: var(--color-accent);
      text-decoration: none;
    }

    .warn a:hover, .sponsor a:hover {
      text-decoration: underline;
    }
  `;

  render() {
    const mod = navigator.platform?.includes('Mac') ? 'Cmd' : 'Ctrl';

    if (ja) {
      return html`
        <h3>ヘルプ</h3>

        <h4>はじめに</h4>
        <p><b>Open</b> ボタンまたはウィンドウへのドラッグ＆ドロップで .syx バンクファイルを開きます。
          右パネルでパラメータを編集し、<b>Save</b> ボタンで保存します。</p>
        <p>MIDI 接続中は DX7 から 32 ボイスのバルクダンプを受信して読み込むこともできます。
          DX7 本体で MIDI CH を設定し、FUNCTION → ボタン 8 → MIDI TRANSMIT? で YES を選択するとバルクダンプが送信されます。</p>

        <h4>編集</h4>
        <p>左サイドバーからボイス（1〜32）を選択します。オペレーター（OP1〜OP6）を選んで
          パラメータを編集します。アルゴリズム図をクリックして FM アルゴリズムを変更できます。</p>

        <h4>MIDI</h4>
        <p><b>MIDI</b> ボタンから DX7 などのシンセに接続します。
          Chrome または Edge が必要です。入出力ポートと MIDI チャンネルを選択し、
          <b>Send Voice</b> や <b>Send Bank</b> でパッチを送信します。</p>
        <p class="warn">MIDI インターフェースによってはバルク送信に失敗する場合があります。
          Arduino を使った USB MIDI インターフェースで安定動作を確認しています。
          詳しくは <a href="https://github.com/katsuyoshi/fmatelier/tree/main/arduino" target="_blank" rel="noopener">Arduino MIDI Interface</a> を参照してください。</p>

        <h4>キーボードショートカット</h4>
        <table>
          <tr><td>${mod}+S</td><td>.syx ファイルを保存</td></tr>
          <tr><td>${mod}+Z</td><td>元に戻す</td></tr>
          <tr><td>${mod}+Shift+Z</td><td>やり直し</td></tr>
          <tr><td>${mod}+C</td><td>ボイスをコピー</td></tr>
          <tr><td>${mod}+V</td><td>ボイスを貼り付け</td></tr>
        </table>

        <h4>自動保存</h4>
        <p>編集内容はブラウザに自動保存され、リロードしても復元されます。</p>

        <p class="sponsor">&#9829; <a href="https://paypal.me/itosoftdesign" target="_blank" rel="noopener">PayPal で応援する</a></p>

        <p class="note">FMAtelier — DX7 ボイスエディタ</p>
      `;
    }

    return html`
      <h3>Help</h3>

      <h4>Getting Started</h4>
      <p>Open a .syx bank file using the <b>Open</b> button or drag &amp; drop onto the window.
        Edit parameters in the right panel. Save with the <b>Save</b> button.</p>
      <p>With a MIDI connection, you can also receive a 32-voice bulk dump from a DX7.
        Set the MIDI CH on the DX7, then go to FUNCTION → Button 8 → MIDI TRANSMIT? and select YES to send the bulk dump.</p>

      <h4>Editing</h4>
      <p>Select a voice (1-32) from the left sidebar. Choose an operator (OP1-OP6)
        to edit its parameters. Click the algorithm diagram to change the FM algorithm.</p>

      <h4>MIDI</h4>
      <p>Click <b>MIDI</b> to connect to a DX7 or other synth.
        Requires Chrome or Edge. Select input/output ports and MIDI channel,
        then use <b>Send Voice</b> or <b>Send Bank</b> to transfer patches.</p>
      <p class="warn">Some MIDI interfaces may fail to transmit bulk SysEx data reliably.
        An Arduino-based USB MIDI interface is confirmed to work.
        See <a href="https://github.com/katsuyoshi/fmatelier/tree/main/arduino" target="_blank" rel="noopener">Arduino MIDI Interface</a> for details.</p>

      <h4>Keyboard Shortcuts</h4>
      <table>
        <tr><td>${mod}+S</td><td>Save .syx file</td></tr>
        <tr><td>${mod}+Z</td><td>Undo</td></tr>
        <tr><td>${mod}+Shift+Z</td><td>Redo</td></tr>
        <tr><td>${mod}+C</td><td>Copy voice</td></tr>
        <tr><td>${mod}+V</td><td>Paste voice</td></tr>
      </table>

      <h4>Auto-save</h4>
      <p>Your edits are automatically saved in the browser and restored on reload.</p>

      <p class="sponsor">&#9829; <a href="https://paypal.me/itosoftdesign" target="_blank" rel="noopener">Support via PayPal</a></p>

      <p class="note">FMAtelier — DX7 Voice Editor</p>
    `;
  }
}
