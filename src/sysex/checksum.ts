/**
 * Calculate DX7 SysEx checksum.
 * Two's complement of the sum of all data bytes, masked to 7 bits.
 */
export function calculateChecksum(data: Uint8Array, start: number = 0, length?: number): number {
  const end = start + (length ?? data.length - start);
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum = (sum + (data[i] ?? 0)) & 0xff;
  }
  return (-sum) & 0x7f;
}
