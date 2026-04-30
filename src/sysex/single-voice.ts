import type { DX7Voice, DX7Operator, DX7VoiceCommon } from '../model/types.ts';
import { decodeDX7Name, encodeDX7Name } from '../utils/ascii.ts';
import { calculateChecksum } from './checksum.ts';
import { SysExError } from './bulk-dump.ts';
import {
  SYSEX_START,
  SYSEX_END,
  YAMAHA_ID,
  SINGLE_VOICE_HEADER,
  UNPACKED_VOICE_SIZE,
} from './constants.ts';

/**
 * Unpack a single voice from 155 unpacked bytes (VCED format).
 * In the unpacked format, each parameter occupies its own byte.
 * Operators are stored OP1 first (opposite of packed format).
 */
export function unpackSingleVoice(data: Uint8Array, offset: number = 0): DX7Voice {
  const b = (i: number) => data[offset + i] ?? 0;

  const operators: DX7Operator[] = [];
  for (let op = 0; op < 6; op++) {
    const base = op * 21;
    operators.push({
      egRate: [b(base), b(base + 1), b(base + 2), b(base + 3)],
      egLevel: [b(base + 4), b(base + 5), b(base + 6), b(base + 7)],
      kbdLevelScalingBreakpoint: b(base + 8),
      kbdLevelScalingLeftDepth: b(base + 9),
      kbdLevelScalingRightDepth: b(base + 10),
      kbdLevelScalingLeftCurve: b(base + 11),
      kbdLevelScalingRightCurve: b(base + 12),
      kbdRateScaling: b(base + 13),
      ampModSensitivity: b(base + 14),
      keyVelocitySensitivity: b(base + 15),
      outputLevel: b(base + 16),
      oscMode: b(base + 17),
      freqCoarse: b(base + 18),
      freqFine: b(base + 19),
      detune: b(base + 20),
    });
  }

  const cBase = 126; // 6 operators × 21 params
  const common: DX7VoiceCommon = {
    pitchEgRate: [b(cBase), b(cBase + 1), b(cBase + 2), b(cBase + 3)],
    pitchEgLevel: [b(cBase + 4), b(cBase + 5), b(cBase + 6), b(cBase + 7)],
    algorithm: b(cBase + 8),
    feedback: b(cBase + 9),
    oscKeySync: b(cBase + 10),
    lfoSpeed: b(cBase + 11),
    lfoDelay: b(cBase + 12),
    lfoPitchModDepth: b(cBase + 13),
    lfoAmpModDepth: b(cBase + 14),
    lfoSync: b(cBase + 15),
    lfoWave: b(cBase + 16),
    lfoPitchModSensitivity: b(cBase + 17),
    transpose: b(cBase + 18),
    name: decodeDX7Name(data, offset + cBase + 19),
  };

  return {
    operators: operators as DX7Voice['operators'],
    common,
  };
}

/**
 * Pack a DX7 voice into 155 unpacked bytes (VCED format).
 */
export function packSingleVoice(voice: DX7Voice): Uint8Array {
  const out = new Uint8Array(UNPACKED_VOICE_SIZE);

  for (let op = 0; op < 6; op++) {
    const o = voice.operators[op]!;
    const base = op * 21;
    out[base] = o.egRate[0];
    out[base + 1] = o.egRate[1];
    out[base + 2] = o.egRate[2];
    out[base + 3] = o.egRate[3];
    out[base + 4] = o.egLevel[0];
    out[base + 5] = o.egLevel[1];
    out[base + 6] = o.egLevel[2];
    out[base + 7] = o.egLevel[3];
    out[base + 8] = o.kbdLevelScalingBreakpoint;
    out[base + 9] = o.kbdLevelScalingLeftDepth;
    out[base + 10] = o.kbdLevelScalingRightDepth;
    out[base + 11] = o.kbdLevelScalingLeftCurve;
    out[base + 12] = o.kbdLevelScalingRightCurve;
    out[base + 13] = o.kbdRateScaling;
    out[base + 14] = o.ampModSensitivity;
    out[base + 15] = o.keyVelocitySensitivity;
    out[base + 16] = o.outputLevel;
    out[base + 17] = o.oscMode;
    out[base + 18] = o.freqCoarse;
    out[base + 19] = o.freqFine;
    out[base + 20] = o.detune;
  }

  const c = voice.common;
  const cBase = 126;
  out[cBase] = c.pitchEgRate[0];
  out[cBase + 1] = c.pitchEgRate[1];
  out[cBase + 2] = c.pitchEgRate[2];
  out[cBase + 3] = c.pitchEgRate[3];
  out[cBase + 4] = c.pitchEgLevel[0];
  out[cBase + 5] = c.pitchEgLevel[1];
  out[cBase + 6] = c.pitchEgLevel[2];
  out[cBase + 7] = c.pitchEgLevel[3];
  out[cBase + 8] = c.algorithm;
  out[cBase + 9] = c.feedback;
  out[cBase + 10] = c.oscKeySync;
  out[cBase + 11] = c.lfoSpeed;
  out[cBase + 12] = c.lfoDelay;
  out[cBase + 13] = c.lfoPitchModDepth;
  out[cBase + 14] = c.lfoAmpModDepth;
  out[cBase + 15] = c.lfoSync;
  out[cBase + 16] = c.lfoWave;
  out[cBase + 17] = c.lfoPitchModSensitivity;
  out[cBase + 18] = c.transpose;
  out.set(encodeDX7Name(c.name), cBase + 19);

  return out;
}

/**
 * Parse a single voice SysEx message.
 */
export function parseSingleVoiceSysEx(data: Uint8Array): DX7Voice {
  if (data[0] !== SYSEX_START || data[1] !== YAMAHA_ID) {
    throw new SysExError('Not a valid Yamaha SysEx message');
  }
  if ((data[3] ?? 0) !== 0x00 || (data[4] ?? 0) !== 0x01 || (data[5] ?? 0) !== 0x1b) {
    throw new SysExError('Not a single voice dump');
  }

  const voiceData = data.slice(6, 6 + UNPACKED_VOICE_SIZE);
  const storedChecksum = data[6 + UNPACKED_VOICE_SIZE] ?? 0;
  const calculatedChecksum = calculateChecksum(voiceData);

  if (storedChecksum !== calculatedChecksum) {
    throw new SysExError('Checksum mismatch');
  }

  return unpackSingleVoice(voiceData);
}

/**
 * Generate a single voice SysEx message.
 */
export function generateSingleVoiceSysEx(voice: DX7Voice, channel: number = 0): Uint8Array {
  const voiceData = packSingleVoice(voice);
  const checksum = calculateChecksum(voiceData);

  const result = new Uint8Array(6 + UNPACKED_VOICE_SIZE + 2);
  result.set(SINGLE_VOICE_HEADER, 0);
  result[2] = channel & 0x0f; // Set MIDI channel in sub-status byte
  result.set(voiceData, 6);
  result[6 + UNPACKED_VOICE_SIZE] = checksum;
  result[6 + UNPACKED_VOICE_SIZE + 1] = SYSEX_END;

  return result;
}
