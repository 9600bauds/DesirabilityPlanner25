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

    this.baseGraphic = this.buildSymbol(svgCanvas, newBp);

    this.tilesOccupied = new TileSet();

    this.recursiveAddToTilesOccupied(newBp, new Tile(0, 0));

    this.desirabilityMap = new Map();
    this.recursiveAddToDesirabilityMap(newBp, new Tile(0, 0));
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
    symbol.stroke({ color: '#f06', opacity: 0.6, width: 5 });
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
