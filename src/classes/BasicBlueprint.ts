import { Rectangle, Tile, TileSet } from '../utils/geometry';
import NewBlueprint from '../types/NewBlueprint';
import colors from '../utils/colors';
import { CATEGORIES } from '../data/CATEGORIES';
import { NEW_BLUEPRINTS } from '../data/BLUEPRINTS';
import DesireBox from './desireBox';
import { Svg, Symbol } from '@svgdotjs/svg.js';
import { canvasTilePx } from '../utils/constants';

class BasicBlueprint {
  key: string;
  width: number;
  height: number;
  tilesOccupied: TileSet;

  desirabilityMap: Map<string, number>;

  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;
  label?: string;

  baseGraphic: Symbol;

  constructor(newBp: NewBlueprint, key: string, svgCanvas: Svg) {
    this.key = key;
    this.height = newBp.height;
    this.width = newBp.width;
    this.label = newBp.label;
    if (newBp.cost) {
      this.cost = newBp.cost;
    }
    if (newBp.employeesRequired) {
      this.employeesRequired = newBp.employeesRequired;
    }

    this.tilesOccupied = new TileSet();
    this.recursiveAddToTilesOccupied(newBp, new Tile(0, 0));

    this.desirabilityMap = new Map();
    this.recursiveAddToDesirabilityMap(newBp, new Tile(0, 0));

    this.baseGraphic = this.buildSymbol(svgCanvas, newBp);
  }

  private recursiveAddToTilesOccupied = (data: NewBlueprint, origin: Tile) => {
    for (let x = 0; x < data.width; x++) {
      for (let y = 0; y < data.height; y++) {
        const thisTile = new Tile(x, y);
        this.tilesOccupied.add(origin.add(thisTile));
      }
    }
    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        this.recursiveAddToTilesOccupied(
          childBlueprint,
          origin.add(child.relativeOrigin)
        );
      }
    }
  };

  private recursiveAddToDesirabilityMap = (
    data: NewBlueprint,
    origin: Tile
  ) => {
    if (data.desireBox) {
      const desireBox = new DesireBox(data.desireBox);
      const ourRect = new Rectangle(origin, this.height, this.width);
      desireBox.addToDesirabilityMap(this.desirabilityMap, ourRect);
    }
    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        this.recursiveAddToDesirabilityMap(
          childBlueprint,
          origin.add(child.relativeOrigin)
        );
      }
    }
  };

  private buildSymbol(svgCanvas: Svg, newBp: NewBlueprint) {
    const symbol = svgCanvas.symbol().attr('id', `${this.key}-base`);
    symbol.css('overflow', 'visible'); //Necessary for buildings with negative coord graphics

    this.recursiveAddToSymbol(newBp, symbol, new Tile(0, 0));

    //Is on the outside
    /*symbol.filterWith(function (add) {
      const dilated = add.morphology('dilate', 2);
      const blackFlood = add.flood('#000', 1);
      const composite = add.composite(blackFlood, dilated, 'in'); // keep only the dilated parts overlapping the original alpha
      add.merge([composite, 'SourceGraphic']);
    });*/

    //Inexplicably lags like hell when a fort is placed down
    /*symbol.filterWith(function (add) {
      // Original alpha
      const original = add.$sourceAlpha;

      // Create eroded version
      const eroded = add.morphology('erode', 2);

      // Subtract to get only the border
      const innerBorder = add.composite(original, eroded, 'out');

      // Color the border
      const strokeFlood = add.flood('#000', 1);
      const coloredStroke = add.composite(strokeFlood, innerBorder, 'in');

      // Merge with original
      add.merge(['SourceGraphic', coloredStroke]);
    });*/

    //Is applied individually
    //symbol.stroke({ color: '#f06', opacity: 0.6, width: 5 });

    //Ugly corners
    /* const path = symbol
      .path()
      .fill('none')
      .stroke({ color: colors.strongOutlineBlack, opacity: 1, width: 2 })
    let pathData = '';
    for (const tile of this.tilesOccupied) {
      // Right edge
      if (!this.tilesOccupied.has(new Tile(tile.x + 1, tile.y))) {
        pathData += `M${(tile.x + 1) * canvasTilePx},${tile.y * canvasTilePx} L${(tile.x + 1) * canvasTilePx},${(tile.y + 1) * canvasTilePx} `;
      }
      // Left edge
      if (!this.tilesOccupied.has(new Tile(tile.x - 1, tile.y))) {
        pathData += `M${tile.x * canvasTilePx},${tile.y * canvasTilePx} L${tile.x * canvasTilePx},${(tile.y + 1) * canvasTilePx} `;
      }
      // Bottom edge
      if (!this.tilesOccupied.has(new Tile(tile.x, tile.y + 1))) {
        pathData += `M${tile.x * canvasTilePx},${(tile.y + 1) * canvasTilePx} L${(tile.x + 1) * canvasTilePx},${(tile.y + 1) * canvasTilePx} `;
      }
      // Top edge
      if (!this.tilesOccupied.has(new Tile(tile.x, tile.y - 1))) {
        pathData += `M${tile.x * canvasTilePx},${tile.y * canvasTilePx} L${(tile.x + 1) * canvasTilePx},${tile.y * canvasTilePx} `;
      }
    }
    path.plot(pathData);*/

    let pathData = 'M0,0';
    const path = symbol
      .path()
      .fill('none')
      .stroke({ color: colors.strongOutlineBlack, opacity: 1, width: 2 });

    let turns = 0;
    const origin = new Tile(0, 0);
    let loc = new Tile(0, 0);
    let done = false;
    let dir = 'right';
    let newDir = 'right';
    while (!done) {
      const up = loc.offset(0, -1);
      const right = loc.offset(1, 0);
      const down = loc.offset(0, 1);
      const left = loc.offset(-1, 0);
      const upleft = loc.offset(-1, -1);
      const upborder =
        this.tilesOccupied.has(up) != this.tilesOccupied.has(upleft);
      const rightborder =
        this.tilesOccupied.has(loc) != this.tilesOccupied.has(up);
      const downborder =
        this.tilesOccupied.has(loc) != this.tilesOccupied.has(left);
      const leftborder =
        this.tilesOccupied.has(left) != this.tilesOccupied.has(upleft);
      if (rightborder && downborder) {
        newDir = this.tilesOccupied.has(loc) ? 'right' : 'down'; //┏
      } else if (rightborder && upborder) {
        newDir = this.tilesOccupied.has(loc) ? 'right' : 'up'; //┗
      } else if (leftborder && upborder) {
        newDir = this.tilesOccupied.has(loc) ? 'up' : 'left'; //┛
      } else if (leftborder && downborder) {
        newDir = this.tilesOccupied.has(loc) ? 'left' : 'down'; //┓
      }
      if (newDir !== dir) {
        pathData += `L${loc.x * canvasTilePx},${loc.y * canvasTilePx}`;
        dir = newDir;
      }
      switch (dir) {
        case 'up':
          loc = up;
          break;
        case 'right':
          loc = right;
          break;
        case 'down':
          loc = down;
          break;
        case 'left':
          loc = left;
          break;
      }
      turns++;
      if (loc.equals(origin)) {
        pathData += ' Z';
        done = true;
        break;
      }
      if (turns > 50) {
        throw new Error('Failed to draw an outline for set of points!');
      }
    }

    path.plot(pathData);
    return symbol;
  }

  private recursiveAddToSymbol = (
    data: NewBlueprint,
    symbol: Symbol,
    origin: Tile,
    parent?: NewBlueprint
  ) => {
    let fillColor = this.getBpFillColor(data);
    if (!fillColor && parent) fillColor = this.getBpFillColor(parent);

    if (fillColor) {
      symbol
        .rect(canvasTilePx * data.width, canvasTilePx * data.height)
        .fill(fillColor)
        .move(canvasTilePx * origin.x, canvasTilePx * origin.y);
    }
    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        this.recursiveAddToSymbol(
          childBlueprint,
          symbol,
          origin.add(child.relativeOrigin),
          data
        );
      }
    }
  };

  private getBpFillColor(bp: NewBlueprint): string | undefined {
    if (bp.fillColor) {
      return bp.fillColor;
    } else if (bp.category) {
      const category = CATEGORIES[bp.category];
      if (category) return category.baseColor;
    }
  }
}

export default BasicBlueprint;
