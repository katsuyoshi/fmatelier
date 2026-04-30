import { describe, it, expect } from 'vitest';
import { parseSyxFile, generateSyxFile, SysExError } from '../bulk-dump.ts';
import { createDefaultBank } from '../../model/defaults.ts';
import { calculateChecksum } from '../checksum.ts';
import { BULK_DATA_SIZE } from '../constants.ts';

describe('generateSyxFile', () => {
  it('generates a valid 4104-byte SysEx file', () => {
    const bank = createDefaultBank();
    const syx = generateSyxFile(bank);

    expect(syx.length).toBe(4104);
    expect(syx[0]).toBe(0xf0); // SysEx start
    expect(syx[1]).toBe(0x43); // Yamaha ID
    expect(syx[2]).toBe(0x00); // Sub-status
    expect(syx[3]).toBe(0x09); // Format (32-voice bulk)
    expect(syx[4]).toBe(0x20); // Byte count MSB
    expect(syx[5]).toBe(0x00); // Byte count LSB
    expect(syx[4103]).toBe(0xf7); // SysEx end
  });

  it('generates a correct checksum', () => {
    const bank = createDefaultBank();
    const syx = generateSyxFile(bank);

    const dataStart = 6;
    const voiceData = syx.slice(dataStart, dataStart + BULK_DATA_SIZE);
    const expectedChecksum = calculateChecksum(voiceData);
    expect(syx[dataStart + BULK_DATA_SIZE]).toBe(expectedChecksum);
  });
});

describe('parseSyxFile', () => {
  it('round-trips a default bank', () => {
    const original = createDefaultBank();
    const syx = generateSyxFile(original);
    const parsed = parseSyxFile(syx);

    expect(parsed.voices.length).toBe(32);
    for (let i = 0; i < 32; i++) {
      expect(parsed.voices[i]).toEqual(original.voices[i]);
    }
  });

  it('preserves voice names', () => {
    const bank = createDefaultBank();
    bank.voices[0]!.common.name = 'BRASS   1';
    bank.voices[31]!.common.name = 'STRINGS 3';

    const syx = generateSyxFile(bank);
    const parsed = parseSyxFile(syx);

    expect(parsed.voices[0]!.common.name).toBe('BRASS   1');
    expect(parsed.voices[31]!.common.name).toBe('STRINGS 3');
  });

  it('throws on invalid header', () => {
    const data = new Uint8Array(4104);
    data[0] = 0x00; // invalid
    expect(() => parseSyxFile(data)).toThrow(SysExError);
  });

  it('throws on checksum mismatch', () => {
    const bank = createDefaultBank();
    const syx = generateSyxFile(bank);
    // Corrupt the checksum
    syx[4102] = (syx[4102]! + 1) & 0x7f;
    expect(() => parseSyxFile(syx)).toThrow(/[Cc]hecksum/);
  });

  it('finds bulk dump even with leading bytes', () => {
    const bank = createDefaultBank();
    const syx = generateSyxFile(bank);
    // Prepend some garbage bytes
    const padded = new Uint8Array(10 + syx.length);
    padded.set(syx, 10);
    const parsed = parseSyxFile(padded);
    expect(parsed.voices.length).toBe(32);
  });
});
