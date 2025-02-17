import RenderContext from '../interfaces/RenderContext';
import colors, { desirabilityColor } from '../utils/colors';
import { canvasTilePx, gridSize, rotationAngle } from '../utils/constants';
import { Line, Tile, Rectangle, TileSet } from '../utils/geometry';
import PlacedBuilding from './PlacedBuilding';

interface CanvasSize {
  width: number;
  height: number;
  pixelRatio: number;
}

class CanvasRenderer {
  private bufferCanvas: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;
  private displayCanvas: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D;

  private currentSize: CanvasSize = { width: 0, height: 0, pixelRatio: 1 };

  private transparentBuildings = false;
  private isGridRotated = false;
  private zoomLevel = 1.0;

  private lastMouseoverTile?: Tile;

  // Panning variables
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;
  private panOffsetX = 0;
  private panOffsetY = 0;

  // Clickdrag variables
  private isDragging = false;
  private dragStartTile?: Tile;
  private dragBox?: Rectangle;

  constructor(canvas: HTMLCanvasElement) {
    //Create the display context
    this.displayCanvas = canvas;
    const displayCtx = this.displayCanvas.getContext('2d', { alpha: false });
    if (!displayCtx) throw new Error('Could not get canvas context!');
    this.displayCtx = displayCtx;

    // Create buffer canvas and context
    this.bufferCanvas = document.createElement('canvas');
    //Buffer canvas is always fullsize
    this.bufferCanvas.width = gridSize * canvasTilePx;
    this.bufferCanvas.height = gridSize * canvasTilePx;
    const bufferCtx = this.bufferCanvas.getContext('2d', { alpha: false });
    if (!bufferCtx) throw new Error('Could not get buffer context!');
    this.bufferCtx = bufferCtx;
  }

  /*
   * Coordinate transformations
   */
  private tileToPoint(tile: Tile): DOMPoint {
    const x = tile.x * canvasTilePx;
    const y = tile.y * canvasTilePx;
    return new DOMPoint(x, y);
  }

  private pointToTile(point: DOMPoint): Tile | undefined {
    // Convert display coordinates to absolute canvas coordinates
    const rect = this.displayCanvas.getBoundingClientRect();
    const scaleX = this.displayCanvas.width / rect.width;
    const scaleY = this.displayCanvas.height / rect.height;

    const canvasX = (point.x - rect.left) * scaleX;
    const canvasY = (point.y - rect.top) * scaleY;

    // Get the inverse of the current transform
    const transform = this.displayCtx.getTransform();
    const inverseTransform = transform.inverse();

    // Transform the point
    const transformedPoint = new DOMPoint(canvasX, canvasY).matrixTransform(
      inverseTransform
    );

    // Convert to grid coordinates
    const x = Math.floor(transformedPoint.x / canvasTilePx);
    const y = Math.floor(transformedPoint.y / canvasTilePx);

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      return new Tile(x, y);
    }
    return undefined;
  }

  public getMouseCoords(event: MouseEvent): Tile | undefined {
    return this.pointToTile(new DOMPoint(event.clientX, event.clientY));
  }

  private rectangleToDOMRect(rectangle: Rectangle): DOMRect {
    const origin = this.tileToPoint(rectangle.origin);
    const width = rectangle.width * canvasTilePx;
    const height = rectangle.height * canvasTilePx;

    return new DOMRect(origin.x, origin.y, width, height);
  }

  /*
   * Transformations
   */
  public updateCanvasSize() {
    const displayWidth = this.displayCanvas.clientWidth;
    const displayHeight = this.displayCanvas.clientHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    this.displayCanvas.width = displayWidth * pixelRatio;
    this.displayCanvas.height = displayHeight * pixelRatio;

    this.currentSize = {
      width: displayWidth,
      height: displayHeight,
      pixelRatio,
    };

    this.updateTransform();
  }

  private rotateAroundPoint(p: DOMPoint, angle: number) {
    this.bufferCtx.translate(p.x, p.y);
    this.bufferCtx.rotate(angle);
    this.bufferCtx.translate(-p.x, -p.y);
  }

  public toggleGridRotation(context: RenderContext): void {
    this.isGridRotated = !this.isGridRotated;
    this.render(context); //We need to rerender the main canvas for this because of the text
  }

  public toggleBuildingTransparency(context: RenderContext): void {
    this.transparentBuildings = !this.transparentBuildings;
    this.render(context);
  }

  public setBuildingTransparency(
    newSetting: boolean,
    context: RenderContext
  ): void {
    this.transparentBuildings = newSetting;
    this.render(context);
  }

  public zoomIn(): void {
    this.zoomLevel *= 1.2;
    this.updateTransform();
  }

  public zoomOut(): void {
    this.zoomLevel /= 1.2;
    this.updateTransform();
  }

  private updateTransform() {
    // Reset transform
    this.displayCtx.setTransform(
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
    this.displayCtx.translate(
      centerX + this.panOffsetX,
      centerY + this.panOffsetY
    );

    // Zoom
    this.displayCtx.scale(this.zoomLevel, this.zoomLevel);

    // Rotation
    if (this.isGridRotated) {
      this.displayCtx.rotate(rotationAngle);
    }

    // Center the grid
    const gridPixelSize = gridSize * canvasTilePx;
    this.displayCtx.translate(-gridPixelSize / 2, -gridPixelSize / 2);

    this.updateDisplay();
  }

  private updateDisplay() {
    this.clearDisplay();
    this.displayCtx.drawImage(this.bufferCanvas, 0, 0);
  }

  /*
   * Mouse movements
   */

  public startPanning(event: MouseEvent) {
    this.isPanning = true;
    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;
  }

  public handlePanning(event: MouseEvent) {
    if (!this.isPanning) return;

    const dragX = event.clientX - this.lastPanX;
    const dragY = event.clientY - this.lastPanY;

    this.panOffsetX += dragX;
    this.panOffsetY += dragY;

    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;

    this.updateTransform();
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
      (thisTile && previousTile && thisTile.equals(previousTile))
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

  private updateDragBox(newPos: Tile) {
    if (this.dragStartTile)
      this.dragBox = Rectangle.fromTiles(this.dragStartTile, newPos);
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
  private clearDisplay() {
    const originalTransform = this.displayCtx.getTransform();
    this.displayCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.displayCtx.fillStyle = 'white';
    this.displayCtx.fillRect(
      0,
      0,
      this.displayCanvas.width,
      this.displayCanvas.height
    );
    this.displayCtx.setTransform(originalTransform);
  }

  private clearBuffer() {
    this.bufferCtx.fillStyle = 'white';
    this.bufferCtx.fillRect(
      0,
      0,
      this.bufferCanvas.width,
      this.bufferCanvas.height
    );
  }

  private drawNonRotatedText(
    textBoxInTiles: Rectangle,
    text: string,
    fillColor: string = colors.pureBlack,
    strokeColor: string | undefined = undefined,
    fontSize: number = canvasTilePx / 3,
    padding: number = 2 //In pixels
  ) {
    const splitTextToLines = (text: string) => {
      const words = text.split(' ');
      let lines: string[] = [];

      const lineWidth = this.bufferCtx.measureText(text).width;
      if (lineWidth > maxWidth && words.length > 1) {
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + ' ' + word;
          const testLineWidth = this.bufferCtx.measureText(testLine).width;

          if (testLineWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
      } else {
        lines = [text];
      }
      return lines;
    };

    this.bufferCtx.fillStyle = fillColor;
    if (strokeColor) this.bufferCtx.strokeStyle = strokeColor;
    this.bufferCtx.lineWidth = 4;
    this.bufferCtx.lineJoin = 'round';
    this.bufferCtx.textAlign = 'center';
    this.bufferCtx.textBaseline = 'middle';
    this.bufferCtx.font = `${fontSize}px monospace`;

    const {
      x,
      y,
      height: textBoxHeight,
      width: textBoxWidth,
    } = this.rectangleToDOMRect(textBoxInTiles);
    const textBoxCenterPx = new DOMPoint(
      x + textBoxWidth / 2,
      y + textBoxHeight / 2
    );
    const maxWidth = textBoxWidth - padding * 2;
    const maxHeight = textBoxHeight - padding * 2;

    if (this.isGridRotated) {
      //Ideally, we'd draw text rotated the other way.
      //But I don't know how to do that so we'll rotate the canvas instead, draw the text, and rotate the canvas back.
      this.rotateAroundPoint(textBoxCenterPx, -rotationAngle);
    }

    // Split text into lines if needed
    const lines: string[] = splitTextToLines(text);

    let lineHeight = fontSize * 1.2;
    let totalTextHeight = lineHeight * lines.length;

    // If text is too big, scale it down
    while (
      fontSize > 8 && // Don't go smaller than 8px
      (totalTextHeight > maxHeight ||
        lines.some((line) => this.bufferCtx.measureText(line).width > maxWidth))
    ) {
      fontSize *= 0.9;
      lineHeight = fontSize * 1.2;
      totalTextHeight = lineHeight * lines.length;
      this.bufferCtx.font = `${fontSize}px monospace`;
    }

    // Draw the text lines
    const startY = textBoxCenterPx.y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      if (strokeColor)
        this.bufferCtx.strokeText(
          line,
          textBoxCenterPx.x,
          startY + i * lineHeight
        );
      this.bufferCtx.fillText(line, textBoxCenterPx.x, startY + i * lineHeight);
    });

    if (this.isGridRotated) {
      //Here's the counterrotation
      this.rotateAroundPoint(textBoxCenterPx, rotationAngle);
    }
  }

  private drawRectangle(
    rectInTiles: Rectangle,
    borderColor?: string,
    fillColor?: string,
    lineWidth: number = 2
  ) {
    const { x, y, height, width } = this.rectangleToDOMRect(rectInTiles);

    if (fillColor) {
      this.bufferCtx.fillStyle = fillColor;
      this.bufferCtx.fillRect(x, y, width, height);
    }

    if (borderColor) {
      this.bufferCtx.strokeStyle = borderColor;
      this.bufferCtx.lineWidth = lineWidth;
      this.bufferCtx.strokeRect(x, y, width, height);
    }
  }

  private drawOutline(tiles: TileSet, color: string, lineWidth: number = 2) {
    if (tiles.size === 0) return;

    const edges: Line[] = [];

    for (const tile of tiles) {
      // Check all 4 sides of this tile to see if there's any neighboring tiles there
      // Right edge
      if (!tiles.has(new Tile(tile.x + 1, tile.y))) {
        edges.push(
          new Line(
            this.tileToPoint(new Tile(tile.x + 1, tile.y)),
            this.tileToPoint(new Tile(tile.x + 1, tile.y + 1))
          )
        );
      }
      // Left edge
      if (!tiles.has(new Tile(tile.x - 1, tile.y))) {
        edges.push(
          new Line(
            this.tileToPoint(new Tile(tile.x, tile.y)),
            this.tileToPoint(new Tile(tile.x, tile.y + 1))
          )
        );
      }
      // Bottom edge
      if (!tiles.has(new Tile(tile.x, tile.y + 1))) {
        edges.push(
          new Line(
            this.tileToPoint(new Tile(tile.x, tile.y + 1)),
            this.tileToPoint(new Tile(tile.x + 1, tile.y + 1))
          )
        );
      }
      // Top edge
      if (!tiles.has(new Tile(tile.x, tile.y - 1))) {
        edges.push(
          new Line(
            this.tileToPoint(new Tile(tile.x, tile.y)),
            this.tileToPoint(new Tile(tile.x + 1, tile.y))
          )
        );
      }
    }

    this.bufferCtx.save();
    this.bufferCtx.strokeStyle = color;
    this.bufferCtx.lineWidth = lineWidth;
    this.bufferCtx.beginPath();

    for (const edge of edges) {
      this.bufferCtx.moveTo(edge.p1.x, edge.p1.y);
      this.bufferCtx.lineTo(edge.p2.x, edge.p2.y);
    }

    this.bufferCtx.stroke();
    this.bufferCtx.restore();
  }

  private drawBuilding(
    building: PlacedBuilding,
    transparent: boolean = false,
    overlayColor?: string
  ) {
    if (!transparent && building.blueprint.fillColor) {
      this.drawRectangle(
        building.rect,
        undefined,
        building.blueprint.fillColor
      );
    }
    /*if (building.parent) {
      // Do not draw overlays for children
      return;
    }
    if (building.children) {
      for (const child of building.children) {
        this.drawBuilding(child, transparent, overlayColor, bestDesirability);
      }
    }*/
    if (building.blueprint.borderColor) {
      this.drawOutline(
        building.offsetTilesOccupied,
        building.blueprint.borderColor,
        2
      );
    }
    const label = building.blueprint.label;
    if (!transparent && label) {
      this.drawNonRotatedText(
        building.rect,
        label,
        colors.pureBlack,
        colors.outlineWhite
      );
    }
    if (overlayColor) {
      for (const tile of building.offsetTilesOccupied) {
        this.drawRectangle(new Rectangle(tile, 1, 1), undefined, overlayColor);
      }
    }
  }

  private drawTile(desirabilityValue: number, origin: Tile) {
    const boundingBox = new Rectangle(origin, 1, 1);
    const fillColor = desirabilityColor(desirabilityValue);
    this.drawRectangle(boundingBox, colors.weakOutlineBlack, fillColor, 1);
    this.drawNonRotatedText(
      boundingBox,
      desirabilityValue.toString(),
      colors.strongOutlineBlack
    );
  }

  public render(context: RenderContext) {
    console.log('Rerendering grid...');
    this.clearBuffer();

    const baseValues = context.getBaseValues();
    const placedBuildings = context.getBuildings();
    const cursorAction = context.getCursorAction();
    const selectedBlueprint = context.getSelectedBlueprint();

    const buildingsBeingRemoved: Set<PlacedBuilding> = new Set();
    const buildingsBeingAdded: Set<PlacedBuilding> = new Set();

    if (cursorAction === 'placing') {
      if (this.lastMouseoverTile && selectedBlueprint) {
        const virtualBuilding = new PlacedBuilding(
          this.lastMouseoverTile,
          selectedBlueprint
        );
        buildingsBeingAdded.add(virtualBuilding);
      }
    } else if (cursorAction === 'erasing') {
      if (this.isDragging) {
        for (const building of placedBuildings) {
          if (this.dragBox && building.interceptsRectangle(this.dragBox)) {
            buildingsBeingRemoved.add(building);
          }
        }
      }
    }

    // Render grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = new Tile(x, y);
        const desirabilityForThisTile = getAdjustedDesirability(tile);
        this.drawTile(desirabilityForThisTile, tile);
      }
    }

    // Render buildings
    for (const building of placedBuildings) {
      const isBeingDeleted = buildingsBeingRemoved.has(building);
      this.drawBuilding(
        building,
        this.transparentBuildings,
        isBeingDeleted ? colors.redMidTransparency : undefined
      );
    }

    for (const virtualBuilding of buildingsBeingAdded) {
      this.drawOutline(
        virtualBuilding.offsetTilesOccupied,
        colors.strongOutlineBlack,
        3
      );
      const blockedTiles = new TileSet();
      const openTiles = new TileSet();
      for (const tile of virtualBuilding.offsetTilesOccupied) {
        if (context.isTileOccupied(tile)) {
          blockedTiles.add(tile);
        } else {
          openTiles.add(tile);
        }
      }
      if (blockedTiles.size > 0) {
        for (const tile of blockedTiles) {
          this.drawRectangle(
            new Rectangle(tile, 1, 1),
            undefined,
            colors.redMidTransparency
          );
        }
        for (const tile of openTiles) {
          this.drawRectangle(
            new Rectangle(tile, 1, 1),
            undefined,
            colors.greenMidTransparency
          );
        }
      } else {
        this.drawBuilding(
          virtualBuilding,
          this.transparentBuildings,
          colors.greenLowTransparency
        );
      }
    }

    if (cursorAction === 'erasing' && this.isDragging && this.dragBox) {
      this.drawRectangle(this.dragBox, colors.redHighTransparency);
    }

    this.updateDisplay();

    /*function bestDesirabilityForBuilding(building: Building) {
      let bestDesirability = Number.MIN_SAFE_INTEGER;
      for (const tile of building.offsetTilesOccupied) {
        bestDesirability = Math.max(
          bestDesirability,
          getAdjustedDesirability(tile)
        );
      }
      return bestDesirability;
    }*/

    function getAdjustedDesirability(tile: Tile) {
      let desirabilityForThisTile = baseValues[tile.x][tile.y];
      for (const building of buildingsBeingAdded) {
        desirabilityForThisTile += building.getDesirabilityEffect(tile);
      }
      for (const building of buildingsBeingRemoved) {
        desirabilityForThisTile -= building.getDesirabilityEffect(tile);
      }
      return desirabilityForThisTile;
    }
  }
}

export default CanvasRenderer;
