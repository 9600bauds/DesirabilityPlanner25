import { BuildingBlueprint } from '../definitions/buildingBlueprints';
import { Point, Rectangle } from '../utils/geometry';
import GridState from './GridState';

class GridStateManager {
  private activeGridState = new GridState();
  public getActiveGridState = () => {
    return this.activeGridState;
  };

  public tryPlaceBuilding(position: Point, blueprint: BuildingBlueprint) {
    const success = this.activeGridState.placeBuilding(position, blueprint);
    return success;
  }

  public eraseRect(rect: Rectangle) {
    let success = false;
    for (const building of this.activeGridState.getPlacedBuildings()) {
      if (building.interceptsRectangle(rect)) {
        this.activeGridState.removeBuilding(building);
        success = true;
      }
    }
    return success;
  }
}

export default GridStateManager;
