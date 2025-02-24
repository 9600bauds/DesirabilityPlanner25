import { NewDesireBox } from '../interfaces/NewDesireBox';
import { chebyshevDistance, Rectangle, Tile } from '../utils/geometry';

class DesireBox {
  readonly effectPerRange: number[];
  readonly bounds: Rectangle; //The origin of this rectangle is relative to 0,0 which is the origin of the base building

  constructor(data: NewDesireBox, origin: Tile, height: number, width: number) {
    if (data.maxRange === undefined || data.maxRange > 99) {
      throw new Error(
        'Desirebox data had an invalid max range (should be <=99, but really, <=6 is what the game uses)!'
      );
    }
    if (data.stepDist === undefined || data.stepDist < 1) {
      throw new Error(
        'Desirebox data had an invalid stepDist (should be positive)!'
      );
    }

    this.effectPerRange = [];
    for (let dist = 1; dist <= data.maxRange; dist++) {
      //Note that dist 0 is not included, we don't affect tiles inside us because reasons
      const stepsAway = Math.ceil(dist / data.stepDist);
      const distanceModifier = (stepsAway - 1) * data.stepVal;

      this.effectPerRange[dist] = data.baseDesirability + distanceModifier;
    }
    this.bounds = new Rectangle(origin, height, width);
  }

  public getEffectForRelativeTile(tile: Tile): number {
    const dist = chebyshevDistance(tile, this.bounds);
    if (dist in this.effectPerRange) {
      return this.effectPerRange[dist];
    }
    return 0;
  }
}

export default DesireBox;
