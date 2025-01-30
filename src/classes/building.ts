// src/building.ts

import { chebyshevDistance, Point } from '../utils/geometry';
import { DesireBox } from './desireBox';

export class Building {
  origin: Point;
  height: number;
  width: number;
  name: string;
  cost: number;
  desireBoxes: DesireBox[];

  constructor(
    origin: Point,
    height: number,
    width: number,
    name: string,
    cost: number,
    desireBoxes: DesireBox[]
  ) {
    this.origin = origin;
    this.height = height;
    this.width = width;
    this.name = name;
    this.cost = cost;
    this.desireBoxes = desireBoxes;
  }

  public calculateDesirabilityEffect(point: Point): number {
    const distFromBuilding = chebyshevDistance(
      point,
      this.origin,
      this.height,
      this.width
    );

    if (distFromBuilding <= 0) {
      return 0; // We don't affect tiles inside us because reasons
    }

    let desirabilityEffect = 0;
    for (const box of this.desireBoxes) {
      const boxOrigin: Point = {
        x: this.origin.x + (box.relativeOrigin?.x || 0),
        y: this.origin.y + (box.relativeOrigin?.y || 0),
      };
      const boxHeight = box.height ?? this.height; // ?? = nullish coalescing operator
      const boxWidth = box.width ?? this.width;
      const distFromBox = chebyshevDistance(
        point,
        boxOrigin,
        boxHeight,
        boxWidth
      );
      if (distFromBox > box.maxRange) {
        return 0; // Beyond max range
      }
      const stepsAway = Math.ceil(distFromBox / box.stepDist);
      const distanceModifier = (stepsAway - 1) * box.stepVal;
      desirabilityEffect += box.baseDesirability + distanceModifier;
    }

    return desirabilityEffect;
  }
}

export class ComplexBuilding extends Building {}

export class House extends Building {}

export interface BuildingPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  cost: number;
  desireBoxes: DesireBox[];
}
