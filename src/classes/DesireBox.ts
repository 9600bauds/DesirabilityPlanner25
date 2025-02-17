import { NewDesireBox } from '../interfaces/NewDesireBox';

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
}

export default DesireBox;
