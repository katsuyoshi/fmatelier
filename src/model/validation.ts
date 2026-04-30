/** Clamp a value to [min, max] range */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Parameter range definitions for DX7 operator parameters */
export const OP_PARAM_RANGES = {
  egRate: { min: 0, max: 99 },
  egLevel: { min: 0, max: 99 },
  kbdLevelScalingBreakpoint: { min: 0, max: 99 },
  kbdLevelScalingLeftDepth: { min: 0, max: 99 },
  kbdLevelScalingRightDepth: { min: 0, max: 99 },
  kbdLevelScalingLeftCurve: { min: 0, max: 3 },
  kbdLevelScalingRightCurve: { min: 0, max: 3 },
  kbdRateScaling: { min: 0, max: 7 },
  ampModSensitivity: { min: 0, max: 3 },
  keyVelocitySensitivity: { min: 0, max: 7 },
  outputLevel: { min: 0, max: 99 },
  oscMode: { min: 0, max: 1 },
  freqCoarse: { min: 0, max: 31 },
  freqFine: { min: 0, max: 99 },
  detune: { min: 0, max: 14 },
} as const;

/** Parameter range definitions for DX7 common parameters */
export const COMMON_PARAM_RANGES = {
  pitchEgRate: { min: 0, max: 99 },
  pitchEgLevel: { min: 0, max: 99 },
  algorithm: { min: 0, max: 31 },
  feedback: { min: 0, max: 7 },
  oscKeySync: { min: 0, max: 1 },
  lfoSpeed: { min: 0, max: 99 },
  lfoDelay: { min: 0, max: 99 },
  lfoPitchModDepth: { min: 0, max: 99 },
  lfoAmpModDepth: { min: 0, max: 99 },
  lfoSync: { min: 0, max: 1 },
  lfoWave: { min: 0, max: 5 },
  lfoPitchModSensitivity: { min: 0, max: 7 },
  transpose: { min: 0, max: 48 },
} as const;
