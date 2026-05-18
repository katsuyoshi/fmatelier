# MIDI Interface for FMAtelier

Firmware for using an Arduino Uno R4 as a USB MIDI interface to reliably send patches from FMAtelier to a DX7 or other MIDI device.

Some USB-MIDI interfaces experience data loss or timeouts when transmitting large SysEx bulk dumps (4KB+). This firmware is designed to reliably transfer DX7 32-voice bulk dumps (4104 bytes).

## Requirements

| Part | Description |
|------|-------------|
| Arduino Uno R4 Minima | Renesas RA4M1, USB MIDI capable |
| MIDI Shield | Serial1 connection (RX=pin0, TX=pin1) |
| DIN MIDI cable | Shield OUT to DX7 IN |
| USB cable | Uno R4 to PC (Type-C) |

## Connection Diagrams

### USB MIDI (Recommended)

No external MIDI interface needed. One USB cable is all you need.

```
+------+       USB       +------------------+ OUT ----> IN +-------------+
|  PC  | <=============> | Uno R4           | <----------> | MIDI device |
+------+                 | + MIDI Shield    | IN <---- OUT +-------------+
                         +------------------+    (DIN)
```

### DIN MIDI Pass-through

Forwards DIN MIDI input from an external interface directly to the DX7.

```
+------+              +-----------+ OUT -----> IN +------------------+ OUT ----> IN +-------------+
|  PC  | -----------> | MIDI I/F  | ============> | MIDI Shield IN   | -----------> | MIDI device |
+------+              +-----------+     (DIN)     | [Uno R4]         |    (DIN)     +-------------+
                                                  | MIDI Shield OUT  |
                                                  +------------------+
```

## Firmware Installation

### Method 1: Flash Pre-built Binary (Recommended)

No development environment setup required.

#### 1. Install dfu-util

| OS | Command |
|----|---------|
| macOS | `brew install dfu-util` |
| Ubuntu/Debian | `sudo apt install dfu-util` |
| Windows | Download from [dfu-util releases](http://dfu-util.sourceforge.net/releases/) |

#### 2. Firmware

A pre-built binary is included in the repository: [`arduino/bin/firmware.bin`](bin/firmware.bin)

#### 3. Enter DFU Mode

**Double-tap** the reset button on the Uno R4 quickly. The onboard LED will fade in and out repeatedly, indicating DFU (bootloader) mode.

#### 4. Flash

```bash
dfu-util -d 2341:0069 -a 0 -D firmware.bin --dfuse-address=0x00000000:leave
```

The board will automatically reset and start the firmware after flashing.

### Method 2: Build from Source

Requires [PlatformIO](https://platformio.org/). Install via VS Code extension or CLI.

```bash
cd arduino

# Build only
pio run

# Build and upload
pio run -t upload
```

On the first build, `patch_usb_midi.py` automatically patches the Arduino Renesas framework to enable USB MIDI.

## Verifying Installation

Once the firmware starts, the PC will recognize the following composite USB device:

| Interface | Purpose |
|-----------|---------|
| CDC ACM | Debug serial port |
| MIDI | USB MIDI device (select in FMAtelier) |

In FMAtelier's MIDI panel, select "Arduino Uno MIDI" for both Input and Output, then use Send Voice / Send Bank to transfer patches to your DX7.

## Behavior

| Message type | Action |
|-------------|--------|
| Non-SysEx | Passed through immediately |
| SysEx (stream mode) | Forwarded as received (default) |
| SysEx (buffer mode) | Buffered entirely, then sent with inter-byte delay |
| Real-time (0xF8-0xFF) | Always passed through |

### SysEx Buffer

Equipped with a 4200-byte buffer, capable of fully buffering a DX7 32-voice bulk dump (F0 43 ch 09 20 00 [4096 data] checksum F7 = 4104 bytes).

### LED Indicator

| State | LED |
|-------|-----|
| SysEx receive/transmit | Solid on |
| Other MIDI activity | 50ms flash |
| Active Sensing (0xFE) | No response |

## Serial Console

Debug logs and settings are accessible at 115200 baud. Connect via Arduino IDE Serial Monitor or `pio device monitor`.

Startup message:
```
MIDI Interface ready [USB+DIN] (mode=stream delay=0us thru=off)
```

### Commands

| Command | Action |
|---------|--------|
| `stream` | Switch to stream mode (default) |
| `buf` | Switch to buffer mode |
| `thru` | Toggle DIN MIDI pass-through on/off |
| `(number)` | Set inter-byte delay in microseconds (e.g. `320`) |

### Configuration Guide

| Use case | Recommended settings |
|----------|---------------------|
| USB MIDI to DX7 | `stream`, delay `0`, `thru` off (defaults) |
| USB MIDI to DX7 (if transfer errors) | `buf`, delay `320` |
| External MIDI I/F to DX7 | `thru` on |

## Troubleshooting

### DX7 does not receive patches

1. Check DIN cable connection (Shield OUT to DX7 IN)
2. Verify the correct MIDI channel is selected in FMAtelier
3. Ensure DX7's MIDI CH matches

### Bulk dump transfer stops midway

1. Type `buf` in the serial console to switch to buffer mode
2. Type `320` to set inter-byte delay
3. Retry the transfer

### USB MIDI device not recognized

1. Verify the USB cable supports data (not charge-only)
2. Press the reset button once to restart firmware
3. If still not recognized, re-flash the firmware

## Program Structure

```
arduino/
├── src/
│   └── main.cpp            # Main firmware
├── include/                # Header files (reserved)
├── platformio.ini          # PlatformIO configuration
└── patch_usb_midi.py       # USB MIDI enable patch script
```

### main.cpp

Receives from both USB MIDI (TinyUSB) and DIN MIDI IN (Serial1), processing through a common `processMidiByte()` function, and outputs via MIDI Shield OUT.

Two SysEx processing modes:
- **stream**: Forwards received bytes immediately (low latency)
- **buffer**: Accumulates in a 4200-byte buffer, sends with delay after F7 (high reliability)

### patch_usb_midi.py

A PlatformIO pre-build script that patches the Arduino Renesas framework to enable USB MIDI:

- **tusb_config.h**: Sets `CFG_TUD_MIDI` to 1, adds FIFO buffer sizes (256B)
- **USB.cpp**: Adds MIDI interface (EP 0x05/0x85) to the USB descriptor

Patches use a sentinel comment to prevent double application and are safe to run multiple times.

## License

MIT
