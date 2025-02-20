import { getOutlinePath, Rectangle, Tile, TileSet } from '../utils/geometry';
import NewBlueprint from '../types/NewBlueprint';
import colors from '../utils/colors';
import { CATEGORIES } from '../data/CATEGORIES';
import { NEW_BLUEPRINTS } from '../data/BLUEPRINTS';
import DesireBox from './desireBox';
import { Svg, Symbol } from '@svgdotjs/svg.js';
import { coordToPx } from '../utils/constants';

class BasicBlueprint {
  key: string;
  width: number;
  height: number;
  tilesOccupied: TileSet;

  desirabilityMap: Map<string, number>;

  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;
  baseLabel?: string;

  baseGraphic?: Symbol;

  constructor(newBp: NewBlueprint, key: string, svgCanvas: Svg) {
    this.key = key;
    this.height = newBp.height;
    this.width = newBp.width;
    this.baseLabel = newBp.label;
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

  private buildSymbol(svgCanvas: Svg, newBp: NewBlueprint): Symbol | undefined {
    if (newBp.invisible) return;
    const symbol = svgCanvas.symbol().attr('id', `${this.key}-base`);
    symbol.css('overflow', 'visible'); //Necessary for buildings with negative coord graphics

    this.recursiveAddToSymbol(newBp, symbol, new Tile(0, 0));

    const path = symbol
      .path()
      .fill('none')
      .stroke({ color: colors.strongOutlineBlack, opacity: 1, width: 3 });

    const pathData = getOutlinePath(this.tilesOccupied);

    path.plot(pathData);
    return symbol;
  }

  private recursiveAddToSymbol = (
    data: NewBlueprint,
    symbol: Symbol,
    origin: Tile
  ) => {
    if (data.invisible) {
      return;
    }
    const fillColor = this.getBpFillColor(data);
    symbol
      .rect(coordToPx(data.width), coordToPx(data.height))
      .fill(fillColor)
      .move(coordToPx(origin.x), coordToPx(origin.y));
    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        this.recursiveAddToSymbol(
          childBlueprint,
          symbol,
          origin.add(child.relativeOrigin)
        );
      }
    }
  };

  private getBpFillColor(bp: NewBlueprint): string {
    if (bp.fillColor) {
      return bp.fillColor;
    }
    if (bp.category) {
      const category = CATEGORIES[bp.category];
      if (category) return category.baseColor;
    }
    return colors.backgroundWhite;
  }

  public getLabel(maxDesirability?: number) {
    const labelHeight = coordToPx(this.height);
    const labelWidth = coordToPx(this.width);
    return `<div class="buildingLabel" style="width: ${labelHeight}px; height: ${labelWidth}px">
          ${this.baseLabel}
        </div>`;
  }
}

export default BasicBlueprint;
