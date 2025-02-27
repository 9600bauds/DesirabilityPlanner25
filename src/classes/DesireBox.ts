import { NewDesireBox } from '../interfaces/NewDesireBox';
import { Rectangle, Tile } from '../utils/geometry';

class DesireBox {
  readonly effectPerRange: Int16Array;
  readonly bounds: Rectangle; //The origin of this rectangle is relative to 0,0 which is the origin of the base building
  readonly maxRange: number;

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

    this.effectPerRange = new Int16Array(data.maxRange + 1);
    this.effectPerRange[0] = 0; //We don't affect tiles inside us because reasons
    for (let dist = 1; dist <= data.maxRange; dist++) {
      const stepsAway = Math.ceil(dist / data.stepDist);
      const distanceModifier = (stepsAway - 1) * data.stepVal;

      this.effectPerRange[dist] = data.baseDesirability + distanceModifier;
    }

    this.bounds = new Rectangle(origin, height, width);
    this.maxRange = data.maxRange;
  }
}

export default DesireBox;
