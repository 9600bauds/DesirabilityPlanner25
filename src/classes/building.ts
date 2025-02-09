// src/building.ts

import {
  addPoints,
  arePointsEqual,
  chebyshevDistance,
  Point,
  Rectangle,
  rectangleInterceptsSetOfPoints,
} from '../utils/geometry';
import { getAllTiles, getBlueprint } from '../interfaces/BuildingBlueprint';
import { BuildingBlueprint } from '../interfaces/BuildingBlueprint';
import { DesireBox } from '../interfaces/DesireBox';

class Building {
  origin: Point;
  label?: string;
  color?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;
  desireBox?: DesireBox;
  children?: Building[];
  blueprint: BuildingBlueprint;
  parent?: Building;

  constructor(origin: Point, blueprint: BuildingBlueprint, parent?: Building) {
    this.origin = origin;
    this.color = blueprint.color;
    this.borderColor = blueprint.borderColor;
    this.height = blueprint.height;
    this.width = blueprint.width;
    this.desireBox = blueprint.desireBox;
    this.blueprint = blueprint;
    if (parent) {
      this.parent = parent;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(this);
    } else {
      //Children are always 0 cost and have no label
      this.label = blueprint.label;
      if (blueprint.cost) {
        this.cost = blueprint.cost;
      }
      if (blueprint.employeesRequired) {
        this.employeesRequired = blueprint.employeesRequired;
      }
    }
    if (blueprint.children) {
      for (const blueprintChild of blueprint.children) {
        const childOrigin = addPoints(origin, blueprintChild.relativeOrigin);
        const childBlueprint = getBlueprint(blueprintChild.childKey);
        const _child = new Building(childOrigin, childBlueprint, this);
      }
    }
    console.log('Created building: ', this);
  }

  public getRectangleInTiles(): Rectangle {
    return { origin: this.origin, width: this.width, height: this.height };
  }

  public getTilesOccupied = (): Set<Point> => {
    return getAllTiles(this.origin, this.blueprint);
  };

  public interceptsPoint(point: Point) {
    const tiles = this.getTilesOccupied();
    for (const tile of tiles) {
      if (arePointsEqual(tile, point)) {
        return true;
      }
    }
    return false;
  }

  public interceptsRectangle(rect: Rectangle): boolean {
    return rectangleInterceptsSetOfPoints(rect, this.getTilesOccupied());
  }

  public recursiveDesirabilityEffect(point: Point): number {
    let desirabilityEffect = this.selfDesirabilityEffect(point);

    if (this.children) {
      for (const child of this.children) {
        desirabilityEffect += child.recursiveDesirabilityEffect(point);
      }
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

export default Building;
