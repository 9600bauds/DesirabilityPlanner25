import RenderContext from '../interfaces/RenderContext';
import colors, { desirabilityColor } from '../utils/colors';
import {
  gridPixelCenter,
  gridPixelSize,
  gridSize,
  rotationAngle,
  coordToPx,
  pxToCoord,
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

type DirtyArea = 'tiles' | 'text' | 'grid-lines';

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
  private isDirty: boolean = false;
  private dirtyAreas: Set<DirtyArea> = new Set();
  private pendingFrame: number | null = null;
  private currentContext: RenderContext | null = null;

  // Building rendering
  private transparentBuildings: boolean = false;

  // Text rendering zoom threshold
  private readonly TEXT_ZOOM_THRESHOLD = 0.5;

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
    this.gridLinesCanvas = this.createCanvas('grid-lines-canvas', 2);
    this.textCanvas = this.createCanvas('text-canvas', 3);

    // Get canvas contexts
    this.tilesCtx = this.getContext(this.tilesCanvas);
    this.gridLinesCtx = this.getContext(this.gridLinesCanvas);
    this.textCtx = this.getContext(this.textCanvas);

    // Set initial background colors
    this.tilesCtx.fillStyle = '#EEEEEE';
    this.tilesCtx.fillRect(0, 0, this.clientWidth, this.clientHeight);

    // Center view
    this.centerViewAt({ x: gridPixelCenter, y: gridPixelCenter });

    // Mark all areas as dirty for initial render
    this.markDirty('grid-lines');
    this.markDirty('tiles');
    this.markDirty('text');

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

  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d', {
      alpha: canvas.id === 'tiles-canvas' ? false : true,
      desynchronized: true,
    });

    if (!ctx) {
      throw new Error(`Could not get 2D context for ${canvas.id}`);
    }

    // Apply device pixel ratio scaling for crisp rendering
    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);

    return ctx;
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

    if (this.isDirty && this.currentContext) {
      console.time('render-frame');

      // Apply canvas transforms before drawing
      this.applyCanvasTransforms();

      // Update areas that need updating
      if (this.dirtyAreas.has('grid-lines')) {
        this.drawGridLines();
      }

      if (this.dirtyAreas.has('tiles')) {
        this.updateTiles(this.currentContext);
      }

      if (this.dirtyAreas.has('text')) {
        this.updateText(this.currentContext);
      }

      // Clear dirty state
      this.isDirty = false;
      this.dirtyAreas.clear();

      console.timeEnd('render-frame');
    }

    // Always schedule the next frame
    this.scheduleRender();
  }

  private markDirty(area: DirtyArea): void {
    this.isDirty = true;
    this.dirtyAreas.add(area);
  }

  /*
   * Apply transforms directly to each canvas
   */
  private applyCanvasTransforms(): void {
    // Reset transforms
    [this.tilesCtx, this.gridLinesCtx, this.textCtx].forEach((ctx) => {
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

    // Mark all layers as dirty since transforms changed
    this.markDirty('grid-lines');
    this.markDirty('tiles');
    this.markDirty('text');
  }

  /*
   * Grid drawing methods
   */

  private drawGridLines() {
    const ctx = this.gridLinesCtx;

    // Clear context
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    // Set up line style
    ctx.strokeStyle = colors.strongOutlineBlack;
    ctx.lineWidth = 0.5;

    // Calculate visible grid area for optimization
    const visibleArea = this.getVisibleGridArea();
    const cellSize = coordToPx(1);

    // Draw grid lines only in visible area (plus padding)
    const startX = Math.floor(visibleArea.startX / cellSize) * cellSize;
    const endX = Math.ceil(visibleArea.endX / cellSize) * cellSize;
    const startY = Math.floor(visibleArea.startY / cellSize) * cellSize;
    const endY = Math.ceil(visibleArea.endY / cellSize) * cellSize;

    // Vertical lines
    for (let x = startX; x <= endX; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  /**
   * Get the visible area in grid coordinates
   */
  private getVisibleGridArea(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } {
    // Add padding to ensure all visible content is rendered
    const padding = coordToPx(5);

    // Convert screen coordinates to grid coordinates
    return {
      startX: -padding,
      startY: -padding,
      endX: gridPixelSize + padding,
      endY: gridPixelSize + padding,
    };
  }

  /**
   * Update the tiles canvas with current grid values
   */
  private updateTiles(context: RenderContext) {
    const ctx = this.tilesCtx;

    // Clear context
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    // Fill with background color
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(0, 0, gridPixelSize, gridPixelSize);

    // Get visible tile range
    const viewport = this.getVisibleTileRange();
    const cellSize = coordToPx(1);

    // Get base values and prepare variables
    const baseValues = context.getBaseValues();
    const buildingsBeingAdded: Set<PlacedBuilding> = new Set();
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
    };

    // Draw colored tiles in the visible area
    for (let x = viewport.startX; x <= viewport.endX; x++) {
      for (let y = viewport.startY; y <= viewport.endY; y++) {
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

        const tile = new Tile(x, y);
        const desirabilityValue = getAdjustedDesirability(tile);

        // Store value for text rendering
        this.oldGridValues[x][y] = desirabilityValue;

        // Skip drawing empty tiles (they're already the background color)
        if (desirabilityValue === 0) continue;

        // Set fill color and draw rectangle
        ctx.fillStyle = desirabilityColor(desirabilityValue);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  /**
   * Draw text labels for the tile values when zoomed in enough
   */
  private updateText(context: RenderContext) {
    const ctx = this.textCtx;

    // Handle text visibility based on zoom level
    if (this.zoomLevel < this.TEXT_ZOOM_THRESHOLD) {
      // If zoomed out too far, just clear text canvas and return
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
      return;
    }

    // Clear context
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    // Get visible range of tiles
    const viewport = this.getVisibleTileRange();
    const cellSize = coordToPx(1);

    // Set up text styling
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';

    // Draw text only for visible non-zero tiles
    for (let x = viewport.startX; x <= viewport.endX; x++) {
      for (let y = viewport.startY; y <= viewport.endY; y++) {
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

        const value = this.oldGridValues[x][y];
        if (value === 0) continue;

        // Draw the text
        ctx.fillText(
          value.toString(),
          coordToPx(x) + cellSize / 2,
          coordToPx(y) + cellSize / 2
        );
      }
    }
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
    const padding = 5;
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
    this.markDirty('tiles');
    this.markDirty('text');
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
    this.markDirty('grid-lines');
    this.markDirty('tiles');
    this.markDirty('text');
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
    this.markDirty('grid-lines');
    this.markDirty('tiles');
    this.markDirty('text');
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
    this.markDirty('grid-lines');
    this.markDirty('tiles');
    this.markDirty('text');
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
    this.markDirty('grid-lines');
    this.markDirty('tiles');
    this.markDirty('text');
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
    this.markDirty('tiles');
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
    this.markDirty('tiles');

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
        this.markDirty('tiles');
      }
    } else if (cursorAction === 'placing') {
      // Store context and mark areas as dirty
      this.currentContext = context;
      this.markDirty('tiles');
    }
  }

  public handleMouseLeave(context: RenderContext) {
    this.lastMouseoverTile = undefined;

    // Store context and mark areas as dirty
    this.currentContext = context;
    this.markDirty('tiles');
  }

  // Building transparency
  public setBuildingTransparency(
    newSetting: boolean,
    context: RenderContext
  ): void {
    this.transparentBuildings = newSetting;

    // Store context and mark areas as dirty
    this.currentContext = context;
    this.markDirty('tiles');
  }

  // Building rendering - to be implemented in Phase 3
  public drawBuilding(building: PlacedBuilding) {
    // TODO: Implement in Phase 3
  }
}

export default CanvasRenderer;
