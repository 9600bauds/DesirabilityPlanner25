import RenderContext from '../interfaces/RenderContext';
import colors, { desirabilityColor } from '../utils/colors';
import {
  gridPixelCenter,
  gridPixelSize,
  gridSize,
  rotationAngle,
  coordToPx,
  pxToCoord,
} from '../utils/constants';
import { Tile, Rectangle, degreesToRads } from '../utils/geometry';
import PlacedBuilding from './PlacedBuilding';
import { Fragment, Pattern, G as SVGG, Svg, Symbol } from '@svgdotjs/svg.js';
import { SVG } from '@svgdotjs/svg.js';

interface gridPoint {
  x: number;
  y: number;
}

class CanvasRenderer {
  private displayCanvas: Svg;

  private backgroundPattern: Pattern;

  private backgroundGroup: SVGG;
  private tilesGroup: SVGG;
  private buildingGroup: SVGG;
  private labelGroup: SVGG;

  private desireValueMap: Map<number, Symbol> = new Map();

  private transparentBuildings = false;
  private currentRotation: number = 0;
  private zoomLevel = 1.0;

  private lastMouseoverTile?: Tile;

  // Panning variables
  private isPanning = false;
  private lastPanCursorX = 0;
  private lastPanCursorY = 0;
  private offsetX = 0;
  private offsetY = 0;

  // Clickdrag variables
  private isDragging = false;
  private dragStartTile?: Tile;
  private dragBox?: Rectangle;

  // Various size and viewbox variables
  private clientWidth: number;
  private clientHeight: number;
  private gridOrigin: gridPoint = { x: 0, y: 0 };
  private gridCenter: gridPoint = { x: gridPixelCenter, y: gridPixelCenter };
  private gridEnd: gridPoint = { x: gridPixelSize, y: gridPixelSize };
  get viewCenter(): DOMPoint {
    return new DOMPoint(this.clientWidth / 2, this.clientHeight / 2);
  }

  constructor(svgCanvas: Svg, canvasContainer: HTMLElement) {
    this.displayCanvas = svgCanvas;

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

    // We draw the background only once!
    this.backgroundGroup = this.displayCanvas.group();
    this.backgroundPattern = this.createBackgroundPattern();
    this.drawBackground();

    this.tilesGroup = this.displayCanvas.group();
    this.buildingGroup = this.displayCanvas.group();
    this.labelGroup = this.displayCanvas.group();

    // Center on origin
    this.centerViewBoxAt(this.gridCenter);

    this.canvasSizeUpdated();
  }

  /*
   * Coordinate transformations
   */

  private grid2canvas(point: gridPoint, useOffset: boolean = true): DOMPoint {
    const cos = Math.cos(degreesToRads(this.currentRotation));
    const sin = Math.sin(degreesToRads(this.currentRotation));
    const offsetX = useOffset ? this.offsetX : 0;
    const offsetY = useOffset ? this.offsetY : 0;
    return new DOMPoint(
      (point.x * cos - point.y * sin) * this.zoomLevel + offsetX,
      (point.x * sin + point.y * cos) * this.zoomLevel + offsetY
    );
  }

  private canvas2grid(point: DOMPoint): gridPoint {
    const xUnscaled = (point.x - this.offsetX) / this.zoomLevel;
    const yUnscaled = (point.y - this.offsetY) / this.zoomLevel;
    const cos = Math.cos(degreesToRads(this.currentRotation));
    const sin = Math.sin(degreesToRads(this.currentRotation));
    return {
      x: xUnscaled * cos + yUnscaled * sin,
      y: -xUnscaled * sin + yUnscaled * cos,
    };
  }

  private centerViewBoxAt(point: gridPoint) {
    const rawCanvasPoint = this.grid2canvas(point, false);
    const center = this.viewCenter;
    this.offsetX = center.x - rawCanvasPoint.x;
    this.offsetY = center.y - rawCanvasPoint.y;
    this.updateTransform();
  }

  private pointToTile(point: DOMPoint): Tile | undefined {
    const gridPt = this.canvas2grid(point);

    // Convert to tile coordinates
    const tileX = pxToCoord(gridPt.x);
    const tileY = pxToCoord(gridPt.y);

    // Check if the tile is within grid bounds
    if (tileX >= 0 && tileX < gridSize && tileY >= 0 && tileY < gridSize) {
      return new Tile(tileX, tileY);
    }

    return undefined;
  }

  public getMouseCoords(event: MouseEvent): Tile | undefined {
    return this.pointToTile(new DOMPoint(event.clientX, event.clientY));
  }

  /*
   * Transformations
   */
  private updateTransform() {
    this.backgroundGroup.transform({
      rotate: this.currentRotation,
      scale: this.zoomLevel,
      translate: { x: this.offsetX, y: this.offsetY },
      origin: this.gridOrigin,
    });
    this.tilesGroup.transform({
      rotate: this.currentRotation,
      scale: this.zoomLevel,
      translate: { x: this.offsetX, y: this.offsetY },
      origin: this.gridOrigin,
    });
    this.buildingGroup.transform({
      rotate: this.currentRotation,
      scale: this.zoomLevel,
      translate: { x: this.offsetX, y: this.offsetY },
      origin: this.gridOrigin,
    });
    this.labelGroup.transform({
      rotate: this.currentRotation,
      scale: this.zoomLevel,
      translate: { x: this.offsetX, y: this.offsetY },
      origin: this.gridOrigin,
    });
  }

  public canvasSizeUpdated() {
    this.clientWidth = this.displayCanvas.node.clientWidth;
    this.clientHeight = this.displayCanvas.node.clientHeight;

    this.updateTransform();
  }

  public toggleGridRotation(context: RenderContext): void {
    // We want to keep our view centered on the same spot after zooming, so let's store the old coords.

    const oldCenter = this.canvas2grid(this.viewCenter);
    if (this.currentRotation === 0) {
      this.currentRotation = rotationAngle;
    } else {
      this.currentRotation = 0;
    }

    this.updateTransform();
    this.centerViewBoxAt(oldCenter); // Re-center please
    this.render(context); //Todo: Technically this does not always need a rerender. But this is a low priority optimization.*/
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
    const oldCenter = this.canvas2grid(this.viewCenter);

    this.zoomLevel *= factor;

    this.centerViewBoxAt(oldCenter); // Re-center please
    this.updateTransform();
  }

  /*
   * Mouse movements
   */

  public startPanning(event: MouseEvent) {
    this.isPanning = true;
    this.lastPanCursorX = event.clientX;
    this.lastPanCursorY = event.clientY;
  }

  public handlePanning(event: MouseEvent) {
    if (!this.isPanning) return;

    const deltaX = event.clientX - this.lastPanCursorX;
    const deltaY = event.clientY - this.lastPanCursorY;

    this.offsetX += deltaX;
    this.offsetY += deltaY;

    this.lastPanCursorX = event.clientX;
    this.lastPanCursorY = event.clientY;

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
    //this.render(context); //Todo: This MIGHT not need a full rerender, but this is a very low priority optimization
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
    this.tilesGroup.clear();
    const newTilesFragment = new Fragment();
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = new Tile(x, y);
        const desirabilityForThisTile = getAdjustedDesirability(tile);
        //if (desirabilityForThisTile === 0) continue;
        let symbol = this.desireValueMap.get(desirabilityForThisTile);
        if (!symbol) {
          symbol = this.createDesireValSymbol(desirabilityForThisTile);
        }
        newTilesFragment.use(symbol).move(coordToPx(tile.x), coordToPx(tile.y));
      }
    }
    this.tilesGroup.add(newTilesFragment); //Causes an error because svg.js but it works

    // Draw buildings
    this.buildingGroup.clear();
    this.labelGroup.clear();
    for (const building of context.getBuildings()) {
      this.drawBuilding(building);
    }

    /*for (const virtualBuilding of buildingsBeingAdded) {
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
      .move(coordToPx(building.origin.x), coordToPx(building.origin.y))
      .css('overflow', 'visible'); //Todo: Labels shouldn't need this in the first place;

    if (this.currentRotation) {
      foreignObject.rotate(-this.currentRotation);
    }
  }

  private createDesireValSymbol(desirabilityValue: number) {
    const symbol = this.displayCanvas
      .symbol()
      .attr('id', `tileValue-${desirabilityValue}`)
      .css('display', 'block');

    symbol
      .rect(coordToPx(1), coordToPx(1))
      .fill(desirabilityColor(desirabilityValue))
      .stroke(colors.strongOutlineBlack)
      .css('display', 'block');

    symbol
      .text(desirabilityValue.toString())
      .font({ anchor: 'middle', 'dominant-baseline': 'middle' })
      .css('display', 'block')
      .center(coordToPx(1) / 2, coordToPx(1) / 2);

    this.desireValueMap.set(desirabilityValue, symbol);
    return symbol;
  }

  private createBackgroundPattern() {
    return this.displayCanvas.pattern(coordToPx(1), coordToPx(1), (pattern) => {
      pattern
        .rect(coordToPx(1), coordToPx(1))
        .fill('none')
        .stroke(colors.strongOutlineBlack);
    });
  }

  private drawBackground() {
    this.backgroundGroup
      .rect(gridPixelSize, gridPixelSize) //Fill the whole canvas with this
      .fill(this.backgroundPattern)
      .back(); // Ensure background is behind other elements
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
