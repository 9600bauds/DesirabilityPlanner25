import Building from '../classes/Building';
import House from '../classes/House';
import { BasicBlueprint } from '../interfaces/BasicBlueprint';
import { HouseBlueprint } from '../interfaces/HouseBlueprint';
import { getBlueprint } from '../utils/ALL_BLUEPRINTS';
import { Point, PointSet, addPoints } from '../utils/geometry';

type BuildingBlueprint = BasicBlueprint | HouseBlueprint;

export default BuildingBlueprint;

export function getAllTiles(origin: Point, bp: BuildingBlueprint): PointSet {
  const tiles = new PointSet();
  for (let x = origin.x; x < origin.x + bp.width; x++) {
    for (let y = origin.y; y < origin.y + bp.height; y++) {
      const thisTile: Point = { x, y };
      tiles.add(thisTile);
    }
  }
  if (bp.children) {
    for (const child of bp.children) {
      const childBlueprint = getBlueprint(child.childKey);
      const childOrigin = addPoints(origin, child.relativeOrigin);
      for (const point of getAllTiles(childOrigin, childBlueprint)) {
        tiles.add(point);
      }
    }
  }
  return tiles;
}

export function createBuilding(
  origin: Point,
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
