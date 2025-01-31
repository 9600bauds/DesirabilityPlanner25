import { gridSize, rotationAngle } from '../utils/constants';
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

    this.render();
  }

  public stopPanning() {
    this.isPanning = false; // Ensure panning is off for other actions
    this.canvas.style.cursor = 'default';
  }

  public getTileUnderMouse(event: MouseEvent): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    let canvasX = event.clientX - rect.left;
    let canvasY = event.clientY - rect.top;

    // Apply pixel ratio inverse to mouse coordinates
    canvasX *= this.currentSize.pixelRatio;
    canvasY *= this.currentSize.pixelRatio;

    // Remove pan offsets
    const gridSizePixels = gridSize * this.tileSize;
    const offsetX =
      (this.currentSize.width - gridSizePixels) / 2 + this.panOffsetX;
    const offsetY =
      (this.currentSize.height - gridSizePixels) / 2 + this.panOffsetY;

    canvasX -= offsetX;
    canvasY -= offsetY;

    if (this.isGridRotated) {
      const centerX = gridSizePixels / 2;
      const centerY = gridSizePixels / 2;

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
    const { width, height } = this.currentSize;

    // Calculate offsets to center the grid AND apply pan offset
    const offsetX = (width - gridSize * this.tileSize) / 2 + this.panOffsetX;
    const offsetY = (height - gridSize * this.tileSize) / 2 + this.panOffsetY;

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
        this.renderTile(
          baseValues[y][x],
          offsetX + x * this.tileSize,
          offsetY + (gridSize - 1 - y) * this.tileSize,
          this.tileSize
        );
      }
    }

    if (this.isGridRotated) {
      this.ctx.restore();
    }
  }

  private renderTile(
    desirabilityValue: number,
    x: number,
    y: number,
    size: number
  ) {
    // Background
    if (desirabilityValue > 0) {
      this.ctx.fillStyle = `rgba(0, 200, 0, ${Math.min(1, desirabilityValue / 10)})`;
    } else if (desirabilityValue < 0) {
      this.ctx.fillStyle = `rgba(200, 0, 0, ${Math.min(1, Math.abs(desirabilityValue) / 10)})`;
    } else {
      this.ctx.fillStyle = '#f0f0f0';
    }
    this.ctx.fillRect(x, y, size, size);

    // Border
    this.ctx.strokeStyle = '#ddd';
    this.ctx.strokeRect(x, y, size, size);

    // Text
    this.ctx.save();
    if (this.isGridRotated) {
      this.ctx.translate(x + size / 2, y + size / 2);
      this.ctx.rotate(-rotationAngle);
      this.ctx.translate(-(x + size / 2), -(y + size / 2));
    }

    this.ctx.fillStyle = '#000';
    this.ctx.font = `${size / 3}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(desirabilityValue.toString(), x + size / 2, y + size / 2);
    this.ctx.restore();
  }

  public toggleGridRotation(): void {
    this.isGridRotated = !this.isGridRotated;
    this.render();
  }

  public zoomIn(): void {
    this.tileSize += 5;
    this.render();
  }

  public zoomOut(): void {
    if (this.tileSize > 5) {
      this.tileSize -= 5;
    }
    this.render();
  }
}
