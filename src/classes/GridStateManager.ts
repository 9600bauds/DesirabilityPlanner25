import Blueprint, { createBuilding } from '../types/Blueprint';
import { Tile, Rectangle } from '../utils/geometry';
import GridState from './GridState';
import Building from './Building';

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

  public verifyPlacement = (building: Building) => {
    const tileArray = building.tilesOccupied.toArray(); //apparently this library doesn't support iterators... so I need to make it into an array
    for (const tile of tileArray) {
      if (this.isTileOccupied(tile)) {
        return false;
      }
    }
    return true;
  };

  public tryPlaceBlueprint(position: Tile, blueprint: Blueprint) {
    const newBuilding = createBuilding(position, blueprint);
    if (!this.verifyPlacement(newBuilding)) {
      return false;
    }
    this.activeGridState.addBuilding(newBuilding);
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
