import type { DX7Operator, DX7Voice, DX7VoiceCommon, DX7Bank } from './types.ts';
import { BANK_SIZE } from './types.ts';

/** Create a default operator matching the DX7 INIT VOICE */
export function createDefaultOperator(opNum: number): DX7Operator {
  return {
    egRate: [99, 99, 99, 99],
    egLevel: [99, 99, 99, 0],
    kbdLevelScalingBreakpoint: 39, // C3
    kbdLevelScalingLeftDepth: 0,
    kbdLevelScalingRightDepth: 0,
    kbdLevelScalingLeftCurve: 0,
    kbdLevelScalingRightCurve: 0,
    kbdRateScaling: 0,
    ampModSensitivity: 0,
    keyVelocitySensitivity: 0,
    // OP1 at full level, others off (matches INIT VOICE behavior)
    outputLevel: opNum === 1 ? 99 : 0,
    oscMode: 0,
    freqCoarse: 1,
    freqFine: 0,
    detune: 7, // center (no detune)
  };
}

/** Create default common parameters matching DX7 INIT VOICE */
export function createDefaultCommon(): DX7VoiceCommon {
  return {
    pitchEgRate: [99, 99, 99, 99],
    pitchEgLevel: [50, 50, 50, 50],
    algorithm: 0, // Algorithm 1
    feedback: 0,
    oscKeySync: 1,
    lfoSpeed: 35,
    lfoDelay: 0,
    lfoPitchModDepth: 0,
    lfoAmpModDepth: 0,
    lfoSync: 1,
    lfoWave: 0, // Triangle
    lfoPitchModSensitivity: 3,
    transpose: 24, // C3 (center)
    name: 'INIT VOICE',
  };
}

/** Create a complete default voice */
export function createDefaultVoice(): DX7Voice {
  return {
    operators: [
      createDefaultOperator(1),
      createDefaultOperator(2),
      createDefaultOperator(3),
      createDefaultOperator(4),
      createDefaultOperator(5),
      createDefaultOperator(6),
    ],
    common: createDefaultCommon(),
  };
}

/** Create a default bank of 32 voices */
export function createDefaultBank(): DX7Bank {
  return {
    voices: Array.from({ length: BANK_SIZE }, () => createDefaultVoice()),
  };
}
