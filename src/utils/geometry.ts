import { COORD_TO_PX, GRID_SIZE } from './constants';
import * as Collections from 'typescript-collections';

export type Coordinate = [x: number, y: number];

export class Tile {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    if (x === undefined || y === undefined) {
      throw new Error('Tried to initialize tile with undefined coordinate!');
    }
    this.x = x;
    this.y = y;
  }

  static fromCoordinate(coord: Coordinate) {
    return new Tile(coord[0], coord[1]);
  }

  toCoordinate(): Coordinate {
    return [this.x, this.y];
  }

  toString(): string {
    return 'tile:{ x: ' + this.x + ', y: ' + this.y + ' }';
  }

  valueOf(): string {
    return `${this.x},${this.y}`;
  }

  hashCode(): number {
    return this.x * 31 + this.y;
  }

  equals(other: Tile): boolean {
    return this.x === other.x && this.y === other.y;
  }

  add(other: Tile): Tile {
    return new Tile(this.x + other.x, this.y + other.y);
  }

  offset(x: number, y: number): Tile {
    return new Tile(this.x + x, this.y + y);
  }

  substract(other: Tile): Tile {
    return new Tile(this.x - other.x, this.y - other.y);
  }
}

export class Rectangle {
  public origin: Tile;
  //Note that for all rectangle math, height and width are effectively +1:
  //A rectangle that starts at y=0 and ends at y=0 is considered to have a height of 1.
  public height: number;
  public width: number;

  public get startX() {
    return this.origin.x;
  }
  public get startY() {
    return this.origin.y;
  }
  public get endX() {
    return this.origin.x + this.width - 1;
  }
  public get endY() {
    return this.origin.y + this.height - 1;
  }

  constructor(origin: Tile, width: number, height: number) {
    this.origin = origin;
    this.height = height;
    this.width = width;
  }

  toString(): string {
    return (
      'rect: {origin:' +
      this.origin +
      ', h:' +
      this.height +
      ', w: ' +
      this.width +
      '}'
    );
  }

  public interceptsTile(t: Tile): boolean {
    const isInsideHorizontal =
      t.x >= this.origin.x && t.x < this.origin.x + this.width;
    const isInsideVertical =
      t.y >= this.origin.y && t.y < this.origin.y + this.height;

    return isInsideHorizontal && isInsideVertical;
  }
  public interceptsTiles(tiles: Collections.Set<Tile>) {
    const tileArray = tiles.toArray(); //apparently this library doesn't support iterators... so I need to make it into an array
    for (const tile of tileArray) {
      if (this.interceptsTile(tile)) {
        return true;
      }
    }
    return false;
  }

  public static fromTiles(t1: Tile, t2: Tile) {
    const originX = Math.min(t1.x, t2.x);
    const originY = Math.min(t1.y, t2.y);
    const width = Math.abs(t1.x - t2.x) + 1;
    const height = Math.abs(t1.y - t2.y) + 1;

    return new Rectangle(new Tile(originX, originY), width, height);
  }

  public static boundingBoxOfSet(rects: Set<Rectangle>): Rectangle | null {
    if (rects.size === 0) {
      return null;
    }

    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;

    for (const rect of rects) {
      minX = Math.min(minX, rect.startX);
      minY = Math.min(minY, rect.startY);
      maxX = Math.max(maxX, rect.endX);
      maxY = Math.max(maxY, rect.endY);
    }

    return new Rectangle(
      new Tile(minX, minY),
      maxX - minX + 1,
      maxY - minY + 1
    );
  }

  public static boundingBoxOfTwo(r1: Rectangle, r2: Rectangle): Rectangle {
    const minX = Math.min(r1.startX, r2.startX);
    const minY = Math.min(r1.startY, r2.startY);
    const maxX = Math.max(r1.endX, r2.endX);
    const maxY = Math.max(r1.endY, r2.endY);

    return new Rectangle(
      new Tile(minX, minY),
      maxX - minX + 1,
      maxY - minY + 1
    );
  }

  public static intersection(r1: Rectangle, r2: Rectangle): Rectangle | null {
    const minX = Math.max(r1.startX, r2.startX);
    const minY = Math.max(r1.startY, r2.startY);
    const maxX = Math.min(r1.endX, r2.endX);
    const maxY = Math.min(r1.endY, r2.endY);

    if (minX > maxX || minY > maxY) {
      return null;
    }

    return new Rectangle(
      new Tile(minX, minY),
      maxX - minX + 1,
      maxY - minY + 1
    );
  }
}

enum dirs {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

/*
 * After 4 hours of searching, I finally confirmed that:
 * Despite SVG being the most popular vector image format used on the web, it doesn't support stroke alignments
 * ...because they inexplicably removed them
 * It also doesn't allow you to add a stroke to an entire group, it just adds the stroke to each member individually
 * There are also no utilities to calculate the outline of a group
 * With some libraries you can get the outline of each member but you can't get the union of them
 * With filters you can achieve a hacky outline-esque effect but it lags massively when you zoom in too much
 *
 * So I just stared at an excel spreadsheet for 30 minutes and cranked out whatever grid tracing algorithm this is, instead.
 *
 * Assumes origin is part of the outline or it fails.
 * Assumes all points are connected with no holes in the middle.
 * But those are reasonable assumptions since there's only one non-rectangular building in the game
 * and this was a massive waste of time in the first place.
 */
// prettier-ignore
export function getOutlinePath(origin: Tile, tiles: Collections.Set<Tile>): Path2D {
  const path = new Path2D();
  path.moveTo(COORD_TO_PX(origin.x), COORD_TO_PX(origin.y));
  let loc = origin;
  let turns = 0;
  let dir = dirs.RIGHT;
  let newDir = dirs.RIGHT;
  while (true) {
    const up = loc.offset(0, -1);
    const right = loc.offset(1, 0);
    const down = loc.offset(0, 1);
    const left = loc.offset(-1, 0);
    const upleft = loc.offset(-1, -1);
    //See which border lines are near this point
    const borderN = tiles.contains(up) != tiles.contains(upleft);   //|╹|
    const borderE = tiles.contains(loc) != tiles.contains(up);      //|╺|
    const borderS = tiles.contains(loc) != tiles.contains(left);    //|╻|
    const borderW = tiles.contains(left) != tiles.contains(upleft); //|╸|
    //Check all the corner configurations to see if we need to turn
    if (borderE && borderS) {         //|▛| / |▗| - note that tiles.has(loc) is inverted for this one
      newDir = !tiles.contains(loc) ? dirs.DOWN : dirs.RIGHT;
    } else if (borderE && borderN) {  //|▙| / |▝|
      newDir = tiles.contains(loc) ? dirs.RIGHT : dirs.UP;
    } else if (borderW && borderN) {  //|▟| / |▘|
      newDir = tiles.contains(loc) ? dirs.UP : dirs.LEFT;
    } else if (borderW && borderS) {  //|▜| / |▖|
      newDir = tiles.contains(loc) ? dirs.LEFT : dirs.DOWN;
    }
    if (newDir !== dir) {
      dir = newDir;
      // We've turned! Add this point to the path
      path.lineTo(COORD_TO_PX(loc.x), COORD_TO_PX(loc.y));
    }
    //Move
    if (dir === dirs.UP) {
      loc = up;
    } else if (dir === dirs.RIGHT) {
      loc = right;
    } else if (dir === dirs.DOWN) {
      loc = down;
    } else if (dir === dirs.LEFT) {
      loc = left;
    }
    if (loc.equals(origin)) {
      //We're back home!
      path.closePath();
      return path;
    }
    turns++;
    if (turns > 50) {
      console.error('Failed to draw an outline for set of points!', tiles);
      throw new Error('Failed to draw an outline for set of points!');
    }
  }
}

export function getEmptyArray(baseValue: unknown) {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => baseValue)
  );
}
