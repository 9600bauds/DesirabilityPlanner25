import { deflateSync, inflateSync } from 'fflate';
import { BLUEPRINTS_BY_ID } from '../data/BLUEPRINTS';

/*
 * Coordinates are never stored. What goes in is the bounding box of the city,
 * the bpIDs in reading order, then one bit per tile of that box saying whether
 * a building starts there.
 *
 * Only tiles that could still hold an origin get a bit. Once a building is
 * placed, the rest of its footprint is skipped, because nothing may overlap it.
 */

const URL_GRID_SIZE = 256;

const BITS_PER_BYTE = 8;

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

const BBOX_BYTES = 4;
const COUNT_BYTES = 2;
const HEADER_BYTES = BBOX_BYTES + COUNT_BYTES;

/*
 * Buildings always fill their own width x height rectangle (children only ever
 * add tiles on top), so skipping that rectangle can never skip a tile that some
 * other building starts on.
 */
const sizeOf = (id: number) => {
  const blueprint = BLUEPRINTS_BY_ID.get(id);
  if (!blueprint) {
    throw new Error(`Malformed data: no blueprint with id ${id}`);
  }
  return { width: blueprint.width, height: blueprint.height };
};

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

  const idAt = new Map<number, number>();
  for (let i = 0; i < count; i++) {
    idAt.set(
      (triples[i * 3 + 2] - minY) * width + (triples[i * 3 + 1] - minX),
      triples[i * 3]
    );
  }

  const writer = new BitWriter();
  const ids: number[] = [];
  const covered = new Uint8Array(width * height);
  for (let tile = 0; tile < width * height; tile++) {
    if (covered[tile]) continue;
    const id = idAt.get(tile);
    writer.write(id === undefined ? 0 : 1, 1);
    if (id === undefined) continue;

    ids.push(id);
    cover(covered, tile, width, height, sizeOf(id));
  }
  const bitmap = writer.finish();

  const body = new Uint8Array(HEADER_BYTES + ids.length + bitmap.length);
  // width-1 because a city spanning the whole grid is 256 wide, and count-1
  // for the same reason -- an empty city never gets this far.
  body.set([minX, minY, width - 1, height - 1], 0);
  body[4] = (count - 1) & 0xff;
  body[5] = (count - 1) >> 8;
  body.set(ids, HEADER_BYTES);
  body.set(bitmap, HEADER_BYTES + ids.length);

  return deflateSync(body, { level: 9 });
}

function cover(
  covered: Uint8Array,
  tile: number,
  width: number,
  height: number,
  size: { width: number; height: number }
) {
  const originX = tile % width;
  const originY = Math.floor(tile / width);
  for (let dy = 0; dy < size.height; dy++) {
    for (let dx = 0; dx < size.width; dx++) {
      const x = originX + dx;
      const y = originY + dy;
      if (x < width && y < height) covered[y * width + x] = 1;
    }
  }
}

export function decompressCity(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (bytes.length === 0) {
    return new Uint8Array(0);
  }
  const body = inflateSync(bytes);
  if (body.length < HEADER_BYTES) {
    throw new Error('Malformed data: truncated header');
  }

  const minX = body[0];
  const minY = body[1];
  const width = body[2] + 1;
  const height = body[3] + 1;
  const count = ((body[5] << 8) | body[4]) + 1;
  if (body.length < HEADER_BYTES + count) {
    throw new Error(`Malformed data: ${count} buildings do not fit`);
  }
  const ids = body.subarray(HEADER_BYTES, HEADER_BYTES + count);

  const reader = new BitReader(body, HEADER_BYTES + count);
  const triples = new Uint8Array(count * 3);
  const covered = new Uint8Array(width * height);
  let placed = 0;
  for (let tile = 0; tile < width * height && placed < count; tile++) {
    if (covered[tile]) continue;
    if (!reader.read(1)) continue;

    const id = ids[placed];
    triples[placed * 3] = id;
    triples[placed * 3 + 1] = minX + (tile % width);
    triples[placed * 3 + 2] = minY + Math.floor(tile / width);
    placed++;
    cover(covered, tile, width, height, sizeOf(id));
  }
  if (placed !== count) {
    throw new Error(
      `Malformed data: expected ${count} buildings, got ${placed}`
    );
  }
  return triples;
}
