import { gridSize, rotationAngle } from '../utils/constants';
import { Point, Rectangle } from '../utils/geometry';
import { Building } from './Building';
import { GridState } from './GridState';

interface CanvasSize {
  width: number;
  height: number;
  pixelRatio: number;
}

export class CanvasRenderer {
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
  private dragStartX = 0;
  private dragStartY = 0;
  private panOffsetX = 0;
  private panOffsetY = 0;

  constructor(canvas: HTMLCanvasElement, gridState: GridState) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context!');
    this.ctx = ctx;

    this.gridState = gridState;
    this.gridState.subscribe(() => this.render()); //Rerender when gridstate notifies us of a change

    this.canvasSizeUpdated(); //Initial size setup
  }

  private coordsToPx(point: Point): Point {
    const x = this.totalOffsetX + point.x * this.tileSize;
    const y = this.totalOffsetY + (gridSize - point.y) * this.tileSize;
    return { x, y };
  }

  private rectangleCoordsToPx(rectangle: Rectangle): Rectangle {
    const origin = this.coordsToPx({
      x: rectangle.origin.x,
      y: rectangle.origin.y + rectangle.height,
    });
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

  public canvasSizeUpdated() {
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

  public startPanning(event: MouseEvent) {
    this.isPanning = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.canvas.style.cursor = 'grabbing';
  }

  public handlePanning(event: MouseEvent) {
    if (!this.isPanning) return;

    let dragX = event.clientX - this.dragStartX;
    let dragY = event.clientY - this.dragStartY;

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

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.updateTotalOffsets();
    this.render();
  }

  public stopPanning() {
    this.isPanning = false;
    this.canvas.style.cursor = 'default';
  }

  public getTileUnderMouse(event: MouseEvent): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    let canvasX = event.clientX - rect.left - this.totalOffsetX;
    let canvasY = event.clientY - rect.top - this.totalOffsetY;

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

    const gridX = Math.floor(canvasX / this.tileSize);
    const gridY = gridSize - 1 - Math.floor(canvasY / this.tileSize); // Invert Y for grid coordinates

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      return { x: gridX, y: gridY };
    } else {
      return null;
    }
  }

  private render() {
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
    const { origin, height, width } = this.rectangleCoordsToPx(textBoxInTiles);
    // Text rendering with rotation handling
    if (this.isGridRotated) {
      this.ctx.save();
      this.ctx.translate(origin.x + width / 2, origin.y + height / 2);
      this.ctx.rotate(-rotationAngle);
      this.ctx.translate(-(origin.x + width / 2), -(origin.y + height / 2));
    }

    // Building name or identifier
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

  private drawRectangle(rectInTiles: Rectangle, color: string = '#f0f0f0') {
    const { origin, height, width } = this.rectangleCoordsToPx(rectInTiles);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(origin.x, origin.y, width, height);

    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    this.ctx.strokeRect(origin.x, origin.y, width, height);
  }

  private drawBuilding(building: Building) {
    const boundingBox = building.getRectangleInTiles();
    this.drawRectangle(boundingBox);
    this.drawNonRotatedText(boundingBox, building.name);
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
