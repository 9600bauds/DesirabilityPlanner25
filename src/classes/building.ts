// src/building.ts

import {
  addPoints,
  chebyshevDistance,
  Point,
  Rectangle,
  rectangleInterceptsSetOfPoints,
} from '../utils/geometry';
import { getBlueprint } from '../definitions/buildingBlueprints';
import { BuildingBlueprint } from '../definitions/buildingBlueprints';
import { DesireBox } from './DesireBox';

export class Building {
  origin: Point;
  name?: string;
  color?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;
  desireBox?: DesireBox;
  children?: Building[];
  parent?: Building;

  constructor(origin: Point, blueprint: BuildingBlueprint) {
    this.origin = origin;
    this.name = blueprint.name;
    this.color = blueprint.color;
    this.borderColor = blueprint.borderColor;
    this.height = blueprint.height;
    this.width = blueprint.width;
    if (blueprint.cost) {
      this.cost = blueprint.cost;
    }
    if (blueprint.employeesRequired) {
      this.employeesRequired = blueprint.employeesRequired;
    }
    this.desireBox = blueprint.desireBox;
    if (blueprint.children) {
      this.children = [];
      for (const blueprintChild of blueprint.children) {
        const childOrigin = addPoints(origin, blueprintChild.relativeOrigin);
        const childBlueprint = getBlueprint(blueprintChild.childKey);
        const child = new Building(childOrigin, childBlueprint);
        this.children?.push(child);
        child.parent = this;
      }
    }
    console.log('Created building: ', this);
  }

  public getRectangleInTiles(): Rectangle {
    return { origin: this.origin, width: this.width, height: this.height };
  }

  public getTilesOccupied(): Set<Point> {
    const tilesOccupied = new Set<Point>();
    for (let x = this.origin.x; x < this.origin.x + this.width; x++) {
      for (let y = this.origin.y; y < this.origin.y + this.height; y++) {
        tilesOccupied.add({ x, y });
      }
    }
    if (this.children) {
      for (const child of this.children) {
        for (const point of child.getTilesOccupied()) {
          tilesOccupied.add(point);
        }
      }
    }
    return tilesOccupied;
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

export class ComplexBuilding extends Building {}

export class House extends Building {}
