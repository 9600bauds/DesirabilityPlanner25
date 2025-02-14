import RenderContext from '../interfaces/RenderContext';
import BuildingBlueprint from '../types/BuildingBlueprint';
import CanvasRenderer from './CanvasRenderer';
import GridStateManager from './GridStateManager';

export type CursorAction = 'placing' | 'panning' | 'erasing';

class UIManager {
  private cursorAction: CursorAction = 'panning';
  private selectedBlueprints?: BuildingBlueprint[];
  private selectedArray: number = 0;

  private canvasRenderer: CanvasRenderer;
  private gridStateManager: GridStateManager;

  public renderState: RenderContext;

  constructor(
    canvas: HTMLCanvasElement,
    canvasRenderer: CanvasRenderer,
    gridStateManager: GridStateManager
  ) {
    this.canvasRenderer = canvasRenderer;
    this.gridStateManager = gridStateManager;

    this.renderState = {
      getBaseValues: gridStateManager.getBaseValues,
      getBuildings: gridStateManager.getBuildings,
      getCursorAction: this.getCursorAction,
      getSelectedBlueprint: this.getSelectedBlueprint,
      isTileOccupied: gridStateManager.isTileOccupied,
    };

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);
    canvas.addEventListener('mouseup', this.handleMouseUp);

    const resizeObserver = new ResizeObserver(() => this.canvasSizeUpdated());
    resizeObserver.observe(canvas);

    //No rightclick menu on the canvas
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    document.addEventListener('keydown', this.handleKeyDown);
  }

  public setCursorAction = (action: CursorAction) => {
    this.cursorAction = action;
  };
  public getCursorAction = () => {
    return this.cursorAction;
  };

  public getSelectedBlueprint = (): BuildingBlueprint | null => {
    if (!this.selectedBlueprints) {
      return null;
    }
    return this.selectedBlueprints[this.selectedArray];
  };

  public setSelectedBlueprints = (blueprints: BuildingBlueprint[]) => {
    this.deselectBlueprint();
    this.setCursorAction('placing');
    this.selectedBlueprints = blueprints;
    this.selectedArray = 0;
  };

  private deselectBlueprint = () => {
    this.selectedBlueprints = undefined;
    this.selectedArray = 0;
  };

  private handleMouseDown = (event: MouseEvent) => {
    if (event.button === 2) {
      //Right click
      if (this.getCursorAction() === 'placing') {
        this.setCursorAction('panning');
        this.deselectBlueprint();
        this.canvasRenderer.render(this.renderState);
      } else if (this.getCursorAction() === 'erasing') {
        this.setCursorAction('panning');
        this.canvasRenderer.stopDragging(this.renderState);
      }
    } else if (event.button === 0) {
      //Left click
      if (this.getCursorAction() === 'panning') {
        this.canvasRenderer.startPanning(event);
      } else if (this.getCursorAction() === 'erasing') {
        this.canvasRenderer.startDragging(event, this.renderState);
      }
    }
  };

  private canvasSizeUpdated() {
    this.canvasRenderer.updateCanvasSize(this.renderState);
  }

  private handleMouseMove = (event: MouseEvent) => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.handlePanning(event, this.renderState);
    } else {
      this.canvasRenderer.handleMouseMove(event, this.renderState);
    }
  };

  private handleMouseLeave = () => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.stopPanning();
    } else {
      this.canvasRenderer.handleMouseLeave(this.renderState);
    }
  };

  private handleMouseUp = (event: MouseEvent) => {
    if (event.button === 0) {
      //Left click
      this.canvasRenderer.stopPanning();
      if (this.cursorAction === 'erasing') {
        const erasedRect = this.canvasRenderer.stopDragging(this.renderState);
        if (erasedRect) {
          if (this.gridStateManager.eraseRect(erasedRect)) {
            this.canvasRenderer.render(this.renderState);
          }
        }
      } else if (this.cursorAction === 'placing') {
        this.canvasRenderer.stopPanning();
        const tile = this.canvasRenderer.getMouseCoords(event);
        if (tile) {
          const blueprint = this.getSelectedBlueprint();
          if (blueprint) {
            this.canvasRenderer.stopPanning();
            if (this.gridStateManager.tryPlaceBuilding(tile, blueprint)) {
              this.canvasRenderer.render(this.renderState);
            }
          }
        }
      }
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'r' || event.key === 'R') {
      this.rotateSelectedBlueprint();
    }
  };

  private rotateSelectedBlueprint = () => {
    if (this.selectedBlueprints && this.selectedBlueprints.length > 0) {
      this.selectedArray =
        (this.selectedArray + 1) % this.selectedBlueprints.length;
      this.canvasRenderer.render(this.renderState);
    }
  };
}

export default UIManager;
