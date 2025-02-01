import {
  BUILDING_BLUEPRINTS,
  getBlueprint,
  getRandomBuildingBlueprint,
} from '../utils/buildingBlueprints';
import { CanvasRenderer } from './CanvasRenderer';
import { GridState } from './GridState';

export class UIManager {
  private cursorAction: 'default' | 'panning' = 'default';
  private selectedBlueprintKey: keyof typeof BUILDING_BLUEPRINTS = 'GARDEN';

  private canvasRenderer: CanvasRenderer;
  private gridState: GridState;

  constructor(
    canvas: HTMLCanvasElement,
    canvasRenderer: CanvasRenderer,
    gridState: GridState
  ) {
    this.canvasRenderer = canvasRenderer;
    this.gridState = gridState;

    const resizeObserver = new ResizeObserver(() => {
      canvasRenderer.canvasSizeUpdated();
    });
    resizeObserver.observe(canvas);

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseup', this.handleMouseUp);

    const rotateButton = document.getElementById('rotate-btn');
    if (rotateButton) {
      rotateButton.addEventListener('click', () => {
        canvasRenderer.toggleGridRotation();
      });
    }
    const zoomInButton = document.getElementById('zoomin-btn');
    if (zoomInButton) {
      zoomInButton.addEventListener('click', () => {
        canvasRenderer.zoomIn();
      });
    }
    const zoomOutButton = document.getElementById('zoomout-btn');
    if (zoomOutButton) {
      zoomOutButton.addEventListener('click', () => {
        canvasRenderer.zoomOut();
      });
    }
    const panButton = document.getElementById('pan-btn');
    if (panButton) {
      panButton.addEventListener('click', () => {
        this.setCursorAction('panning');
      });
    }
    const defaultActionButton = document.getElementById('default-action-btn');
    if (defaultActionButton) {
      defaultActionButton.addEventListener('click', () => {
        this.setCursorAction('default');
      });
    }
  }

  public setCursorAction(action: 'default' | 'panning') {
    this.cursorAction = action;
  }
  public getCursorAction() {
    return this.cursorAction;
  }

  public getSelectedBlueprint() {
    return getBlueprint(this.selectedBlueprintKey);
  }

  public getSelectedBlueprintKey() {
    return this.selectedBlueprintKey;
  }

  public setSelectedBlueprintKey(
    blueprintKey: keyof typeof BUILDING_BLUEPRINTS
  ) {
    this.selectedBlueprintKey = blueprintKey;
  }

  private handleMouseDown = (event: MouseEvent) => {
    if (this.cursorAction === 'panning') {
      this.canvasRenderer.startPanning(event);
    } else {
      this.canvasRenderer.stopPanning();

      const tile = this.canvasRenderer.getTileUnderMouse(event);
      if (tile) {
        //this.gridState.placeBuilding(tile, getRandomBuildingBlueprint());
        this.gridState.placeBuilding(tile, BUILDING_BLUEPRINTS['STORAGEYARD']);
        //this.gridState.placeBuilding(tile, this.getSelectedBlueprint());
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
