import Blueprint from '../types/Blueprint';
import { COORD_TO_INT16 } from '../utils/constants';
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

  public maxDesirabilityFromGrid(tileValues: Int16Array): number {
    let max = Number.MIN_SAFE_INTEGER;
    for (const tile of this.tilesOccupied.toArray()) {
      max = Math.max(max, tileValues[COORD_TO_INT16(tile.x, tile.y)]);
    }
    return max;
  }

  public getLabel(tileValues: Int16Array) {
    const maxDesirability = this.maxDesirabilityFromGrid(tileValues);
    return (
      this.baseLabel! +
      `<br>Devolving: ${maxDesirability}/${this.desirabilityToDevolve}`
    );
  }
}

export default House;
