# MIDI Interface for FMAtelier

Arduino Uno R4 を USB MIDI インターフェースとして使用し、FMAtelier から DX7 などの MIDI 機器にパッチを送信するためのファームウェアです。

多くの市販 USB-MIDI インターフェースは SysEx バルクダンプ（4KB超）の送信時にデータ欠落やタイムアウトが発生することがあります。このファームウェアは DX7 の 32 ボイスバルクダンプ（4104 バイト）を確実に転送できるよう設計されています。

## 必要なもの

| 部品 | 説明 |
|------|------|
| Arduino Uno R4 Minima | Renesas RA4M1 搭載、USB MIDI 対応 |
| MIDI Shield | Serial1（RX=pin0, TX=pin1）接続のもの |
| DIN MIDI ケーブル | Shield の OUT → DX7 の IN |
| USB ケーブル | Uno R4 と PC の接続用（Type-C） |

## 接続図

### USB MIDI（推奨）

外部 MIDI インターフェース不要。USB ケーブル1本で接続できます。

```
+------+       USB       +------------------+ OUT ----> IN +----------+
|  PC  | <=============> | Uno R4           | <----------> | MIDI機器 |
+------+                 | + MIDI Shield    | IN <---- OUT +----------+
                         +------------------+    (DIN)
```

### DIN MIDI スルー

外部 MIDI インターフェースからの DIN MIDI 入力を、そのまま DX7 に転送します。

```
+------+              +-----------+ OUT -----> IN +------------------+ OUT ----> IN +----------+
|  PC  | -----------> | MIDI I/F  | ============> | MIDI Shield IN   | -----------> | MIDI機器 |
+------+              +-----------+     (DIN)     | [Uno R4]         |    (DIN)     +----------+
                                                  | MIDI Shield OUT  |
                                                  +------------------+
```

## ファームウェアのインストール

### 方法 1: ビルド済みバイナリを書き込む（推奨）

開発環境のセットアップ不要で、すぐに使えます。

#### 1. dfu-util のインストール

| OS | コマンド |
|----|---------|
| macOS | `brew install dfu-util` |
| Ubuntu/Debian | `sudo apt install dfu-util` |
| Windows | [dfu-util リリースページ](http://dfu-util.sourceforge.net/releases/) からダウンロード |

#### 2. ファームウェア

ビルド済みバイナリがリポジトリに含まれています: [`arduino/bin/firmware.bin`](bin/firmware.bin)

#### 3. DFU モードにする

Uno R4 のリセットボタンを**素早く2回押す**と、DFU モード（ブートローダー）に入ります。
オンボード LED がフェードイン/アウトを繰り返します。

#### 4. 書き込み

```bash
dfu-util -d 2341:0069 -a 0 -D firmware.bin --dfuse-address=0x00000000:leave
```

書き込み完了後、自動的にリセットされファームウェアが起動します。

### 方法 2: ソースからビルド

[PlatformIO](https://platformio.org/) を使用します。VS Code 拡張機能または CLI でインストールしてください。

```bash
cd arduino

# ビルドのみ
pio run

# ビルド＋書き込み
pio run -t upload
```

初回ビルド時に `patch_usb_midi.py` が Arduino Renesas フレームワークを自動パッチして USB MIDI を有効化します。

## 動作確認

ファームウェアが起動すると、PC から以下の複合 USB デバイスとして認識されます。

| インターフェース | 用途 |
|----------------|------|
| CDC ACM | デバッグ用シリアルポート |
| MIDI | USB MIDI デバイス（FMAtelier で選択） |

FMAtelier の MIDI パネルで Input/Output に「Arduino Uno MIDI」を選択し、Send Voice / Send Bank で DX7 にパッチを送信できます。

## 動作仕様

| メッセージ種別 | 動作 |
|---------------|------|
| 非 SysEx | そのまま通過 |
| SysEx (stream モード) | 受信しながらそのまま転送（デフォルト） |
| SysEx (buffer モード) | 全体をバッファリング後、バイト間ディレイ付きで送信 |
| リアルタイム (0xF8-0xFF) | 常にそのまま通過 |

### SysEx バッファ

4200 バイトのバッファを搭載しており、DX7 の 32 ボイスバルクダンプ（F0 43 ch 09 20 00 [4096 data] checksum F7 = 4104 バイト）を完全にバッファリングできます。

### LED インジケーター

| 状態 | LED |
|------|-----|
| SysEx 受信/送信中 | 点灯 |
| その他の MIDI 受信 | 50ms フラッシュ |
| Active Sensing (0xFE) | 無反応 |

## シリアルコンソール

115200 baud でデバッグログと設定変更ができます。Arduino IDE のシリアルモニタや `pio device monitor` で接続してください。

起動時メッセージ:
```
MIDI Interface ready [USB+DIN] (mode=stream delay=0us thru=off)
```

### コマンド

| コマンド | 動作 |
|---------|------|
| `stream` | stream モードに切り替え（デフォルト） |
| `buf` | buffer モードに切り替え |
| `thru` | DIN MIDI パスルーの on/off をトグル |
| `(数値)` | バイト間ディレイをマイクロ秒で設定（例: `320`） |

### 設定ガイド

| 使用形態 | 推奨設定 |
|---------|---------|
| USB MIDI → DX7 | `stream`、ディレイ `0`、`thru` off（デフォルト） |
| USB MIDI → DX7（転送エラー時） | `buf`、ディレイ `320` |
| 外部 MIDI I/F → DX7 | `thru` on |

## トラブルシューティング

### DX7 がパッチを受信しない

1. DIN ケーブルの接続を確認（Shield OUT → DX7 IN）
2. FMAtelier で正しい MIDI チャンネルを選択しているか確認
3. DX7 の MIDI CH が一致しているか確認

### バルクダンプ送信が途中で止まる

1. シリアルコンソールで `buf` を入力してバッファモードに切り替え
2. `320` を入力してバイト間ディレイを設定
3. 再送信

### USB MIDI デバイスが認識されない

1. USB ケーブルがデータ通信対応か確認（充電専用ケーブルは不可）
2. リセットボタンを1回押してファームウェアを再起動
3. それでも認識されない場合はファームウェアを再書き込み

## プログラム構成

```
arduino/
├── src/
│   └── main.cpp            # メインファームウェア
├── include/                # ヘッダファイル（将来用）
├── platformio.ini          # PlatformIO 設定
└── patch_usb_midi.py       # USB MIDI 有効化パッチスクリプト
```

### main.cpp

USB MIDI（TinyUSB）と DIN MIDI IN（Serial1）の両方から受信し、共通の `processMidiByte()` 関数で処理して MIDI Shield OUT から出力します。

SysEx メッセージの処理は 2 つのモード:
- **stream**: 受信したバイトを即座に転送（低レイテンシ）
- **buffer**: 4200 バイトバッファに蓄積し、F7 受信後にディレイ付きで送信（高信頼性）

### patch_usb_midi.py

PlatformIO のプレビルドスクリプト。Arduino Renesas フレームワークの以下のファイルをパッチして USB MIDI を有効化します:

- **tusb_config.h**: `CFG_TUD_MIDI` を 1 に変更、FIFO バッファサイズ（256B）を追加
- **USB.cpp**: USB ディスクリプタに MIDI インターフェース（EP 0x05/0x85）を追加

パッチはセンチネルコメントで二重適用を防止しており、何度実行しても安全です。

## ライセンス

MIT
