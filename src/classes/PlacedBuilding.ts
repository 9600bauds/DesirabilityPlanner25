import BuildingBlueprint from '../types/BuildingBlueprint';
import { chebyshevDistance, Tile, Rectangle, TileSet } from '../utils/geometry';

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

  public recursiveDesirabilityEffect(tile: Tile): number {
    const desirabilityEffect = this.selfDesirabilityEffect(tile);

    /*if (this.children) {
      for (const child of this.children) {
        desirabilityEffect += child.recursiveDesirabilityEffect(tile);
      }
    }*/

    return desirabilityEffect;
  }

  public selfDesirabilityEffect(tile: Tile): number {
    if (!this.blueprint.desireBox) return 0;

    let desirabilityEffect = 0;

    const distFromBuilding = chebyshevDistance(tile, this.rect);

    if (
      distFromBuilding <= 0 ||
      distFromBuilding > this.blueprint.desireBox.maxRange
    ) {
      return 0; // We don't affect tiles inside us because reasons
    }

    const stepsAway = Math.ceil(
      distFromBuilding / this.blueprint.desireBox.stepDist
    );
    const distanceModifier = (stepsAway - 1) * this.blueprint.desireBox.stepVal;
    desirabilityEffect +=
      this.blueprint.desireBox.baseDesirability + distanceModifier;

    return desirabilityEffect;
  }
}

export default PlacedBuilding;
