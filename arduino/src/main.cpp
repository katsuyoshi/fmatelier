/*
 * DX7 MIDI Bridge
 *
 * MIDI pass-through with byte-level delay for SysEx messages.
 * Solves the DX7 UART buffer overflow problem when receiving
 * 32-voice bulk dumps (4104 bytes) at full MIDI speed.
 *
 * Data flow:
 *   PC (MIDI I/F) -> MIDI Shield IN -> [Uno R4] -> MIDI Shield OUT -> DX7
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

// MIDI baud rate (standard)
constexpr unsigned long MIDI_BAUD = 31250;

// Inter-byte delay for SysEx transmission (microseconds).
// Adjustable at runtime via serial console (e.g. type "500" to set 500us).
static unsigned long sysexByteDelayUs = 1000;

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

// Serial console input buffer for delay value
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
    Serial.print(F("DX7 MIDI Bridge ready (delay="));
    Serial.print(sysexByteDelayUs);
    Serial.println(F("us)"));
  }

  // Read delay value from serial console (non-blocking, e.g. "500\n")
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (cmdLen > 0) {
        cmdBuf[cmdLen] = '\0';
        unsigned long val = strtoul(cmdBuf, nullptr, 10);
        if (val > 0) {
          sysexByteDelayUs = val;
          Serial.print(F("delay="));
          Serial.print(sysexByteDelayUs);
          Serial.println(F("us"));
        }
        cmdLen = 0;
      }
    } else if (cmdLen < sizeof(cmdBuf) - 1) {
      cmdBuf[cmdLen++] = c;
    }
  }

  // Turn off activity LED after hold time
  if (ledActivity && millis() - ledOnTime >= LED_HOLD_MS) {
    digitalWrite(LED_BUILTIN, LOW);
    ledActivity = false;
  }

  while (Serial1.available()) {
    uint8_t b = Serial1.read();

    // Log received byte (skip per-byte log during SysEx to avoid RX overflow)
    if (!inSysex) {
      Serial.print(F("RX: 0x"));
      if (b < 0x10) Serial.print('0');
      Serial.println(b, HEX);
    }

    // Activity LED flash (non-SysEx)
    if (!inSysex) {
      digitalWrite(LED_BUILTIN, HIGH);
      ledOnTime = millis();
      ledActivity = true;
    }

    // Real-time messages (0xF8-0xFF) always pass through
    if (b >= 0xF8) {
      Serial1.write(b);
      continue;
    }

    // SysEx start
    if (b == 0xF0) {
      Serial.println(F("SysEx RX start"));
      inSysex = true;
      bufferOverflow = false;
      sysexLen = 0;
      sysexBuf[sysexLen++] = b;
      continue;
    }

    // Inside SysEx
    if (inSysex) {
      if (b == 0xF7) {
        // SysEx end - buffer complete, now send with delay
        inSysex = false;
        if (!bufferOverflow && sysexLen < SYSEX_BUF_SIZE) {
          sysexBuf[sysexLen++] = b;
          sendSysexWithDelay(sysexBuf, sysexLen);
        } else {
          Serial.print(F("SysEx overflow! len="));
          Serial.println(sysexLen);
          Serial1.write(b);
        }
        continue;
      }

      // Status byte (0x80-0xF6) inside SysEx = abort
      if (b & 0x80) {
        inSysex = false;
        Serial.println(F("SysEx aborted"));
        // Fall through to non-SysEx handling
      } else {
        // Data byte
        if (sysexLen < SYSEX_BUF_SIZE) {
          sysexBuf[sysexLen++] = b;
        } else {
          bufferOverflow = true;
        }
        continue;
      }
    }

    // Non-SysEx: pass through immediately
    Serial1.write(b);
  }
}
