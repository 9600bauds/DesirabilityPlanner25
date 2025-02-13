import RenderContext from '../interfaces/RenderContext';
import { createBuilding } from '../types/BuildingBlueprint';
import {
  desirabilityColor,
  greenLowTransparency,
  greenMidTransparency,
  pureBlack,
  redHighTransparency,
  redMidTransparency,
  strongOutlineBlack,
  weakOutlineBlack,
} from '../utils/colors';
import { canvasTilePx, gridSize, rotationAngle } from '../utils/constants';
import {
  arePointsEqual,
  createRectangleFromPoints,
  Line,
  Point,
  PointSet,
  Rectangle,
} from '../utils/geometry';
import Building from './Building';

interface CanvasSize {
  width: number;
  height: number;
  pixelRatio: number;
}

class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentSize: CanvasSize = { width: 0, height: 0, pixelRatio: 1 };

  private isGridRotated = false;
  private zoomLevel = 1.0;

  private lastMouseoverTile?: Point = { x: 0, y: 0 };

  // Panning variables
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;
  private panOffsetX = 0;
  private panOffsetY = 0;

  // Clickdrag variables
  private isDragging = false;
  private dragStartTile: Point = { x: 0, y: 0 };
  private dragBox: Rectangle = { origin: { x: 0, y: 0 }, height: 0, width: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get canvas context!');
    this.ctx = ctx;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /*
   * Coordinate transformations
   */
  private coordsToPx(point: Point): Point {
    const x = point.x * canvasTilePx;
    const y = point.y * canvasTilePx;
    return { x, y };
  }

  private pxToCoords(point: Point): Point | undefined {
    // Convert screen coordinates to canvas coordinates
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const canvasX = (point.x - rect.left) * scaleX;
    const canvasY = (point.y - rect.top) * scaleY;

    // Get the inverse of the current transform
    const transform = this.ctx.getTransform();
    const inverseTransform = transform.inverse();

    // Transform the point
    const transformedPoint = new DOMPoint(canvasX, canvasY).matrixTransform(
      inverseTransform
    );

    // Convert to grid coordinates
    const x = Math.floor(transformedPoint.x / canvasTilePx);
    const y = Math.floor(transformedPoint.y / canvasTilePx);

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      return { x, y };
    }
    return undefined;
  }

  public getMouseCoords(event: MouseEvent): Point | undefined {
    return this.pxToCoords({
      x: event.clientX,
      y: event.clientY,
    });
  }

  private rectangleToPx(rectangle: Rectangle): Rectangle {
    const origin = this.coordsToPx(rectangle.origin);
    const width = rectangle.width * canvasTilePx;
    const height = rectangle.height * canvasTilePx;

    return { origin, width, height };
  }

  /*
   * Transformations
   */
  public updateCanvasSize(context: RenderContext) {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    this.canvas.width = displayWidth * pixelRatio;
    this.canvas.height = displayHeight * pixelRatio;

    this.currentSize = {
      width: displayWidth,
      height: displayHeight,
      pixelRatio,
    };

    this.updateTransform();
    this.render(context);
  }

  public toggleGridRotation(context: RenderContext): void {
    this.isGridRotated = !this.isGridRotated;
    this.updateTransform();
    this.render(context);
  }

  public zoomIn(context: RenderContext): void {
    this.zoomLevel *= 1.2;
    this.updateTransform();
    this.render(context);
  }

  public zoomOut(context: RenderContext): void {
    this.zoomLevel /= 1.2;
    this.updateTransform();
    this.render(context);
  }

  private updateTransform() {
    // Reset transform
    this.ctx.setTransform(
      this.currentSize.pixelRatio,
      0,
      0,
      this.currentSize.pixelRatio,
      0,
      0
    );

    // Apply panning
    const centerX = this.currentSize.width / 2;
    const centerY = this.currentSize.height / 2;
    this.ctx.translate(centerX + this.panOffsetX, centerY + this.panOffsetY);

    // Zoom
    this.ctx.scale(this.zoomLevel, this.zoomLevel);

    // Rotation
    if (this.isGridRotated) {
      this.ctx.rotate(rotationAngle);
    }

    // Center the grid
    const gridPixelSize = gridSize * canvasTilePx;
    this.ctx.translate(-gridPixelSize / 2, -gridPixelSize / 2);
  }

  /*
   * Mouse movements
   */

  public startPanning(event: MouseEvent) {
    this.isPanning = true;
    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;
  }

  public handlePanning(event: MouseEvent, context: RenderContext) {
    if (!this.isPanning) return;

    const dragX = event.clientX - this.lastPanX;
    const dragY = event.clientY - this.lastPanY;

    this.panOffsetX += dragX;
    this.panOffsetY += dragY;

    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;

    this.updateTransform();
    this.render(context);
  }

  public stopPanning() {
    this.isPanning = false;
  }

  public startDragging(event: MouseEvent, context: RenderContext) {
    const thisTile = this.getMouseCoords(event);
    if (!thisTile) {
      return;
    }
    this.isDragging = true;
    this.dragStartTile = thisTile;
    this.updateDragBox(thisTile);
    this.render(context);
  }

  //This will explicitly only be called if we're not panning. Thus, we can make our logic per-tile.
  public handleMouseMove(event: MouseEvent, context: RenderContext) {
    const previousTile = this.lastMouseoverTile;
    const thisTile = this.getMouseCoords(event);
    this.lastMouseoverTile = thisTile;

    if (
      !thisTile ||
      (thisTile && previousTile && arePointsEqual(thisTile, previousTile))
    ) {
      return;
    }

    const cursorAction = context.getCursorAction();

    if (this.isDragging) {
      if (event.buttons !== 1) {
        this.stopDragging(context);
      } else {
        this.updateDragBox(thisTile);
      }
      this.render(context);
    } else if (cursorAction == 'placing') {
      this.render(context);
    }
  }

  public handleMouseLeave(context: RenderContext) {
    this.lastMouseoverTile = undefined;
    this.render(context);
  }

  private updateDragBox(newPos: Point) {
    this.dragBox = createRectangleFromPoints(this.dragStartTile, newPos);
  }

  public stopDragging(context: RenderContext) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.render(context);
    return this.dragBox;
  }

  /*
   * Rendering
   */
  private clearCanvas() {
    const originalTransform = this.ctx.getTransform();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(originalTransform);
  }

  private drawNonRotatedText(
    textBoxInTiles: Rectangle,
    text: string,
    color: string = pureBlack,
    fontSize: number = canvasTilePx / 3
  ) {
    const { origin, height, width } = this.rectangleToPx(textBoxInTiles);
    // Text rendering with rotation handling
    if (this.isGridRotated) {
      this.ctx.save();
      this.ctx.translate(origin.x + width / 2, origin.y + height / 2);
      this.ctx.rotate(-rotationAngle);
      this.ctx.translate(-(origin.x + width / 2), -(origin.y + height / 2));
    }

    this.ctx.fillStyle = color;
    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, origin.x + width / 2, origin.y + height / 2);

    // Restore context if rotated
    if (this.isGridRotated) {
      this.ctx.restore();
    }
  }

  private drawRectangle(
    rectInTiles: Rectangle,
    borderColor?: string,
    fillColor?: string,
    lineWidth: number = 2
  ) {
    const { origin, height, width } = this.rectangleToPx(rectInTiles);

    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(origin.x, origin.y, width, height);
    }

    if (borderColor) {
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = lineWidth;
      this.ctx.strokeRect(origin.x, origin.y, width, height);
    }
  }

  private drawPointSetOutline(
    points: PointSet,
    color: string,
    lineWidth: number = 2
  ) {
    if (points.size === 0) return;

    const edges: Line[] = [];

    for (const point of points) {
      // Check all 4 sides of this tile to see if there's any neighboring tiles there
      // Right edge
      if (!points.has({ x: point.x + 1, y: point.y })) {
        edges.push({
          p1: { x: point.x + 1, y: point.y },
          p2: { x: point.x + 1, y: point.y + 1 },
        });
      }
      // Left edge
      if (!points.has({ x: point.x - 1, y: point.y })) {
        edges.push({
          p1: { x: point.x, y: point.y },
          p2: { x: point.x, y: point.y + 1 },
        });
      }
      // Bottom edge
      if (!points.has({ x: point.x, y: point.y + 1 })) {
        edges.push({
          p1: { x: point.x, y: point.y + 1 },
          p2: { x: point.x + 1, y: point.y + 1 },
        });
      }
      // Top edge
      if (!points.has({ x: point.x, y: point.y - 1 })) {
        edges.push({
          p1: { x: point.x, y: point.y },
          p2: { x: point.x + 1, y: point.y },
        });
      }
    }

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();

    for (const edge of edges) {
      const p1Px = this.coordsToPx(edge.p1);
      const p2Px = this.coordsToPx(edge.p2);
      this.ctx.moveTo(p1Px.x, p1Px.y);
      this.ctx.lineTo(p2Px.x, p2Px.y);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawBuilding(building: Building, overlayColor?: string) {
    const boundingBox = building.getRectangleInTiles();
    if (building.fillColor) {
      this.drawRectangle(boundingBox, undefined, building.fillColor);
    }
    if (building.parent) {
      // Do not draw overlays for children
      return;
    }
    if (building.children) {
      for (const child of building.children) {
        this.drawBuilding(child);
      }
    }
    if (overlayColor) {
      for (const tile of building.tilesOccupied) {
        this.drawRectangle(
          { origin: tile, height: 1, width: 1 },
          undefined,
          overlayColor
        );
      }
    }
    if (building.borderColor) {
      this.drawPointSetOutline(building.tilesOccupied, building.borderColor, 1);
    }
    if (building.label) {
      this.drawNonRotatedText(boundingBox, building.label);
    }
  }

  private drawTile(desirabilityValue: number, origin: Point) {
    const boundingBox: Rectangle = { origin, height: 1, width: 1 };
    const fillColor = desirabilityColor(desirabilityValue);
    this.drawRectangle(boundingBox, weakOutlineBlack, fillColor, 1);
    this.drawNonRotatedText(boundingBox, desirabilityValue.toString());
  }

  public render(context: RenderContext) {
    console.log('Rerendering grid...');

    const baseValues = context.getBaseValues();
    const placedBuildings = context.getBuildings();
    const cursorAction = context.getCursorAction();
    const selectedBlueprint = context.getSelectedBlueprint();

    const buildingsBeingRemoved: Set<Building> = new Set();
    const buildingsBeingAdded: Set<Building> = new Set();
    const occupiedTiles: PointSet = new PointSet();

    if (cursorAction === 'placing') {
      if (this.lastMouseoverTile && selectedBlueprint) {
        const virtualBuilding = createBuilding(
          this.lastMouseoverTile,
          selectedBlueprint
        );
        buildingsBeingAdded.add(virtualBuilding);
      }
    } else if (cursorAction === 'erasing') {
      if (this.isDragging) {
        for (const building of placedBuildings) {
          if (building.interceptsRectangle(this.dragBox)) {
            buildingsBeingRemoved.add(building);
          }
        }
      }
    }
    for (const building of placedBuildings) {
      for (const tile of building.tilesOccupied) {
        occupiedTiles.add(tile);
      }
    }
    for (const building of buildingsBeingAdded) {
      for (const tile of building.tilesOccupied) {
        occupiedTiles.add(tile);
      }
    }
    /*for (const building of buildingsBeingRemoved) {
      for (const tile of building.tilesOccupied) {
        occupiedTiles.remove(tile);
      }
    }*/

    this.clearCanvas();

    // Render grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const thisPoint = { x, y };
        if (occupiedTiles.has(thisPoint)) continue;

        let desirabilityForThisTile = baseValues[y][x];
        for (const building of buildingsBeingAdded) {
          desirabilityForThisTile +=
            building.recursiveDesirabilityEffect(thisPoint);
        }
        for (const building of buildingsBeingRemoved) {
          desirabilityForThisTile -=
            building.recursiveDesirabilityEffect(thisPoint);
        }
        this.drawTile(desirabilityForThisTile, { x, y });
      }
    }

    // Render buildings
    for (const building of placedBuildings) {
      const isBeingDeleted = buildingsBeingRemoved.has(building);
      this.drawBuilding(
        building,
        isBeingDeleted ? redMidTransparency : undefined
      );
    }

    for (const virtualBuilding of buildingsBeingAdded) {
      this.drawPointSetOutline(
        virtualBuilding.tilesOccupied,
        strongOutlineBlack,
        3
      );
      const blockedTiles = new PointSet();
      const openTiles = new PointSet();
      for (const tile of virtualBuilding.tilesOccupied) {
        if (context.isTileOccupied(tile)) {
          blockedTiles.add(tile);
        } else {
          openTiles.add(tile);
        }
      }
      if (blockedTiles.size) {
        for (const tile of blockedTiles) {
          this.drawRectangle(
            { origin: tile, height: 1, width: 1 },
            undefined,
            redMidTransparency
          );
        }
        for (const tile of openTiles) {
          this.drawRectangle(
            { origin: tile, height: 1, width: 1 },
            undefined,
            greenMidTransparency
          );
        }
      } else {
        this.drawBuilding(virtualBuilding, greenLowTransparency);
      }
    }

    if (cursorAction === 'erasing' && this.isDragging) {
      this.drawRectangle(this.dragBox, redHighTransparency);
    }
  }
}

export default CanvasRenderer;
