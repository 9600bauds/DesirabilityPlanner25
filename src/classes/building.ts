// src/building.ts

import { globalMaxRange } from '../utils/constants';
import { chebyshevDistance, Point } from '../utils/geometry';
import { DesireBox } from './DesireBox';

export interface BuildingPreset {
  name: string;
  width: number;
  height: number;
  cost: number[];
  employees: number;
  desireBoxes: DesireBox[];
}

export class Building {
  origin: Point;
  height: number;
  width: number;
  name: string;
  cost: number[];
  employees: number;
  desireBoxes: DesireBox[];

  constructor(origin: Point, preset: BuildingPreset) {
    this.origin = origin;
    this.height = preset.height;
    this.width = preset.width;
    this.name = preset.name;
    this.cost = preset.cost;
    this.employees = preset.employees;
    this.desireBoxes = preset.desireBoxes;
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
