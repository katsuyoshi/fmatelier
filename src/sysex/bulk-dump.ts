import type { DX7Bank, DX7Voice } from '../model/types.ts';
import { BANK_SIZE } from '../model/types.ts';
import { calculateChecksum } from './checksum.ts';
import { unpackVoice } from './unpack.ts';
import { packVoice } from './pack.ts';
import {
  SYSEX_START,
  SYSEX_END,
  YAMAHA_ID,
  BULK_HEADER,
  BULK_DATA_SIZE,
  PACKED_VOICE_SIZE,
} from './constants.ts';

export class SysExError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SysExError';
  }
}

/**
 * Parse a .syx bulk dump file into a DX7Bank.
 * Supports both standard 4104-byte bulk dumps and raw 4096-byte data.
 */
export function parseSyxFile(data: Uint8Array): DX7Bank {
  // Try to find a bulk dump SysEx message in the data
  const offset = findBulkDump(data);
  if (offset === -1) {
    throw new SysExError('No valid DX7 bulk dump found in file');
  }

  // Validate header
  const headerStart = offset;
  if (data[headerStart] !== SYSEX_START) {
    throw new SysExError('Missing SysEx start byte (F0)');
  }
  if (data[headerStart + 1] !== YAMAHA_ID) {
    throw new SysExError('Not a Yamaha SysEx message');
  }
  // Byte 2: sub-status (0n where n=MIDI channel, accept any)
  // Byte 3: format number (09 = 32 voice bulk dump)
  if ((data[headerStart + 3] ?? 0) !== 0x09) {
    throw new SysExError(`Unexpected format byte: expected 0x09, got 0x${(data[headerStart + 3] ?? 0).toString(16).padStart(2, '0')}`);
  }
  // Bytes 4-5: byte count MSB/LSB = 0x20, 0x00 = 8192? Actually 0x2000 = 4096
  // The byte count is stored as MSB, LSB for the data size
  const byteCountMSB = data[headerStart + 4] ?? 0;
  const byteCountLSB = data[headerStart + 5] ?? 0;
  const byteCount = (byteCountMSB << 7) | byteCountLSB;
  if (byteCount !== BULK_DATA_SIZE) {
    throw new SysExError(`Unexpected data size: expected ${BULK_DATA_SIZE}, got ${byteCount}`);
  }

  // Extract voice data (4096 bytes starting at offset+6)
  const dataStart = headerStart + 6;
  const voiceData = data.slice(dataStart, dataStart + BULK_DATA_SIZE);

  // Verify checksum
  const storedChecksum = data[dataStart + BULK_DATA_SIZE] ?? 0;
  const calculatedChecksum = calculateChecksum(voiceData);
  if (storedChecksum !== calculatedChecksum) {
    throw new SysExError(
      `Checksum mismatch: expected 0x${calculatedChecksum.toString(16).padStart(2, '0')}, got 0x${storedChecksum.toString(16).padStart(2, '0')}`
    );
  }

  // Verify SysEx end byte
  if ((data[dataStart + BULK_DATA_SIZE + 1] ?? 0) !== SYSEX_END) {
    throw new SysExError('Missing SysEx end byte (F7)');
  }

  // Unpack 32 voices
  const voices: DX7Voice[] = [];
  for (let i = 0; i < BANK_SIZE; i++) {
    voices.push(unpackVoice(voiceData, i * PACKED_VOICE_SIZE));
  }

  return { voices };
}

/**
 * Generate a .syx bulk dump file from a DX7Bank.
 */
export function generateSyxFile(bank: DX7Bank): Uint8Array {
  // Pack all 32 voices
  const voiceData = new Uint8Array(BULK_DATA_SIZE);
  for (let i = 0; i < BANK_SIZE; i++) {
    const packed = packVoice(bank.voices[i]!);
    voiceData.set(packed, i * PACKED_VOICE_SIZE);
  }

  // Calculate checksum
  const checksum = calculateChecksum(voiceData);

  // Build complete SysEx message
  const result = new Uint8Array(BULK_HEADER.length + BULK_DATA_SIZE + 2);
  result.set(BULK_HEADER, 0);
  result.set(voiceData, BULK_HEADER.length);
  result[BULK_HEADER.length + BULK_DATA_SIZE] = checksum;
  result[BULK_HEADER.length + BULK_DATA_SIZE + 1] = SYSEX_END;

  return result;
}

/**
 * Find the start offset of a DX7 bulk dump SysEx message in the data.
 * Returns -1 if not found.
 */
function findBulkDump(data: Uint8Array): number {
  for (let i = 0; i <= data.length - 6; i++) {
    if (
      data[i] === SYSEX_START &&
      data[i + 1] === YAMAHA_ID &&
      ((data[i + 2] ?? 0) & 0xf0) === 0x00 && // sub-status 0n
      (data[i + 3] ?? 0) === 0x09
    ) {
      return i;
    }
  }
  return -1;
}
