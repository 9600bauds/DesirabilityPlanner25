import Building from '../classes/Building';
import House from '../classes/House';
import { BasicBlueprint } from '../interfaces/BasicBlueprint';
import { HouseBlueprint } from '../interfaces/HouseBlueprint';
import { getBlueprint } from '../utils/ALL_BLUEPRINTS';
import { Tile, TileSet } from '../utils/geometry';

type BuildingBlueprint = BasicBlueprint | HouseBlueprint;

export default BuildingBlueprint;

export function getAllTiles(origin: Tile, bp: BuildingBlueprint): TileSet {
  const tiles = new TileSet();
  for (let x = origin.x; x < origin.x + bp.width; x++) {
    for (let y = origin.y; y < origin.y + bp.height; y++) {
      const thisTile = new Tile(x, y);
      tiles.add(thisTile);
    }
  }
  if (bp.children) {
    for (const child of bp.children) {
      const childBlueprint = getBlueprint(child.childKey);
      const childOrigin = origin.add(child.relativeOrigin);
      for (const tile of getAllTiles(childOrigin, childBlueprint)) {
        tiles.add(tile);
      }
    }
  }
  return tiles;
}

export function createBuilding(
  origin: Tile,
  blueprint: BuildingBlueprint,
  parent?: Building
): Building {
  if (
    'desirabilityToEvolve' in blueprint ||
    'desirabilityToDevolve' in blueprint
  ) {
    return new House(origin, blueprint as HouseBlueprint, parent);
  } else {
    return new Building(origin, blueprint, parent);
  }
}
