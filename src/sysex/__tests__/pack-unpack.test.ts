import { describe, it, expect } from 'vitest';
import { unpackVoice } from '../unpack.ts';
import { packVoice } from '../pack.ts';
import { createDefaultVoice } from '../../model/defaults.ts';
import type { DX7Voice } from '../../model/types.ts';

describe('pack/unpack round-trip', () => {
  it('round-trips a default INIT VOICE', () => {
    const original = createDefaultVoice();
    const packed = packVoice(original);
    expect(packed.length).toBe(128);

    const unpacked = unpackVoice(packed);
    expectVoicesEqual(unpacked, original);
  });

  it('round-trips a voice with various parameter values', () => {
    const voice = createDefaultVoice();

    // Set diverse values on OP1
    voice.operators[0]!.egRate = [50, 60, 70, 80];
    voice.operators[0]!.egLevel = [99, 80, 60, 0];
    voice.operators[0]!.kbdLevelScalingBreakpoint = 42;
    voice.operators[0]!.kbdLevelScalingLeftDepth = 55;
    voice.operators[0]!.kbdLevelScalingRightDepth = 66;
    voice.operators[0]!.kbdLevelScalingLeftCurve = 2;  // +EXP
    voice.operators[0]!.kbdLevelScalingRightCurve = 3; // +LIN
    voice.operators[0]!.kbdRateScaling = 5;
    voice.operators[0]!.ampModSensitivity = 3;
    voice.operators[0]!.keyVelocitySensitivity = 7;
    voice.operators[0]!.outputLevel = 88;
    voice.operators[0]!.oscMode = 1; // fixed
    voice.operators[0]!.freqCoarse = 20;
    voice.operators[0]!.freqFine = 77;
    voice.operators[0]!.detune = 10;

    // Set diverse values on OP6
    voice.operators[5]!.egRate = [10, 20, 30, 40];
    voice.operators[5]!.outputLevel = 95;
    voice.operators[5]!.freqCoarse = 31;
    voice.operators[5]!.detune = 0;

    // Set common parameters
    voice.common.algorithm = 31;
    voice.common.feedback = 7;
    voice.common.oscKeySync = 1;
    voice.common.lfoSpeed = 88;
    voice.common.lfoDelay = 44;
    voice.common.lfoPitchModDepth = 77;
    voice.common.lfoAmpModDepth = 33;
    voice.common.lfoSync = 1;
    voice.common.lfoWave = 5; // S&H
    voice.common.lfoPitchModSensitivity = 7;
    voice.common.transpose = 36;
    voice.common.name = 'TEST VOICE';

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);
    expectVoicesEqual(unpacked, voice);
  });

  it('round-trips all operator boundary values', () => {
    const voice = createDefaultVoice();

    // Set all operators to max values
    for (let i = 0; i < 6; i++) {
      const op = voice.operators[i]!;
      op.egRate = [99, 99, 99, 99];
      op.egLevel = [99, 99, 99, 99];
      op.kbdLevelScalingBreakpoint = 99;
      op.kbdLevelScalingLeftDepth = 99;
      op.kbdLevelScalingRightDepth = 99;
      op.kbdLevelScalingLeftCurve = 3;
      op.kbdLevelScalingRightCurve = 3;
      op.kbdRateScaling = 7;
      op.ampModSensitivity = 3;
      op.keyVelocitySensitivity = 7;
      op.outputLevel = 99;
      op.oscMode = 1;
      op.freqCoarse = 31;
      op.freqFine = 99;
      op.detune = 14;
    }

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);
    expectVoicesEqual(unpacked, voice);
  });

  it('preserves operator ordering correctly (OP1..OP6)', () => {
    const voice = createDefaultVoice();

    // Give each operator a unique output level
    for (let i = 0; i < 6; i++) {
      voice.operators[i]!.outputLevel = (i + 1) * 10; // 10, 20, 30, 40, 50, 60
    }

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);

    for (let i = 0; i < 6; i++) {
      expect(unpacked.operators[i]!.outputLevel).toBe((i + 1) * 10);
    }
  });
});

describe('bit-packed fields', () => {
  it('correctly packs curves into shared byte', () => {
    const voice = createDefaultVoice();
    voice.operators[0]!.kbdLevelScalingLeftCurve = 1;  // -EXP
    voice.operators[0]!.kbdLevelScalingRightCurve = 2; // +EXP

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);

    expect(unpacked.operators[0]!.kbdLevelScalingLeftCurve).toBe(1);
    expect(unpacked.operators[0]!.kbdLevelScalingRightCurve).toBe(2);
  });

  it('correctly packs rate scaling and detune into shared byte', () => {
    const voice = createDefaultVoice();
    voice.operators[0]!.kbdRateScaling = 5;
    voice.operators[0]!.detune = 12;

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);

    expect(unpacked.operators[0]!.kbdRateScaling).toBe(5);
    expect(unpacked.operators[0]!.detune).toBe(12);
  });

  it('correctly packs AMS and KVS into shared byte', () => {
    const voice = createDefaultVoice();
    voice.operators[0]!.ampModSensitivity = 2;
    voice.operators[0]!.keyVelocitySensitivity = 6;

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);

    expect(unpacked.operators[0]!.ampModSensitivity).toBe(2);
    expect(unpacked.operators[0]!.keyVelocitySensitivity).toBe(6);
  });

  it('correctly packs osc mode and freq coarse into shared byte', () => {
    const voice = createDefaultVoice();
    voice.operators[0]!.oscMode = 1;
    voice.operators[0]!.freqCoarse = 25;

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);

    expect(unpacked.operators[0]!.oscMode).toBe(1);
    expect(unpacked.operators[0]!.freqCoarse).toBe(25);
  });

  it('correctly packs feedback and osc key sync into shared byte', () => {
    const voice = createDefaultVoice();
    voice.common.feedback = 6;
    voice.common.oscKeySync = 1;

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);

    expect(unpacked.common.feedback).toBe(6);
    expect(unpacked.common.oscKeySync).toBe(1);
  });

  it('correctly packs LFO fields into shared byte', () => {
    const voice = createDefaultVoice();
    voice.common.lfoSync = 1;
    voice.common.lfoWave = 4; // Sine
    voice.common.lfoPitchModSensitivity = 5;

    const packed = packVoice(voice);
    const unpacked = unpackVoice(packed);

    expect(unpacked.common.lfoSync).toBe(1);
    expect(unpacked.common.lfoWave).toBe(4);
    expect(unpacked.common.lfoPitchModSensitivity).toBe(5);
  });
});

function expectVoicesEqual(a: DX7Voice, b: DX7Voice): void {
  for (let i = 0; i < 6; i++) {
    expect(a.operators[i]).toEqual(b.operators[i]);
  }
  expect(a.common).toEqual(b.common);
}
