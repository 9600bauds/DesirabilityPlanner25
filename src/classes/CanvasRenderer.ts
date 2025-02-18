import RenderContext from '../interfaces/RenderContext';
import colors, { desirabilityColor } from '../utils/colors';
import {
  canvasTilePx,
  gridPixelCenter,
  gridPixelSize,
  gridSize,
  rotationAngle,
  rotationRadians,
} from '../utils/constants';
import { Tile, Rectangle, degreesToRads } from '../utils/geometry';
import PlacedBuilding from './PlacedBuilding';
import { G as SVGG, Svg } from '@svgdotjs/svg.js';

class CanvasRenderer {
  private displayCanvas: Svg;

  private backgroundGroup: SVGG;
  private buildingGroup: SVGG;
  private labelGroup: SVGG;

  private clientWidth: number;
  private clientHeight: number;

  private transparentBuildings = false;
  private currentRotation: number = 0;
  private zoomLevel = 1.0;

  private lastMouseoverTile?: Tile;

  // Panning variables
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;

  private viewBoxX = 0;
  private viewBoxY = 0;

  // Clickdrag variables
  private isDragging = false;
  private dragStartTile?: Tile;
  private dragBox?: Rectangle;

  get viewboxCenterX() {
    return this.viewBoxX + this.clientWidth / this.zoomLevel / 2;
  }
  get viewboxCenterY() {
    return this.viewBoxY + this.clientHeight / this.zoomLevel / 2;
  }

  constructor(svgCanvas: Svg, canvasContainer: HTMLElement) {
    this.displayCanvas = svgCanvas;

    this.clientWidth = canvasContainer.clientWidth;
    this.clientHeight = canvasContainer.clientHeight;

    this.backgroundGroup = this.displayCanvas.group();
    this.buildingGroup = this.displayCanvas.group();

    this.drawBackground(this.backgroundGroup);

    this.centerViewBoxAt(gridPixelSize / 2, gridPixelSize / 2);

    this.updateCanvasSize();
  }

  private drawBackground(backgroundGroup: SVGG) {
    const backgroundPattern = backgroundGroup.pattern(
      canvasTilePx,
      canvasTilePx,
      (pattern) => {
        pattern
          .rect(canvasTilePx, canvasTilePx)
          .fill('none')
          .stroke(colors.strongOutlineBlack);
      }
    );

    backgroundGroup
      .rect(gridPixelSize, gridPixelSize)
      .fill(backgroundPattern)
      .back(); // Ensure background is behind other elements
  }

  /*
   * Coordinate transformations
   */

  private centerViewBoxAt(x: number, y: number) {
    const viewBoxWidth = this.clientWidth / this.zoomLevel;
    const viewBoxHeight = this.clientHeight / this.zoomLevel;

    x -= viewBoxWidth / 2;
    y -= viewBoxHeight / 2;

    this.viewBoxX = x;
    this.viewBoxY = y;

    this.updateTransform();
  }

  private tileToPoint(tile: Tile): DOMPoint {
    const x = tile.x * canvasTilePx;
    const y = tile.y * canvasTilePx;

    return new DOMPoint(x, y);
  }

  private pointToTile(point: DOMPoint): Tile | undefined {
    let x = this.viewBoxX + point.x / this.zoomLevel;
    let y = this.viewBoxY + point.y / this.zoomLevel;

    // If grid is rotated, reverse the rotation
    if (this.currentRotation) {
      ({ x, y } = this.rotatePointFromOrigin(x, y, -this.currentRotation));
    }

    // Convert to tile coordinates
    const tileX = Math.floor(x / canvasTilePx);
    const tileY = Math.floor(y / canvasTilePx);

    // Check if the tile is within grid bounds
    if (tileX >= 0 && tileX < gridSize && tileY >= 0 && tileY < gridSize) {
      return new Tile(tileX, tileY);
    }

    return undefined;
  }

  private rotatePointFromOrigin(x: number, y: number, rotationAngle: number) {
    x -= gridPixelCenter;
    y -= gridPixelCenter;

    const cos = Math.cos(degreesToRads(rotationAngle));
    const sin = Math.sin(degreesToRads(rotationAngle));
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;

    // Translate back
    x = rotatedX + gridPixelCenter;
    y = rotatedY + gridPixelCenter;
    return { x, y };
  }

  public getMouseCoords(event: MouseEvent): Tile | undefined {
    return this.pointToTile(new DOMPoint(event.clientX, event.clientY));
  }

  /*
   * Transformations
   */
  private updateTransform() {
    const viewBoxWidth = this.clientWidth / this.zoomLevel;
    const viewBoxHeight = this.clientHeight / this.zoomLevel;

    this.displayCanvas.viewbox(
      this.viewBoxX,
      this.viewBoxY,
      viewBoxWidth,
      viewBoxHeight
    );

    if (this.currentRotation) {
      this.backgroundGroup.transform({
        rotate: this.currentRotation,
        origin: { x: gridPixelCenter, y: gridPixelCenter },
      });
      this.buildingGroup.transform({
        rotate: this.currentRotation,
        origin: { x: gridPixelCenter, y: gridPixelCenter },
      });
    } else {
      this.backgroundGroup.transform({});
      this.buildingGroup.transform({});
    }
  }

  public updateCanvasSize() {
    this.clientWidth = this.displayCanvas.node.clientWidth;
    this.clientHeight = this.displayCanvas.node.clientHeight;

    this.updateTransform();
  }

  public toggleGridRotation(): void {
    let x = this.viewboxCenterX;
    let y = this.viewboxCenterY;
    if (this.currentRotation === 0) {
      this.currentRotation = rotationAngle;
      ({ x, y } = this.rotatePointFromOrigin(x, y, this.currentRotation));
    } else {
      ({ x, y } = this.rotatePointFromOrigin(x, y, -this.currentRotation));
      this.currentRotation = 0;
    }
    this.updateTransform();
    this.centerViewBoxAt(x, y);
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

  public zoomIn() {
    this.zoom(1.2);
  }

  public zoomOut() {
    this.zoom(1 / 1.2);
  }

  private zoom(factor: number) {
    const oldY = this.viewboxCenterY;
    const oldX = this.viewboxCenterX;
    // Update zoom level
    this.zoomLevel *= factor;

    this.centerViewBoxAt(oldX, oldY);

    this.updateTransform();
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

    const deltaX = event.clientX - this.lastPanX;
    const deltaY = event.clientY - this.lastPanY;

    this.viewBoxX -= deltaX / this.zoomLevel;
    this.viewBoxY -= deltaY / this.zoomLevel;

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

  public render(context: RenderContext) {
    this.buildingGroup.clear();
    for (const building of context.getBuildings()) {
      this.drawBuilding(building);
    }
    console.log('Rerendering grid...');
  }

  public drawBuilding(building: PlacedBuilding) {
    if (!building.blueprint.visualRepresentation) return;

    const importedElement = this.buildingGroup
      .use(building.blueprint.visualRepresentation)
      .move(building.origin.x * canvasTilePx, building.origin.y * canvasTilePx);

    this.buildingGroup.add(importedElement);
  }
}

export default CanvasRenderer;
