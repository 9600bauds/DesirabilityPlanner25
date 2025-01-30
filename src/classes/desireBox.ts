import { Point, chebyshevDistance } from '../utils/geometry';

export class DesireBox {
  origin: Point;
  height: number;
  width: number;
  baseDesirability: number;
  stepVal: number;
  stepDist: number;
  maxRange: number;

  constructor(
    origin: Point,
    height: number,
    width: number,
    baseDesirability: number,
    stepVal: number,
    stepDist: number,
    maxRange: number
  ) {
    this.origin = origin;
    this.height = height;
    this.width = width;
    this.baseDesirability = baseDesirability;
    this.stepVal = stepVal;
    this.stepDist = stepDist;
    this.maxRange = maxRange;
  }

  calculateDesirabilityEffect(point: Point): number {
    const chebyshevDist = chebyshevDistance(
      point,
      this.origin,
      this.height,
      this.width
    );

    if (chebyshevDist > this.maxRange) {
      return 0; // Beyond max range
    }

    if (chebyshevDist <= 0) {
      return 0; // We don't affect tiles inside us because reasons
    }

    const stepsAway = Math.ceil(chebyshevDist / this.stepDist);
    const distanceModifier = (stepsAway - 1) * this.stepVal;
    const desirabilityEffect = this.baseDesirability + distanceModifier;
    return desirabilityEffect;
  }
}
