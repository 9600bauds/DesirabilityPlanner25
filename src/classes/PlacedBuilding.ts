import BuildingBlueprint from '../types/BuildingBlueprint';
import { Tile, Rectangle, TileSet } from '../utils/geometry';

class PlacedBuilding {
  blueprint: BuildingBlueprint;
  origin: Tile;
  rect: Rectangle;
  offsetTilesOccupied: TileSet;

  constructor(origin: Tile, type: BuildingBlueprint) {
    this.blueprint = type;
    this.origin = origin;
    this.rect = new Rectangle(
      this.origin,
      this.blueprint.height,
      this.blueprint.width
    );
    this.offsetTilesOccupied = this.blueprint.tilesOccupied.offsetSet(
      this.origin
    );
  }

  public interceptsTile(t2: Tile) {
    for (const t1 of this.offsetTilesOccupied) {
      if (t1.equals(t2)) {
        return true;
      }
    }
    return false;
  }

  public interceptsRectangle(rect: Rectangle): boolean {
    return rect.interceptsTiles(this.offsetTilesOccupied);
  }

  public getDesirabilityEffect(tile: Tile): number {
    const adjustedTile = tile.substract(this.origin);
    const effect = this.blueprint.desirabilityMap.get(adjustedTile.toKey());
    if (!effect) {
      return 0;
    }
    return effect;
  }
}

export default PlacedBuilding;
