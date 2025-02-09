import { BuildingBlueprint } from '../interfaces/BuildingBlueprint';
import RenderGetters from '../interfaces/RenderGetters';
import CanvasRenderer from './CanvasRenderer';
import GridStateManager from './GridStateManager';

export type CursorAction = 'placing' | 'panning' | 'erasing';

class UIManager {
  private cursorAction: CursorAction = 'panning';
  private selectedBlueprints?: BuildingBlueprint[];
  private selectedArray: number = 0;

  private canvasRenderer: CanvasRenderer;
  private gridStateManager: GridStateManager;

  public renderGetters: RenderGetters;

  constructor(
    canvas: HTMLCanvasElement,
    canvasRenderer: CanvasRenderer,
    gridStateManager: GridStateManager
  ) {
    this.canvasRenderer = canvasRenderer;
    this.gridStateManager = gridStateManager;

    this.renderGetters = {
      getBaseValues: gridStateManager.getBaseValues,
      getBuildings: gridStateManager.getBuildings,
      getCursorAction: this.getCursorAction,
      getSelectedBlueprint: this.getSelectedBlueprint,
    };

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
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
    this.setCursorAction('panning');
  };

  private handleMouseDown = (event: MouseEvent) => {
    if (event.buttons === 2) {
      //Right click
      this.deselectBlueprint();
    } else if (event.buttons === 1) {
      //Left click
      if (this.cursorAction === 'panning') {
        this.canvasRenderer.startPanning(event);
      } else if (this.cursorAction === 'erasing') {
        this.canvasRenderer.startDragging(event, this.renderGetters);
      } else {
        this.canvasRenderer.stopPanning();

        const tile = this.canvasRenderer.getMouseCoords(event);
        if (tile) {
          const blueprint = this.getSelectedBlueprint();
          if (blueprint) {
            this.canvasRenderer.stopPanning();
            if (this.gridStateManager.tryPlaceBuilding(tile, blueprint)) {
              this.canvasRenderer.render(this.renderGetters);
            }
          }
          console.log(`Clicked tile: x=${tile.x}, y=${tile.y}`);
        } else {
          console.log('Clicked outside the grid');
        }
      }
    }
  };

  private canvasSizeUpdated() {
    this.canvasRenderer.updateCanvasSize(this.renderGetters);
  }

  private handleMouseMove = (event: MouseEvent) => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.handlePanning(event, this.renderGetters);
    } else if (this.cursorAction === 'erasing') {
      this.canvasRenderer.handleDragging(event, this.renderGetters);
    }
  };

  private handleMouseUp = () => {
    this.canvasRenderer.stopPanning();
    if (this.cursorAction === 'erasing') {
      const erasedRect = this.canvasRenderer.stopDragging(this.renderGetters);
      if (erasedRect) {
        if (this.gridStateManager.eraseRect(erasedRect)) {
          this.canvasRenderer.render(this.renderGetters);
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
    console.log(this.selectedBlueprints);
    if (this.selectedBlueprints && this.selectedBlueprints.length > 0) {
      this.selectedArray =
        (this.selectedArray + 1) % this.selectedBlueprints.length;
    }
  };
}

export default UIManager;
