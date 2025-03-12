import RenderContext from '../interfaces/RenderContext';
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
class CanvasRenderer {
  // Settings
  private transparentBuildings: boolean = false;
  private readonly GRID_TEXT_THRESHOLD = 0.6; // Zoom threshold to draw

  // Rendering system
  private pendingRerender: number | null = null;
  private pendingPreview: number | null = null;
  private renderContext: RenderContext;

  // DOM elements
  private parentContainer: HTMLDivElement;
  private labelContainer: HTMLDivElement;

  // Size variables
  private clientWidth: number;
  private clientHeight: number;
  private devicePixelRatio: number;

  // Canvas elements
  private mainLayers: Record<string, CanvasRenderingContext2D> = {};
  private previewLayers: Record<string, CanvasRenderingContext2D> = {};

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
    this.parentContainer = parentContainer;
    this.renderContext = renderContext;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Store dimensions
    this.clientWidth = parentContainer.clientWidth;
    this.clientHeight = parentContainer.clientHeight;

    // Create the building label container
    this.labelContainer = document.createElement('div');
    this.labelContainer.id = 'building-labels-container';
    this.labelContainer.style.zIndex = '500';
    this.parentContainer.appendChild(this.labelContainer);

    // Create canvas elements
    this.previewLayers.buildings = this.createCtx('buildings-preview', 71);
    this.previewLayers.tileNumbers = this.createCtx('tilenumbers-preview', 22);
    this.previewLayers.tiles = this.createCtx('tiles-preview', 21);

    this.mainLayers.buildings = this.createCtx('buildings-main', 61);
    this.mainLayers.gridLines = this.createCtx('gridlines-main', 50);
    this.mainLayers.tileNumbers = this.createCtx('tilenumbers-main', 12);
    this.mainLayers.tiles = this.createCtx('tiles-main', 11);

    // Todo: React can probably do this better. Also todo: Debounce this
    const resizeObserver = new ResizeObserver(() => this.canvasSizeUpdated());
    resizeObserver.observe(parentContainer);

    // Center view
    this.centerViewAt({ x: GRID_CENTER_PX, y: GRID_CENTER_PX });

    // Go ahead and get us started here
    this.scheduleRerender();
  }

  public destroy() {
    this.parentContainer.removeChild(this.labelContainer);
    for (const ctx of Object.values(this.mainLayers)) {
      this.parentContainer.removeChild(ctx.canvas);
    }
    this.mainLayers = {};
    for (const ctx of Object.values(this.previewLayers)) {
      this.parentContainer.removeChild(ctx.canvas);
    }
    this.previewLayers = {};
  }

  private createCtx = (
    id: string,
    zIndex: number
  ): CanvasRenderingContext2D => {
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.className = 'canvasLayer';
    canvas.style.zIndex = zIndex.toString();

    this.parentContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    }) as CanvasRenderingContext2D;
    return ctx;
  };

  private fastClearCtx(ctx: CanvasRenderingContext2D, rotate = this.isRotated) {
    //Setting the width every time is apparently the fastest way to clear the canvas? Even if the size didn't change?
    ctx.canvas.width = this.clientWidth * this.devicePixelRatio;
    ctx.canvas.height = this.clientHeight * this.devicePixelRatio;

    ctx.translate(
      this.offsetX * this.devicePixelRatio,
      this.offsetY * this.devicePixelRatio
    );
    ctx.scale(
      this.zoomLevel * this.devicePixelRatio,
      this.zoomLevel * this.devicePixelRatio
    );
    if (rotate) ctx.rotate(ROTATION_RADS);
  }

  private hideLayers(layers: Record<string, CanvasRenderingContext2D>) {
    for (const ctx of Object.values(layers)) {
      ctx.canvas.style.opacity = '0';
    }
  }

  public scheduleRerender(): void {
    if (!this.pendingRerender) {
      this.pendingRerender = requestAnimationFrame(
        this.fullRerender.bind(this)
      );
    }
  }

  public schedulePreview(): void {
    if (!this.pendingPreview) {
      this.pendingPreview = requestAnimationFrame(this.preview.bind(this));
    }
  }

  // Size handling
  public canvasSizeUpdated() {
    this.clientWidth = this.parentContainer.clientWidth;
    this.clientHeight = this.parentContainer.clientHeight;

    this.scheduleRerender();
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
  public getViewport(): { coordsRect: Rectangle; tilesRect: Rectangle } {
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
    const coordWidth = coordEndX - coordStartX + 1;
    const coordHeight = coordEndY - coordStartY + 1;
    const coordsRect: Rectangle = new Rectangle(
      new Tile(coordStartX, coordStartY),
      coordWidth,
      coordHeight
    );

    const tileStartX = Math.max(0, PX_TO_COORD(minX));
    const tileStartY = Math.max(0, PX_TO_COORD(minY));
    const tileEndX = Math.min(GRID_MAX_X, PX_TO_COORD(maxX) + 1);
    const tileEndY = Math.min(GRID_MAX_Y, PX_TO_COORD(maxY) + 1);
    const tileWidth = tileEndX - tileStartX + 1;
    const tileHeight = tileEndY - tileStartY + 1;
    const tilesRect: Rectangle = new Rectangle(
      new Tile(tileStartX, tileStartY),
      tileWidth,
      tileHeight
    );

    return { coordsRect, tilesRect };
  }

  /*
   * Canvas transforms
   */
  public toggleGridRotation(): void {
    const oldCenter = this.canvas2grid(this.viewCenter);

    this.isRotated = !this.isRotated;

    // Recenter view
    this.centerViewAt(oldCenter);

    this.scheduleRerender();
  }

  public centerViewAt(point: GridPoint) {
    const center = this.viewCenter;

    if (this.isRotated) {
      point = ROTATE_AROUND_ORIGIN(point);
    }

    this.offsetX = center.x - point.x * this.zoomLevel;
    this.offsetY = center.y - point.y * this.zoomLevel;

    this.scheduleRerender(); //This might not always need a full rerender if the distance moved is small enough but that's a very low priority optimization
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

    this.scheduleRerender(); //This might not always need a full rerender in some very specific cases but that's very tricky for such a small optimization
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

    this.scheduleRerender(); //This might not always need a full rerender if the distance moved is small enough but that's a very low priority optimization
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
    this.schedulePreview();
  }

  public stopDragging() {
    if (!this.isDragging) return;

    const returnBox = this.dragBox;
    this.dragBox = undefined;
    this.isDragging = false;

    this.scheduleRerender(); //Todo... Maybe do the deletion here?

    return returnBox;
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
  private fullRerender(): void {
    this.pendingRerender = null;
    this.pendingPreview = null;

    this.hideLayers(this.previewLayers);
    this.hideLayers(this.mainLayers); //We'll re-enable them as needed

    const viewport = this.getViewport();
    if (viewport.tilesRect.height < 1 || viewport.tilesRect.width < 1) {
      return; //We are fully offscreen!
    }

    const placedBuildings = this.renderContext.getBuildings();
    // These are the precomputed desirability values from the "true" gridstate.
    const baseValues = this.renderContext.getBaseValues();

    // Even though canvases are "just bitmaps", and so, it shouldn't be a problem to draw on top of the previous frame...
    // NOT clearing the previous frame inexplicably causes setTransform() to be extremely slow. Even though we're clearing it AFTER the setTransform().
    // I have no idea how this works, I've been unable to find any explanation, and at this point, I've given up trying to understand.
    // Suffice to say, this clear is VITAL for performance, even though we shouldn't need it and it makes no sense.
    this.fastClearCtx(this.mainLayers.tiles);
    this.renderTiles(this.mainLayers.tiles, baseValues, viewport.tilesRect);
    this.mainLayers.tiles.canvas.style.opacity = '100';

    if (this.zoomLevel > this.GRID_TEXT_THRESHOLD) {
      this.fastClearCtx(this.mainLayers.tileNumbers, false); //We intentionally do not rotate!;
      this.renderTileNumbers(
        this.mainLayers.tileNumbers,
        baseValues,
        viewport.tilesRect
      );
      this.mainLayers.tileNumbers.canvas.style.opacity = '100';
    }

    this.fastClearCtx(this.mainLayers.gridLines);
    this.renderGridlines(this.mainLayers.gridLines, viewport.tilesRect);
    this.mainLayers.gridLines.canvas.style.opacity = '100';

    this.fastClearCtx(this.mainLayers.buildings);
    this.renderBuildings(
      this.mainLayers.buildings,
      viewport.tilesRect,
      placedBuildings
    );
    this.mainLayers.buildings.canvas.style.opacity = '100';

    this.renderBuildingLabels(viewport.tilesRect, baseValues);
  }

  private preview() {
    this.pendingPreview = null;
    this.hideLayers(this.previewLayers);

    if (this.pendingRerender) return; //Let's not preview anything if we're going to full update anyways.
    const viewport = this.getViewport();
    if (viewport.tilesRect.height < 1 || viewport.tilesRect.width < 1) {
      return; //We are fully offscreen!
    }

    const selectedBlueprint = this.renderContext.getSelectedBlueprint();
    const placedBuildings = this.renderContext.getBuildings();

    // These are the precomputed desirability values from the "true" gridstate.
    const baseValues = this.renderContext.getBaseValues();
    // Let's clone the base values so we can do our own calculations
    const modifiedValues = new Int16Array(baseValues);
    const modifiedAreas: Set<Rectangle> = new Set();

    // These sets are not persistent. We recalculate them each time. This is potentially inefficient,
    // but probably only to a marginal degree - so I'm not prematurely optimizing them yet.
    const buildingsBeingAdded: Set<Building> = new Set();
    if (this.lastMouseoverTile && selectedBlueprint) {
      // Yes, we re-create this building each time too.
      buildingsBeingAdded.add(
        new Building(this.lastMouseoverTile, selectedBlueprint)
      );
    }
    const buildingsBeingRemoved: Set<Building> = new Set();
    if (this.isDragging && this.dragBox) {
      for (const building of placedBuildings) {
        if (building.interceptsRectangle(this.dragBox)) {
          buildingsBeingRemoved.add(building);
        }
      }
    }

    for (const building of buildingsBeingAdded) {
      for (const dbox of building.desireBoxes) {
        dbox.apply(modifiedValues);
        modifiedAreas.add(dbox.affectedBounds);
      }
    }
    for (const building of buildingsBeingRemoved) {
      for (const dbox of building.desireBoxes) {
        dbox.apply(modifiedValues, -1);
        modifiedAreas.add(dbox.affectedBounds);
      }
    }

    let modifiedArea = Rectangle.boundingBoxOfSet(modifiedAreas);
    if (modifiedArea) {
      modifiedArea = Rectangle.intersection(modifiedArea, viewport.tilesRect);
    }

    if (modifiedArea) {
      this.fastClearCtx(this.previewLayers.tiles);
      this.renderTiles(this.previewLayers.tiles, modifiedValues, modifiedArea);
      this.previewLayers.tiles.canvas.style.opacity = '100';

      if (this.zoomLevel > this.GRID_TEXT_THRESHOLD) {
        this.fastClearCtx(this.previewLayers.tileNumbers, false); //We intentionally do not rotate!;
        this.renderTileNumbers(
          this.previewLayers.tileNumbers,
          modifiedValues,
          modifiedArea
        );
        this.previewLayers.tileNumbers.canvas.style.opacity = '100';
      }

      if (buildingsBeingAdded.size > 0) {
        this.fastClearCtx(this.previewLayers.buildings);
        this.renderBuildings(
          this.previewLayers.buildings,
          modifiedArea,
          buildingsBeingAdded
        );
        this.previewLayers.buildings.canvas.style.opacity = '100';
      }
    }
  }

  private renderTiles(
    ctx: CanvasRenderingContext2D,
    tileValues: Int16Array,
    bounds: Rectangle
  ) {
    // We make use of a temporary canvas here. We draw each tile as 1 pixel big. Then we expand it to cover the entire canvas.
    // This is more efficient, but we need this ugly temporary canvas to do it, because bitmap creation is asynchronous and I don't want to deal with that.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = bounds.endX - bounds.startX + 1;
    tempCanvas.height = bounds.endY - bounds.startY + 1;
    const tempCtx = tempCanvas.getContext('2d')!;
    const imageData = tempCtx.createImageData(
      tempCanvas.width,
      tempCanvas.height
    );

    // Fill the image with cell colors - one pixel per cell
    let idx = 0;
    for (let y = bounds.startY; y <= bounds.endY; y++) {
      for (let x = bounds.startX; x <= bounds.endX; x++) {
        const thisVal = tileValues[COORD_TO_INT16(x, y)];
        const rgb = getDesirabilityRGB(thisVal);
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
      tempCanvas.width,
      tempCanvas.height,
      COORD_TO_PX(bounds.startX),
      COORD_TO_PX(bounds.startY),
      COORD_TO_PX(tempCanvas.width),
      COORD_TO_PX(tempCanvas.height)
    );
  }

  private renderGridlines(ctx: CanvasRenderingContext2D, bounds: Rectangle) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.pureBlack;
    // Batch all line drawing into a single path
    ctx.beginPath();
    // Path the horizontal lines
    for (let y = bounds.startY; y <= bounds.endY + 1; y++) {
      ctx.moveTo(COORD_TO_PX(bounds.startX), COORD_TO_PX(y));
      ctx.lineTo(COORD_TO_PX(bounds.endX + 1), COORD_TO_PX(y));
    }
    // Path the vertical lines
    for (let x = bounds.startX; x <= bounds.endX + 1; x++) {
      ctx.moveTo(COORD_TO_PX(x), COORD_TO_PX(bounds.startY));
      ctx.lineTo(COORD_TO_PX(x), COORD_TO_PX(bounds.endY + 1));
    }
    // Execute the path!
    ctx.stroke();
  }

  private renderTileNumbers(
    ctx: CanvasRenderingContext2D,
    tileValues: Int16Array,
    bounds: Rectangle
  ) {
    // Set text style
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';

    for (let x = bounds.startX; x <= bounds.endX; x++) {
      for (let y = bounds.startY; y <= bounds.endY; y++) {
        const desirabilityValue = tileValues[COORD_TO_INT16(x, y)];

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
    bounds: Rectangle,
    placedBuildings: Set<Building>
  ) {
    const buildingOutlinesPath = new Path2D();

    for (const building of placedBuildings) {
      if (!building.interceptsRectangle(bounds)) continue;
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

  private renderBuildingLabels(bounds: Rectangle, baseValues: Int16Array) {
    const buildings = this.renderContext.getBuildings();
    const labelsHTML: string[] = []; //Just building these as a raw string is the fastest way to do it, believe it or not.

    for (const building of buildings) {
      if (!building.interceptsRectangle(bounds)) continue;
      const innerLabel = building.getLabel(0);
      if (!innerLabel) continue;

      let labelHeight = COORD_TO_PX(building.height) * this.zoomLevel;
      let labelWidth = COORD_TO_PX(building.width) * this.zoomLevel;

      let labelOrigin;
      if (!this.isRotated) {
        labelOrigin = this.grid2canvas(building.origin);
      } else {
        // Because I couldn't figure out rotation, we do this thing where we position ourselves on the center of the building, rotate, and then go back.
        // We also make ourselves a bit wider and a bit shorter because it looks better with rotated buildings.
        labelHeight -= labelHeight * 0.2;
        labelWidth += labelWidth * 0.2;
        const buildingCenter = {
          x: building.origin.x + building.width / 2,
          y: building.origin.y + building.height / 2,
        };
        labelOrigin = this.grid2canvas(buildingCenter);
        labelOrigin.x -= labelWidth / 2;
        labelOrigin.y -= labelHeight / 2;
      }

      let fontSize;
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
