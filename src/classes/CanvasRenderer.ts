import RenderGetters from '../interfaces/RenderGetters';
import {
  desirabilityColor,
  greenMidTransparency,
  redHighTransparency,
  redMidTransparency,
  strongOutlineBlack,
  weakOutlineBlack,
} from '../utils/colors';
import { gridSize, rotationAngle } from '../utils/constants';
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
  private tileSize = 45;

  private totalOffsetX = 0;
  private totalOffsetY = 0;

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
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context!');
    this.ctx = ctx;
  }

  public updateCanvasSize(getters: RenderGetters) {
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

    this.ctx.scale(pixelRatio, pixelRatio);
    this.updateTotalOffsets();
    this.render(getters);
  }

  private coordsToPx(point: Point): Point {
    const x = this.totalOffsetX + point.x * this.tileSize;
    const y = this.totalOffsetY + point.y * this.tileSize;
    return { x, y };
  }

  private pxToCoords(point: Point): Point | undefined {
    const rect = this.canvas.getBoundingClientRect();
    let canvasX = point.x - rect.left - this.totalOffsetX;
    let canvasY = point.y - rect.top - this.totalOffsetY;

    // Apply pixel ratio inverse to mouse coordinates //Seems to cause bugs on other monitors?
    //canvasX *= this.currentSize.pixelRatio;
    //canvasY *= this.currentSize.pixelRatio;s

    if (this.isGridRotated) {
      const gridSizePixels = gridSize * this.tileSize;
      const centerX = gridSizePixels / 2 - this.panOffsetX;
      const centerY = gridSizePixels / 2 - this.panOffsetY;

      const cosAngle = Math.cos(rotationAngle);
      const sinAngle = Math.sin(rotationAngle);

      const relativeX = canvasX - centerX;
      const relativeY = canvasY - centerY;

      canvasX = relativeX * cosAngle + relativeY * sinAngle + centerX;
      canvasY = -relativeX * sinAngle + relativeY * cosAngle + centerY;
    }

    const x = Math.floor(canvasX / this.tileSize);
    const y = Math.floor(canvasY / this.tileSize);

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      return { x, y };
    } else {
      return undefined;
    }
  }

  public getMouseCoords(event: MouseEvent): Point | undefined {
    return this.pxToCoords({
      x: event.clientX,
      y: event.clientY,
    });
  }

  private rectangleToPx(rectangle: Rectangle): Rectangle {
    const origin = this.coordsToPx(rectangle.origin);
    const width = rectangle.width * this.tileSize;
    const height = rectangle.height * this.tileSize;

    return { origin, width, height };
  }

  private updateTotalOffsets() {
    this.totalOffsetX =
      (this.currentSize.width - gridSize * this.tileSize) / 2 + this.panOffsetX;
    this.totalOffsetY =
      (this.currentSize.height - gridSize * this.tileSize) / 2 +
      this.panOffsetY;
  }

  public startPanning(event: MouseEvent) {
    this.isPanning = true;
    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;
  }

  public handlePanning(event: MouseEvent, getters: RenderGetters) {
    if (!this.isPanning) return;

    let dragX = event.clientX - this.lastPanX;
    let dragY = event.clientY - this.lastPanY;

    if (this.isGridRotated) {
      const cosAngle = Math.cos(rotationAngle);
      const sinAngle = Math.sin(rotationAngle);

      // Apply inverse rotation to the drag vector
      const rotatedDragX = dragX * cosAngle + dragY * sinAngle;
      const rotatedDragY = -dragX * sinAngle + dragY * cosAngle;

      dragX = rotatedDragX;
      dragY = rotatedDragY;
    }

    this.panOffsetX += dragX;
    this.panOffsetY += dragY;

    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;

    this.updateTotalOffsets();
    this.render(getters);
  }

  public stopPanning() {
    this.isPanning = false;
  }

  public startDragging(event: MouseEvent, getters: RenderGetters) {
    const thisTile = this.getMouseCoords(event);
    if (!thisTile) {
      return;
    }
    this.isDragging = true;
    this.dragStartTile = thisTile;
    this.updateDragBox(thisTile, getters);
    this.render(getters);
  }

  //This will explicitly only be called if we're not panning. Thus, we can make our logic per-tile.
  public handleMouseMove(event: MouseEvent, getters: RenderGetters) {
    const previousTile = this.lastMouseoverTile;
    const thisTile = this.getMouseCoords(event);
    this.lastMouseoverTile = thisTile;

    if (
      !thisTile ||
      (thisTile && previousTile && arePointsEqual(thisTile, previousTile))
    ) {
      return;
    }

    const cursorAction = getters.getCursorAction();

    if (this.isDragging) {
      if (event.buttons !== 1) {
        this.stopDragging(getters);
      } else {
        this.updateDragBox(thisTile, getters);
      }
      this.render(getters);
    } else if (cursorAction == 'placing') {
      this.render(getters);
    }
  }

  public handleMouseLeave(getters: RenderGetters) {
    this.lastMouseoverTile = undefined;
    this.render(getters);
  }

  private updateDragBox(newPos: Point, getters: RenderGetters) {
    this.dragBox = createRectangleFromPoints(this.dragStartTile, newPos);
  }

  public stopDragging(getters: RenderGetters) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.render(getters);
    return this.dragBox;
  }

  public render(getters: RenderGetters) {
    console.log('Rerendering grid...');
    const { width, height } = this.currentSize;
    const baseValues = getters.getBaseValues();
    const placedBuildings = getters.getBuildings();
    const cursorAction = getters.getCursorAction();
    const selectedBlueprint = getters.getSelectedBlueprint();

    const buildingsBeingRemoved: Set<Building> = new Set();
    const buildingsBeingAdded: Set<Building> = new Set();
    const occupiedTiles: PointSet = new PointSet();

    if (cursorAction === 'placing') {
      if (this.lastMouseoverTile && selectedBlueprint) {
        const virtualBuilding = new Building(
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
      for (const tile of building.getTilesOccupied()) {
        occupiedTiles.add(tile);
      }
    }
    for (const building of buildingsBeingAdded) {
      for (const tile of building.getTilesOccupied()) {
        occupiedTiles.add(tile);
      }
    }
    for (const building of buildingsBeingRemoved) {
      for (const tile of building.getTilesOccupied()) {
        occupiedTiles.remove(tile);
      }
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Handle rotation
    if (this.isGridRotated) {
      this.ctx.save();
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate(rotationAngle);
      this.ctx.translate(-width / 2, -height / 2);
    }

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
        this.renderTile(desirabilityForThisTile, { x, y });
      }
    }

    // Render buildings
    for (const building of placedBuildings) {
      const isBeingDeleted = buildingsBeingRemoved.has(building);
      this.drawBuilding(building, isBeingDeleted);
    }

    for (const virtualBuilding of buildingsBeingAdded) {
      this.drawPointSetOutline(
        virtualBuilding.getTilesOccupied(),
        strongOutlineBlack,
        3
      );
      for (const tile of virtualBuilding.getTilesOccupied()) {
        if (getters.isTileOccupied(tile)) {
          this.drawRectangle(
            { origin: tile, height: 1, width: 1 },
            undefined,
            redMidTransparency
          );
        } else {
          this.drawRectangle(
            { origin: tile, height: 1, width: 1 },
            undefined,
            greenMidTransparency
          );
        }
      }
    }

    if (cursorAction === 'erasing' && this.isDragging) {
      this.drawRectangle(this.dragBox, redHighTransparency);
    }

    if (this.isGridRotated) {
      this.ctx.restore();
    }
  }

  private drawNonRotatedText(
    textBoxInTiles: Rectangle,
    text: string,
    color: string = '#000000',
    fontSize: number = this.tileSize / 3
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
    color: string = 'rgba(0,0,0,0.8)',
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

  private drawBuilding(building: Building, isBeingDeleted = false) {
    const boundingBox = building.getRectangleInTiles();
    if (building.color) {
      this.drawRectangle(boundingBox, undefined, building.color);
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
    if (isBeingDeleted) {
      for (const tile of building.getTilesOccupied()) {
        this.drawRectangle(
          { origin: tile, height: 1, width: 1 },
          undefined,
          redMidTransparency
        );
      }
    }
    if (building.borderColor) {
      this.drawPointSetOutline(
        building.getTilesOccupied(),
        building.borderColor,
        2
      );
    }
    if (building.label) {
      this.drawNonRotatedText(boundingBox, building.label);
    }
  }

  private renderTile(desirabilityValue: number, origin: Point) {
    const boundingBox: Rectangle = { origin, height: 1, width: 1 };
    const fillColor = desirabilityColor(desirabilityValue);
    this.drawRectangle(boundingBox, weakOutlineBlack, fillColor, 1);
    this.drawNonRotatedText(boundingBox, desirabilityValue.toString());
  }

  public toggleGridRotation(getters: RenderGetters): void {
    this.isGridRotated = !this.isGridRotated;
    this.render(getters);
  }

  public zoomIn(getters: RenderGetters): void {
    this.tileSize += 5;
    this.updateTotalOffsets();
    this.render(getters);
  }

  public zoomOut(getters: RenderGetters): void {
    if (this.tileSize > 5) {
      this.tileSize -= 5;
    }
    this.updateTotalOffsets();
    this.render(getters);
  }
}

export default CanvasRenderer;
