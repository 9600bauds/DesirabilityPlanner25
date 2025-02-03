import { BuildingBlueprint } from '../definitions/buildingBlueprints';
import { Point, Rectangle } from '../utils/geometry';
import GridState from './GridState';

class GridStateManager {
  private activeGridState = new GridState();
  private listeners: Set<(updatedGridState: GridState) => void>;

  constructor() {
    this.listeners = new Set();
  }

  public getActiveGridState = () => {
    return this.activeGridState;
  };

  //Let other classes subscribe so they know when the current gridState was updated
  public subscribe = (listener: (updatedGridState: GridState) => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  //Tell other classes that the current gridState was updated
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getActiveGridState()));
  }

  public tryPlaceBuilding(position: Point, blueprint: BuildingBlueprint): void {
    const success = this.activeGridState.placeBuilding(position, blueprint);
    if (success) {
      this.notifyListeners();
    }
  }

  public eraseRect(rect: Rectangle) {
    let success = false;
    this.activeGridState.getPlacedBuildings().forEach((building) => {
      if (building.interceptsRectangle(rect)) {
        this.activeGridState.removeBuilding(building);
        success = true;
      }
    });
    if (success) {
      this.notifyListeners();
    }
  }
}

export default GridStateManager;
