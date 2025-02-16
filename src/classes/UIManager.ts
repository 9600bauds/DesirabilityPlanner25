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

  public renderContext: RenderContext;

  constructor(
    canvas: HTMLCanvasElement,
    canvasRenderer: CanvasRenderer,
    gridStateManager: GridStateManager
  ) {
    this.canvasRenderer = canvasRenderer;
    this.gridStateManager = gridStateManager;

    this.renderContext = {
      getBaseValues: gridStateManager.getBaseValues,
      getBuildings: gridStateManager.getBuildings,
      getCursorAction: this.getCursorAction,
      getSelectedBlueprint: this.getSelectedBlueprint,
      isTileOccupied: gridStateManager.isTileOccupied,
    };

    //Do the initial render here since the canvas renderer can't do it until it has the context
    this.canvasRenderer.render(this.renderContext);

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
    document.addEventListener('keyup', this.handleKeyUp);
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
        this.canvasRenderer.render(this.renderContext);
      } else if (this.getCursorAction() === 'erasing') {
        this.setCursorAction('panning');
        this.canvasRenderer.stopDragging(this.renderContext);
      }
    } else if (event.button === 0) {
      //Left click
      if (this.getCursorAction() === 'panning') {
        this.canvasRenderer.startPanning(event);
      } else if (this.getCursorAction() === 'erasing') {
        this.canvasRenderer.startDragging(event, this.renderContext);
      }
    }
  };

  private canvasSizeUpdated() {
    this.canvasRenderer.updateCanvasSize();
  }

  private handleMouseMove = (event: MouseEvent) => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.handlePanning(event);
    } else {
      this.canvasRenderer.handleMouseMove(event, this.renderContext);
    }
  };

  private handleMouseLeave = () => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.stopPanning();
    } else {
      this.canvasRenderer.handleMouseLeave(this.renderContext);
    }
  };

  private handleMouseUp = (event: MouseEvent) => {
    if (event.button === 0) {
      //Left click
      this.canvasRenderer.stopPanning();
      if (this.cursorAction === 'erasing') {
        const erasedRect = this.canvasRenderer.stopDragging(this.renderContext);
        if (erasedRect) {
          if (this.gridStateManager.eraseRect(erasedRect)) {
            this.canvasRenderer.render(this.renderContext);
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
              this.canvasRenderer.render(this.renderContext);
            }
          }
        }
      }
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'r' || event.key === 'R') {
      this.rotateSelectedBlueprint();
    } else if (event.key === 'Control' && !event.repeat) {
      this.canvasRenderer.setBuildingTransparency(true, this.renderContext);
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Control') {
      this.canvasRenderer.setBuildingTransparency(false, this.renderContext);
    }
  };

  private rotateSelectedBlueprint = () => {
    if (this.selectedBlueprints && this.selectedBlueprints.length > 0) {
      this.selectedArray =
        (this.selectedArray + 1) % this.selectedBlueprints.length;
      this.canvasRenderer.render(this.renderContext);
    }
  };
}

export default UIManager;
