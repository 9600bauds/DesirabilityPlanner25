import { deflateSync, inflateSync } from 'fflate';

/*
 * Coordinates are never stored. What goes in is the bounding box of the city,
 * then one bit per tile of that box marking which tiles a building starts on,
 * then one bpID per set bit in reading order.
 */

const URL_GRID_SIZE = 256;

const BITS_PER_BYTE = 8;
const BBOX_BYTES = 4;

class BitWriter {
  private bytes: number[] = [];
  private cur = 0;
  private used = 0;

  write(value: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      this.cur = (this.cur << 1) | ((value >>> i) & 1);
      if (++this.used === BITS_PER_BYTE) {
        this.bytes.push(this.cur);
        this.cur = 0;
        this.used = 0;
      }
    }
  }

  // Pads out to the next byte
  align() {
    if (this.used) {
      this.bytes.push(this.cur << (BITS_PER_BYTE - this.used));
      this.cur = 0;
      this.used = 0;
    }
  }

  finish(): Uint8Array {
    this.align();
    return Uint8Array.from(this.bytes);
  }
}

class BitReader {
  private pos: number;
  private used = 0;

  constructor(
    private buf: Uint8Array,
    offset = 0
  ) {
    this.pos = offset;
  }

  read(bits: number): number {
    let value = 0;
    for (let i = 0; i < bits; i++) {
      if (this.pos >= this.buf.length) {
        throw new Error('Malformed data: bit stream ended early');
      }
      value = (value << 1) | ((this.buf[this.pos] >>> (7 - this.used)) & 1);
      if (++this.used === BITS_PER_BYTE) {
        this.used = 0;
        this.pos++;
      }
    }
    return value >>> 0;
  }

  align() {
    if (this.used) {
      this.used = 0;
      this.pos++;
    }
  }
}

export function compressCity(triples: Uint8Array): Uint8Array {
  if (triples.length % 3 !== 0) {
    throw new Error(
      `Malformed data: expected a multiple of 3 bytes, got ${triples.length}`
    );
  }
  const count = triples.length / 3;
  if (count === 0) {
    return new Uint8Array(0);
  }

  let minX = URL_GRID_SIZE - 1;
  let minY = URL_GRID_SIZE - 1;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < count; i++) {
    const x = triples[i * 3 + 1];
    const y = triples[i * 3 + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  // The bitmap comes out in reading order, so the IDs have to as well or they
  // get handed to the wrong buildings
  const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => {
    const ka = triples[a * 3 + 2] * URL_GRID_SIZE + triples[a * 3 + 1];
    const kb = triples[b * 3 + 2] * URL_GRID_SIZE + triples[b * 3 + 1];
    return ka - kb;
  });

  // Two buildings can't start on the same tile, so one bit per tile is enough
  // and we never write a single coordinate
  const origins = new Set<number>();
  for (let i = 0; i < count; i++) {
    origins.add(
      (triples[i * 3 + 2] - minY) * width + (triples[i * 3 + 1] - minX)
    );
  }

  const writer = new BitWriter();
  for (let tile = 0; tile < width * height; tile++) {
    writer.write(origins.has(tile) ? 1 : 0, 1);
  }
  writer.align();
  for (const i of order) writer.write(triples[i * 3], BITS_PER_BYTE);
  const bitmapAndIds = writer.finish();

  const body = new Uint8Array(BBOX_BYTES + bitmapAndIds.length);
  // width-1 because a full-grid city is 256 wide and that doesn't fit in a byte
  body.set([minX, minY, width - 1, height - 1], 0);
  body.set(bitmapAndIds, BBOX_BYTES);

  return deflateSync(body, { level: 9 });
}

export function decompressCity(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (bytes.length === 0) {
    return new Uint8Array(0);
  }
  const body = inflateSync(bytes);
  if (body.length < BBOX_BYTES) {
    throw new Error('Malformed data: truncated bounding box');
  }

  const minX = body[0];
  const minY = body[1];
  const width = body[2] + 1;
  const height = body[3] + 1;

  // Walk the box in the same order it was written and collect the set tiles
  const reader = new BitReader(body, BBOX_BYTES);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let tile = 0; tile < width * height; tile++) {
    if (reader.read(1)) {
      xs.push(minX + (tile % width));
      ys.push(minY + Math.floor(tile / width));
    }
  }
  reader.align();

  const triples = new Uint8Array(xs.length * 3);
  for (let i = 0; i < xs.length; i++) {
    triples[i * 3] = reader.read(BITS_PER_BYTE);
    triples[i * 3 + 1] = xs[i];
    triples[i * 3 + 2] = ys[i];
  }
  return triples;
}
