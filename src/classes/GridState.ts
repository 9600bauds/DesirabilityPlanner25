import { Tile } from '../utils/geometry';
import Building from './Building';
import { gridSize } from '../utils/constants';
import BuildingBlueprint, { createBuilding } from '../types/BuildingBlueprint';

class GridState {
  private desirabilityGrid: number[][];
  private placedBuildings: Set<Building>;

  constructor() {
    this.desirabilityGrid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => 0)
    );
    this.placedBuildings = new Set();
  }

  public getDesirabilityGrid() {
    return this.desirabilityGrid;
  }

  public getPlacedBuildings() {
    return this.placedBuildings;
  }

  private updateDesirabilityGrid() {
    this.desirabilityGrid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => 0)
    ); //Reset the grid to zero

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const tile = new Tile(x, y);
        let totalDesirabilityEffect = 0;
        for (const building of this.getPlacedBuildings()) {
          totalDesirabilityEffect += building.recursiveDesirabilityEffect(tile);
        }
        this.desirabilityGrid[y][x] += totalDesirabilityEffect;
      }
    }
  }

  public placeBuilding(position: Tile, blueprint: BuildingBlueprint): Building {
    const newBuilding = createBuilding(position, blueprint);

    this.placedBuildings.add(newBuilding);
    this.updateDesirabilityGrid();
    return newBuilding;
  }
  public removeBuilding(building: Building): void {
    this.placedBuildings.delete(building);
    this.updateDesirabilityGrid();
  }
}

export default GridState;
