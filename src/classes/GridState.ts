import { getEmptyArray, Tile } from '../utils/geometry';
import PlacedBuilding from './PlacedBuilding';
import { gridSize } from '../utils/constants';
import BuildingBlueprint from '../types/BuildingBlueprint';

class GridState {
  private desirabilityGrid: number[][];
  private placedBuildings: Set<PlacedBuilding>;

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
    this.desirabilityGrid = getEmptyArray(0) as number[][]; //Reset the grid to zero

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const tile = new Tile(x, y);
        let totalDesirabilityEffect = 0;
        for (const building of this.getPlacedBuildings()) {
          totalDesirabilityEffect += building.getDesirabilityEffect(tile);
        }
        this.desirabilityGrid[x][y] += totalDesirabilityEffect;
      }
    }
  }

  public placeBuilding(
    position: Tile,
    blueprint: BuildingBlueprint
  ): PlacedBuilding {
    const newBuilding = new PlacedBuilding(position, blueprint);

    this.placedBuildings.add(newBuilding);
    this.updateDesirabilityGrid();
    return newBuilding;
  }
  public removeBuilding(building: PlacedBuilding): void {
    this.placedBuildings.delete(building);
    this.updateDesirabilityGrid();
  }
}

export default GridState;
