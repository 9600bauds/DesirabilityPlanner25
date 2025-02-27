import { getOutlinePath, Rectangle, Tile } from '../utils/geometry';
import NewBlueprint from '../types/NewBlueprint';
import colors from '../utils/colors';
import { NEW_CATEGORIES } from '../data/CATEGORIES';
import { NEW_BLUEPRINTS } from '../data/BLUEPRINTS';
import DesireBox from './desireBox';
import { Svg, Symbol } from '@svgdotjs/svg.js';
import { COORD_TO_PX } from '../utils/constants';
import * as Collections from 'typescript-collections';

class BasicBlueprint {
  key: string;
  width: number;
  height: number;
  tilesOccupied: Collections.Set<Tile>;

  desireBoxes: DesireBox[];

  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;
  baseLabel?: string;

  baseGraphic?: Symbol;
  path: string;

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

    this.desireBoxes = [];
    this.recursiveAddDesireBox(newBp, new Tile(0, 0));

    this.tilesOccupied = new Collections.Set<Tile>();
    this.recursiveAddToTilesOccupied(newBp, new Tile(0, 0));

    this.path = getOutlinePath(this.tilesOccupied);
    this.baseGraphic = this.buildSymbol(svgCanvas, newBp);
  }

  private recursiveAddToTilesOccupied = (data: NewBlueprint, origin: Tile) => {
    for (let x = 0; x < data.width; x++) {
      for (let y = 0; y < data.height; y++) {
        const thisTile = new Tile(x, y).add(origin);
        this.tilesOccupied.add(thisTile);
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

  private recursiveAddDesireBox = (data: NewBlueprint, origin: Tile) => {
    if (data.desireBox) {
      this.desireBoxes.push(
        new DesireBox(data.desireBox, origin, data.height, data.width)
      );
    }
    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        this.recursiveAddDesireBox(
          childBlueprint,
          origin.add(child.relativeOrigin)
        );
      }
    }
  };

  private buildSymbol(svgCanvas: Svg, newBp: NewBlueprint): Symbol | undefined {
    if (newBp.invisible) return;
    const symbol = svgCanvas.symbol().attr('id', `${this.key}-base`);
    symbol.css('overflow', 'visible'); //Necessary for outlines and buildings with negative coord graphics. Todo: Does this impact performance much?

    this.recursiveAddToSymbol(newBp, symbol, new Tile(0, 0));

    const path = symbol
      .path()
      .fill('none')
      .stroke({ color: colors.strongOutlineBlack, opacity: 1, width: 3 });

    path.plot(this.path);
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
      .rect(COORD_TO_PX(data.width), COORD_TO_PX(data.height))
      .fill(fillColor)
      .move(COORD_TO_PX(origin.x), COORD_TO_PX(origin.y));
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
      const category = NEW_CATEGORIES[bp.category];
      if (category) return category.baseColor;
    }
    return colors.backgroundWhite;
  }

  public getLabel(maxDesirability?: number) {
    const labelHeight = COORD_TO_PX(this.height);
    const labelWidth = COORD_TO_PX(this.width);
    return `<div class="buildingLabel" style="width: ${labelWidth}px; height: ${labelHeight}px">
          ${this.baseLabel}
        </div>`;
  }
}

export default BasicBlueprint;
