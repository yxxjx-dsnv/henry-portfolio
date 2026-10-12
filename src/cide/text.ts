// Text in and out of the vendored clang core. The core moves strings one byte
// per character (it writes `charCodeAt(0)` into memory and reads bytes back
// with `String.fromCharCode`), so anything past U+00FF was mangled. These
// helpers turn real text into such "byte strings" and back, as UTF-8.

/** UTF-8 bytes of `text`, one character per byte, for the core's memory. */
export function toByteString(text: string): string {
  let out = '';
  for (const b of new TextEncoder().encode(text)) out += String.fromCharCode(b);
  return out;
}

/**
 * Reassembles UTF-8 text from byte strings that arrive in pieces: a multi-byte
 * character can be split across two writes, so the decoder keeps the tail.
 */
export function createByteDecoder() {
  const decoder = new TextDecoder('utf-8');
  return {
    push(bytes: string): string {
      const u8 = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) u8[i] = bytes.charCodeAt(i);
      return decoder.decode(u8, { stream: true });
    },
    end(): string {
      return decoder.decode();
    },
  };
}

/** Terminal colour codes (the toolchain's own progress lines carry them). */
export const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

// A program that prints without end (most often one re-prompting forever once
// stdin runs out) would grow the page by megabytes a second until the tab died.
// Past this many characters of output the run is ended.
export const OUTPUT_LIMIT = 100_000;

/**
 * Caps a stream of program output at `limit` characters. `take` returns the part
 * of `text` that still fits, and `full` once something had to be cut off (output
 * of exactly `limit` characters is not cut).
 */
export function createOutputCap(limit: number) {
  let sent = 0;
  return {
    take(text: string): { text: string; full: boolean } {
      const room = Math.max(0, limit - sent);
      const fits = text.length <= room ? text : text.slice(0, room);
      sent += fits.length;
      return { text: fits, full: fits.length < text.length };
    },
  };
}
