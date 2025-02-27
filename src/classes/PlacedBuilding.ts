import BuildingBlueprint from '../types/BuildingBlueprint';
import { Tile, Rectangle, offsetSetOfTiles } from '../utils/geometry';
import * as Collections from 'typescript-collections';

class PlacedBuilding {
  blueprint: BuildingBlueprint;
  origin: Tile;
  rect: Rectangle;
  offsetTilesOccupied: Collections.Set<Tile>;

  constructor(origin: Tile, type: BuildingBlueprint) {
    this.blueprint = type;
    this.origin = origin;
    this.rect = new Rectangle(
      this.origin,
      this.blueprint.height,
      this.blueprint.width
    );
    this.offsetTilesOccupied = offsetSetOfTiles(
      this.blueprint.tilesOccupied,
      this.origin
    );
  }

  public interceptsTile(t2: Tile) {
    return this.offsetTilesOccupied.contains(t2);
  }

  public interceptsRectangle(rect: Rectangle): boolean {
    return rect.interceptsTiles(this.offsetTilesOccupied);
  }
}

export default PlacedBuilding;
