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

  visualRepresentation?: Symbol;

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

    const symbol = svgCanvas.symbol().attr('id', `${this.key}-base`);
    symbol.css('overflow', 'visible'); //Necessary for buildings with negative coord graphics
    let fillColor = colors.backgroundWhite;
    if (newBp.fillColor) {
      fillColor = newBp.fillColor;
    } else if (newBp.category) {
      const category = CATEGORIES[newBp.category];
      if (category) fillColor = category.baseColor;
    }

    const addToSymbol = (
      data: NewBlueprint,
      symbol: Symbol,
      fillColor: string,
      offset?: Tile
    ) => {
      const rect = symbol
        .rect(canvasTilePx * data.width, canvasTilePx * data.height)
        .fill(fillColor);
      if (offset) {
        rect.move(canvasTilePx * offset.x, canvasTilePx * offset.y);
      }
    };

    addToSymbol(newBp, symbol, fillColor);
    if (newBp.children) {
      for (const child of newBp.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        addToSymbol(childBlueprint, symbol, fillColor, child.relativeOrigin);
      }
    }
    symbol.stroke({ color: '#f06', opacity: 0.6, width: 5 });
    this.visualRepresentation = symbol;

    this.tilesOccupied = new TileSet();
    const addToTilesOccupied = (data: NewBlueprint, offset?: Tile) => {
      for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
          const thisTile = new Tile(x, y);
          this.tilesOccupied.add(offset ? thisTile.add(offset) : thisTile);
        }
      }
    };
    addToTilesOccupied(newBp);
    if (newBp.children) {
      for (const child of newBp.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        addToTilesOccupied(childBlueprint, child.relativeOrigin);
      }
    }

    this.desirabilityMap = new Map();
    const addToDesirabilityMap = (data: NewBlueprint, offset?: Tile) => {
      if (data.desireBox) {
        const desireBox = new DesireBox(data.desireBox);
        const origin = offset ? offset : new Tile(0, 0);
        const ourRect = new Rectangle(origin, this.height, this.width);
        desireBox.addToDesirabilityMap(this.desirabilityMap, ourRect);
      }
    };
    addToDesirabilityMap(newBp);
    if (newBp.children) {
      for (const child of newBp.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        addToDesirabilityMap(childBlueprint, child.relativeOrigin);
      }
    }
  }
}

export default BasicBlueprint;
