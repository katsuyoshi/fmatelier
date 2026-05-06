/*
 * DX7 MIDI Bridge
 *
 * MIDI pass-through with byte-level delay for SysEx messages.
 * Solves the DX7 UART buffer overflow problem when receiving
 * 32-voice bulk dumps (4104 bytes) at full MIDI speed.
 *
 * Data flow (DIN MIDI):
 *   PC (MIDI I/F) -> MIDI Shield IN -> [Uno R4] -> MIDI Shield OUT -> DX7
 *
 * Data flow (USB MIDI):
 *   PC -> USB MIDI -> [Uno R4] -> MIDI Shield OUT -> DX7
 *
 * Hardware:
 *   - Arduino Uno R4 (Minima or WiFi)
 *   - MIDI Shield on Serial1 (RX=pin0, TX=pin1)
 *
 * Behavior:
 *   - Non-SysEx messages: pass through immediately (no delay)
 *   - SysEx messages: buffer fully, then send with inter-byte delay
 *   - Built-in LED lights during SysEx transmission
 */

#include <Arduino.h>

extern "C" {
  #include "tusb.h"
}

// Register as USB MIDI device.
// Overrides the weak declaration in USB.h, causing the USB descriptor
// builder to include the MIDI interface alongside CDC.
void __USBInstallMIDI() {}

// MIDI baud rate (standard)
constexpr unsigned long MIDI_BAUD = 31250;

// Inter-byte delay for SysEx transmission (microseconds).
// Adjustable at runtime via serial console (e.g. type "500" to set 500us).
static unsigned long sysexByteDelayUs = 0;

// SysEx buffer - large enough for 32-voice bulk dump
// (F0 43 ch 09 20 00 [4096 data] checksum F7 = ~4104 bytes)
constexpr uint16_t SYSEX_BUF_SIZE = 4200;
static uint8_t sysexBuf[SYSEX_BUF_SIZE];
static uint16_t sysexLen = 0;
static bool inSysex = false;
static bool bufferOverflow = false;
static bool serialReady = false;

// LED activity indicator
constexpr unsigned long LED_HOLD_MS = 50;
static unsigned long ledOnTime = 0;
static bool ledActivity = false;

// SysEx mode: true = stream (forward bytes as received), false = buffer then send
static bool streamMode = true;

// DIN MIDI pass-through: when true, DIN IN is forwarded to DIN OUT
// Enable this when using an external MIDI interface (PC -> MIDI I/F -> DIN IN -> DIN OUT -> device)
// Disable (default) when using USB MIDI to avoid looping data back to the connected device
static bool dinThru = false;

// Serial console input buffer
static char cmdBuf[16];
static uint8_t cmdLen = 0;

void sendSysexWithDelay(const uint8_t* buf, uint16_t len) {
  Serial.print(F("SysEx TX: "));
  Serial.print(len);
  Serial.print(F(" bytes (delay="));
  Serial.print(sysexByteDelayUs);
  Serial.println(F("us)"));

  digitalWrite(LED_BUILTIN, HIGH);
  for (uint16_t i = 0; i < len; i++) {
    Serial1.write(buf[i]);
    delayMicroseconds(sysexByteDelayUs);
  }
  Serial1.flush();
  digitalWrite(LED_BUILTIN, LOW);

  Serial.println(F("SysEx TX done"));
}

// Send a byte to USB MIDI (DIN IN -> PC)
static inline void sendToUSBMidi(uint8_t b) {
  if (tud_midi_mounted()) {
    tud_midi_stream_write(0, &b, 1);
  }
}

// Process one incoming MIDI byte.
// fromUSB: true if from USB MIDI, false if from DIN MIDI IN.
// USB -> DIN OUT: always forwarded
// DIN IN -> DIN OUT: only when dinThru is enabled
// DIN IN -> USB MIDI: always forwarded (to PC)
void processMidiByte(uint8_t b, bool fromUSB) {
  bool sendToOut = fromUSB || dinThru;
  bool sendToUSB = !fromUSB;

  // Log received byte (skip SysEx per-byte and Active Sensing 0xFE)
  if (!inSysex && b != 0xFE) {
    Serial.print(fromUSB ? F("USB RX: 0x") : F("DIN RX: 0x"));
    if (b < 0x10) Serial.print('0');
    Serial.println(b, HEX);
  }

  // Activity LED flash (non-SysEx, skip Active Sensing)
  if (!inSysex && b != 0xFE) {
    digitalWrite(LED_BUILTIN, HIGH);
    ledOnTime = millis();
    ledActivity = true;
  }

  // Real-time messages (0xF8-0xFF) pass through
  if (b >= 0xF8) {
    if (sendToOut) Serial1.write(b);
    if (sendToUSB) sendToUSBMidi(b);
    return;
  }

  // SysEx start
  if (b == 0xF0) {
    Serial.println(F("SysEx RX start"));
    inSysex = true;
    sysexLen = 1;
    if (streamMode) {
      digitalWrite(LED_BUILTIN, HIGH);
      if (sendToOut) {
        Serial1.write(b);
        if (sysexByteDelayUs > 0) delayMicroseconds(sysexByteDelayUs);
      }
      if (sendToUSB) sendToUSBMidi(b);
    } else {
      bufferOverflow = false;
      sysexBuf[0] = b;
    }
    return;
  }

  // Inside SysEx
  if (inSysex) {
    if (b == 0xF7) {
      inSysex = false;
      sysexLen++;
      if (streamMode) {
        if (sendToOut) {
          Serial1.write(b);
          Serial1.flush();
        }
        if (sendToUSB) sendToUSBMidi(b);
        digitalWrite(LED_BUILTIN, LOW);
      } else if (!bufferOverflow && sysexLen <= SYSEX_BUF_SIZE) {
        sysexBuf[sysexLen - 1] = b;
        if (sendToOut) sendSysexWithDelay(sysexBuf, sysexLen);
        if (sendToUSB) {
          for (uint16_t i = 0; i < sysexLen; i++) {
            sendToUSBMidi(sysexBuf[i]);
          }
        }
      } else {
        Serial.print(F("SysEx overflow! len="));
        Serial.println(sysexLen);
      }
      Serial.print(F("SysEx done: "));
      Serial.print(sysexLen);
      Serial.println(F(" bytes"));
      return;
    }

    // Status byte (0x80-0xF6) inside SysEx = abort
    if (b & 0x80) {
      inSysex = false;
      if (streamMode) digitalWrite(LED_BUILTIN, LOW);
      Serial.println(F("SysEx aborted"));
      // Fall through to non-SysEx handling
    } else {
      // Data byte
      sysexLen++;
      if (streamMode) {
        if (sendToOut) {
          Serial1.write(b);
          if (sysexByteDelayUs > 0) delayMicroseconds(sysexByteDelayUs);
        }
        if (sendToUSB) sendToUSBMidi(b);
      } else {
        if (sysexLen <= SYSEX_BUF_SIZE) {
          sysexBuf[sysexLen - 1] = b;
        } else {
          bufferOverflow = true;
        }
      }
      return;
    }
  }

  // Non-SysEx: pass through immediately
  if (sendToOut) Serial1.write(b);
  if (sendToUSB) sendToUSBMidi(b);
}

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  // USB serial for debug logging
  Serial.begin(115200);

  // MIDI via shield (DIN IN/OUT on pins 0/1)
  Serial1.begin(MIDI_BAUD);
}

void loop() {
  if (!serialReady && Serial) {
    delay(100);  // wait for USB CDC to stabilize
    serialReady = true;
    Serial.print(F("MIDI Interface ready [USB+DIN] (mode="));
    Serial.print(streamMode ? F("stream") : F("buffer"));
    Serial.print(F(" delay="));
    Serial.print(sysexByteDelayUs);
    Serial.print(F("us thru="));
    Serial.print(dinThru ? F("on") : F("off"));
    Serial.println(F(")"));
  }

  // Read delay value from serial console (non-blocking, e.g. "500\n")
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (cmdLen > 0) {
        cmdBuf[cmdLen] = '\0';
        if (strcmp(cmdBuf, "stream") == 0) {
          streamMode = true;
          Serial.println(F("mode=stream"));
        } else if (strcmp(cmdBuf, "buf") == 0) {
          streamMode = false;
          Serial.println(F("mode=buffer"));
        } else if (strcmp(cmdBuf, "thru") == 0) {
          dinThru = !dinThru;
          Serial.print(F("DIN thru="));
          Serial.println(dinThru ? F("on") : F("off"));
        } else {
          char* endPtr;
          unsigned long val = strtoul(cmdBuf, &endPtr, 10);
          if (endPtr != cmdBuf) {
            sysexByteDelayUs = val;
            Serial.print(F("delay="));
            Serial.print(sysexByteDelayUs);
            Serial.println(F("us"));
          }
        }
        cmdLen = 0;
      }
    } else if (cmdLen < sizeof(cmdBuf) - 1) {
      cmdBuf[cmdLen++] = c;
    }
  }

  // Turn off activity LED after hold time
  if (ledActivity && !inSysex && millis() - ledOnTime >= LED_HOLD_MS) {
    digitalWrite(LED_BUILTIN, LOW);
    ledActivity = false;
  }

  // Read from USB MIDI
  if (tud_midi_mounted()) {
    uint8_t buf[64];
    uint32_t count = tud_midi_stream_read(buf, sizeof(buf));
    for (uint32_t i = 0; i < count; i++) {
      processMidiByte(buf[i], true);
    }
  }

  // Read from DIN MIDI (Serial1)
  while (Serial1.available()) {
    uint8_t b = Serial1.read();
    processMidiByte(b, false);
  }
}
