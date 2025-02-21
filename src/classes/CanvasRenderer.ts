import RenderContext from '../interfaces/RenderContext';
import colors, { desirabilityColor } from '../utils/colors';
import {
  canvasTilePx,
  gridPixelCenter,
  gridPixelSize,
  gridSize,
  rotationAngle,
  coordToPx,
} from '../utils/constants';
import { Tile, Rectangle, degreesToRads } from '../utils/geometry';
import PlacedBuilding from './PlacedBuilding';
import { G as SVGG, Svg, Symbol } from '@svgdotjs/svg.js';
import { SVG } from '@svgdotjs/svg.js';

class CanvasRenderer {
  private displayCanvas: Svg;

  private backgroundGroup: SVGG;
  private desireValuesGroup: SVGG;
  private buildingGroup: SVGG;
  private labelGroup: SVGG;

  private desireValueMap: Map<number, Symbol> = new Map();

  private transparentBuildings = false;
  private currentRotation: number = 0;
  private zoomLevel = 1.0;

  private lastMouseoverTile?: Tile;

  // Panning variables
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;
  // These two are effectively our pan offsets since nothing else uses them
  private viewBoxX = 0;
  private viewBoxY = 0;

  // Clickdrag variables
  private isDragging = false;
  private dragStartTile?: Tile;
  private dragBox?: Rectangle;

  // Various size and viewbox variables
  private clientWidth: number;
  private clientHeight: number;
  get viewboxCenterX() {
    return this.viewBoxX + this.clientWidth / this.zoomLevel / 2;
  }
  get viewboxCenterY() {
    return this.viewBoxY + this.clientHeight / this.zoomLevel / 2;
  }
  get viewBoxWidth() {
    return this.clientWidth / this.zoomLevel;
  }
  get viewBoxHeight() {
    return this.clientHeight / this.zoomLevel;
  }

  constructor(svgCanvas: Svg, canvasContainer: HTMLElement) {
    this.displayCanvas = svgCanvas;

    // This feature has been completely undocumented for 7 years and I only found it by digging through the source.
    this.displayCanvas.style().rule('.buildingLabel', {
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'text-align': 'center',
      color: 'black',
      padding: '2px',
      '-webkit-text-stroke': '3px white',
      'paint-order': 'stroke fill', //Looks better but apparently is not supported in all browsers?
      //'text-shadow': '-2px -2px 0 white,  2px -2px 0 white, -2px  2px 0 white,  2px  2px 0 white, -2px  0px 0 white,  2px  0px 0 white, 0px -2px 0 white, 0px 2px 0 white', //Looks worse but apparently has better compatibility?
    });

    this.clientWidth = canvasContainer.clientWidth;
    this.clientHeight = canvasContainer.clientHeight;

    this.backgroundGroup = this.displayCanvas.group();
    this.desireValuesGroup = this.displayCanvas.group();
    this.buildingGroup = this.displayCanvas.group();
    this.labelGroup = this.displayCanvas.group();

    // We draw the background only once!
    this.drawBackground(this.backgroundGroup);

    // Center on origin
    this.centerViewBoxAt(gridPixelCenter, gridPixelCenter);

    this.canvasSizeUpdated();
  }

  private drawBackground(backgroundGroup: SVGG) {
    const backgroundPattern = backgroundGroup.pattern(
      coordToPx(1),
      coordToPx(1),
      (pattern) => {
        pattern
          .rect(coordToPx(1), coordToPx(1))
          .fill('none')
          .stroke(colors.strongOutlineBlack);
      }
    );

    backgroundGroup
      .rect(gridPixelSize, gridPixelSize) //Fill the whole canvas with this
      .fill(backgroundPattern)
      .back(); // Ensure background is behind other elements
  }

  /*
   * Coordinate transformations
   */

  private centerViewBoxAt(x: number, y: number) {
    x -= this.viewBoxWidth / 2;
    y -= this.viewBoxHeight / 2;

    this.viewBoxX = x;
    this.viewBoxY = y;

    this.updateTransform();
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
    // Translate the point to origin to make the math easier
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
    this.displayCanvas.viewbox(
      this.viewBoxX,
      this.viewBoxY,
      this.viewBoxWidth,
      this.viewBoxHeight
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
      this.labelGroup.transform({
        rotate: this.currentRotation,
        origin: { x: gridPixelCenter, y: gridPixelCenter },
      });
    } else {
      this.backgroundGroup.transform({});
      this.buildingGroup.transform({});
      this.labelGroup.transform({});
    }
  }

  public canvasSizeUpdated() {
    this.clientWidth = this.displayCanvas.node.clientWidth;
    this.clientHeight = this.displayCanvas.node.clientHeight;

    this.updateTransform();
  }

  public toggleGridRotation(context: RenderContext): void {
    // We want to keep our view centered on the same spot after zooming, so let's store the old coords.
    let x = this.viewboxCenterX;
    let y = this.viewboxCenterY;

    if (this.currentRotation === 0) {
      this.currentRotation = rotationAngle;
      // We are rotating, so rotate the new center too
      ({ x, y } = this.rotatePointFromOrigin(x, y, this.currentRotation));
    } else {
      // We are undoing the rotation, so undo the rotation for the center too
      ({ x, y } = this.rotatePointFromOrigin(x, y, -this.currentRotation));
      this.currentRotation = 0;
    }
    this.centerViewBoxAt(x, y); // Re-center please
    this.updateTransform();
    this.render(context); //Todo: Technically this does not always need a rerender. But this is a low priority optimization.
  }

  public toggleBuildingTransparency(context: RenderContext): void {
    this.setBuildingTransparency(!this.transparentBuildings, context);
  }

  public setBuildingTransparency(
    newSetting: boolean,
    context: RenderContext
  ): void {
    this.transparentBuildings = newSetting;
    this.render(context); //Todo: This doesn't need a full rerender. Right?
  }

  public zoomIn() {
    this.zoom(1.2);
  }

  public zoomOut() {
    this.zoom(1 / 1.2);
  }

  private zoom(factor: number) {
    // We want to keep our view centered on the same spot after zooming, so let's store the old coords.
    const oldY = this.viewboxCenterY;
    const oldX = this.viewboxCenterX;

    this.zoomLevel *= factor;

    this.centerViewBoxAt(oldX, oldY); // Re-center please
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
    this.render(context); //Todo: This doesn't need a full rerender, but this is a very low priority optimization
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
    this.render(context); //Todo: This MIGHT not need a full rerender, but this is a very low priority optimization
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
    console.log('Rerendering grid...');

    const baseValues = context.getBaseValues();
    const placedBuildings = context.getBuildings();
    const cursorAction = context.getCursorAction();
    const selectedBlueprint = context.getSelectedBlueprint();

    // We populate this each rerender
    const buildingsBeingRemoved: Set<PlacedBuilding> = new Set();
    const buildingsBeingAdded: Set<PlacedBuilding> = new Set();

    // Clear what needs to be cleared.
    // Todo: Maybe we can clear only some things, depending on what needs rerendering
    this.buildingGroup.clear();
    this.labelGroup.clear();
    this.desireValuesGroup.clear();

    // Draw buildings
    for (const building of context.getBuildings()) {
      this.drawBuilding(building);
    }

    // Render grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = new Tile(x, y);
        const desirabilityForThisTile = getAdjustedDesirability(tile);
        if (desirabilityForThisTile === 0) continue;
        this.drawTile(desirabilityForThisTile, tile);
      }
    }

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

  public drawBuilding(building: PlacedBuilding) {
    if (!building.blueprint.baseGraphic) return;
    const importedElement = this.buildingGroup
      .use(building.blueprint.baseGraphic)
      .move(coordToPx(building.origin.x), coordToPx(building.origin.y));

    this.buildingGroup.add(importedElement);

    const textHeight = coordToPx(building.blueprint.height);
    const textWidth = coordToPx(building.blueprint.width);
    const foreignObject = this.labelGroup.foreignObject(textHeight, textWidth);
    const labelElement = building.blueprint.getLabel();

    foreignObject
      .add(SVG(labelElement, true))
      .move(coordToPx(building.origin.x), coordToPx(building.origin.y));

    if (this.currentRotation) {
      foreignObject.rotate(-this.currentRotation);
    }
  }

  private drawTile(desirabilityValue: number, origin: Tile) {
    let symbol = this.desireValueMap.get(desirabilityValue);
    if (!symbol) {
      symbol = this.displayCanvas
        .symbol()
        .attr('id', `tileValue-${desirabilityValue}`);

      symbol
        .rect(coordToPx(1), coordToPx(1))
        .fill(desirabilityColor(desirabilityValue))
        .stroke(colors.strongOutlineBlack);

      symbol
        .text(desirabilityValue.toString())
        .font({ anchor: 'middle', 'dominant-baseline': 'middle' })
        .center(coordToPx(1) / 2, coordToPx(1) / 2);

      this.desireValueMap.set(desirabilityValue, symbol);
    }
    this.desireValuesGroup
      .use(symbol)
      .move(coordToPx(origin.x), coordToPx(origin.y));
  }

  /*private bestDesirabilityForBuilding(building: Building) {
        let bestDesirability = Number.MIN_SAFE_INTEGER;
        for (const tile of building.offsetTilesOccupied) {
          bestDesirability = Math.max(
            bestDesirability,
            getAdjustedDesirability(tile)
          );
        }
        return bestDesirability;
  }*/
}
export default CanvasRenderer;
