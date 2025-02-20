import { coordToPx } from './constants';

export class Tile {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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

  toKey(): string {
    return `${this.x},${this.y}`;
  }

  //I once again have to do hackiness because JS cannot into custom classes as keys for sets/maps.
  static fromKey(key: string): Tile {
    const [x, y] = key.split(',').map(Number);
    return new Tile(x, y);
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

// It's genuinely insane that I need to have a wrapper class for this. Why, JS, why?
export class TileSet {
  private items: Tile[] = [];

  add(tile: Tile): void {
    if (!this.has(tile)) {
      this.items.push(tile);
    }
  }

  has(tile: Tile): boolean {
    return this.items.some((item) => item.equals(tile));
  }

  get size(): number {
    return this.items.length;
  }

  values(): Tile[] {
    return [...this.items];
  }

  [Symbol.iterator](): Iterator<Tile> {
    let index = 0;
    const items = this.items;
    return {
      next(): IteratorResult<Tile> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        } else {
          return { value: undefined, done: true };
        }
      },
    };
  }

  offsetSet(offset: Tile): TileSet {
    const newSet = new TileSet();
    for (const tile of this.items) {
      newSet.add(tile.add(offset));
    }
    return newSet;
  }
}

export class Rectangle {
  public origin: Tile;
  //Note that for all rectangle math, height and width are effectively +1:
  //A rectangle that starts at y=0 and ends at y=0 is considered to have a height of 1.
  public height: number;
  public width: number;

  constructor(origin: Tile, height: number, width: number) {
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

  public static fromTiles(t1: Tile, t2: Tile) {
    const originX = Math.min(t1.x, t2.x);
    const originY = Math.min(t1.y, t2.y);
    const width = Math.abs(t1.x - t2.x) + 1;
    const height = Math.abs(t1.y - t2.y) + 1;

    return new Rectangle(new Tile(originX, originY), height, width);
  }

  public interceptsTile(t: Tile): boolean {
    const isInsideHorizontal =
      t.x >= this.origin.x && t.x < this.origin.x + this.width;
    const isInsideVertical =
      t.y >= this.origin.y && t.y < this.origin.y + this.height;

    return isInsideHorizontal && isInsideVertical;
  }
  public interceptsTiles(tiles: TileSet) {
    for (const tile of tiles) {
      if (this.interceptsTile(tile)) {
        return true;
      }
    }
    return false;
  }
}

export function chebyshevDistance(tile: Tile, rect: Rectangle): number {
  let distanceX = 0;
  let distanceY = 0;

  if (tile.x < rect.origin.x) {
    distanceX = rect.origin.x - tile.x;
  } else if (tile.x >= rect.origin.x + rect.width) {
    distanceX = tile.x - (rect.origin.x + rect.width - 1);
  }

  if (tile.y < rect.origin.y) {
    distanceY = rect.origin.y - tile.y;
  } else if (tile.y >= rect.origin.y + rect.height) {
    distanceY = tile.y - (rect.origin.y + rect.height - 1);
  }

  return Math.max(distanceX, distanceY);
}

export const degreesToRads = (deg: number) => (deg * Math.PI) / 180.0;
export const radsToDegrees = (rad: number) => (rad * 180.0) / Math.PI;

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
 * Assumes 0,0 is part of the outline or it fails.
 * Assumes all points are connected with no holes in the middle.
 * But those are reasonable assumptions since there's only one non-rectangular building in the game
 * and this was a massive waste of time in the first place.
 */
// prettier-ignore
export function getOutlinePath(tiles: TileSet) {
  let pathData = 'M0,0'; //'M' means 'move to here without drawing anything'
  const origin = new Tile(0, 0);
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
    const borderN = tiles.has(up) != tiles.has(upleft);   //|╹|
    const borderE = tiles.has(loc) != tiles.has(up);      //|╺|
    const borderS = tiles.has(loc) != tiles.has(left);    //|╻|
    const borderW = tiles.has(left) != tiles.has(upleft); //|╸|
    //Check all the corner configurations to see if we need to turn
    if (borderE && borderS) {         //|▛| / |▗| - note that tiles.has(loc) is inverted for this one
      newDir = !tiles.has(loc) ? dirs.DOWN : dirs.RIGHT;
    } else if (borderE && borderN) {  //|▙| / |▝|
      newDir = tiles.has(loc) ? dirs.RIGHT : dirs.UP;
    } else if (borderW && borderN) {  //|▟| / |▘|
      newDir = tiles.has(loc) ? dirs.UP : dirs.LEFT;
    } else if (borderW && borderS) {  //|▜| / |▖|
      newDir = tiles.has(loc) ? dirs.LEFT : dirs.DOWN;
    }
    if (newDir !== dir) {
      // We've turned! Add this point to the path
      pathData += `L${coordToPx(loc.x)},${coordToPx(loc.y)} `; //'L' means 'draw a line to this point'
      dir = newDir;
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
      pathData += ' Z'; //This tells the path to close itself by going back to the start point
      return pathData;
    }
    turns++;
    if (turns > 50) {
      throw new Error('Failed to draw an outline for set of points!');
    }
  }
}
