import { chebyshevDistance, Rectangle, Tile, TileSet } from '../utils/geometry';
import NewBlueprint from '../types/NewBlueprint';
import colors from '../utils/colors';
import { CATEGORIES } from '../data/CATEGORIES';
import { NEW_BLUEPRINTS } from '../data/BLUEPRINTS';
import DesireBox from './desireBox';

class BasicBlueprint {
  width: number;
  height: number;
  tilesOccupied: TileSet;

  desirabilityMap: Map<string, number>;

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
    this.label = newBp.label;
    if (newBp.cost) {
      this.cost = newBp.cost;
    }
    if (newBp.employeesRequired) {
      this.employeesRequired = newBp.employeesRequired;
    }

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
        const minX = 0 - desireBox.maxRange + (offset ? offset.x : 0);
        const maxX = this.width + desireBox.maxRange + (offset ? offset.x : 0);
        const minY = 0 - desireBox.maxRange + (offset ? offset.y : 0);
        const maxY = this.height + desireBox.maxRange + (offset ? offset.y : 0);
        for (let x = minX; x < maxX; x++) {
          for (let y = minY; y < maxY; y++) {
            const thisTile = new Tile(x, y);
            const dist = chebyshevDistance(thisTile, ourRect);
            const desirabilityEffect = desireBox.distToEffect(dist);
            if (!desirabilityEffect) continue;
            const tileAsKey = thisTile.toKey();
            this.desirabilityMap.set(
              tileAsKey,
              desirabilityEffect + (this.desirabilityMap.get(tileAsKey) ?? 0)
            );
          }
        }
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
