/**
 * Sanitize a string to the DX7 valid character range (ASCII 32-127).
 * Pad or truncate to exactly 10 characters.
 */
export function toDX7Name(name: string): string {
  const sanitized = name
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code <= 126 ? ch : ' ';
    })
    .join('');
  return sanitized.padEnd(10, ' ').slice(0, 10);
}

/** Decode a DX7 voice name from a Uint8Array (10 bytes) */
export function decodeDX7Name(data: Uint8Array, offset: number): string {
  let name = '';
  for (let i = 0; i < 10; i++) {
    const byte = data[offset + i] ?? 0;
    name += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' ';
  }
  return name.trimEnd();
}

/** Encode a voice name to 10 bytes */
export function encodeDX7Name(name: string): Uint8Array {
  const padded = toDX7Name(name);
  const bytes = new Uint8Array(10);
  for (let i = 0; i < 10; i++) {
    bytes[i] = padded.charCodeAt(i);
  }
  return bytes;
}
