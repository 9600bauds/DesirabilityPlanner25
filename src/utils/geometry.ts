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

export class Line {
  public p1: DOMPoint;
  public p2: DOMPoint;

  constructor(p1: DOMPoint, p2: DOMPoint) {
    this.p1 = p1;
    this.p2 = p2;
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
