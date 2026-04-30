import type { DX7Voice, DX7Operator } from '../model/types.ts';
import { packBits } from '../utils/bit-utils.ts';
import { encodeDX7Name } from '../utils/ascii.ts';
import { PACKED_VOICE_SIZE, PACKED_OP_SIZE } from './constants.ts';

/**
 * Pack a single operator into 17 bytes.
 */
function packOperator(op: DX7Operator, out: Uint8Array, offset: number): void {
  out[offset + 0] = op.egRate[0];
  out[offset + 1] = op.egRate[1];
  out[offset + 2] = op.egRate[2];
  out[offset + 3] = op.egRate[3];
  out[offset + 4] = op.egLevel[0];
  out[offset + 5] = op.egLevel[1];
  out[offset + 6] = op.egLevel[2];
  out[offset + 7] = op.egLevel[3];
  out[offset + 8] = op.kbdLevelScalingBreakpoint;
  out[offset + 9] = op.kbdLevelScalingLeftDepth;
  out[offset + 10] = op.kbdLevelScalingRightDepth;
  out[offset + 11] = packBits(op.kbdLevelScalingLeftCurve, 0, 2)
                    | packBits(op.kbdLevelScalingRightCurve, 2, 2);
  out[offset + 12] = packBits(op.kbdRateScaling, 0, 3)
                    | packBits(op.detune, 3, 4);
  out[offset + 13] = packBits(op.ampModSensitivity, 0, 2)
                    | packBits(op.keyVelocitySensitivity, 2, 3);
  out[offset + 14] = op.outputLevel;
  out[offset + 15] = packBits(op.oscMode, 0, 1)
                    | packBits(op.freqCoarse, 1, 5);
  out[offset + 16] = op.freqFine;
}

/**
 * Pack a DX7 voice into 128 bytes.
 * Operators are stored in reverse order: OP6, OP5, OP4, OP3, OP2, OP1.
 */
export function packVoice(voice: DX7Voice): Uint8Array {
  const out = new Uint8Array(PACKED_VOICE_SIZE);

  // Pack operators in reverse order (OP6 first, OP1 last)
  for (let i = 0; i < 6; i++) {
    const opIndex = 5 - i; // OP6=index5 → slot0, OP1=index0 → slot5
    packOperator(voice.operators[opIndex]!, out, i * PACKED_OP_SIZE);
  }

  // Common parameters at byte 102
  const c = voice.common;
  const base = 102;
  out[base + 0] = c.pitchEgRate[0];
  out[base + 1] = c.pitchEgRate[1];
  out[base + 2] = c.pitchEgRate[2];
  out[base + 3] = c.pitchEgRate[3];
  out[base + 4] = c.pitchEgLevel[0];
  out[base + 5] = c.pitchEgLevel[1];
  out[base + 6] = c.pitchEgLevel[2];
  out[base + 7] = c.pitchEgLevel[3];
  out[base + 8] = c.algorithm & 0x1f;
  out[base + 9] = packBits(c.feedback, 0, 3) | packBits(c.oscKeySync, 3, 1);
  out[base + 10] = c.lfoSpeed;
  out[base + 11] = c.lfoDelay;
  out[base + 12] = c.lfoPitchModDepth;
  out[base + 13] = c.lfoAmpModDepth;
  out[base + 14] = packBits(c.lfoSync, 0, 1)
                  | packBits(c.lfoWave, 1, 3)
                  | packBits(c.lfoPitchModSensitivity, 4, 3);
  out[base + 15] = c.transpose;

  // Voice name (10 bytes)
  const nameBytes = encodeDX7Name(c.name);
  out.set(nameBytes, base + 16);

  return out;
}
