import RenderContext from '../interfaces/RenderContext';
import colors, { desirabilityColor } from '../utils/colors';
import {
  gridPixelCenter,
  gridPixelSize,
  gridSize,
  rotationAngle,
  coordToPx,
  pxToCoord,
  canvasTilePx,
} from '../utils/constants';
import {
  Tile,
  Rectangle,
  degreesToRads,
  getEmptyArray,
} from '../utils/geometry';
import PlacedBuilding from './PlacedBuilding';

interface GridPoint {
  x: number;
  y: number;
}

class CanvasRenderer {
  // DOM elements
  private parentContainer: HTMLDivElement;

  // Canvas elements
  private tilesCanvas: HTMLCanvasElement;
  private gridLinesCanvas: HTMLCanvasElement;
  private textCanvas: HTMLCanvasElement;

  // Canvas contexts
  private tilesCtx: CanvasRenderingContext2D;
  private gridLinesCtx: CanvasRenderingContext2D;
  private textCtx: CanvasRenderingContext2D;

  // Grid state
  private oldGridValues = getEmptyArray(0) as number[][];

  // Transform state
  private currentRotation: number = 0;
  private zoomLevel: number = 1.0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  // Mouse state
  private isPanning: boolean = false;
  private lastPanCursorX: number = 0;
  private lastPanCursorY: number = 0;
  private lastMouseoverTile?: Tile;

  // Dragging state
  private isDragging: boolean = false;
  private dragStartTile?: Tile;
  private dragBox?: Rectangle;

  // Rendering system
  private tilesNeedUpdating = false;
  private pendingFrame: number | null = null;
  private currentContext: RenderContext | null = null;

  // Building rendering
  private transparentBuildings: boolean = false;

  // Text rendering zoom threshold
  private readonly TEXT_ZOOM_THRESHOLD = 0.6;

  // Size variables
  private clientWidth: number;
  private clientHeight: number;
  private devicePixelRatio: number;

  get viewCenter(): DOMPoint {
    return new DOMPoint(this.clientWidth / 2, this.clientHeight / 2);
  }

  constructor(parentContainer: HTMLDivElement) {
    this.parentContainer = parentContainer;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Store dimensions
    this.clientWidth = parentContainer.clientWidth;
    this.clientHeight = parentContainer.clientHeight;

    // Create canvas elements - all sized to fit the viewport
    this.tilesCanvas = this.createCanvas('tiles-canvas', 1);
    this.tilesCtx = this.tilesCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      imageSmoothingEnabled: false,
    }) as CanvasRenderingContext2D;

    // Center view
    this.centerViewAt({ x: gridPixelCenter, y: gridPixelCenter });

    this.tilesNeedUpdating = true;

    // Start animation loop
    this.scheduleRender();
  }

  private createCanvas(id: string, zIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.id = id;

    // Size canvas to match the viewport (not the grid)
    canvas.width = this.clientWidth * this.devicePixelRatio;
    canvas.height = this.clientHeight * this.devicePixelRatio;

    // Set display size via CSS
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = this.clientWidth + 'px';
    canvas.style.height = this.clientHeight + 'px';
    canvas.style.zIndex = zIndex.toString();
    canvas.style.pointerEvents = 'none';

    this.parentContainer.appendChild(canvas);
    return canvas;
  }

  /*
   * Render loop and change detection
   */

  private scheduleRender(): void {
    if (!this.pendingFrame) {
      this.pendingFrame = requestAnimationFrame(this.renderFrame.bind(this));
    }
  }

  private renderFrame(): void {
    this.pendingFrame = null;

    if (this.tilesNeedUpdating && this.currentContext) {
      let startTime = performance.now();

      // Apply canvas transforms before drawing
      this.applyCanvasTransforms();

      const transformTime = performance.now() - startTime;
      if (transformTime > 5) {
        //prettier-ignore
        console.log("transformation took", transformTime, "ms!");
      }
      startTime = performance.now();

      if (this.tilesNeedUpdating) {
        this.updateTiles(this.currentContext);
      }

      const tilesRendering = performance.now() - startTime;
      if (tilesRendering > 5) {
        //prettier-ignore
        console.log("tile rendering took", tilesRendering, "ms!");
      }
      startTime = performance.now();
    }

    // Always schedule the next frame
    this.scheduleRender();
  }

  /*
   * Apply transforms directly to each canvas
   */
  private applyCanvasTransforms(): void {
    // Reset transforms
    [this.tilesCtx].forEach((ctx) => {
      // Start with device pixel ratio scaling
      ctx.setTransform(
        this.devicePixelRatio,
        0,
        0,
        this.devicePixelRatio,
        0,
        0
      );

      // Apply our transformations
      ctx.translate(this.offsetX, this.offsetY);
      ctx.rotate(degreesToRads(this.currentRotation));
      ctx.scale(this.zoomLevel, this.zoomLevel);
    });
  }

  /*
   * Coordinate transformations
   */

  private grid2canvas(point: GridPoint): DOMPoint {
    const cos = Math.cos(degreesToRads(this.currentRotation));
    const sin = Math.sin(degreesToRads(this.currentRotation));

    return new DOMPoint(
      (point.x * cos - point.y * sin) * this.zoomLevel + this.offsetX,
      (point.x * sin + point.y * cos) * this.zoomLevel + this.offsetY
    );
  }

  private canvas2grid(point: DOMPoint): GridPoint {
    const xUnscaled = (point.x - this.offsetX) / this.zoomLevel;
    const yUnscaled = (point.y - this.offsetY) / this.zoomLevel;
    const cos = Math.cos(degreesToRads(this.currentRotation));
    const sin = Math.sin(degreesToRads(this.currentRotation));

    return {
      x: xUnscaled * cos + yUnscaled * sin,
      y: -xUnscaled * sin + yUnscaled * cos,
    };
  }

  /*
   * View transformation methods
   */

  private centerViewAt(point: GridPoint) {
    const center = this.viewCenter;
    this.offsetX = center.x - point.x * this.zoomLevel;
    this.offsetY = center.y - point.y * this.zoomLevel;

    this.tilesNeedUpdating = true;
  }

  /**
   * Update the tiles canvas with current grid values
   */
  private updateTiles(context: RenderContext) {
    const ctx = this.tilesCtx;

    /*// Clear context
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();*/

    // Fill with background color
    /*ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(0, 0, gridPixelSize, gridPixelSize);*/

    // Get visible tile range
    const viewport = this.getVisibleTileRange();

    // Get base values and prepare variables
    const baseValues = context.getBaseValues();
    /*const buildingsBeingAdded: Set<PlacedBuilding> = new Set();
    const buildingsBeingRemoved: Set<PlacedBuilding> = new Set();

    // Handle preview for placement or erasing
    const cursorAction = context.getCursorAction();
    if (cursorAction === 'placing') {
      if (this.lastMouseoverTile) {
        const selectedBlueprint = context.getSelectedBlueprint();
        if (selectedBlueprint) {
          const virtualBuilding = new PlacedBuilding(
            this.lastMouseoverTile,
            selectedBlueprint
          );
          buildingsBeingAdded.add(virtualBuilding);
        }
      }
    } else if (cursorAction === 'erasing' && this.isDragging && this.dragBox) {
      for (const building of context.getBuildings()) {
        if (building.interceptsRectangle(this.dragBox)) {
          buildingsBeingRemoved.add(building);
        }
      }
    }

    // Helper function for calculating adjusted desirability
    const getAdjustedDesirability = (tile: Tile) => {
      let desirabilityForThisTile = baseValues[tile.x][tile.y];

      // Add effects from buildings being added (preview)
      if (buildingsBeingAdded.size > 0) {
        for (const building of buildingsBeingAdded) {
          desirabilityForThisTile += building.getDesirabilityEffect(tile);
        }
      }

      // Subtract effects from buildings being removed (preview)
      if (buildingsBeingRemoved.size > 0) {
        for (const building of buildingsBeingRemoved) {
          desirabilityForThisTile -= building.getDesirabilityEffect(tile);
        }
      }

      return desirabilityForThisTile;
    };*/

    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';

    // Draw colored tiles in the visible area
    for (let x = viewport.startX; x <= viewport.endX; x++) {
      for (let y = viewport.startY; y <= viewport.endY; y++) {
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

        const tile = new Tile(x, y);
        //const desirabilityValue = getAdjustedDesirability(tile);
        const desirabilityValue = baseValues[tile.x][tile.y];

        // Set fill color and draw rectangle
        ctx.fillStyle = 'black';
        ctx.fillRect(
          x * canvasTilePx,
          y * canvasTilePx,
          canvasTilePx,
          canvasTilePx
        );

        ctx.fillStyle = desirabilityColor(desirabilityValue);
        ctx.fillRect(
          x * canvasTilePx + 1,
          y * canvasTilePx + 1,
          canvasTilePx - 1,
          canvasTilePx - 1
        );
      }
    }
    if (this.zoomLevel > this.TEXT_ZOOM_THRESHOLD) {
      ctx.fillStyle = 'white';
      for (let x = viewport.startX; x <= viewport.endX; x++) {
        for (let y = viewport.startY; y <= viewport.endY; y++) {
          if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

          const tile = new Tile(x, y);
          //const desirabilityValue = getAdjustedDesirability(tile);
          const desirabilityValue = baseValues[tile.x][tile.y];

          if (desirabilityValue === 0) continue;

          ctx.fillText(
            desirabilityValue.toString(),
            coordToPx(x) + canvasTilePx / 2,
            coordToPx(y) + canvasTilePx / 2
          );
        }
      }
    }

    this.tilesNeedUpdating = false;
  }

  /**
   * Get the range of tiles currently visible in the viewport
   */
  private getVisibleTileRange(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } {
    // Convert viewport corners to grid coordinates
    const topLeft = this.canvas2grid(new DOMPoint(0, 0));
    const bottomRight = this.canvas2grid(
      new DOMPoint(this.clientWidth, this.clientHeight)
    );

    // Calculate tile range with padding
    const padding = 1;
    const startX = Math.max(0, Math.floor(pxToCoord(topLeft.x)) - padding);
    const startY = Math.max(0, Math.floor(pxToCoord(topLeft.y)) - padding);
    const endX = Math.min(
      gridSize - 1,
      Math.ceil(pxToCoord(bottomRight.x)) + padding
    );
    const endY = Math.min(
      gridSize - 1,
      Math.ceil(pxToCoord(bottomRight.y)) + padding
    );

    return { startX, startY, endX, endY };
  }

  /*
   * Public API methods
   */

  // Main render method
  public render(context: RenderContext) {
    this.currentContext = context;
    this.tilesNeedUpdating = true;
  }

  // Size handling
  public canvasSizeUpdated() {
    this.clientWidth = this.parentContainer.clientWidth;
    this.clientHeight = this.parentContainer.clientHeight;

    // Resize all canvases
    [this.tilesCanvas, this.gridLinesCanvas, this.textCanvas].forEach(
      (canvas) => {
        canvas.width = this.clientWidth * this.devicePixelRatio;
        canvas.height = this.clientHeight * this.devicePixelRatio;
        canvas.style.width = this.clientWidth + 'px';
        canvas.style.height = this.clientHeight + 'px';
      }
    );

    // Mark all areas as dirty
    this.tilesNeedUpdating = true; //NOTE: nuke all old values here!!
  }

  // View transformations
  public toggleGridRotation(context: RenderContext): void {
    const oldCenter = this.canvas2grid(this.viewCenter);

    if (this.currentRotation === 0) {
      this.currentRotation = rotationAngle;
    } else {
      this.currentRotation = 0;
    }

    // Recenter view
    this.centerViewAt(oldCenter);

    // Store context and mark all areas as dirty
    this.currentContext = context;
    this.tilesNeedUpdating = true; //NOTE: nuke all old values here!!
  }

  public zoomIn() {
    this.zoom(1.2);
  }

  public zoomOut() {
    this.zoom(1 / 1.2);
  }

  private zoom(factor: number) {
    const oldCenter = this.canvas2grid(this.viewCenter);
    this.zoomLevel *= factor;

    // Recenter view
    this.centerViewAt(oldCenter);

    // Mark layers for redraw
    this.tilesNeedUpdating = true; //NOTE: nuke all old values here!!
  }

  // Panning methods
  public startPanning(event: MouseEvent) {
    this.isPanning = true;
    this.lastPanCursorX = event.clientX;
    this.lastPanCursorY = event.clientY;
    this.parentContainer.style.cursor = 'grabbing';
  }

  public handlePanning(event: MouseEvent) {
    if (!this.isPanning) return;

    const deltaX = event.clientX - this.lastPanCursorX;
    const deltaY = event.clientY - this.lastPanCursorY;

    this.offsetX += deltaX;
    this.offsetY += deltaY;

    this.lastPanCursorX = event.clientX;
    this.lastPanCursorY = event.clientY;

    // Mark for redraw
    this.tilesNeedUpdating = true; //we don't need to nuke the old values here
  }

  public stopPanning() {
    this.isPanning = false;
    this.parentContainer.style.cursor = 'grab';
  }

  // Tile coordinate methods
  private pointToTile(point: DOMPoint): Tile | undefined {
    const gridPt = this.canvas2grid(point);

    // Convert to tile coordinates
    const tileX = pxToCoord(gridPt.x);
    const tileY = pxToCoord(gridPt.y);

    // Check if the tile is within grid bounds
    if (tileX >= 0 && tileX < gridSize && tileY >= 0 && tileY < gridSize) {
      return new Tile(tileX, tileY);
    }

    return undefined;
  }

  public getMouseCoords(event: MouseEvent): Tile | undefined {
    return this.pointToTile(new DOMPoint(event.clientX, event.clientY));
  }

  // Drag handling
  public startDragging(event: MouseEvent, context: RenderContext) {
    const thisTile = this.getMouseCoords(event);
    if (!thisTile) return;

    this.isDragging = true;
    this.dragStartTile = thisTile;
    this.updateDragBox(thisTile);

    // Store context and mark areas as dirty
    this.currentContext = context;
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer
  }

  private updateDragBox(newPos: Tile | undefined) {
    if (this.dragStartTile && newPos) {
      this.dragBox = Rectangle.fromTiles(this.dragStartTile, newPos);
    }
  }

  public stopDragging(context: RenderContext) {
    if (!this.isDragging) return;

    const returnBox = this.dragBox;
    this.isDragging = false;

    // Store context and mark areas as dirty
    this.currentContext = context;
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer

    return returnBox;
  }

  // Mouse handling
  public handleMouseMove(event: MouseEvent, context: RenderContext) {
    const previousTile = this.lastMouseoverTile;
    const thisTile = this.getMouseCoords(event);
    this.lastMouseoverTile = thisTile;

    if (
      (thisTile && previousTile && thisTile.equals(previousTile)) ||
      (!thisTile && !previousTile)
    ) {
      return;
    }

    const cursorAction = context.getCursorAction();

    if (this.isDragging) {
      if (event.buttons !== 1) {
        this.stopDragging(context);
      } else {
        this.updateDragBox(thisTile);
        // Store context and mark areas as dirty
        this.currentContext = context;
        this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer
      }
    } else if (cursorAction === 'placing') {
      // Store context and mark areas as dirty
      this.currentContext = context;
      this.tilesNeedUpdating = true; //old values are... we'll figure this out later
    }
  }

  public handleMouseLeave(context: RenderContext) {
    this.lastMouseoverTile = undefined;

    // Store context and mark areas as dirty
    this.currentContext = context;
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here?
  }

  // Building transparency
  public setBuildingTransparency(
    newSetting: boolean,
    context: RenderContext
  ): void {
    this.transparentBuildings = newSetting;

    // Store context and mark areas as dirty
    this.currentContext = context;
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer
  }

  // Building rendering - to be implemented in Phase 3
  public drawBuilding(building: PlacedBuilding) {
    // TODO: Implement in Phase 3
  }
}

export default CanvasRenderer;
