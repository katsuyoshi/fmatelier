# MIDI Interface

Uses an Arduino as a MIDI interface. Supports USB MIDI input and DIN MIDI IN-to-OUT pass-through.

## Hardware

- Arduino Uno R4 Minima
- MIDI Shield (Serial1: RX=pin0, TX=pin1)

### Connection

No external MIDI interface is needed when using USB MIDI.

```
USB MIDI (recommended):

  +------+       USB       +------------------+ OUT ----> IN +-------------+
  |  PC  | <=============> | Uno R4           | <----------> | MIDI device |
  +------+                 | + MIDI Shield    | IN <---- OUT +-------------+
                           +------------------+    (DIN)

DIN MIDI (pass-through):

  +------+              +-----------+ OUT -----> IN +------------------+ OUT ----> IN +-------------+
  |  PC  | -----------> | MIDI I/F  | ============> | MIDI Shield IN   | -----------> | MIDI device |
  +------+              +-----------+     (DIN)     | [Uno R4]         |    (DIN)     +-------------+
                                                    | MIDI Shield OUT  |
                                                    +------------------+
```

## Behavior

| Message type | Action |
|-------------|--------|
| Non-SysEx | Passed through immediately |
| SysEx (stream mode) | Forwarded as received (default) |
| SysEx (buffer mode) | Buffered entirely, then sent with inter-byte delay |
| Real-time (0xF8-0xFF) | Always passed through |

### LED

- SysEx receive/transmit: stays on
- Other MIDI activity: brief flash (50ms)
- Active Sensing (0xFE): ignored

## Build and Upload

Requires [PlatformIO](https://platformio.org/).

```bash
# Build
pio run

# Build and upload
pio run -t upload
```

On the first build, `patch_usb_midi.py` automatically patches the framework files to enable USB MIDI.

## Serial Console

Outputs debug logs at 115200 baud.

```
MIDI Interface ready [USB+DIN] (mode=stream delay=0us thru=off)
```

### Commands

Type a command and press Enter to change settings.

| Command | Action |
|---------|--------|
| `stream` | Switch to stream mode (default) |
| `buf` | Switch to buffer mode |
| `thru` | Toggle DIN MIDI pass-through on/off |
| `(number)` | Set inter-byte delay in microseconds (e.g. `1000` = 1ms) |

Defaults: stream mode, delay 0, DIN pass-through off.

When using USB MIDI, keep DIN pass-through off (default). Enable it with `thru` when using an external DIN MIDI interface.

## Program Structure

```
arduino/
├── src/
│   └── main.cpp            # Main firmware
├── platformio.ini          # PlatformIO configuration
└── patch_usb_midi.py       # USB MIDI enable patch script
```

### main.cpp

Firmware that processes the MIDI byte stream. Receives from both USB MIDI (TinyUSB) and DIN MIDI IN (Serial1), processing through a common `processMidiByte()` function, and outputs via MIDI Shield OUT.

SysEx messages have two processing modes. Stream mode forwards received bytes immediately. Buffer mode accumulates up to 4200 bytes and sends them after receiving F7.

### patch_usb_midi.py

A PlatformIO pre-build script that patches the Arduino Renesas framework to enable USB MIDI.

- **tusb_config.h**: Changes `CFG_TUD_MIDI` from 0 to 1 and adds MIDI FIFO buffer sizes
- **USB.cpp**: Adds MIDI interface (EP 0x05/0x85) to the USB descriptor

Patches use a sentinel comment to prevent double application and are safe to run multiple times.

### USB Device Configuration

The PC sees the following composite USB device:

| Interface | Purpose |
|-----------|---------|
| CDC ACM | Debug serial port |
| MIDI | USB MIDI device |
