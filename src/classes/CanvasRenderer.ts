import RenderContext from '../interfaces/RenderContext';
import Viewport from '../interfaces/Viewport';
import colors, { getDesirabilityRGB } from '../utils/colors';
import {
  GRID_CENTER_PX,
  GRID_TOTAL_PX,
  GRID_SIZE,
  ROTATION_ANGLE,
  COORD_TO_PX,
  PX_TO_COORD,
  CELL_PX,
  COORD_TO_INT16,
} from '../utils/constants';
import { Tile, Rectangle, degreesToRads } from '../utils/geometry';
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
  private tilesCtx: CanvasRenderingContext2D;

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
  private renderContext: RenderContext;

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

  constructor(parentContainer: HTMLDivElement, renderContext: RenderContext) {
    this.parentContainer = parentContainer;
    this.renderContext = renderContext;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Store dimensions
    this.clientWidth = parentContainer.clientWidth;
    this.clientHeight = parentContainer.clientHeight;

    // Create canvas elements - all sized to fit the viewport
    this.tilesCanvas = this.createCanvas('tiles-canvas', 1);
    this.tilesCtx = this.tilesCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    }) as CanvasRenderingContext2D;

    // Center view
    this.centerViewAt({ x: GRID_CENTER_PX, y: GRID_CENTER_PX });

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

    if (this.tilesNeedUpdating) {
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
        this.updateTiles();
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
  private updateTiles() {
    // Get visible tile range. We only need to update the stuff within visible range. We don't even need to clear the previous frame since there's no transparency anywhere.
    const viewport = this.getVisibleTileRange();
    if (viewport.height < 1 || viewport.width < 1) {
      return; //We are fully offscreen!
    }

    //This beauty stores all the precomputed desirability values.
    const baseValues = this.renderContext.getBaseValues();

    /*
     * DRAW THE COLORED CELLS
     */
    // We make use of a temporary canvas here. We draw each tile as 1 pixel big. Then we expand it to cover the entire canvas.
    // This is more efficient, but we need this ugly temporary canvas to do it, because bitmap creation is asynchronous and I don't want to deal with that.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    const imageData = tempCtx.createImageData(viewport.width, viewport.height);

    // Fill the image with cell colors - one pixel per cell
    let idx = 0;
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        const rgb = getDesirabilityRGB(baseValues[COORD_TO_INT16(x, y)]);
        imageData.data[idx++] = rgb.r;
        imageData.data[idx++] = rgb.g;
        imageData.data[idx++] = rgb.b;
        imageData.data[idx++] = 255; //We don't use alpha but still need to assign it
      }
    }

    // Put the image data on the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
    // Draw the scaled image
    this.tilesCtx.imageSmoothingEnabled = false;
    this.tilesCtx.drawImage(
      tempCanvas,
      0,
      0,
      viewport.width,
      viewport.height,
      COORD_TO_PX(viewport.startX),
      COORD_TO_PX(viewport.startY),
      COORD_TO_PX(viewport.width),
      COORD_TO_PX(viewport.height)
    );

    /*
     * DRAW THE BLACK GRIDLINES
     */
    this.tilesCtx.lineWidth = 1;
    this.tilesCtx.strokeStyle = colors.pureBlack;
    // Batch all line drawing into a single path
    this.tilesCtx.beginPath();
    // Path the horizontal lines
    for (let y = viewport.startY; y <= viewport.endY; y++) {
      this.tilesCtx.moveTo(COORD_TO_PX(viewport.startX), COORD_TO_PX(y));
      this.tilesCtx.lineTo(COORD_TO_PX(viewport.endX), COORD_TO_PX(y));
    }
    // Path the vertical lines
    for (let x = viewport.startX; x <= viewport.endX; x++) {
      this.tilesCtx.moveTo(COORD_TO_PX(x), COORD_TO_PX(viewport.startY));
      this.tilesCtx.lineTo(COORD_TO_PX(x), COORD_TO_PX(viewport.endY));
    }
    // Execute the path!
    this.tilesCtx.stroke();

    /*
     * DRAW THE TEXT LABELS (most of the performance hit is from here!)
     */
    if (this.zoomLevel > this.TEXT_ZOOM_THRESHOLD) {
      this.tilesCtx.font = '10px Arial';
      this.tilesCtx.textAlign = 'center';
      this.tilesCtx.textBaseline = 'middle';
      this.tilesCtx.fillStyle = 'white';
      this.tilesCtx.fillStyle = 'white';
      for (let x = viewport.startX; x < viewport.endX; x++) {
        for (let y = viewport.startY; y < viewport.endY; y++) {
          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;

          const tile = new Tile(x, y);
          const desirabilityValue = baseValues[COORD_TO_INT16(tile.x, tile.y)];

          if (desirabilityValue === 0) continue;

          this.tilesCtx.fillText(
            desirabilityValue.toString(),
            COORD_TO_PX(x) + CELL_PX / 2,
            COORD_TO_PX(y) + CELL_PX / 2
          );
        }
      }
    }

    this.tilesNeedUpdating = false;
  }
  /**
   * Get the range of tiles currently visible in the viewport
   */
  private getVisibleTileRange(): Viewport {
    // Convert viewport corners to grid coordinates
    const topLeft = this.canvas2grid(new DOMPoint(0, 0));
    const bottomRight = this.canvas2grid(
      new DOMPoint(this.clientWidth, this.clientHeight)
    );

    // Calculate tile range with padding
    const padding = 1;
    const startX = Math.max(0, PX_TO_COORD(topLeft.x) - padding);
    const startY = Math.max(0, PX_TO_COORD(topLeft.y) - padding);
    const endX = Math.min(
      GRID_SIZE - 1,
      PX_TO_COORD(bottomRight.x) + 1 + padding
    );
    const endY = Math.min(
      GRID_SIZE - 1,
      PX_TO_COORD(bottomRight.y) + 1 + padding
    );

    return {
      startX,
      startY,
      endX,
      endY,
      width: endX - startX,
      height: endY - startY,
    };
  }

  /*
   * Public API methods
   */

  // Main render method
  public render() {
    this.tilesNeedUpdating = true;
  }

  // Size handling
  public canvasSizeUpdated() {
    this.clientWidth = this.parentContainer.clientWidth;
    this.clientHeight = this.parentContainer.clientHeight;

    // Resize all canvases
    [this.tilesCanvas].forEach((canvas) => {
      canvas.width = this.clientWidth * this.devicePixelRatio;
      canvas.height = this.clientHeight * this.devicePixelRatio;
      canvas.style.width = this.clientWidth + 'px';
      canvas.style.height = this.clientHeight + 'px';
    });

    // Mark all areas as dirty
    this.tilesNeedUpdating = true; //NOTE: nuke all old values here!!
  }

  // View transformations
  public toggleGridRotation(): void {
    const oldCenter = this.canvas2grid(this.viewCenter);

    if (this.currentRotation === 0) {
      this.currentRotation = ROTATION_ANGLE;
    } else {
      this.currentRotation = 0;
    }

    // Recenter view
    this.centerViewAt(oldCenter);

    // Store context and mark all areas as dirty
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
    const tileX = PX_TO_COORD(gridPt.x);
    const tileY = PX_TO_COORD(gridPt.y);

    // Check if the tile is within grid bounds
    if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
      return new Tile(tileX, tileY);
    }

    return undefined;
  }

  public getMouseCoords(event: MouseEvent): Tile | undefined {
    return this.pointToTile(new DOMPoint(event.clientX, event.clientY));
  }

  // Drag handling
  public startDragging(event: MouseEvent) {
    const thisTile = this.getMouseCoords(event);
    if (!thisTile) return;

    this.isDragging = true;
    this.dragStartTile = thisTile;
    this.updateDragBox(thisTile);

    // Store context and mark areas as dirty
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer
  }

  private updateDragBox(newPos: Tile | undefined) {
    if (this.dragStartTile && newPos) {
      this.dragBox = Rectangle.fromTiles(this.dragStartTile, newPos);
    }
  }

  public stopDragging() {
    if (!this.isDragging) return;

    const returnBox = this.dragBox;
    this.isDragging = false;

    // Store context and mark areas as dirty
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer

    return returnBox;
  }

  // Mouse handling
  public handleMouseMove(event: MouseEvent) {
    const previousTile = this.lastMouseoverTile;
    const thisTile = this.getMouseCoords(event);
    this.lastMouseoverTile = thisTile;

    if (
      (thisTile && previousTile && thisTile.equals(previousTile)) ||
      (!thisTile && !previousTile)
    ) {
      return;
    }

    const cursorAction = this.renderContext.getCursorAction();

    if (this.isDragging) {
      if (event.buttons !== 1) {
        this.stopDragging();
      } else {
        this.updateDragBox(thisTile);
        // Store context and mark areas as dirty
        this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer
      }
    } else if (cursorAction === 'placing') {
      // Store context and mark areas as dirty
      this.tilesNeedUpdating = true; //old values are... we'll figure this out later
    }
  }

  public handleMouseLeave() {
    this.lastMouseoverTile = undefined;

    // Store context and mark areas as dirty
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here?
  }

  // Building transparency
  public setBuildingTransparency(newSetting: boolean): void {
    this.transparentBuildings = newSetting;

    // Store context and mark areas as dirty
    this.tilesNeedUpdating = true; //not sure if we need to nuke the old values here, this is prob another layer
  }
}

export default CanvasRenderer;
