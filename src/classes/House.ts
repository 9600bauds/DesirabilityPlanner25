import Blueprint from '../types/Blueprint';
import { Tile } from '../utils/geometry';
import Building from './Building';

class House extends Building {
  desirabilityToEvolve: number;
  desirabilityToDevolve: number;

  constructor(origin: Tile, blueprint: Blueprint) {
    super(origin, blueprint);
    if ('desirabilityToEvolve' in blueprint) {
      this.desirabilityToEvolve = blueprint.desirabilityToEvolve;
      this.desirabilityToDevolve = blueprint.desirabilityToDevolve;
    } else {
      throw new Error('House blueprint got an incomplete interface object!');
    }
  }
}

export default House;
