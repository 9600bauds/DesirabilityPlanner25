import { Point } from '../utils/geometry';
import { Building, BuildingPreset } from './Building';
import { gridSize } from '../utils/constants';

export class GridState {
  private desirabilityGrid: number[][];
  private placedBuildings: Set<Building>;

  private listeners: Set<() => void>;

  constructor() {
    this.desirabilityGrid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => 0)
    );
    this.placedBuildings = new Set();
    this.listeners = new Set();
  }

  // Observer pattern methods
  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener); // Return unsubscribe function
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  public getDesirabilityGrid() {
    return this.desirabilityGrid;
  }

  private updateDesirabilityGrid() {
    this.desirabilityGrid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => 0)
    ); //Reset the grid to zero

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const tilePoint: Point = { x, y };
        let totalDesirabilityEffect = 0;
        this.placedBuildings.forEach((building) => {
          totalDesirabilityEffect +=
            building.calculateDesirabilityEffect(tilePoint);
        });
        this.desirabilityGrid[y][x] += totalDesirabilityEffect;
      }
    }
    this.notifyListeners();
  }

  public placeBuilding(position: Point, preset: BuildingPreset): Building {
    const newBuilding = new Building(position, preset);

    this.placedBuildings.add(newBuilding);
    this.updateDesirabilityGrid();
    return newBuilding;
  }
}
