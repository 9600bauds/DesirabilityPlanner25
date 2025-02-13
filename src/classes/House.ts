import { HouseBlueprint } from '../interfaces/HouseBlueprint';
import { Point } from '../utils/geometry';
import Building from './Building';

class House extends Building {
  desirabilityToEvolve: number;
  desirabilityToDevolve: number;

  constructor(origin: Point, blueprint: HouseBlueprint, parent?: Building) {
    super(origin, blueprint, parent);

    this.desirabilityToEvolve = blueprint.desirabilityToEvolve;
    this.desirabilityToDevolve = blueprint.desirabilityToDevolve;
  }
}

export default House;
