const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Convert a DX7 keyboard level scaling breakpoint value (0-99) to a note name.
 * Breakpoint 0 = A-1 (MIDI note 21), each step = 1 semitone.
 */
export function breakpointToNoteName(bp: number): string {
  const midiNote = bp + 21;
  const octave = Math.floor(midiNote / 12) - 1;
  const note = NOTE_NAMES[midiNote % 12];
  return `${note}${octave}`;
}

/** Convert transpose value (0-48) to display string. Center=24=C3. */
export function transposeToDisplay(value: number): string {
  const midiNote = value + 36; // 0→C2, 24→C3(middle), 48→C5
  const octave = Math.floor(midiNote / 12) - 1;
  const note = NOTE_NAMES[midiNote % 12];
  return `${note}${octave}`;
}
