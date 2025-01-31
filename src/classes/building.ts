// src/building.ts

import { globalMaxRange } from '../utils/constants';
import {
  addPoints,
  chebyshevDistance,
  Point,
  Rectangle,
} from '../utils/geometry';
import { DesireBox } from './DesireBox';

export interface BuildingPreset {
  name: string;
  color?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost: number[];
  employees: number;
  desireBoxes: DesireBox[];
}

export class Building {
  origin: Point;
  name: string;
  color?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost: number[];
  employees: number;
  desireBoxes: DesireBox[];

  constructor(origin: Point, preset: BuildingPreset) {
    this.origin = origin;
    this.name = preset.name;
    this.color = preset.color;
    this.borderColor = preset.borderColor;
    this.height = preset.height;
    this.width = preset.width;
    this.cost = preset.cost;
    this.employees = preset.employees;
    this.desireBoxes = preset.desireBoxes;
  }

  public getRectangleInTiles(): Rectangle {
    return { origin: this.origin, width: this.width, height: this.height };
  }

  public calculateDesirabilityEffect(point: Point): number {
    const distFromBuilding = chebyshevDistance(
      point,
      this.origin,
      this.height,
      this.width
    );

    if (distFromBuilding <= 0 || distFromBuilding > globalMaxRange) {
      return 0; // We don't affect tiles inside us because reasons, and the global max range has the final say (sorry no external boxes)
    }

    let desirabilityEffect = 0;
    for (const box of this.desireBoxes) {
      let distFromBox: number;
      if ('relativeOrigin' in box) {
        distFromBox = chebyshevDistance(
          point,
          addPoints(this.origin, box.relativeOrigin),
          box.height,
          box.width
        );
      } else {
        distFromBox = chebyshevDistance(
          point,
          this.origin,
          this.height,
          this.width
        );
      }
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
