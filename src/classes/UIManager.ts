import {
  BUILDING_BLUEPRINTS,
  getBlueprint,
  getRandomBuildingBlueprint,
} from '../definitions/buildingBlueprints';
import CanvasRenderer from './CanvasRenderer';
import GridStateManager from './GridStateManager';

class UIManager {
  private cursorAction: 'default' | 'panning' = 'default';
  private selectedBlueprintKey: keyof typeof BUILDING_BLUEPRINTS = 'GARDEN';

  private canvasRenderer: CanvasRenderer;
  private gridStateManager: GridStateManager;

  constructor(
    canvas: HTMLCanvasElement,
    canvasRenderer: CanvasRenderer,
    gridStateManager: GridStateManager
  ) {
    this.canvasRenderer = canvasRenderer;
    this.gridStateManager = gridStateManager;

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseup', this.handleMouseUp);
  }

  public setCursorAction(action: 'default' | 'panning') {
    this.cursorAction = action;
  }
  public getCursorAction() {
    return this.cursorAction;
  }

  public getSelectedBlueprint() {
    const currentBlueprintKey = this.getSelectedBlueprintKey();
    if (!currentBlueprintKey) {
      return null;
    }
    return getBlueprint(currentBlueprintKey);
  }

  public getSelectedBlueprintKey() {
    return this.selectedBlueprintKey;
  }

  public setSelectedBlueprintKey(
    blueprintKey: keyof typeof BUILDING_BLUEPRINTS
  ) {
    this.selectedBlueprintKey = blueprintKey;
  }

  public setBlueprintKeyButPublic = (
    blueprintKey: keyof typeof BUILDING_BLUEPRINTS
  ) => {
    this.selectedBlueprintKey = blueprintKey;
  };

  private handleMouseDown = (event: MouseEvent) => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.startPanning(event);
    } else {
      this.canvasRenderer.stopPanning();

      const tile = this.canvasRenderer.getTileUnderMouse(event);
      if (tile) {
        const blueprint = this.getSelectedBlueprint();
        if (blueprint) {
          this.canvasRenderer.stopPanning();
          this.gridStateManager.tryPlaceBuilding(tile, blueprint);
          //this.gridState.placeBuilding(tile, getRandomBuildingBlueprint());
        }
        console.log(`Clicked tile: x=${tile.x}, y=${tile.y}`);
      } else {
        console.log('Clicked outside the grid');
      }
    }
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.handlePanning(event);
    }
  };

  private handleMouseUp = () => {
    this.canvasRenderer.stopPanning();
  };
}

export default UIManager;
