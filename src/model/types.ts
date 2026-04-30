/** DX7 operator parameters (one per each of the 6 operators) */
export interface DX7Operator {
  /** Envelope generator rates R1-R4 (0-99) */
  egRate: [number, number, number, number];
  /** Envelope generator levels L1-L4 (0-99) */
  egLevel: [number, number, number, number];
  /** Keyboard level scaling breakpoint (0-99) */
  kbdLevelScalingBreakpoint: number;
  /** Keyboard level scaling left depth (0-99) */
  kbdLevelScalingLeftDepth: number;
  /** Keyboard level scaling right depth (0-99) */
  kbdLevelScalingRightDepth: number;
  /** Keyboard level scaling left curve (0-3: -LIN, -EXP, +EXP, +LIN) */
  kbdLevelScalingLeftCurve: number;
  /** Keyboard level scaling right curve (0-3) */
  kbdLevelScalingRightCurve: number;
  /** Keyboard rate scaling (0-7) */
  kbdRateScaling: number;
  /** Amplitude modulation sensitivity (0-3) */
  ampModSensitivity: number;
  /** Key velocity sensitivity (0-7) */
  keyVelocitySensitivity: number;
  /** Operator output level (0-99) */
  outputLevel: number;
  /** Oscillator mode: 0=ratio, 1=fixed */
  oscMode: number;
  /** Frequency coarse (0-31) */
  freqCoarse: number;
  /** Frequency fine (0-99) */
  freqFine: number;
  /** Detune (0-14, center=7) */
  detune: number;
}

/** LFO waveform types */
export const LFO_WAVE_NAMES = [
  'Triangle',
  'Saw Down',
  'Saw Up',
  'Square',
  'Sine',
  'Sample & Hold',
] as const;

/** Keyboard level scaling curve names */
export const KBD_CURVE_NAMES = ['-LIN', '-EXP', '+EXP', '+LIN'] as const;

/** Common (global) voice parameters */
export interface DX7VoiceCommon {
  /** Pitch EG rates R1-R4 (0-99) */
  pitchEgRate: [number, number, number, number];
  /** Pitch EG levels L1-L4 (0-99) */
  pitchEgLevel: [number, number, number, number];
  /** Algorithm select (0-31, displayed as 1-32) */
  algorithm: number;
  /** Feedback level (0-7) */
  feedback: number;
  /** Oscillator key sync (0=off, 1=on) */
  oscKeySync: number;
  /** LFO speed (0-99) */
  lfoSpeed: number;
  /** LFO delay (0-99) */
  lfoDelay: number;
  /** LFO pitch modulation depth (0-99) */
  lfoPitchModDepth: number;
  /** LFO amplitude modulation depth (0-99) */
  lfoAmpModDepth: number;
  /** LFO sync (0=off, 1=on) */
  lfoSync: number;
  /** LFO waveform (0-5) */
  lfoWave: number;
  /** LFO pitch modulation sensitivity (0-7) */
  lfoPitchModSensitivity: number;
  /** Transpose (0-48, center=24 = middle C) */
  transpose: number;
  /** Voice name (10 ASCII characters) */
  name: string;
}

/** Complete DX7 voice */
export interface DX7Voice {
  /** Operators 1-6 (index 0=OP1, index 5=OP6) */
  operators: [DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator, DX7Operator];
  /** Common parameters */
  common: DX7VoiceCommon;
}

/** A bank of 32 voices */
export interface DX7Bank {
  voices: DX7Voice[];
}

/** Number of voices in a bank */
export const BANK_SIZE = 32;

/** Number of operators per voice */
export const NUM_OPERATORS = 6;

/** Packed voice size in bytes */
export const PACKED_VOICE_SIZE = 128;

/** Unpacked single voice size in bytes */
export const UNPACKED_VOICE_SIZE = 155;

/** Bulk dump data size (32 voices × 128 bytes) */
export const BULK_DATA_SIZE = BANK_SIZE * PACKED_VOICE_SIZE;
