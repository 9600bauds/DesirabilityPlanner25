import {
  BUILDING_BLUEPRINTS,
  getBlueprint,
  getRandomBuildingBlueprint,
} from '../definitions/buildingBlueprints';
import CanvasRenderer from './CanvasRenderer';
import GridStateManager from './GridStateManager';

type CursorAction = 'default' | 'panning' | 'erasing';

class UIManager {
  private cursorAction: CursorAction = 'erasing';
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

  public setCursorAction(action: CursorAction) {
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
    } else if (this.cursorAction === 'erasing') {
      this.canvasRenderer.startDragging(event);
    } else {
      this.canvasRenderer.stopPanning();

      const tile = this.canvasRenderer.getMouseCoords(event);
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
    } else if (this.cursorAction === 'erasing') {
      this.canvasRenderer.handleDragging(event);
    }
  };

  private handleMouseUp = () => {
    this.canvasRenderer.stopPanning();
    if (this.cursorAction === 'erasing') {
      const erasedRect = this.canvasRenderer.stopDragging();
      if (erasedRect) this.gridStateManager.eraseRect(erasedRect);
    }
  };
}

export default UIManager;
