/** SysEx message boundaries */
export const SYSEX_START = 0xf0;
export const SYSEX_END = 0xf7;

/** Yamaha manufacturer ID */
export const YAMAHA_ID = 0x43;

/** Bulk dump header: F0 43 00 09 20 00 */
export const BULK_HEADER = new Uint8Array([0xf0, 0x43, 0x00, 0x09, 0x20, 0x00]);

/** Single voice header: F0 43 00 00 01 1B */
export const SINGLE_VOICE_HEADER = new Uint8Array([0xf0, 0x43, 0x00, 0x00, 0x01, 0x1b]);

/** Total .syx file size for a 32-voice bulk dump */
export const BULK_FILE_SIZE = 4104; // 6 header + 4096 data + 1 checksum + 1 F7

/** Data payload size for bulk dump */
export const BULK_DATA_SIZE = 4096;

/** Packed voice size */
export const PACKED_VOICE_SIZE = 128;

/** Unpacked single voice size */
export const UNPACKED_VOICE_SIZE = 155;

/** Bytes per operator in packed format */
export const PACKED_OP_SIZE = 17;
