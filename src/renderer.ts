import { tileSize } from './utils/constants';

interface CanvasSize {
  width: number;
  height: number;
  pixelRatio: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentSize: CanvasSize = { width: 0, height: 0, pixelRatio: 1 };

  private getBaseValues: () => number[][];

  private isGridRotated = false;

  constructor(canvas: HTMLCanvasElement, getBaseValues: () => number[][]) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context!');
    this.ctx = ctx;
    this.getBaseValues = getBaseValues;
    this.canvasSizeUpdated();
  }

  toggleGridRotation(): void {
    this.isGridRotated = !this.isGridRotated;

    this.render();
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

  public baseValuesUpdated() {
    this.render();
  }

  private render() {
    const baseGrid: number[][] = this.getBaseValues();
    const { width, height } = this.currentSize;
    const gridSize = baseGrid.length;

    // Calculate offsets to center the grid
    const offsetX = (width - gridSize * tileSize) / 2;
    const offsetY = (height - gridSize * tileSize) / 2;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Handle rotation
    if (this.isGridRotated) {
      this.ctx.save();
      this.ctx.translate(width / 2, height / 2);
      this.ctx.rotate((45 * Math.PI) / 180);
      this.ctx.translate(-width / 2, -height / 2);
    }

    // Render grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        this.renderTile(
          baseGrid[y][x],
          offsetX + x * tileSize,
          offsetY + (gridSize - 1 - y) * tileSize,
          tileSize
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
      this.ctx.rotate((-45 * Math.PI) / 180);
      this.ctx.translate(-(x + size / 2), -(y + size / 2));
    }

    this.ctx.fillStyle = '#000';
    this.ctx.font = `${size / 3}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(desirabilityValue.toString(), x + size / 2, y + size / 2);
    this.ctx.restore();
  }
}
