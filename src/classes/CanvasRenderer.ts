import RenderContext from '../interfaces/RenderContext';
import Viewport from '../interfaces/Viewport';
import colors, { getDesirabilityRGB } from '../utils/colors';
import {
  GRID_CENTER_PX,
  GRID_TOTAL_PX,
  GRID_SIZE,
  COORD_TO_PX,
  PX_TO_COORD,
  CELL_PX,
  COORD_TO_INT16,
  SINE_COSINE,
  ROTATION_RADS,
} from '../utils/constants';
import { Tile, Rectangle } from '../utils/geometry';
import Building from './Building';

export enum CanvasUpdateFlag {
  NONE = 0,
  TRANSFORM = 1 << 0,
  TILES = 1 << 1,
  BUILDINGS = 1 << 2,
  ALL = ~0, // All bits set to 1
}

export interface GridPoint {
  x: number;
  y: number;
}

class CanvasRenderer {
  // Settings
  private transparentBuildings: boolean = false;
  private readonly GRID_TEXT_THRESHOLD = 0.6; // Zoom threshold to draw
  private readonly GRID_LINES_THRESHOLD = 0.1; // Zoom threshold to draw

  // Rendering system
  private sectionsNeedUpdating: number = CanvasUpdateFlag.NONE; //Uses a bitflag system
  private pendingFrame: number | null = null;
  private renderContext: RenderContext;

  // DOM elements
  private parentContainer: HTMLDivElement;

  // Size variables
  private clientWidth: number;
  private clientHeight: number;
  private devicePixelRatio: number;

  // Canvas elements
  private tilesCanvas: HTMLCanvasElement;
  private tilesCtx: CanvasRenderingContext2D;
  private buildingsCanvas: HTMLCanvasElement;
  private buildingsCtx: CanvasRenderingContext2D;

  // Transform state
  private isRotated: boolean = false;
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

  get viewCenter(): DOMPoint {
    return new DOMPoint(this.clientWidth / 2, this.clientHeight / 2);
  }

  constructor(parentContainer: HTMLDivElement, renderContext: RenderContext) {
    const createCanvas = (id: string, zIndex: number): HTMLCanvasElement => {
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
    };

    this.parentContainer = parentContainer;
    this.renderContext = renderContext;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Store dimensions
    this.clientWidth = parentContainer.clientWidth;
    this.clientHeight = parentContainer.clientHeight;

    // Create canvas elements - all sized to fit the viewport
    this.tilesCanvas = createCanvas('tiles-canvas', 1);
    this.tilesCtx = this.tilesCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    }) as CanvasRenderingContext2D;

    this.buildingsCanvas = createCanvas('buildings-canvas', 2);
    this.buildingsCtx = this.buildingsCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    }) as CanvasRenderingContext2D;

    // Todo: React can probably do this better. Also todo: Debounce this
    const resizeObserver = new ResizeObserver(() => this.canvasSizeUpdated());
    resizeObserver.observe(parentContainer);

    // Center view
    this.centerViewAt({ x: GRID_CENTER_PX, y: GRID_CENTER_PX });

    // Go ahead and get us started here
    this.scheduleRender(CanvasUpdateFlag.ALL);
  }

  public destroy() {
    this.parentContainer.removeChild(this.tilesCanvas);
    this.parentContainer.removeChild(this.buildingsCanvas);
  }

  /*
   * Public methods
   */
  public selectedBlueprintChanged() {
    //Todo: Update virtual building
  }

  public scheduleRender(updateFlags: number): void {
    this.sectionsNeedUpdating |= updateFlags; //Add the flags of the parts that need updating via bitwise OR

    if (!this.pendingFrame) {
      this.pendingFrame = requestAnimationFrame(this.render.bind(this));
    }
  }

  // Size handling
  public canvasSizeUpdated() {
    this.clientWidth = this.parentContainer.clientWidth;
    this.clientHeight = this.parentContainer.clientHeight;

    // Resize all canvases
    [this.tilesCanvas, this.buildingsCanvas].forEach((canvas) => {
      canvas.width = this.clientWidth * this.devicePixelRatio;
      canvas.height = this.clientHeight * this.devicePixelRatio;
      canvas.style.width = this.clientWidth + 'px';
      canvas.style.height = this.clientHeight + 'px';
    });

    this.scheduleRender(CanvasUpdateFlag.ALL);
  }

  /*
   * Coordinate transformations
   */
  private grid2canvas(point: GridPoint): DOMPoint {
    if (!this.isRotated) {
      return new DOMPoint(
        point.x * this.zoomLevel + this.offsetX,
        point.y * this.zoomLevel + this.offsetY
      );
    } else {
      return new DOMPoint(
        (point.x * SINE_COSINE - point.y * SINE_COSINE) * this.zoomLevel +
          this.offsetX,
        (point.x * SINE_COSINE + point.y * SINE_COSINE) * this.zoomLevel +
          this.offsetY
      );
    }
  }

  private canvas2grid(point: DOMPoint): GridPoint {
    const xUnscaled = (point.x - this.offsetX) / this.zoomLevel;
    const yUnscaled = (point.y - this.offsetY) / this.zoomLevel;

    if (!this.isRotated) {
      return { x: xUnscaled, y: yUnscaled };
    } else {
      return {
        x: xUnscaled * SINE_COSINE + yUnscaled * SINE_COSINE,
        y: -xUnscaled * SINE_COSINE + yUnscaled * SINE_COSINE,
      };
    }
  }

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

  // Get the range of tiles currently visible in the viewport
  public getViewport(): Viewport {
    // Currently, this function uses a very simple and slightly wasteful algorithm.
    // In order to handle grid rotation, we need to get the axis-aligned bounding box of all four corners of the viewport.
    // This means that when the grid is rotated, up to 50% of the tiles we render are wasted effort since they're offscreen!
    // We could further optimize this by memoizing most of this logic and only updating it when the rotation or client height/width change.
    // However, fixing that is tricky without messing with the SIMD optimization. And there are much more significant optimizations we should do, first.
    let minX: number, minY: number, maxX: number, maxY: number;
    if (!this.isRotated) {
      const topLeft = this.canvas2grid(new DOMPoint(0, 0));
      const bottomRight = this.canvas2grid(
        new DOMPoint(this.clientWidth, this.clientHeight)
      );

      minX = topLeft.x;
      minY = topLeft.y;
      maxX = bottomRight.x;
      maxY = bottomRight.y;
    } else {
      // For a rotated grid, we need the 4 corners
      const corners = [
        this.canvas2grid(new DOMPoint(0, 0)), // top-left
        this.canvas2grid(new DOMPoint(this.clientWidth, 0)), // top-right
        this.canvas2grid(new DOMPoint(0, this.clientHeight)), // bottom-left
        this.canvas2grid(new DOMPoint(this.clientWidth, this.clientHeight)), // bottom-right
      ];
      minX = Math.min(...corners.map((p) => p.x));
      minY = Math.min(...corners.map((p) => p.y));
      maxX = Math.max(...corners.map((p) => p.x));
      maxY = Math.max(...corners.map((p) => p.y));
    }

    const coordStartX = Math.max(0, minX);
    const coordStartY = Math.max(0, minY);
    const coordEndX = Math.min(GRID_TOTAL_PX, maxX);
    const coordEndY = Math.min(GRID_TOTAL_PX, maxY);

    const tileStartX = Math.max(0, PX_TO_COORD(minX));
    const tileStartY = Math.max(0, PX_TO_COORD(minY));
    const tileEndX = Math.min(GRID_SIZE - 1, PX_TO_COORD(maxX) + 1);
    const tileEndY = Math.min(GRID_SIZE - 1, PX_TO_COORD(maxY) + 1);

    return {
      coords: {
        startX: coordStartX,
        startY: coordStartY,
        endX: coordEndX,
        endY: coordEndY,
        width: coordEndX - coordStartX,
        height: coordEndY - coordStartY,
      },
      tiles: {
        startX: tileStartX,
        startY: tileStartY,
        endX: tileEndX,
        endY: tileEndY,
        width: tileEndX - tileStartX,
        height: tileEndY - tileStartY,
      },
    };
  }

  /*
   * Canvas transforms
   */
  private applyCanvasTransforms(): void {
    // Reset transforms
    [this.tilesCtx, this.buildingsCtx].forEach((ctx) => {
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
      ctx.scale(this.zoomLevel, this.zoomLevel);
      if (this.isRotated) ctx.rotate(ROTATION_RADS);
    });
  }

  public toggleGridRotation(): void {
    const oldCenter = this.canvas2grid(this.viewCenter);

    this.isRotated = !this.isRotated;

    // Recenter view
    this.centerViewAt(oldCenter);

    this.scheduleRender(CanvasUpdateFlag.ALL);
  }

  public centerViewAt(point: GridPoint) {
    const center = this.viewCenter;

    let transformedX, transformedY;
    if (!this.isRotated) {
      transformedX = point.x * this.zoomLevel;
      transformedY = point.y * this.zoomLevel;
    } else {
      transformedX =
        (point.x * SINE_COSINE - point.y * SINE_COSINE) * this.zoomLevel;
      transformedY =
        (point.x * SINE_COSINE + point.y * SINE_COSINE) * this.zoomLevel;
    }

    // Calculate the offset to place the transformed point at the center
    this.offsetX = center.x - transformedX;
    this.offsetY = center.y - transformedY;

    this.scheduleRender(CanvasUpdateFlag.ALL); //This might not always need a full rerender if the distance moved is small enough but that's a very low priority optimization
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

    this.scheduleRender(CanvasUpdateFlag.ALL); //This might not always need a full rerender in some very specific cases but that's very tricky for such a small optimization
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

    this.scheduleRender(CanvasUpdateFlag.ALL); //This might not always need a full rerender if the distance moved is small enough but that's a very low priority optimization
  }

  public stopPanning() {
    this.isPanning = false;
    this.parentContainer.style.cursor = 'grab';
  }

  // Drag handling
  public startDragging(event: MouseEvent) {
    const thisTile = this.getMouseCoords(event);
    if (!thisTile) return;

    this.isDragging = true;
    this.dragStartTile = thisTile;
    this.updateDragBox(thisTile);
  }

  private updateDragBox(newPos: Tile | undefined) {
    if (this.dragStartTile && newPos) {
      this.dragBox = Rectangle.fromTiles(this.dragStartTile, newPos);
    }
    this.scheduleRender(CanvasUpdateFlag.ALL); //Todo: Later when we have a proper overlays layer we only need to update that
  }

  public stopDragging() {
    if (!this.isDragging) return;

    const returnBox = this.dragBox;
    this.isDragging = false;

    this.scheduleRender(CanvasUpdateFlag.ALL); //Todo: Later when we have a proper overlays layer we only need to update that

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
      }
    } else if (cursorAction === 'placing') {
      //Todo: Update virtual building here
    }
  }

  public handleMouseLeave() {
    this.lastMouseoverTile = undefined;

    this.scheduleRender(CanvasUpdateFlag.ALL); //Todo: This shouldn't need a rerender but I'll deal with it later
  }

  // Building transparency
  public setBuildingTransparency(newSetting: boolean): void {
    this.transparentBuildings = newSetting;

    //Todo: What needs rerendering here?
  }

  /*
   * Actual rendering methods
   */
  private render(): void {
    let startTime = performance.now();

    if (this.sectionsNeedUpdating & CanvasUpdateFlag.TRANSFORM) {
      this.applyCanvasTransforms();
      const transformTime = performance.now() - startTime;
      if (transformTime > 3) {
        //prettier-ignore
        console.log("Transformation took", transformTime, "ms!");
      }
      startTime = performance.now();
    }

    const viewport = this.getViewport();

    if (this.sectionsNeedUpdating & CanvasUpdateFlag.TILES) {
      this.renderTiles(viewport);
      const tilesTime = performance.now() - startTime;
      if (tilesTime > 5) {
        //prettier-ignore
        console.log("Tile rendering took", tilesTime, "ms!");
      }
      startTime = performance.now();
    }

    if (this.sectionsNeedUpdating & CanvasUpdateFlag.BUILDINGS) {
      this.renderBuildings(viewport);
      const buildingsTime = performance.now() - startTime;
      if (buildingsTime > 5) {
        //prettier-ignore
        console.log("Rendering buildings took", buildingsTime, "ms!");
      }
      startTime = performance.now();
    }

    this.pendingFrame = null;
    this.sectionsNeedUpdating = CanvasUpdateFlag.NONE;
  }

  /*
   * Render the tiles
   */
  private renderTiles(viewport: Viewport) {
    // Get visible tile range. We only need to update the stuff within visible range.
    // We don't even need to clear the previous frame since there's no transparency anywhere, so it only matters when panning to outside the grid's edge
    // (and in that case, it merely results in the fun hall of mirrors effect that's really fun to play with, so it's almost a feature really)
    if (viewport.tiles.height < 1 || viewport.tiles.width < 1) {
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
    tempCanvas.width = viewport.tiles.width;
    tempCanvas.height = viewport.tiles.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    const imageData = tempCtx.createImageData(
      tempCanvas.width,
      tempCanvas.height
    );

    // Fill the image with cell colors - one pixel per cell
    let idx = 0;
    for (let y = viewport.tiles.startY; y < viewport.tiles.endY; y++) {
      for (let x = viewport.tiles.startX; x < viewport.tiles.endX; x++) {
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
    this.tilesCtx.imageSmoothingEnabled = false; //For some reason we need to set this each time?
    this.tilesCtx.drawImage(
      tempCanvas,
      0,
      0,
      viewport.tiles.width,
      viewport.tiles.height,
      COORD_TO_PX(viewport.tiles.startX), //We're not using viewport.coords because we're drawing the visual representation of tiles, basically
      COORD_TO_PX(viewport.tiles.startY),
      COORD_TO_PX(viewport.tiles.width),
      COORD_TO_PX(viewport.tiles.height)
    );

    /*
     * DRAW THE BLACK GRIDLINES
     */
    if (this.zoomLevel > this.GRID_LINES_THRESHOLD) {
      this.tilesCtx.lineWidth = 1;
      this.tilesCtx.strokeStyle = colors.pureBlack;
      // Batch all line drawing into a single path
      this.tilesCtx.beginPath();
      // Path the horizontal lines
      for (let y = viewport.tiles.startY + 1; y < viewport.tiles.endY; y++) {
        this.tilesCtx.moveTo(viewport.coords.startX, COORD_TO_PX(y));
        this.tilesCtx.lineTo(viewport.coords.endX, COORD_TO_PX(y));
      }
      // Path the vertical lines
      for (let x = viewport.tiles.startX + 1; x < viewport.tiles.endX; x++) {
        this.tilesCtx.moveTo(COORD_TO_PX(x), viewport.coords.startY);
        this.tilesCtx.lineTo(COORD_TO_PX(x), viewport.coords.endY);
      }
      // Execute the path!
      this.tilesCtx.stroke();
    }

    /*
     * DRAW THE TEXT LABELS (most of the performance hit is from here!)
     */
    if (this.zoomLevel > this.GRID_TEXT_THRESHOLD) {
      // Save the current transform state
      this.tilesCtx.save();

      // Reset transform to identity but keep device pixel ratio
      this.tilesCtx.setTransform(
        this.devicePixelRatio,
        0,
        0,
        this.devicePixelRatio,
        0,
        0
      );

      // Set text style
      this.tilesCtx.font = 'bold 14px Arial';
      this.tilesCtx.textAlign = 'center';
      this.tilesCtx.textBaseline = 'middle';
      this.tilesCtx.lineWidth = 2;
      this.tilesCtx.strokeStyle = 'white';
      this.tilesCtx.fillStyle = 'black';

      // Draw all text without rotation
      for (let x = viewport.tiles.startX; x < viewport.tiles.endX; x++) {
        for (let y = viewport.tiles.startY; y < viewport.tiles.endY; y++) {
          if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;

          const tile = new Tile(x, y);
          const desirabilityValue = baseValues[COORD_TO_INT16(tile.x, tile.y)];

          if (desirabilityValue === 0) continue;

          // Get the center point of this tile in canvas space
          const centerPoint = {
            x: COORD_TO_PX(x) + CELL_PX / 2,
            y: COORD_TO_PX(y) + CELL_PX / 2,
          };

          // Apply all transformations to this point to get screen coordinates
          const screenPoint = this.grid2canvas(centerPoint);

          // Draw the text at screen coordinates without any rotation
          const valueText = desirabilityValue.toString();
          this.tilesCtx.strokeText(valueText, screenPoint.x, screenPoint.y);
          this.tilesCtx.fillText(valueText, screenPoint.x, screenPoint.y);
        }
      }

      // Restore the transform
      this.tilesCtx.restore();
    }
  }

  private renderBuildings(viewport: Viewport): void {
    this.buildingsCtx.clearRect(
      viewport.coords.startX,
      viewport.coords.startY,
      viewport.coords.width,
      viewport.coords.height
    );
    const buildings = this.renderContext.getBuildings();
    const buildingOutlinesPath = new Path2D();

    for (const building of buildings) {
      const graphic = building.graphic;
      if (!graphic) continue;

      this.buildingsCtx.save();

      const x = COORD_TO_PX(building.origin.x);
      const y = COORD_TO_PX(building.origin.y);
      this.buildingsCtx.translate(x, y);

      for (const pathFill of graphic.fillPaths) {
        this.buildingsCtx.fillStyle = pathFill.fillColor;
        this.buildingsCtx.fill(pathFill.path);
      }
      buildingOutlinesPath.addPath(graphic.outline);

      this.buildingsCtx.restore();
    }

    this.buildingsCtx.strokeStyle = colors.strongOutlineBlack;
    this.buildingsCtx.lineWidth = 3;
    this.buildingsCtx.stroke(buildingOutlinesPath);
  }
}

export default CanvasRenderer;
