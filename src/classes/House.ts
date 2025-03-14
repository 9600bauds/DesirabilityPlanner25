import { HouseBlueprint } from '../interfaces/HouseBlueprint';
import { COORD_TO_INT16 } from '../utils/constants';
import { Tile } from '../utils/geometry';
import Building from './Building';

class House extends Building {
  desirabilityToEvolve?: number;
  desirabilityToBeStable?: number;
  desirabilityToDevolve?: number;

  constructor(origin: Tile, blueprint: HouseBlueprint) {
    super(origin, blueprint);
    this.desirabilityToEvolve = blueprint.desirabilityToEvolve;
    this.desirabilityToDevolve = blueprint.desirabilityToDevolve;
    this.desirabilityToBeStable = blueprint.desirabilityToBeStable;
  }

  public maxDesirabilityFromGrid(tileValues: Int16Array): number {
    let max = Number.MIN_SAFE_INTEGER;
    for (const tile of this.tilesOccupied.toArray()) {
      max = Math.max(max, tileValues[COORD_TO_INT16(tile.x, tile.y)]);
    }
    return max;
  }

  public getLabel(tileValues: Int16Array) {
    const max = this.maxDesirabilityFromGrid(tileValues);

    if (this.desirabilityToDevolve && max <= this.desirabilityToDevolve) {
      return (
        this.baseLabel! +
        `<br>${max}/${this.desirabilityToDevolve + 1}&nbsp;to<br>not&nbsp;devolve`
      );
    } else if (
      this.desirabilityToBeStable &&
      max < this.desirabilityToBeStable
    ) {
      return (
        this.baseLabel! +
        `<br>${max}/${this.desirabilityToBeStable}&nbsp;to<br>be&nbsp;stable`
      );
    } else if (this.desirabilityToEvolve) {
      return (
        this.baseLabel! +
        `<br>${max}/${this.desirabilityToEvolve}&nbsp;to<br>evolve`
      );
    }
    return this.baseLabel;
  }
}

export default House;
