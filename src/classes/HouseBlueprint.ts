import { Svg } from '@svgdotjs/svg.js';
import NewBlueprint from '../types/NewBlueprint';
import BasicBlueprint from './BasicBlueprint';

class HouseBlueprint extends BasicBlueprint {
  desirabilityToEvolve: number;
  desirabilityToDevolve: number;

  constructor(blueprint: NewBlueprint, key: string, svgCanvas: Svg) {
    super(blueprint, key, svgCanvas);
    if ('desirabilityToEvolve' in blueprint) {
      this.desirabilityToEvolve = blueprint.desirabilityToEvolve;
      this.desirabilityToDevolve = blueprint.desirabilityToDevolve;
    } else {
      throw new Error('House blueprint got an incomplete interface object!');
    }
  }
}

export default HouseBlueprint;
