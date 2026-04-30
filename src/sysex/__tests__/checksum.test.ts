import { describe, it, expect } from 'vitest';
import { calculateChecksum } from '../checksum.ts';

describe('calculateChecksum', () => {
  it('returns 0 for empty data', () => {
    expect(calculateChecksum(new Uint8Array(0))).toBe(0);
  });

  it('returns 0 for all zeros', () => {
    expect(calculateChecksum(new Uint8Array(10))).toBe(0);
  });

  it('calculates twos complement masked to 7 bits', () => {
    // sum = 1, twos complement = -1 & 0x7F = 0x7F = 127
    expect(calculateChecksum(new Uint8Array([1]))).toBe(127);
  });

  it('handles sum overflow correctly', () => {
    // sum = 255 + 1 = 256, (256 & 0xFF) = 0, twos complement = 0
    expect(calculateChecksum(new Uint8Array([255, 1]))).toBe(0);
  });

  it('masks result to 7 bits', () => {
    // sum = 128, -128 & 0x7F = 0
    expect(calculateChecksum(new Uint8Array([128]))).toBe(0);
    // sum = 200, -200 & 0xFF = 56, 56 & 0x7F = 56
    expect(calculateChecksum(new Uint8Array([200]))).toBe(56);
  });

  it('supports start and length parameters', () => {
    const data = new Uint8Array([0, 0, 10, 20, 0, 0]);
    // sum of bytes at index 2..3 = 30, -30 & 0x7F = 98
    expect(calculateChecksum(data, 2, 2)).toBe(98);
  });
});
