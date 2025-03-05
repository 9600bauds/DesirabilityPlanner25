import { Tile } from '../utils/geometry';
import Building from './Building';
import {
  GRID_SIZE,
  COORD_TO_INT16,
  GRID_SIZE_BITS,
  GRID_MAX_X,
  GRID_MAX_Y,
} from '../utils/constants';
import DesireBox from './desireBox';
import Blueprint from '../types/Blueprint';
import House from './House';

class GridState {
  private grid: Int16Array;
  private placedBuildings: Set<Building>; //This is effectively a list, not a set, right?

  constructor() {
    this.grid = new Int16Array(GRID_SIZE * GRID_SIZE);
    this.placedBuildings = new Set();
  }

  getValue(x: number, y: number): number {
    return this.grid[COORD_TO_INT16(x, y)];
  }

  setValue(x: number, y: number, value: number): void {
    this.grid[COORD_TO_INT16(x, y)] = value;
  }

  applyDesireBox(dbox: DesireBox, multiplier: number = 1): void {
    const origin = dbox.bounds.origin;
    const rectRight = origin.x + dbox.bounds.width - 1;
    const rectBottom = origin.y + dbox.bounds.height - 1;
    const minX = Math.max(0, origin.x - dbox.maxRange);
    const maxX = Math.min(GRID_MAX_X, rectRight + dbox.maxRange);
    const minY = Math.max(0, origin.y - dbox.maxRange);
    const maxY = Math.min(GRID_MAX_Y, rectBottom + dbox.maxRange);

    // Process grid row by row for SIMD-friendly access pattern
    for (let y = minY; y <= maxY; y++) {
      const isAboveRect = y < origin.y;
      const isBelowRect = y > rectBottom;

      // Pre-compute vertical distance once per row
      let distY = 0;
      if (isAboveRect) {
        distY = origin.y - y;
      } else if (isBelowRect) {
        distY = y - rectBottom;
      }

      // Pre-compute row offset for faster indexing
      const rowOffset = y << GRID_SIZE_BITS;
      // Process each cell in the row
      for (let x = minX; x <= maxX; x++) {
        const isLeftOfRect = x < origin.x;
        const isRightOfRect = x > rectRight;

        const isInsideRect =
          !isAboveRect && !isBelowRect && !isLeftOfRect && !isRightOfRect;
        if (isInsideRect) {
          continue;
        }

        // Gotta calculate horizontal distance for each one individually
        let distX = 0;
        if (isLeftOfRect) {
          distX = origin.x - x;
        } else if (isRightOfRect) {
          distX = x - rectRight;
        }

        const chebyshevDist = distX > distY ? distX : distY;

        this.grid[rowOffset | x] +=
          dbox.effectPerRange[chebyshevDist] * multiplier;
      }
    }
  }

  public getDesirabilityGrid() {
    return this.grid;
  }

  public getPlacedBuildings() {
    return this.placedBuildings;
  }

  public placeBuilding(position: Tile, blueprint: Blueprint): Building {
    let newBuilding: Building;
    if ('desirabilityToEvolve' in blueprint) {
      newBuilding = new House(position, blueprint);
    } else {
      newBuilding = new Building(position, blueprint);
    }

    for (const dbox of newBuilding.desireBoxes) {
      this.applyDesireBox(dbox, 1);
    }

    this.placedBuildings.add(newBuilding);
    return newBuilding;
  }

  public removeBuilding(building: Building): void {
    for (const dbox of building.desireBoxes) {
      this.applyDesireBox(dbox, -1);
    }

    // Remove the building from the set
    this.placedBuildings.delete(building);
  }
}

export default GridState;
