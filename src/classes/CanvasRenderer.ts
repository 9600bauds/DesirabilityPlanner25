import RenderContext from '../interfaces/RenderContext';
import Viewport from '../interfaces/Viewport';
import colors, { getDesirabilityRGB } from '../utils/colors';
import {
  GRID_CENTER_PX,
  GRID_TOTAL_PX,
  GRID_SIZE,
  COORD_TO_PX,
  PX_TO_COORD,
  COORD_TO_INT16,
  ROTATION_RADS,
  GRID_MAX_X,
  GRID_MAX_Y,
  ROTATE_AROUND_ORIGIN,
  COUNTERROTATE_AROUND_ORIGIN,
} from '../utils/constants';
import { smallestFontSizeInBounds } from '../utils/fonts';
import { Tile, Rectangle, GridPoint } from '../utils/geometry';
import Building from './Building';

export enum CanvasUpdateFlag {
  NONE = 0,
  TILES = 1 << 0,
  BUILDINGS = 1 << 1,
  ALL = ~0, // All bits set to 1
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
  private labelContainer: HTMLDivElement;

  // Size variables
  private clientWidth: number;
  private clientHeight: number;
  private devicePixelRatio: number;

  // Canvas elements
  private tilesCanvas: HTMLCanvasElement;
  private tilesCtx: CanvasRenderingContext2D;
  private tileNumbersCanvas: HTMLCanvasElement;
  private tileNumbersCtx: CanvasRenderingContext2D;
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
      canvas.className = 'canvasLayer';
      canvas.style.width = this.clientWidth + 'px';
      canvas.style.height = this.clientHeight + 'px';
      canvas.style.zIndex = zIndex.toString();

      this.parentContainer.appendChild(canvas);
      return canvas;
    };

    this.parentContainer = parentContainer;
    this.renderContext = renderContext;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Store dimensions
    this.clientWidth = parentContainer.clientWidth;
    this.clientHeight = parentContainer.clientHeight;

    // Create the building label container
    this.labelContainer = document.createElement('div');
    this.labelContainer.id = 'building-labels-container';
    this.parentContainer.appendChild(this.labelContainer);

    // Create canvas elements - all sized to fit the viewport
    this.buildingsCanvas = createCanvas('buildings-canvas', 3);
    this.buildingsCtx = this.buildingsCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    }) as CanvasRenderingContext2D;

    this.tileNumbersCanvas = createCanvas('tile-numbers-canvas', 2);
    this.tileNumbersCtx = this.tileNumbersCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    }) as CanvasRenderingContext2D;

    this.tilesCanvas = createCanvas('tiles-canvas', 1);
    this.tilesCtx = this.tilesCanvas.getContext('2d', {
      alpha: false,
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
    this.parentContainer.removeChild(this.labelContainer);
    this.parentContainer.removeChild(this.tilesCanvas);
    this.parentContainer.removeChild(this.tileNumbersCanvas);
    this.parentContainer.removeChild(this.buildingsCanvas);
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
    [this.tilesCanvas, this.tileNumbersCanvas, this.buildingsCanvas].forEach(
      (canvas) => {
        canvas.width = this.clientWidth * this.devicePixelRatio;
        canvas.height = this.clientHeight * this.devicePixelRatio;
        canvas.style.width = this.clientWidth + 'px';
        canvas.style.height = this.clientHeight + 'px';
      }
    );

    this.scheduleRender(CanvasUpdateFlag.ALL);
  }

  /*
   * Coordinate transformations
   */
  private grid2canvas(point: GridPoint, rotate = this.isRotated): DOMPoint {
    if (rotate) point = ROTATE_AROUND_ORIGIN(point);
    return new DOMPoint(
      COORD_TO_PX(point.x) * this.zoomLevel + this.offsetX,
      COORD_TO_PX(point.y) * this.zoomLevel + this.offsetY
    );
  }

  private canvas2grid(dompoint: DOMPoint, rotate = this.isRotated): GridPoint {
    const x = (dompoint.x - this.offsetX) / this.zoomLevel;
    const y = (dompoint.y - this.offsetY) / this.zoomLevel;
    let point = { x, y };
    if (rotate) point = COUNTERROTATE_AROUND_ORIGIN(point);
    return point;
  }

  private pointToTile(point: DOMPoint): Tile | undefined {
    if (
      point.x < 0 ||
      point.y < 0 ||
      point.x >= this.clientWidth ||
      point.y >= this.clientHeight
    ) {
      return undefined; //This is outside our viewport!
    }

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
    const tileEndX = Math.min(GRID_MAX_X, PX_TO_COORD(maxX) + 1);
    const tileEndY = Math.min(GRID_MAX_Y, PX_TO_COORD(maxY) + 1);

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
        width: tileEndX - tileStartX + 1,
        height: tileEndY - tileStartY + 1,
      },
    };
  }

  /*
   * Canvas transforms
   */
  public toggleGridRotation(): void {
    const oldCenter = this.canvas2grid(this.viewCenter);

    this.isRotated = !this.isRotated;

    // Recenter view
    this.centerViewAt(oldCenter);

    this.scheduleRender(CanvasUpdateFlag.ALL);
  }

  public centerViewAt(point: GridPoint) {
    const center = this.viewCenter;

    if (this.isRotated) {
      point = ROTATE_AROUND_ORIGIN(point);
    }

    this.offsetX = center.x - point.x * this.zoomLevel;
    this.offsetY = center.y - point.y * this.zoomLevel;

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
  public startDragging() {
    this.isDragging = true;
    this.dragStartTile = this.lastMouseoverTile;
    this.updateDragBox(this.lastMouseoverTile);
  }

  public handleDragging() {
    if (!this.isDragging) return;
    this.updateDragBox(this.lastMouseoverTile);
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

  // Placement preview
  public handlePlacementPreview() {
    console.log('handling preview...');
    return; //Todo
  }

  // Mouse handling
  public checkForTileChange(event?: MouseEvent) {
    const previousTile = this.lastMouseoverTile;
    const newTile = event && this.getMouseCoords(event);
    let tileChanged: boolean;

    if (!newTile) {
      if (previousTile) {
        tileChanged = true; //We went from something to nothing, thus, change
      } else {
        tileChanged = false; //We went from nothing to nothing, thus, no change
      }
    } else {
      if (!previousTile) {
        tileChanged = true; //We went from nothing to something, thus, change
      } else {
        tileChanged = !newTile.equals(previousTile); //We change only if the new tile is not the same as the previous one
      }
    }

    this.lastMouseoverTile = newTile;
    return tileChanged;
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
    const viewport = this.getViewport();
    if (viewport.tiles.height < 1 || viewport.tiles.width < 1) {
      return; //We are fully offscreen!
    }

    //This beauty stores all the precomputed desirability values.
    const baseValues = this.renderContext.getBaseValues();

    let startTime = performance.now();

    if (this.sectionsNeedUpdating & CanvasUpdateFlag.TILES) {
      this.renderTiles(this.tilesCtx, viewport, baseValues);
      if (this.zoomLevel > this.GRID_TEXT_THRESHOLD) {
        this.tileNumbersCanvas.style.display = 'initial';
        this.renderTileNumbers(this.tileNumbersCtx, viewport, baseValues);
      } else {
        this.tileNumbersCanvas.style.display = 'none';
      }
      const tilesTime = performance.now() - startTime;
      if (tilesTime > 5) {
        //prettier-ignore
        console.log("Tile rendering took", tilesTime, "ms!");
      }
      startTime = performance.now();
    }

    if (this.sectionsNeedUpdating & CanvasUpdateFlag.BUILDINGS) {
      this.renderBuildings(this.buildingsCtx, viewport, baseValues);
      this.renderBuildingLabels(viewport, baseValues);
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
  private renderTiles(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport,
    baseValues: Int16Array
  ) {
    // We don't even need to clear the previous frame since there's no transparency anywhere, so it only matters when panning to outside the grid's edge
    // (and in that case, it merely results in the fun hall of mirrors effect that's really fun to play with, so it's almost a feature really)

    // prettier-ignore
    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    if (this.isRotated) ctx.rotate(ROTATION_RADS);

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
    for (let y = viewport.tiles.startY; y <= viewport.tiles.endY; y++) {
      for (let x = viewport.tiles.startX; x <= viewport.tiles.endX; x++) {
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
    ctx.imageSmoothingEnabled = false; //For some reason we need to set this each time?
    ctx.drawImage(
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
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.pureBlack;
      // Batch all line drawing into a single path
      ctx.beginPath();
      // Path the horizontal lines
      for (let y = viewport.tiles.startY + 1; y <= viewport.tiles.endY; y++) {
        ctx.moveTo(viewport.coords.startX, COORD_TO_PX(y));
        ctx.lineTo(viewport.coords.endX, COORD_TO_PX(y));
      }
      // Path the vertical lines
      for (let x = viewport.tiles.startX + 1; x <= viewport.tiles.endX; x++) {
        ctx.moveTo(COORD_TO_PX(x), viewport.coords.startY);
        ctx.lineTo(COORD_TO_PX(x), viewport.coords.endY);
      }
      // Execute the path!
      ctx.stroke();
    }
  }

  private renderTileNumbers(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport,
    baseValues: Int16Array
  ) {
    // prettier-ignore
    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.clientWidth, this.clientHeight);
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    //We intentionally do not rotate!

    // Set text style
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';

    for (let x = viewport.tiles.startX; x <= viewport.tiles.endX; x++) {
      for (let y = viewport.tiles.startY; y <= viewport.tiles.endY; y++) {
        const desirabilityValue = baseValues[COORD_TO_INT16(x, y)];

        if (desirabilityValue === 0) continue;

        // Get the center point of this tile in canvas space
        let centerPoint = {
          x: COORD_TO_PX(x + 0.5),
          y: COORD_TO_PX(y + 0.5),
        };

        if (this.isRotated) {
          centerPoint = ROTATE_AROUND_ORIGIN(centerPoint);
        }

        // Draw the text at screen coordinates without any rotation
        const valueText = desirabilityValue.toString();
        ctx.strokeText(valueText, centerPoint.x, centerPoint.y);
        ctx.fillText(valueText, centerPoint.x, centerPoint.y);
      }
    }
  }

  private renderBuildings(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport,
    baseValues: Int16Array
  ) {
    // prettier-ignore
    ctx.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    if (this.isRotated) ctx.rotate(ROTATION_RADS);

    ctx.clearRect(
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

      for (const pathFill of graphic.fillPaths) {
        ctx.fillStyle = pathFill.fillColor;
        ctx.fill(pathFill.path);
      }
      buildingOutlinesPath.addPath(graphic.outline);
    }
    ctx.strokeStyle = colors.pureBlack;
    ctx.lineWidth = 3;
    ctx.stroke(buildingOutlinesPath);
  }

  private renderBuildingLabels(viewport: Viewport, baseValues: Int16Array) {
    const buildings = this.renderContext.getBuildings();
    const labelsHTML: string[] = []; //Just building these as a raw string is the fastest way to do it, believe it or not.

    for (const building of buildings) {
      const innerLabel = building.getLabel(0);
      if (!innerLabel) continue;

      let labelHeight = COORD_TO_PX(building.height) * this.zoomLevel;
      let labelWidth = COORD_TO_PX(building.width) * this.zoomLevel;

      let labelOrigin;
      if (!this.isRotated) {
        labelOrigin = this.grid2canvas(building.origin);
      } else {
        const buildingCenter = {
          x: building.origin.x + building.width / 2,
          y: building.origin.y + building.height / 2,
        };
        labelOrigin = this.grid2canvas(buildingCenter);
        labelHeight -= labelHeight * 0.2;
        labelWidth += labelWidth * 0.2;
        labelOrigin.x -= labelWidth / 2;
        labelOrigin.y -= labelHeight / 2;
      }
      const widthSpace = labelWidth / (1.4 * Math.sqrt(innerLabel.length));
      const heightSpace = labelHeight / (1.5 * Math.sqrt(innerLabel.length));
      let fontSize = 4 + Math.min(widthSpace, heightSpace);

      //prettier-ignore
      const fontWithBreaks = smallestFontSizeInBounds(innerLabel, labelWidth, labelHeight, true);
      //prettier-ignore
      const fontWithoutBreaks = smallestFontSizeInBounds(innerLabel, labelWidth, labelHeight, false);

      if (fontWithoutBreaks >= 8) {
        fontSize = fontWithoutBreaks;
      } else if (fontWithBreaks >= 6) {
        fontSize = fontWithBreaks;
      } else {
        continue;
      }

      const labelHTML = `
        <div
          id='label-${building.id}'
          class='building-label'
          style="
            left: ${labelOrigin.x}px;
            top: ${labelOrigin.y}px;
            width: ${labelWidth}px;
            height: ${labelHeight}px;
            padding: 3px;
            font-size: ${fontSize}px;
          "
        >
          ${innerLabel}
        </div>`;
      labelsHTML.push(labelHTML);
    }
    this.labelContainer.innerHTML = labelsHTML.join('');
  }
}

export default CanvasRenderer;
