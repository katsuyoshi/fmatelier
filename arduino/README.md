# MIDI Interface

Arduino を MIDI インターフェースとして使用します。
USB MIDI での受信と、DIN MIDI IN から OUT へのスルーに対応しています。

## ハードウェア

- Arduino Uno R4 Minima
- MIDI Shield（Serial1: RX=pin0, TX=pin1）

### 接続

USB MIDI を使用する場合、外部 MIDI インターフェースは不要です。

```
USB MIDI（推奨）:

  +------+       USB       +------------------+ OUT ----> IN +----------+
  |  PC  | <=============> | Uno R4           | <----------> | MIDI機器 |
  +------+                 | + MIDI Shield    | IN <---- OUT +----------+
                           +------------------+    (DIN)

DIN MIDI（スルー）:

  +------+              +-----------+ OUT -----> IN +------------------+ OUT ----> IN +----------+
  |  PC  | -----------> | MIDI I/F  | ============> | MIDI Shield IN   | -----------> | MIDI機器 |
  +------+              +-----------+     (DIN)     | [Uno R4]         |    (DIN)     +----------+
                                                    | MIDI Shield OUT  |
                                                    +------------------+
```

## 動作仕様

| メッセージ種別 | 動作 |
|---------------|------|
| 非 SysEx | そのまま通過します |
| SysEx (stream モード) | 受信しながらそのまま転送します（デフォルト） |
| SysEx (buffer モード) | 全体をバッファリング後、バイト間ディレイ付きで送信します |
| リアルタイム (0xF8-0xFF) | 常にそのまま通過します |

### LED

- SysEx 受信/送信中: 点灯します
- その他の MIDI 受信時: 短時間フラッシュします（50ms）
- Active Sensing (0xFE) では点灯しません

## ビルドと書き込み

[PlatformIO](https://platformio.org/) を使用します。

```bash
# ビルド
pio run

# ビルド＋書き込み
pio run -t upload
```

初回ビルド時に `patch_usb_midi.py` がフレームワークファイルを自動パッチして USB MIDI を有効化します。

## シリアルコンソール

115200 baud でデバッグログを出力します。

```
MIDI Interface ready [USB+DIN] (mode=stream delay=0us thru=off)
```

### コマンド

シリアルコンソールにコマンドを入力して Enter を押すと設定を変更できます。

| コマンド | 動作 |
|---------|------|
| `stream` | stream モードに切り替えます（デフォルト） |
| `buf` | buffer モードに切り替えます |
| `thru` | DIN MIDI パスルーの on/off を切り替えます |
| `(数値)` | バイト間ディレイをマイクロ秒単位で設定します（例: `1000` → 1ms） |

デフォルトは stream モード、ディレイ 0、DIN パスルー off です。

USB MIDI 使用時は DIN パスルー off（デフォルト）で使用します。DIN MIDI で外部 MIDI インターフェースを経由する場合は `thru` で on にしてください。

## プログラム構成

```
arduino/
├── src/
│   └── main.cpp            # メインファームウェア
├── platformio.ini          # PlatformIO 設定
└── patch_usb_midi.py       # USB MIDI 有効化パッチスクリプト
```

### main.cpp

MIDI バイトストリームを処理するファームウェアです。USB MIDI（TinyUSB）と DIN MIDI IN（Serial1）の両方から受信し、共通の `processMidiByte()` 関数で処理して MIDI シールド OUT から出力します。

SysEx メッセージの処理は 2 つのモードがあります。stream モードでは受信したバイトをそのまま転送します。buffer モードでは 4200 バイトのバッファに蓄積し、F7 受信後に送信します。

### patch_usb_midi.py

PlatformIO のプレビルドスクリプトです。Arduino Renesas フレームワークの以下のファイルをパッチして USB MIDI を有効化します。

- **tusb_config.h**: `CFG_TUD_MIDI` を 0 → 1 に変更し、MIDI FIFO バッファサイズを追加します
- **USB.cpp**: USB ディスクリプタに MIDI インターフェース（EP 0x05/0x85）を追加します

パッチはセンチネルコメントで二重適用を防止しており、何度実行しても安全です。

### USB デバイス構成

PC からは以下の複合 USB デバイスとして認識されます。

| インターフェース | 用途 |
|----------------|------|
| CDC ACM | デバッグ用シリアルポート |
| MIDI | USB MIDI デバイス |

