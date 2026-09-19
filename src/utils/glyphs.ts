import { BASE256HIEROGLYPH } from '../data/ALPHABETS';

const GLYPHS = [...BASE256HIEROGLYPH];
const INDEX_OF = new Map(GLYPHS.map((glyph, i) => [glyph, i]));

if (GLYPHS.length !== 256) {
  throw new Error(`Need exactly 256 hieroglyphs, got ${GLYPHS.length}`);
}

export function isHieroglyphLink(str: string): boolean {
  return (str.codePointAt(0) ?? 0) > 0xffff;
}

export function bytesToGlyphs(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += GLYPHS[byte];
  return out;
}

export function glyphsToBytes(str: string): Uint8Array<ArrayBuffer> {
  const glyphs = [...str];
  const bytes = new Uint8Array(glyphs.length);
  for (let i = 0; i < glyphs.length; i++) {
    const byte = INDEX_OF.get(glyphs[i]);
    if (byte === undefined) {
      throw new Error(`Malformed data: ${glyphs[i]} is not in the alphabet`);
    }
    bytes[i] = byte;
  }
  return bytes;
}
