import { chebyshevDistance, Tile, Rectangle, TileSet } from '../utils/geometry';
import { DesireBox } from '../interfaces/DesireBox';
import NewBlueprint from '../types/NewBlueprint';
import colors from '../utils/colors';
import { CATEGORIES } from '../data/CATEGORIES';
import { NEW_BLUEPRINTS } from '../data/BLUEPRINTS';

class BasicBlueprint {
  width: number;
  height: number;
  tilesOccupied: TileSet;

  desireBox?: DesireBox;

  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;
  label?: string;
  fillColor?: string = colors.backgroundWhite;
  borderColor?: string = colors.strongOutlineBlack;

  constructor(newBp: NewBlueprint) {
    this.height = newBp.height;
    this.width = newBp.width;
    if (newBp.borderColor) {
      this.borderColor = newBp.borderColor;
    }
    if (newBp.fillColor) {
      this.fillColor = newBp.fillColor;
    } else if (newBp.category) {
      const category = CATEGORIES[newBp.category];
      if (category) this.fillColor = category.baseColor;
    }
    this.desireBox = newBp.desireBox;
    this.label = newBp.label;
    if (newBp.cost) {
      this.cost = newBp.cost;
    }
    if (newBp.employeesRequired) {
      this.employeesRequired = newBp.employeesRequired;
    }
    this.tilesOccupied = new TileSet();
    for (let x = 0; x < newBp.width; x++) {
      for (let y = 0; y < newBp.height; y++) {
        const thisTile = new Tile(x, y);
        this.tilesOccupied.add(thisTile);
      }
    }
    if (newBp.children) {
      for (const child of newBp.children) {
        const childBlueprint = NEW_BLUEPRINTS[child.childKey];
        for (let x = 0; x < childBlueprint.width; x++) {
          for (let y = 0; y < childBlueprint.height; y++) {
            const thisTile = child.relativeOrigin.add(new Tile(x, y));
            this.tilesOccupied.add(thisTile);
          }
        }
      }
    }
  }
}

export default BasicBlueprint;
