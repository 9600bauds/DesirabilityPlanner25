import Building from './Building';
import { GRID_SIZE } from '../utils/constants';

class GridState {
  private readonly grid: Int16Array;
  private readonly placedBuildings: Set<Building>;

  constructor(grid?: Int16Array, placedBuildings?: Set<Building>) {
    this.grid = grid || new Int16Array(GRID_SIZE * GRID_SIZE);
    this.placedBuildings = placedBuildings || new Set();
  }

  public getDesirabilityGrid() {
    return this.grid;
  }

  public getPlacedBuildings() {
    return this.placedBuildings;
  }

  public addBuilding(building: Building): GridState {
    return this.addBuildings([building]);
  }

  public removeBuilding(building: Building): GridState {
    return this.removeBuildings([building]);
  }

  public addBuildings(buildings: Building[]): GridState {
    if (buildings.length === 0) return this;

    const newGrid = new Int16Array(this.grid);
    const newBuildings = new Set(this.placedBuildings);

    for (const building of buildings) {
      for (const dbox of building.desireBoxes) {
        dbox.apply(newGrid, 1);
      }
      newBuildings.add(building);
    }

    return new GridState(newGrid, newBuildings);
  }

  public removeBuildings(buildings: Building[]): GridState {
    if (buildings.length === 0) return this;

    const newGrid = new Int16Array(this.grid);
    const newBuildings = new Set(this.placedBuildings);

    for (const building of buildings) {
      for (const dbox of building.desireBoxes) {
        dbox.apply(newGrid, -1);
      }
      newBuildings.delete(building);
    }

    return new GridState(newGrid, newBuildings);
  }
}

export default GridState;
