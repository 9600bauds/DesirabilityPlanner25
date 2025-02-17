import BuildingBlueprint from '../types/BuildingBlueprint';
import NewBlueprint from '../types/NewBlueprint';
import { Tile, Rectangle } from '../utils/geometry';
import GridState from './GridState';

class GridStateManager {
  private activeGridState = new GridState();

  public getActiveGridState = () => {
    return this.activeGridState;
  };

  public getBaseValues = () => {
    return this.getActiveGridState().getDesirabilityGrid();
  };

  public getBuildings = () => {
    return this.getActiveGridState().getPlacedBuildings();
  };

  public isTileOccupied = (tile: Tile) => {
    if (this.getInterceptingBuilding(tile)) {
      return true;
    }
    return false;
  };

  public getInterceptingBuilding = (tile: Tile) => {
    for (const building of this.activeGridState.getPlacedBuildings()) {
      if (building.interceptsTile(tile)) return building;
    }
    return undefined;
  };

  public canPlaceBuilding = (position: Tile, blueprint: BuildingBlueprint) => {
    /*const buildingTiles = getAllTiles(position, blueprint);
    for (const tile of buildingTiles) {
      if (this.isTileOccupied(tile)) {
        return false;
      }
    }*/
    return true;
  };

  public tryPlaceBuilding(position: Tile, blueprint: BuildingBlueprint) {
    if (!this.canPlaceBuilding(position, blueprint)) {
      return false;
    }
    this.activeGridState.placeBuilding(position, blueprint);
    return true;
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
