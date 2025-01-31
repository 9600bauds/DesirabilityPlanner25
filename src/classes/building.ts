// src/building.ts

import {
  addPoints,
  chebyshevDistance,
  Point,
  Rectangle,
} from '../utils/geometry';
import { BUILDING_PRESETS } from '../utils/building_presets';
import { BuildingPreset } from './BuildingPreset';
import { DesireBox } from './DesireBox';

export class Building {
  origin: Point;
  name?: string;
  color?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost: number[]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number;
  desireBox?: DesireBox;
  children?: Building[];

  constructor(origin: Point, preset: BuildingPreset) {
    this.origin = origin;
    this.name = preset.name;
    this.color = preset.color;
    this.borderColor = preset.borderColor;
    this.height = preset.height;
    this.width = preset.width;
    this.cost = preset.cost;
    this.employeesRequired = preset.employeesRequired;
    this.desireBox = preset.desireBox;
    if (preset.children) {
      this.children = [];
      preset.children.forEach((presetChild) => {
        const childOrigin = addPoints(origin, presetChild.relativeOrigin);
        const childPreset = BUILDING_PRESETS[presetChild.childKey];
        const child = new Building(childOrigin, childPreset);
        this.children.push(child);
      });
    }
    console.log('Created building: ', this);
  }

  public getRectangleInTiles(): Rectangle {
    return { origin: this.origin, width: this.width, height: this.height };
  }

  public recursiveDesirabilityEffect(point: Point): number {
    let desirabilityEffect = this.selfDesirabilityEffect(point);

    if (this.children) {
      this.children.forEach((child) => {
        desirabilityEffect += child.recursiveDesirabilityEffect(point);
      });
    }

    return desirabilityEffect;
  }

  public selfDesirabilityEffect(point: Point): number {
    if (!this.desireBox) return 0;

    let desirabilityEffect = 0;

    const distFromBuilding = chebyshevDistance(
      point,
      this.origin,
      this.height,
      this.width
    );

    if (distFromBuilding <= 0 || distFromBuilding > this.desireBox.maxRange) {
      return 0; // We don't affect tiles inside us because reasons
    }

    const stepsAway = Math.ceil(distFromBuilding / this.desireBox.stepDist);
    const distanceModifier = (stepsAway - 1) * this.desireBox.stepVal;
    desirabilityEffect += this.desireBox.baseDesirability + distanceModifier;

    return desirabilityEffect;
  }
}

export class ComplexBuilding extends Building {}

export class House extends Building {}
