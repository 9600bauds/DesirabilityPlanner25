import Building from '../classes/Building';
import House from '../classes/House';
import { BuildingBlueprint } from '../interfaces/BuildingBlueprint';
import { HouseBlueprint } from '../interfaces/HouseBlueprint';
import { Tile } from '../utils/geometry';

type Blueprint = BuildingBlueprint | HouseBlueprint;

export function createBuilding(position: Tile, blueprint: Blueprint) {
  if (
    'desirabilityToEvolve' in blueprint ||
    'desirabilityToDevolve' in blueprint ||
    'desirabilityToBeStable' in blueprint
  ) {
    return new House(position, blueprint);
  } else {
    return new Building(position, blueprint);
  }
}

export default Blueprint;
