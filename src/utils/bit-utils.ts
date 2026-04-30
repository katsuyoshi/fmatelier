/** Extract `count` bits starting at `startBit` from a byte */
export function extractBits(byte: number, startBit: number, count: number): number {
  return (byte >> startBit) & ((1 << count) - 1);
}

/** Pack a value into a byte at `startBit` position, using `count` bits */
export function packBits(value: number, startBit: number, count: number): number {
  return (value & ((1 << count) - 1)) << startBit;
}
