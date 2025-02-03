import {
  BUILDING_BLUEPRINTS,
  BuildingBlueprint,
  getBlueprint,
} from '../definitions/buildingBlueprints';
import CanvasRenderer from './CanvasRenderer';
import GridStateManager from './GridStateManager';

type CursorAction = 'default' | 'panning' | 'erasing';

class UIManager {
  private cursorAction: CursorAction = 'erasing';
  private selectedBlueprints?: BuildingBlueprint[];
  private selectedArray: number = 0;

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

    document.addEventListener('keydown', this.handleKeyDown);
  }

  public setCursorAction(action: CursorAction) {
    this.cursorAction = action;
  }
  public getCursorAction() {
    return this.cursorAction;
  }

  public getSelectedBlueprint = (): BuildingBlueprint | null => {
    if (!this.selectedBlueprints) {
      return null;
    }
    return this.selectedBlueprints[this.selectedArray];
  };

  public setSelectedBlueprints = (blueprints: BuildingBlueprint[]) => {
    this.selectedBlueprints = blueprints;
    this.selectedArray = 0;
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

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'r' || event.key === 'R') {
      this.rotateSelectedBlueprint();
    }
  };

  private rotateSelectedBlueprint = () => {
    console.log(this.selectedBlueprints);
    if (this.selectedBlueprints && this.selectedBlueprints.length > 0) {
      this.selectedArray =
        (this.selectedArray + 1) % this.selectedBlueprints.length;
    }
  };
}

export default UIManager;
