import Blueprint, { createBuilding } from '../types/Blueprint';
import { Tile, Rectangle } from '../utils/geometry';
import GridState from './GridState';
import Building from './Building';

export interface BlueprintPlacement {
  position: Tile;
  blueprint: Blueprint;
}

class GridStateManager {
  private states: GridState[] = [];
  private stateIndex: number = 0;
  private maxHistorySize: number = 50;

  constructor() {
    const initialState = new GridState();
    this.states = [initialState];
    this.stateIndex = 0;
  }

  public get activeGridState(): GridState {
    return this.states[this.stateIndex];
  }

  public getBaseValues = (): Int16Array => {
    return this.activeGridState.getDesirabilityGrid();
  };

  public getBuildings = (): Set<Building> => {
    return this.activeGridState.getPlacedBuildings();
  };

  public isTileOccupied = (tile: Tile): boolean => {
    return this.getInterceptingBuilding(tile) !== undefined;
  };

  public getInterceptingBuilding = (tile: Tile): Building | undefined => {
    for (const building of this.activeGridState.getPlacedBuildings()) {
      if (building.interceptsTile(tile)) return building;
    }
    return undefined;
  };

  public isBuildingValid = (building: Building): boolean => {
    const tileArray = building.tilesOccupied.toArray();
    for (const tile of tileArray) {
      if (this.isTileOccupied(tile)) {
        return false;
      }
    }
    return true;
  };

  // Push a new state to the history
  private pushState = (state: GridState): void => {
    // If we're not at the end of the history, truncate future states
    if (this.stateIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.stateIndex + 1);
    }

    // Add the new state and move index forward
    this.states.push(state);
    this.stateIndex++;

    // Prune history if it exceeds max size
    if (this.states.length > this.maxHistorySize) {
      this.states.shift();
      this.stateIndex--;
    }
  };

  public canUndo = (): boolean => {
    return this.stateIndex > 0;
  };

  public canRedo = (): boolean => {
    return this.stateIndex < this.states.length - 1;
  };

  public undo = (): boolean => {
    if (!this.canUndo()) return false;

    this.stateIndex--;
    return true;
  };

  public redo = (): boolean => {
    if (!this.canRedo()) return false;

    this.stateIndex++;
    return true;
  };

  public tryPlaceBlueprint = (
    position: Tile,
    blueprint: Blueprint
  ): boolean => {
    const newBuilding = createBuilding(position, blueprint);
    if (!this.isBuildingValid(newBuilding)) {
      return false;
    }

    // Create new state with the building added
    const newState = this.activeGridState.addBuilding(newBuilding);

    // Add to history
    this.pushState(newState);

    return true;
  };

  public tryPlaceBlueprints(placements: Array<BlueprintPlacement>): boolean {
    // Create all buildings first
    const newBuildings: Building[] = [];

    for (const { position, blueprint } of placements) {
      try {
        const newBuilding = createBuilding(position, blueprint);

        // Check if each building can be placed
        if (!this.isBuildingValid(newBuilding)) {
          return false;
        }

        newBuildings.push(newBuilding);
      } catch (error) {
        console.error(error);
        return false;
      }
    }

    // If all buildings can be placed, create a new state with all of them
    const newState = this.activeGridState.addBuildings(newBuildings);

    // Add to history
    this.pushState(newState);

    return true;
  }

  public eraseRect = (rect: Rectangle): boolean => {
    // Check if there are any buildings to erase first
    const buildingsToRemove: Building[] = [];

    for (const building of this.activeGridState.getPlacedBuildings()) {
      if (building.interceptsRectangle(rect)) {
        buildingsToRemove.push(building);
      }
    }

    if (buildingsToRemove.length === 0) {
      return false;
    }

    // Remove all buildings in a single operation
    const newState = this.activeGridState.removeBuildings(buildingsToRemove);

    // Add to history
    this.pushState(newState);

    return true;
  };
}

export default GridStateManager;
