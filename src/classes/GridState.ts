import { Tile } from '../utils/geometry';
import Building from './Building';
import { GRID_SIZE, COORD_TO_INT16 } from '../utils/constants';
import Blueprint, { createBuilding } from '../types/Blueprint';

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

  public getDesirabilityGrid() {
    return this.grid;
  }

  public getPlacedBuildings() {
    return this.placedBuildings;
  }

  public placeBuilding(position: Tile, blueprint: Blueprint): Building {
    const newBuilding = createBuilding(position, blueprint);

    for (const dbox of newBuilding.desireBoxes) {
      dbox.apply(this.grid, 1);
    }

    this.placedBuildings.add(newBuilding);
    return newBuilding;
  }

  public removeBuilding(building: Building): void {
    for (const dbox of building.desireBoxes) {
      dbox.apply(this.grid, -1);
    }

    // Remove the building from the set
    this.placedBuildings.delete(building);
  }
}

export default GridState;
