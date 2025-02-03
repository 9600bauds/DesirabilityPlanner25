import { gridSize, rotationAngle } from '../utils/constants';
import { Point, Rectangle } from '../utils/geometry';
import { Building } from './Building';
import GridState from './GridState';
import GridStateManager from './GridStateManager';

interface CanvasSize {
  width: number;
  height: number;
  pixelRatio: number;
}

class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentSize: CanvasSize = { width: 0, height: 0, pixelRatio: 1 };

  private gridState: GridState;

  private isGridRotated = false;
  private tileSize = 45;

  private totalOffsetX = 0;
  private totalOffsetY = 0;

  // Panning variables
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;
  private panOffsetX = 0;
  private panOffsetY = 0;

  // Clickdrag variables
  private isDragging = false;
  private dragStartTile: Point | null = null;
  private dragLastTile: Point | null = null;

  constructor(canvas: HTMLCanvasElement, gridStateManager: GridStateManager) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context!');
    this.ctx = ctx;

    this.gridState = gridStateManager.getActiveGridState();
    gridStateManager.subscribe(this.gridStateUpdated);

    const resizeObserver = new ResizeObserver(() => this.canvasSizeUpdated());
    resizeObserver.observe(canvas);
  }

  private gridStateUpdated = (updatedGridState: GridState) => {
    this.gridState = updatedGridState;
    this.render();
  };

  private canvasSizeUpdated() {
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
    this.render();
  }

  private coordsToPx(point: Point): Point {
    const x = this.totalOffsetX + point.x * this.tileSize;
    const y = this.totalOffsetY + point.y * this.tileSize;
    return { x, y };
  }

  private pxToCoords(point: Point): Point | null {
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
      return null;
    }
  }

  public getMouseCoords(event: MouseEvent): Point | null {
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
    this.canvas.style.cursor = 'grabbing';
  }

  public handlePanning(event: MouseEvent) {
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
    this.render();
  }

  public stopPanning() {
    this.isPanning = false;
    this.canvas.style.cursor = 'default';
  }

  public startDragging(event: MouseEvent) {
    this.isDragging = true;
    this.dragStartTile = this.getMouseCoords(event);
    this.dragLastTile = this.dragStartTile;
  }

  public handleDragging(event: MouseEvent) {
    if (!this.isDragging) return;

    const thisTile = this.getMouseCoords(event);
    if (thisTile === this.dragLastTile) return;
    this.dragLastTile = thisTile;
    console.log(
      'Start: (',
      this.dragStartTile?.x,
      ',',
      this.dragStartTile?.y,
      '), Now: (',
      this.dragLastTile?.x,
      ',',
      this.dragLastTile?.y,
      ')'
    );
  }

  public stopDragging() {
    this.isDragging = false;
  }

  private render() {
    console.log('Rerendering grid...');
    const baseValues = this.gridState.getDesirabilityGrid();
    const placedBuildings = this.gridState.getPlacedBuildings();
    const { width, height } = this.currentSize;

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
        this.renderTile(baseValues[y][x], { x, y });
      }
    }

    // Render buildings
    placedBuildings.forEach((building) => {
      this.drawBuilding(building);
    });

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
    color: null | string = '#f0f0f0',
    borderColor: null | string = 'rgba(0,0,0,0.3)'
  ) {
    const { origin, height, width } = this.rectangleToPx(rectInTiles);

    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(origin.x, origin.y, width, height);
    }

    if (borderColor) {
      this.ctx.strokeStyle = borderColor;
      this.ctx.strokeRect(origin.x, origin.y, width, height);
    }
  }

  private drawBuilding(building: Building) {
    const boundingBox = building.getRectangleInTiles();
    this.drawRectangle(boundingBox, building.color);
    if (building.children) {
      building.children.forEach((child) => {
        this.drawBuilding(child);
      });
    }
    if (building.name) {
      this.drawNonRotatedText(boundingBox, building.name);
    }
  }

  private renderTile(desirabilityValue: number, origin: Point) {
    const boundingBox: Rectangle = { origin, height: 1, width: 1 };
    let color;
    if (desirabilityValue > 0) {
      color = `rgba(0, 200, 0, ${Math.min(1, desirabilityValue / 10)})`;
    } else if (desirabilityValue < 0) {
      color = `rgba(200, 0, 0, ${Math.min(1, Math.abs(desirabilityValue) / 10)})`;
    } else {
      color = '#f0f0f0';
    }
    this.drawRectangle(boundingBox, color);
    this.drawNonRotatedText(boundingBox, desirabilityValue.toString());
  }

  public toggleGridRotation(): void {
    this.isGridRotated = !this.isGridRotated;
    this.render();
  }

  public zoomIn(): void {
    this.tileSize += 5;
    this.updateTotalOffsets();
    this.render();
  }

  public zoomOut(): void {
    if (this.tileSize > 5) {
      this.tileSize -= 5;
    }
    this.updateTotalOffsets();
    this.render();
  }
}

export default CanvasRenderer;
