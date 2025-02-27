import { getEmptyArray, Rectangle, Tile } from '../utils/geometry';
import PlacedBuilding from './PlacedBuilding';
import { GRID_SIZE, COORD_TO_INT16, GRID_SIZE_BITS } from '../utils/constants';
import BuildingBlueprint from '../types/BuildingBlueprint';
import DesireBox from './desireBox';

class GridState {
  private grid: Int16Array;
  private placedBuildings: Set<PlacedBuilding>;

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

  applyDesireBox(origin: Tile, dbox: DesireBox, multiplier: number = 1): void {
    const rectRight = origin.x + dbox.bounds.width - 1;
    const rectBottom = origin.y + dbox.bounds.height - 1;
    const minX = Math.max(0, origin.x - dbox.maxRange);
    const maxX = Math.min(GRID_SIZE - 1, rectRight + dbox.maxRange);
    const minY = Math.max(0, origin.y - dbox.maxRange);
    const maxY = Math.min(GRID_SIZE - 1, rectBottom + dbox.maxRange);

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

  public placeBuilding(
    position: Tile,
    blueprint: BuildingBlueprint
  ): PlacedBuilding {
    const newBuilding = new PlacedBuilding(position, blueprint);

    for (const dbox of blueprint.desireBoxes) {
      this.applyDesireBox(position.add(dbox.bounds.origin), dbox, 1);
    }

    this.placedBuildings.add(newBuilding);
    return newBuilding;
  }

  public removeBuilding(building: PlacedBuilding): void {
    for (const dbox of building.blueprint.desireBoxes) {
      this.applyDesireBox(building.origin.add(dbox.bounds.origin), dbox, -1);
    }

    // Remove the building from the set
    this.placedBuildings.delete(building);
  }
}

export default GridState;
