import { fillPath } from '../interfaces/BuildingGraphic';
import RenderContext from '../interfaces/RenderContext';
import { createBuilding } from '../types/Blueprint';
import colors, { getDesirabilityRGB } from '../utils/colors';
import {
  GRID_CENTER_PX,
  GRID_TOTAL_PX,
  COORD_TO_PX,
  PX_TO_COORD,
  COORD_TO_UINT16,
  ROTATION_RADS,
  GRID_MAX_X,
  GRID_MAX_Y,
  ROTATE_AROUND_ORIGIN,
  COUNTERROTATE_AROUND_ORIGIN,
  CELL_PX,
  MIN_LABEL_FONTSIZE_WITH_BREAKS,
  MIN_ZOOM_FOR_LABELS,
  ZOOM_SENSITIVITY_FACTOR,
  MAX_ZOOM,
  MIN_ZOOM,
  MIN_LABEL_FONTSIZE_WITHOUT_BREAKS,
} from '../utils/constants';
import { smallestFontSizeInBounds } from '../utils/fonts';
import { Tile, Rectangle, Coordinate } from '../utils/geometry';
import Building from './Building';
import { isInteractionActive } from '../types/InteractionState';
import { getClientCoordinates } from '../utils/events';
import { InteractionEvent } from '../types/InteractionEvent';

class CanvasRenderer {
  // Settings
  public transparentBuildings: boolean = false;

  // Rendering system
  private pendingRerender: number | null = null;
  private pendingPreview: number | null = null;
  private renderContext: RenderContext;

  // DOM elements
  private parentContainer: HTMLDivElement;
  private labelContainer: HTMLElement;
  private mainLayers: Record<string, CanvasRenderingContext2D> = {};
  private previewLayers: Record<string, CanvasRenderingContext2D> = {};

  // Size variables
  private clientWidth: number;
  private clientHeight: number;
  private devicePixelRatio: number;

  // Transform state
  public isRotated: boolean = false;
  private zoomLevel: number = 1.0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  get viewCenter(): Coordinate {
    return [this.clientWidth / 2, this.clientHeight / 2];
  }

  constructor(parentContainer: HTMLDivElement, renderContext: RenderContext) {
    const createCtx = (
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
        //desynchronized: true, //Seems to cause issues in mobile?
      }) as CanvasRenderingContext2D;
      return ctx;
    };

    const createTextDiv = (id: string, zIndex: number): HTMLElement => {
      const div = document.createElement('div');
      div.id = id;
      div.className = 'textLayer';
      div.style.zIndex = zIndex.toString();
      this.parentContainer.appendChild(div);

      return div;
    };

    this.parentContainer = parentContainer;
    this.renderContext = renderContext;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Store dimensions
    this.clientWidth = parentContainer.clientWidth;
    this.clientHeight = parentContainer.clientHeight;

    // Create canvas elements
    this.labelContainer = createTextDiv('label-container', 99);

    this.previewLayers.overlays = createCtx('overlays-preview', 73);
    this.previewLayers.outlines = createCtx('outlines-preview', 72);
    this.mainLayers.outlines = createCtx('outlines-main', 71);
    this.previewLayers.buildings = createCtx('buildings-preview', 62);
    this.mainLayers.buildings = createCtx('buildings-main', 61);

    this.mainLayers.gridLines = createCtx('gridlines-main', 50);

    this.previewLayers.tileNumbers = createCtx('tilenumbers-preview', 22);
    this.previewLayers.tiles = createCtx('tiles-preview', 21);
    this.mainLayers.tileNumbers = createCtx('tilenumbers-main', 12);
    this.mainLayers.tiles = createCtx('tiles-main', 11);

    // Center view
    this.focusOnGridPoint([GRID_CENTER_PX, GRID_CENTER_PX]);

    // Go ahead and get us started here
    this.scheduleRerender();
  }

  public destroy = () => {
    this.parentContainer.removeChild(this.labelContainer);
    for (const ctx of Object.values(this.mainLayers)) {
      this.parentContainer.removeChild(ctx.canvas);
    }
    this.mainLayers = {};
    for (const ctx of Object.values(this.previewLayers)) {
      this.parentContainer.removeChild(ctx.canvas);
    }
    this.previewLayers = {};
  };

  /**
   * @param newContext Partial RenderContext, updates only the properties that were provided
   */
  public updateRenderContext(newContext: Partial<RenderContext>): void {
    this.renderContext = {
      ...this.renderContext,
      ...newContext,
    };
  }

  // === MOUSE HANDLING ===

  /**
   * @param event Mouse event, touch event, or similar. NOT a React event.
   * @returns True if the mouse is on top of the canvas, false if it's on top of another element or out of bounds
   */
  public isMouseInsideCanvas = (event: InteractionEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      // This case should ideally not happen with standard DOM events
      return false;
    }
    const targetNode: Node = target;
    return (
      targetNode === this.parentContainer &&
      this.parentContainer.contains(targetNode)
    );
  };

  /**
   * @param event Mouse event, touch event, or similar. NOT a React event.
   * @param allowOutsideViewport If false, will return null when the mouse is outside the canvas (i.e. is on top of a menu, the sidebar, or has left the window entirely)
   * @returns The Tile currently underneath the mouse, or null if no such tile exists (out of bounds).
   */
  public getMouseCoords = (
    event: InteractionEvent,
    allowOutsideViewport = false
  ): Tile | null => {
    const point = getClientCoordinates(event);
    if (!allowOutsideViewport && !this.isMouseInsideCanvas(event)) {
      return null; //This is outside our viewport!
    }

    const gridPt = this.screen2tile(point);
    // Convert to tile coordinates
    const tileX = Math.min(GRID_MAX_X, Math.max(0, PX_TO_COORD(gridPt.x)));
    const tileY = Math.min(GRID_MAX_Y, Math.max(0, PX_TO_COORD(gridPt.y)));

    return new Tile(tileX, tileY);
  };

  // === COORDINATE TRANSFORMATIONS ===

  /**
   * @param tile A tile (point corresponding a visible square in the grid)
   * @param rotate Whether to apply rotation or not, defaults to matching the current rotation state
   * @returns The X Y coordinates of where in the screen the top-left corner of that tile would be. It is not guaranteed to be inside the screen (can be a negative or very large number.)
   */
  private tile2screen = (tile: Tile, rotate = this.isRotated): Coordinate => {
    let point = tile.toCoordinate();
    if (rotate) point = ROTATE_AROUND_ORIGIN(point);
    return [
      COORD_TO_PX(point[0]) * this.zoomLevel + this.offsetX,
      COORD_TO_PX(point[1]) * this.zoomLevel + this.offsetY,
    ];
  };

  /**
   * @param coord A set of X Y coordinates corresponding to a point in the visible screen.
   * @param rotate Whether to apply rotation or not, defaults to matching the current rotation state
   * @returns A tile (point corresponding a visible square in the grid). It is not guaranteed to be a tile within bounds of the grid's limits (e.g. can be negative).
   */
  private screen2tile = (coord: Coordinate, rotate = this.isRotated): Tile => {
    const x = (coord[0] - this.offsetX) / this.zoomLevel;
    const y = (coord[1] - this.offsetY) / this.zoomLevel;
    let point: Coordinate = [x, y];
    if (rotate) point = COUNTERROTATE_AROUND_ORIGIN(point);
    return Tile.fromCoordinate(point);
  };

  /**
   * Gets the smallest axis-aligned rectangle that contains all grid tiles in view.
   */
  public getRectInView = (): {
    coordsRect: Rectangle;
    tilesRect: Rectangle;
  } => {
    // Currently, this function uses a very simple and slightly wasteful algorithm.
    // In order to handle grid rotation, we need to get the axis-aligned bounding box of all four corners of the viewport.
    // This means that when the grid is rotated, up to 50% of the tiles we render are wasted effort since they're offscreen!
    // We could further optimize this by memoizing most of this logic and only updating it when the rotation or client height/width change.
    // However, fixing that is tricky without messing with the SIMD optimization. And there are much more significant optimizations we should do, first.
    let minX: number, minY: number, maxX: number, maxY: number;
    if (!this.isRotated) {
      const topLeft = this.screen2tile([0, 0]);
      const bottomRight = this.screen2tile([
        this.clientWidth,
        this.clientHeight,
      ]);

      minX = topLeft.x;
      minY = topLeft.y;
      maxX = bottomRight.x;
      maxY = bottomRight.y;
    } else {
      // For a rotated grid, we need the 4 corners
      const corners = [
        this.screen2tile([0, 0]), // top-left
        this.screen2tile([this.clientWidth, 0]), // top-right
        this.screen2tile([0, this.clientHeight]), // bottom-left
        this.screen2tile([this.clientWidth, this.clientHeight]), // bottom-right
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
  };

  // === VIEWPORT MANIPULATION ===

  /**
   * Update the viewport offset directly (for panning)
   */
  public panningUpdate(newPixel: Coordinate, oldPixel: Coordinate | null) {
    if (!oldPixel) return;
    const deltaX = newPixel[0] - oldPixel[0];
    const deltaY = newPixel[1] - oldPixel[1];
    if (deltaX !== 0 || deltaY !== 0) {
      this.updateOffset(deltaX, deltaY);
    }
  }

  public updateOffset(deltaX: number, deltaY: number): void {
    this.offsetX += deltaX;
    this.offsetY += deltaY;
    this.scheduleRerender();
  }

  public toggleGridRotation = (): void => {
    const oldCenter = this.screen2tile(this.viewCenter);

    this.isRotated = !this.isRotated;

    // Recenter view
    this.focusOnGridPoint(oldCenter.toCoordinate());
  };

  /**
   * Focuses the view on a desired grid coordinate.
   * @param gridPointCoord The point that you want to be focused on.
   * @param targetCanvasPoint The point on the canvas (CSS pixels) that the focus point should occupy afterwards. Defaults to the center of the screen.
   */
  public focusOnGridPoint = (
    gridPointCoord: Coordinate,
    targetCanvasPoint: Coordinate = this.viewCenter
  ): void => {
    if (this.isRotated) {
      gridPointCoord = ROTATE_AROUND_ORIGIN(gridPointCoord);
    }
    this.offsetX = targetCanvasPoint[0] - gridPointCoord[0] * this.zoomLevel;
    this.offsetY = targetCanvasPoint[1] - gridPointCoord[1] * this.zoomLevel;

    this.scheduleRerender(); // Schedule a rerender as the view has changed
  };

  /**
   * Zoom in towards the center of the view
   */
  public zoomIn = () => {
    this.zoom(1.2, this.viewCenter);
  };
  /**
   * Zoom out from the center of the view
   */
  public zoomOut = () => {
    this.zoom(1 / 1.2, this.viewCenter);
  };

  private zoom = (factor: number, targetCanvasPoint: Coordinate): void => {
    const gridPointBeforeZoom = this.screen2tile(targetCanvasPoint);

    this.zoomLevel *= factor;
    this.zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoomLevel));

    this.focusOnGridPoint(
      gridPointBeforeZoom.toCoordinate(),
      targetCanvasPoint
    );
  };

  public handleWheelZoom = (event: WheelEvent): void => {
    event.preventDefault();

    if (event.deltaY === 0) return;
    const zoomFactor = Math.pow(ZOOM_SENSITIVITY_FACTOR, -event.deltaY);

    const mouseCanvasPos = getClientCoordinates(event);

    this.zoom(zoomFactor, mouseCanvasPos);
  };

  public canZoomIn = () => {
    return this.zoomLevel < MAX_ZOOM;
  };
  public canZoomOut = () => {
    return this.zoomLevel > MIN_ZOOM;
  };

  // Size handling
  public updateDimensions = (width: number, height: number): void => {
    if (width !== this.clientWidth || height !== this.clientHeight) {
      this.clientWidth = width;
      this.clientHeight = height;
      this.scheduleRerender();
    }
  };

  // Building transparency
  public setBuildingTransparency = (newSetting: boolean): void => {
    this.transparentBuildings = newSetting;

    if (this.transparentBuildings) {
      this.mainLayers.buildings.canvas.style.opacity = '0.5';
    } else {
      this.mainLayers.buildings.canvas.style.opacity = '1';
    }
  };
  public toggleBuildingTransparency = (): void => {
    this.setBuildingTransparency(!this.transparentBuildings);
  };

  // === RENDERING METHODS ===

  /**
   * Schedule a full rerender
   */
  public scheduleRerender = (): void => {
    if (!this.pendingRerender) {
      this.pendingRerender = requestAnimationFrame(
        this.fullRerender.bind(this)
      );
    }
  };

  /**
   * Schedule a preview update
   */
  public schedulePreview = (): void => {
    if (!this.pendingPreview) {
      this.pendingPreview = requestAnimationFrame(this.preview.bind(this));
    }
  };

  /**
   * Clear this canvas context in an optimized way.
   */
  private fastClearCtx = (
    ctx: CanvasRenderingContext2D,
    rotate = this.isRotated
  ) => {
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
  };

  private hideLayer = (layer: CanvasRenderingContext2D) => {
    layer.canvas.style.opacity = '0';
  };
  private showLayer = (layer: CanvasRenderingContext2D) => {
    layer.canvas.style.opacity = '1';
  };

  private hideLayers = (layers: Record<string, CanvasRenderingContext2D>) => {
    for (const ctx of Object.values(layers)) {
      this.hideLayer(ctx);
    }
  };

  /**
   * Preview method that uses external interaction state
   */
  private preview = () => {
    this.pendingPreview = null;
    if (this.pendingRerender) return;

    // Get current interaction state from render context
    const interactionState = this.renderContext.getInteractionState();

    const viewport = this.getRectInView();
    if (viewport.tilesRect.height < 1 || viewport.tilesRect.width < 1) {
      return;
    }

    const selectedBlueprint = this.renderContext.getSelectedBlueprint();
    const placedBuildings = this.renderContext.getBuildings();
    const baseValues = this.renderContext.getBaseValues();

    const buildingsBeingAdded: Set<Building> = new Set();
    const buildingsBeingRemoved: Set<Building> = new Set();

    // Process based on interaction type and tile state
    if (
      interactionState.type === 'placing' &&
      interactionState.currentTile &&
      selectedBlueprint
    ) {
      buildingsBeingAdded.add(
        createBuilding(interactionState.currentTile, selectedBlueprint)
      );
    } else if (
      interactionState.type === 'erasing' &&
      isInteractionActive(interactionState) &&
      interactionState.dragBox
    ) {
      for (const building of placedBuildings) {
        if (building.interceptsRectangle(interactionState.dragBox)) {
          buildingsBeingRemoved.add(building);
        }
      }
    }

    const modifiedValues = new Int16Array(baseValues); // Let's clone the base values so we can do our own calculations.
    const modifiedAreas: Set<Rectangle> = new Set();
    const buildingsToRender = new Set<Building>(); // We don't rerender the base buildings
    const outlinesToRender = new Set<Building>();
    const labelsToRender = new Set<Building>(placedBuildings); // Since it's hard to rerender -only- some buildings, let's just do a full update.
    const overlaysToRender: fillPath[] = [];

    for (const virtualBuilding of buildingsBeingAdded) {
      for (const dbox of virtualBuilding.desireBoxes) {
        dbox.apply(modifiedValues);
        modifiedAreas.add(dbox.affectedBounds);
      }
    }
    for (const erasedBuilding of buildingsBeingRemoved) {
      for (const dbox of erasedBuilding.desireBoxes) {
        dbox.apply(modifiedValues, -1);
        modifiedAreas.add(dbox.affectedBounds);
      }
    }

    let modifiedArea = Rectangle.boundingBoxOfSet(modifiedAreas);
    if (modifiedArea) {
      modifiedArea = Rectangle.intersection(modifiedArea, viewport.tilesRect);
    }
    if (modifiedArea) {
      this.renderTiles(this.previewLayers.tiles, modifiedValues, modifiedArea);
      this.showLayer(this.previewLayers.tiles);
    } else {
      this.hideLayer(this.previewLayers.tiles);
    }
    if (modifiedArea && this.zoomLevel > MIN_ZOOM_FOR_LABELS) {
      this.renderTileNumbers(
        this.previewLayers.tileNumbers,
        modifiedValues,
        modifiedArea
      );
      this.showLayer(this.previewLayers.tileNumbers);
    } else {
      this.hideLayer(this.previewLayers.tileNumbers);
    }

    for (const virtualBuilding of buildingsBeingAdded) {
      outlinesToRender.add(virtualBuilding);
      const blockedTiles: Tile[] = [];
      const openTiles: Tile[] = [];
      for (const tile of virtualBuilding.tilesOccupied.toArray()) {
        if (this.renderContext.isTileOccupied(tile)) {
          blockedTiles.push(tile);
        } else {
          openTiles.push(tile);
        }
      }
      const canPlaceBuilding = blockedTiles.length === 0;
      if (canPlaceBuilding) {
        buildingsToRender.add(virtualBuilding);
        labelsToRender.add(virtualBuilding);
        if (virtualBuilding.graphic)
          overlaysToRender.push({
            path: virtualBuilding.graphic.outline,
            fillColor: colors.greenMidTransparency,
          });
      } else {
        for (const tile of blockedTiles) {
          const path = new Path2D();
          path.rect(COORD_TO_PX(tile.x), COORD_TO_PX(tile.y), CELL_PX, CELL_PX);
          overlaysToRender.push({ path, fillColor: colors.redMidTransparency });
        }
        for (const tile of openTiles) {
          const path = new Path2D();
          path.rect(COORD_TO_PX(tile.x), COORD_TO_PX(tile.y), CELL_PX, CELL_PX);
          overlaysToRender.push({
            path,
            fillColor: colors.greenMidTransparency,
          });
        }
      }
    }
    for (const erasedBuilding of buildingsBeingRemoved) {
      if (erasedBuilding.graphic)
        overlaysToRender.push({
          path: erasedBuilding.graphic.outline,
          fillColor: colors.redMidTransparency,
        });
    }

    if (buildingsToRender.size > 0) {
      this.renderBuildings(
        this.previewLayers.buildings,
        viewport.tilesRect,
        buildingsToRender
      );
      this.showLayer(this.previewLayers.buildings);
    } else {
      this.hideLayer(this.previewLayers.buildings);
    }

    if (outlinesToRender.size > 0) {
      this.renderBuildingOutlines(
        this.previewLayers.outlines,
        viewport.tilesRect,
        outlinesToRender
      );
      this.showLayer(this.previewLayers.outlines);
    } else {
      this.hideLayer(this.previewLayers.outlines);
    }

    this.renderOverlays(this.previewLayers.overlays, overlaysToRender);
    if (
      interactionState.type === 'erasing' &&
      isInteractionActive(interactionState) &&
      interactionState.dragBox
    ) {
      this.renderDragBox(
        this.previewLayers.overlays,
        interactionState.dragBox,
        colors.redHighTransparency,
        colors.redVeryLowTransparency
      );
    }
    this.showLayer(this.previewLayers.overlays);

    this.renderBuildingLabels(
      this.labelContainer,
      viewport.tilesRect,
      labelsToRender,
      modifiedValues
    );
  };

  /*
   * Actual rendering methods
   */
  private fullRerender = (): void => {
    this.pendingRerender = null;
    this.pendingPreview = null; //Cancel any previews too

    this.hideLayers(this.previewLayers);

    const viewport = this.getRectInView();
    if (viewport.tilesRect.height < 1 || viewport.tilesRect.width < 1) {
      return; //We are fully offscreen! //todo: prevent this from happening to begin with!
    }

    const placedBuildings = this.renderContext.getBuildings();
    const baseValues = this.renderContext.getBaseValues(); // These are the precomputed desirability values from the "true" gridstate.

    this.renderTiles(this.mainLayers.tiles, baseValues, viewport.tilesRect);

    if (this.zoomLevel > MIN_ZOOM_FOR_LABELS) {
      this.renderTileNumbers(
        this.mainLayers.tileNumbers,
        baseValues,
        viewport.tilesRect
      );
      this.showLayer(this.mainLayers.tileNumbers);
    } else {
      this.hideLayer(this.mainLayers.tileNumbers);
    }

    this.renderGridlines(this.mainLayers.gridLines, viewport.tilesRect);

    this.renderBuildingOutlines(
      this.mainLayers.outlines,
      viewport.tilesRect,
      placedBuildings
    );

    this.renderBuildings(
      this.mainLayers.buildings,
      viewport.tilesRect,
      placedBuildings
    );

    this.renderBuildingLabels(
      this.labelContainer,
      viewport.tilesRect,
      placedBuildings,
      baseValues
    );
  };

  private renderTiles = (
    ctx: CanvasRenderingContext2D,
    tileValues: Int16Array,
    bounds: Rectangle
  ) => {
    // Even though canvases are "just bitmaps", and so, it shouldn't be a problem to draw on top of the previous frame...
    // NOT clearing the previous frame inexplicably causes setTransform() to be extremely slow. Even though we're clearing it AFTER the setTransform().
    // I have no idea how this works, I've been unable to find any explanation, and at this point, I've given up trying to understand.
    // Suffice to say, this clear is VITAL for performance, even though we shouldn't need it and it makes no sense.
    this.fastClearCtx(ctx);

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
        const thisVal = tileValues[COORD_TO_UINT16([x, y])];
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
  };

  private renderGridlines = (
    ctx: CanvasRenderingContext2D,
    bounds: Rectangle
  ) => {
    this.fastClearCtx(ctx);

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
  };

  private renderTileNumbers = (
    ctx: CanvasRenderingContext2D,
    tileValues: Int16Array,
    bounds: Rectangle
  ) => {
    this.fastClearCtx(ctx, false); //We intentionally do not rotate!
    // Set text style
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';

    for (let x = bounds.startX; x <= bounds.endX; x++) {
      for (let y = bounds.startY; y <= bounds.endY; y++) {
        const desirabilityValue = tileValues[COORD_TO_UINT16([x, y])];

        if (desirabilityValue === 0) continue;

        // Get the center point of this tile in canvas space
        let centerPoint: Coordinate = [
          COORD_TO_PX(x + 0.5),
          COORD_TO_PX(y + 0.5),
        ];

        if (this.isRotated) {
          centerPoint = ROTATE_AROUND_ORIGIN(centerPoint);
        }

        // Draw the text at screen coordinates without any rotation
        const valueText = desirabilityValue.toString();
        ctx.strokeText(valueText, centerPoint[0], centerPoint[1]);
        ctx.fillText(valueText, centerPoint[0], centerPoint[1]);
      }
    }
  };

  private renderBuildingOutlines = (
    ctx: CanvasRenderingContext2D,
    bounds: Rectangle,
    placedBuildings: Set<Building>
  ) => {
    this.fastClearCtx(ctx);
    const buildingOutlinesPath = new Path2D();
    for (const building of placedBuildings) {
      if (!building.interceptsRectangle(bounds)) continue;
      if (!building.graphic) continue;

      buildingOutlinesPath.addPath(building.graphic.outline);
    }
    ctx.strokeStyle = colors.pureBlack;
    ctx.lineWidth = 2;
    ctx.stroke(buildingOutlinesPath);
  };

  private renderBuildings = (
    ctx: CanvasRenderingContext2D,
    bounds: Rectangle,
    placedBuildings: Set<Building>
  ) => {
    this.fastClearCtx(ctx);
    for (const building of placedBuildings) {
      if (!building.interceptsRectangle(bounds)) continue;
      if (!building.graphic) continue;

      for (const pathFill of building.graphic.fillPaths) {
        ctx.fillStyle = pathFill.fillColor;
        ctx.fill(pathFill.path);
      }
    }
  };

  private renderOverlays = (
    ctx: CanvasRenderingContext2D,
    overlays: fillPath[]
  ) => {
    this.fastClearCtx(ctx);
    for (const overlay of overlays) {
      ctx.fillStyle = overlay.fillColor;
      ctx.fill(overlay.path);
    }
  };

  private renderDragBox = (
    ctx: CanvasRenderingContext2D,
    dragBox: Rectangle,
    strokeColor: string,
    fillColor: string
  ) => {
    // We do not clear the ctx here! Or check for bounds!
    const path = new Path2D();
    path.rect(
      COORD_TO_PX(dragBox.origin.x),
      COORD_TO_PX(dragBox.origin.y),
      COORD_TO_PX(dragBox.width),
      COORD_TO_PX(dragBox.height)
    );
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke(path);
    ctx.fillStyle = fillColor;
    ctx.fill(path);
  };

  private renderBuildingLabels = (
    div: HTMLElement,
    bounds: Rectangle,
    buildings: Set<Building>,
    tileValues: Int16Array
  ) => {
    const labelsHTML: string[] = []; //Just building these as a raw string is the fastest way to do it, believe it or not.

    for (const building of buildings) {
      if (!building.interceptsRectangle(bounds)) continue;

      const innerLabel = building.getLabel(tileValues);
      if (!innerLabel) continue;

      let labelHeight = COORD_TO_PX(building.height) * this.zoomLevel;
      let labelWidth = COORD_TO_PX(building.width) * this.zoomLevel;

      let labelOrigin;
      if (!this.isRotated) {
        labelOrigin = this.tile2screen(building.origin);
      } else {
        // Because I couldn't figure out rotation, we do this thing where we position ourselves on the center of the building, rotate, and then go back.
        // We also make ourselves a bit wider and a bit shorter because it looks better with rotated buildings.
        labelHeight -= labelHeight * 0.2;
        labelWidth += labelWidth * 0.2;
        const buildingCenter = new Tile(
          building.origin.x + building.width / 2,
          building.origin.y + building.height / 2
        );
        labelOrigin = this.tile2screen(buildingCenter);
        labelOrigin[0] -= labelWidth / 2;
        labelOrigin[1] -= labelHeight / 2;
      }

      let fontSize;
      //prettier-ignore
      const fontWithBreaks = smallestFontSizeInBounds(innerLabel, labelWidth, labelHeight, true);
      //prettier-ignore
      const fontWithoutBreaks = smallestFontSizeInBounds(innerLabel, labelWidth, labelHeight, false);
      if (fontWithoutBreaks >= MIN_LABEL_FONTSIZE_WITHOUT_BREAKS) {
        fontSize = fontWithoutBreaks;
      } else if (fontWithBreaks >= MIN_LABEL_FONTSIZE_WITH_BREAKS) {
        fontSize = fontWithBreaks;
      } else {
        continue;
      }

      const labelHTML = `
        <div
          id='label-${building.id}'
          class='building-label'
          style="
            left: ${labelOrigin[0]}px;
            top: ${labelOrigin[1]}px;
            width: ${labelWidth}px;
            height: ${labelHeight}px;
            font-size: ${fontSize}px;
          "
        >
          ${innerLabel}
        </div>`;
      labelsHTML.push(labelHTML);
    }
    div.innerHTML = labelsHTML.join('');
  };
}

export default CanvasRenderer;
