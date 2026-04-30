# DX7 Voice Editor - 実装計画

## 概要
YAMAHA DX7シンセサイザーの音色（ボイス）を編集するWebアプリケーション。
- Phase 1: .syxファイルの読み書き + 音色パラメータ編集UI
- Phase 2: Web MIDI APIによる実機DX7との通信

---

## 技術スタック
| 項目 | 選択 | 理由 |
|------|------|------|
| ビルド | Vite + TypeScript (strict) | 高速HMR、ゼロコンフィグ |
| UI | Lit (Web Components, ~5KB) | スライダー多数のUIに最適。ReactのVDOM diffは不要 |
| テスト | Vitest | Viteと同じ変換パイプライン |
| CSS | CSS Custom Properties | プリプロセッサ不要、テーマ対応可能 |
| 追加依存 | なし | SysExパース、SVG描画等はすべて自前実装 |

---

## DX7 ボイスデータ仕様

### オペレータパラメータ (×6)
| パラメータ | 範囲 |
|-----------|------|
| EG Rate R1-R4 | 0-99 |
| EG Level L1-L4 | 0-99 |
| KBD Level Scaling Breakpoint | 0-99 |
| KBD Level Scaling Left/Right Depth | 0-99 |
| KBD Level Scaling Left/Right Curve | 0-3 (-LIN, -EXP, +EXP, +LIN) |
| KBD Rate Scaling | 0-7 |
| Amp Mod Sensitivity | 0-3 |
| Key Velocity Sensitivity | 0-7 |
| Output Level | 0-99 |
| Osc Mode | 0-1 (ratio/fixed) |
| Freq Coarse | 0-31 |
| Freq Fine | 0-99 |
| Detune | 0-14 (center=7) |

### 共通パラメータ
| パラメータ | 範囲 |
|-----------|------|
| Pitch EG Rate R1-R4 | 0-99 |
| Pitch EG Level L1-L4 | 0-99 |
| Algorithm | 0-31 (表示: 1-32) |
| Feedback | 0-7 |
| Osc Key Sync | 0-1 |
| LFO Speed | 0-99 |
| LFO Delay | 0-99 |
| LFO PMD / AMD | 0-99 |
| LFO Sync | 0-1 |
| LFO Wave | 0-5 (tri, saw↓, saw↑, square, sine, S&H) |
| LFO PMS | 0-7 |
| Transpose | 0-48 (center=24) |
| Voice Name | 10文字 ASCII |

### Packed Format (128 byte/voice)
- オペレータ格納順: OP6, OP5, OP4, OP3, OP2, OP1 (逆順)
- オペレータ1基 = 17バイト (ビットフィールド共有あり):
  - Byte 0-7: EG Rate/Level (R1,R2,R3,R4,L1,L2,L3,L4)
  - Byte 8: Breakpoint
  - Byte 9: Left Depth
  - Byte 10: Right Depth
  - Byte 11: Left Curve[1:0] | Right Curve[3:2]
  - Byte 12: Rate Scaling[2:0] | Detune[6:3]
  - Byte 13: AMS[1:0] | KVS[4:2]
  - Byte 14: Output Level
  - Byte 15: Osc Mode[0] | Freq Coarse[5:1]
  - Byte 16: Freq Fine
- Byte 102-109: Pitch EG Rate/Level
- Byte 110: Algorithm[4:0]
- Byte 111: Feedback[2:0] | Osc Key Sync[3]
- Byte 112-115: LFO Speed, Delay, PMD, AMD
- Byte 116: LFO Sync[0] | LFO Wave[3:1] | LFO PMS[6:4]
- Byte 117: Transpose
- Byte 118-127: Voice Name (10文字)

### SysEx Format
- バルクダンプ (32声): `F0 43 00 09 20 00 [4096 bytes] [checksum] F7`
- 単一ボイス: `F0 43 00 00 01 1B [155 bytes] [checksum] F7`
- チェックサム: データバイト合計の2の補数 & 0x7F

---

## プロジェクト構成

```
dxedit/
├── index.html
├── package.json / tsconfig.json / vite.config.ts
├── src/
│   ├── main.ts                           # エントリポイント
│   ├── model/
│   │   ├── types.ts                      # 型定義 (DX7Voice, DX7Operator, DX7Bank)
│   │   ├── defaults.ts                   # 初期化ボイス生成関数
│   │   ├── algorithms.ts                 # 32アルゴリズム定義 (グラフデータ)
│   │   ├── param-meta.ts                 # パラメータメタデータ (min/max/label)
│   │   └── validation.ts                 # パラメータ範囲クランプ
│   ├── sysex/
│   │   ├── constants.ts                  # SysExヘッダバイト、サイズ定数
│   │   ├── pack.ts                       # Voice → 128byte packed
│   │   ├── unpack.ts                     # 128byte packed → Voice
│   │   ├── bulk-dump.ts                  # .syxファイル全体の読み書き (32ボイス)
│   │   ├── single-voice.ts              # 単一ボイスSysEx (155byte unpacked)
│   │   └── checksum.ts                  # チェックサム計算
│   ├── store/
│   │   ├── bank-store.ts                # 中央ストア (EventTarget singleton)
│   │   └── undo.ts                      # Undo/Redo (structuredClone, 100エントリ上限)
│   ├── components/
│   │   ├── app/
│   │   │   └── dx-app.ts               # ルートアプリケーションシェル
│   │   ├── bank/
│   │   │   ├── voice-list.ts            # 32ボイス一覧/選択グリッド
│   │   │   └── voice-card.ts            # 個別ボイスカード
│   │   ├── editor/
│   │   │   ├── voice-editor.ts          # メインエディタレイアウト
│   │   │   ├── operator-panel.ts        # オペレータ全パラメータ編集
│   │   │   ├── operator-strip.ts        # 6OP概要 (レベルバー + ON/OFF)
│   │   │   ├── common-panel.ts          # 共通パラメータ
│   │   │   └── lfo-panel.ts             # LFOパラメータ
│   │   ├── controls/
│   │   │   ├── dx-slider.ts             # スライダーコントロール
│   │   │   ├── dx-switch.ts             # トグル/マルチポジションスイッチ
│   │   │   └── dx-select.ts             # ドロップダウン
│   │   ├── visualizations/
│   │   │   ├── envelope-graph.ts        # 4段EG描画 (SVG, ドラッグ対応)
│   │   │   ├── algorithm-diagram.ts     # アルゴリズム図 (SVG)
│   │   │   └── kbd-scaling-graph.ts     # キーボードスケーリング曲線
│   │   └── toolbar/
│   │       ├── main-toolbar.ts          # ファイル操作ボタン
│   │       └── file-io.ts              # D&D、ファイル読み込み/ダウンロード
│   ├── styles/
│   │   ├── reset.css
│   │   ├── theme.css                   # CSS Custom Properties
│   │   └── global.css
│   └── utils/
│       ├── bit-utils.ts                # ビット抽出/パッキングヘルパー
│       ├── note-names.ts               # MIDIノート番号 ↔ 音名
│       └── ascii.ts                    # DX7 ASCII文字処理
└── test/
    └── fixtures/
        └── rom1a.syx                   # テスト用ROM1Aファイル
```

---

## データフロー

```
User操作 → <dx-slider> ──param-change──→ <dx-voice-editor>
                                              │
                                      bankStore.setParam()
                                              │
                                      ┌───────┴────────┐
                                      │ バリデーション  │
                                      │ 値の適用        │
                                      │ Undoスタック追加 │
                                      └───────┬────────┘
                                              │
                                      'state-changed' event
                                              │
                                      購読コンポーネント再描画
```

---

## 実装順序 (Phase 1)

### Step 1: プロジェクト初期化
- `npm create vite@latest . -- --template vanilla-ts`
- `npm install lit`
- `npm install -D vitest`
- tsconfig.json: strict mode, experimentalDecorators有効化
- 基本的な index.html (`<dx-app>`) + src/main.ts

### Step 2: データモデル・型定義
- `src/model/types.ts` - 全インターフェース定義
- `src/model/defaults.ts` - createDefaultOperator(), createDefaultVoice(), createDefaultBank()
- `src/model/validation.ts` - clampParam()
- `src/model/param-meta.ts` - ParamMeta型、メタデータ生成
- `src/utils/bit-utils.ts` - extractBits(), packBits()
- テスト: ビットユーティリティ、デフォルト値生成

### Step 3: SysExパース (最重要 - UIに進む前に完全にする)
- `src/sysex/constants.ts` - SYSEX_START, YAMAHA_ID, etc.
- `src/sysex/checksum.ts` - calculateChecksum()
- `src/sysex/unpack.ts` - unpackVoice(data, offset)
- `src/sysex/pack.ts` - packVoice(voice)
- `src/sysex/bulk-dump.ts` - parseSyxFile(), generateSyxFile()
- `src/sysex/single-voice.ts` - parseSingleVoice(), generateSingleVoice()
- テスト:
  - ラウンドトリップ (unpack → pack → 元データと一致)
  - ROM1A.syxの既知ボイス名/パラメータ値検証
  - 全パラメータmin/maxのエッジケース
  - 全ビットフィールドの個別検証

### Step 4: 状態管理ストア
- `src/store/bank-store.ts` - BankStore (EventTarget extends)
  - getState(), getCurrentVoice()
  - setParam(path, value), selectVoice(index), selectOperator(index)
  - loadBank(), undo(), redo()
- Undo/Redo: structuredClone snapshot, 100エントリ上限 (≈500KB)
- テスト: CRUD操作、Undo/Redo

### Step 5: 基本UIコントロール
- `dx-slider.ts` - label + range input + 数値表示、param-changeイベント発火
- `dx-switch.ts` - ON/OFFトグル
- `dx-select.ts` - ドロップダウン選択
- `src/styles/theme.css` - CSS Custom Properties定義

### Step 6: アプリシェル + ボイスリスト
- `dx-app.ts` - CSS Gridレイアウト (左: バンク一覧、右: エディタ)
- `voice-list.ts` - 32ボイスグリッド
- `voice-card.ts` - ボイス名 + 番号表示
- `file-io.ts` - D&D対応、FileReader → Uint8Array → parseSyxFile()
- **ここで.syx読み込み → 32ボイス名表示が動作する**

### Step 7: オペレータエディタ
- `voice-editor.ts` - タブ/パネルレイアウト
- `operator-panel.ts` - 全オペレータパラメータ (EG, Scaling, Freq, etc.)
- `operator-strip.ts` - 6OP概要バー (出力レベル表示、クリックで選択)
- ストア連携: UI ↔ bankStore双方向

### Step 8: エンベロープ可視化
- `envelope-graph.ts` - SVG polyline + ドラッグ可能なブレークポイント
- 4段表示: R1/L1 → R2/L2 → R3/L3 (sustain) → R4/L4 (release)
- Rate=水平方向(時間)、Level=垂直方向

### Step 9: アルゴリズム図
- `algorithms.ts` - 全32アルゴリズムのグラフデータ定義
  - carriers[], connections[], feedback
  - DX7マニュアル(p.28-29)およびDexedソースから転記
- `algorithm-diagram.ts` - SVGレンダリング
  - オペレータをボックスで描画
  - 変調パスを矢印で接続
  - キャリアは太枠/別色で強調
  - フィードバックは曲線矢印
  - オペレータクリックで選択

### Step 10: 共通パネル + LFOパネル
- `common-panel.ts` - Algorithm選択、Feedback、Osc Key Sync、Pitch EG
- `lfo-panel.ts` - Speed, Delay, PMD, AMD, Sync, Wave, PMS

### Step 11: キーボードスケーリング可視化
- `kbd-scaling-graph.ts` - C1-C7の鍵盤範囲にわたる曲線描画
- Breakpoint位置、Left/Right Depth/Curveの視覚表現

### Step 12: ファイルエクスポート + 仕上げ
- .syxダウンロード (Blob → Object URL → `<a download>`)
- キーボードショートカット: Ctrl+Z (Undo), Ctrl+Shift+Z (Redo), Ctrl+S (Save)
- ボイスコピー/ペースト (スロット間)
- ボイス名編集 (10文字ASCII制限入力)
- レスポンシブレイアウト調整

---

## Phase 2: Web MIDI API (将来)

```typescript
// src/midi/midi-manager.ts
class MidiManager {
  async requestAccess(): Promise<void> {
    // navigator.requestMIDIAccess({ sysex: true }) ← sysex:true必須
    // HTTPS環境が必要
  }
  async sendBulkDump(bank: DX7Bank): Promise<void> { /* ... */ }
  async sendSingleVoice(voice: DX7Voice): Promise<void> { /* ... */ }
  async sendParameterChange(param: number, value: number): Promise<void> { /* ... */ }
  onSysExReceived(callback: (data: Uint8Array) => void): void { /* ... */ }
}
```

- MIDIデバイス選択UI (`midi-panel.ts`)
- リアルタイムパラメータ送信 (single voice dump)
- DX7からのバルクダンプ受信

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| 32アルゴリズム定義の正確性 | Dexedソースコードとの照合。各アルゴリズムのキャリア数テスト |
| ビットパッキングのオフバイワン | 全フィールド個別テスト + 実ファイルラウンドトリップ |
| SVGドラッグ座標計算 | ドラッグ数学を純粋関数に分離してテスト可能に |
| ボイス名エンコーディング | インポート時にDX7有効文字範囲にクランプ |

---

## 検証方法
1. ROM1A.syx読み込み → 32ボイス名が正しく表示される
2. パラメータ編集 → エクスポート → 再読み込みでラウンドトリップ一致
3. Undo/Redo が正しく動作する
4. Chrome, Firefox, Safariで表示・操作確認
5. `npx vitest run` で全テスト通過
