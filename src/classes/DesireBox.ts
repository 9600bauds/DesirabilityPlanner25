import { NewDesireBox } from '../interfaces/NewDesireBox';
import { chebyshevDistance, Rectangle, Tile } from '../utils/geometry';
import * as Collections from 'typescript-collections';

class DesireBox {
  readonly baseDesirability: number;
  readonly stepVal: number;
  readonly stepDist: number;
  readonly maxRange: number;

  constructor(data: NewDesireBox) {
    this.baseDesirability = data.baseDesirability;
    this.stepVal = data.stepVal;
    this.stepDist = data.stepDist;
    this.maxRange = data.maxRange;
  }

  public distToEffect(dist: number) {
    if (dist <= 0 || dist > this.maxRange) {
      return 0; // We don't affect tiles inside us because reasons
    }

    const stepsAway = Math.ceil(dist / this.stepDist);
    const distanceModifier = (stepsAway - 1) * this.stepVal;
    return this.baseDesirability + distanceModifier;
  }

  public addTodesirabilityDict = (
    desirabilityDict: Collections.Dictionary<Tile, number>,
    bounds: Rectangle
  ) => {
    const minX = bounds.origin.x - this.maxRange;
    const maxX = bounds.origin.x + bounds.width + this.maxRange;
    const minY = bounds.origin.y - this.maxRange;
    const maxY = bounds.origin.y + bounds.height + this.maxRange;
    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        const tile = new Tile(x, y);
        const dist = chebyshevDistance(tile, bounds);
        const desirabilityEffect = this.distToEffect(dist);
        if (!desirabilityEffect) continue;
        desirabilityDict.setValue(
          tile,
          desirabilityEffect + (desirabilityDict.getValue(tile) ?? 0)
        );
      }
    }
  };
}

export default DesireBox;
