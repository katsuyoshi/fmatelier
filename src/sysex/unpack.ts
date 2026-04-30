import type { DX7Operator, DX7Voice, DX7VoiceCommon } from '../model/types.ts';
import { extractBits } from '../utils/bit-utils.ts';
import { decodeDX7Name } from '../utils/ascii.ts';
import { PACKED_OP_SIZE } from './constants.ts';

/**
 * Unpack a single operator from 17 packed bytes.
 */
function unpackOperator(data: Uint8Array, offset: number): DX7Operator {
  const b = (i: number) => data[offset + i] ?? 0;

  return {
    egRate: [b(0), b(1), b(2), b(3)],
    egLevel: [b(4), b(5), b(6), b(7)],
    kbdLevelScalingBreakpoint: b(8),
    kbdLevelScalingLeftDepth: b(9),
    kbdLevelScalingRightDepth: b(10),
    kbdLevelScalingLeftCurve: extractBits(b(11), 0, 2),
    kbdLevelScalingRightCurve: extractBits(b(11), 2, 2),
    kbdRateScaling: extractBits(b(12), 0, 3),
    detune: extractBits(b(12), 3, 4),
    ampModSensitivity: extractBits(b(13), 0, 2),
    keyVelocitySensitivity: extractBits(b(13), 2, 3),
    outputLevel: b(14),
    oscMode: extractBits(b(15), 0, 1),
    freqCoarse: extractBits(b(15), 1, 5),
    freqFine: b(16),
  };
}

/**
 * Unpack a single DX7 voice from 128 packed bytes.
 * Operators are stored in reverse order: OP6, OP5, OP4, OP3, OP2, OP1.
 * Our model uses OP1=index 0 through OP6=index 5.
 */
export function unpackVoice(data: Uint8Array, offset: number = 0): DX7Voice {
  // Unpack 6 operators in packed order (OP6..OP1), then reverse
  const operators: DX7Operator[] = [];
  for (let i = 0; i < 6; i++) {
    operators.push(unpackOperator(data, offset + i * PACKED_OP_SIZE));
  }
  operators.reverse();

  // Common parameters start at byte 102
  const c = offset + 102;
  const b = (i: number) => data[c + i] ?? 0;

  const common: DX7VoiceCommon = {
    pitchEgRate: [b(0), b(1), b(2), b(3)],
    pitchEgLevel: [b(4), b(5), b(6), b(7)],
    algorithm: extractBits(b(8), 0, 5),
    feedback: extractBits(b(9), 0, 3),
    oscKeySync: extractBits(b(9), 3, 1),
    lfoSpeed: b(10),
    lfoDelay: b(11),
    lfoPitchModDepth: b(12),
    lfoAmpModDepth: b(13),
    lfoSync: extractBits(b(14), 0, 1),
    lfoWave: extractBits(b(14), 1, 3),
    lfoPitchModSensitivity: extractBits(b(14), 4, 3),
    transpose: b(15),
    name: decodeDX7Name(data, c + 16),
  };

  return {
    operators: operators as DX7Voice['operators'],
    common,
  };
}
