// src/building.ts

import { chebyshevDistance, Tile, Rectangle, TileSet } from '../utils/geometry';
import { getAllTiles } from '../interfaces/getAllTiles';
import { getBlueprint } from '../utils/ALL_BLUEPRINTS';
import { DesireBox } from '../interfaces/DesireBox';
import BuildingBlueprint, { createBuilding } from '../types/BuildingBlueprint';
import { BUILDING_CATEGORIES } from '../interfaces/BuildingCategory';
import colors from '../utils/colors';

class Building {
  origin: Tile;
  width: number;
  height: number;
  rect: Rectangle;
  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;
  label?: string;
  fillColor?: string = colors.backgroundWhite;
  borderColor?: string = colors.strongOutlineBlack;
  desireBox?: DesireBox;
  tilesOccupied: TileSet;
  children?: Building[];
  parent?: Building;

  constructor(origin: Tile, blueprint: BuildingBlueprint, parent?: Building) {
    this.origin = origin;
    this.height = blueprint.height;
    this.width = blueprint.width;
    this.rect = new Rectangle(this.origin, this.width, this.height);
    if (blueprint.borderColor) {
      this.borderColor = blueprint.borderColor;
    }
    if (blueprint.fillColor) {
      this.fillColor = blueprint.fillColor;
    } else if (parent) {
      this.fillColor = parent.fillColor;
    } else if (blueprint.category) {
      const category = BUILDING_CATEGORIES[blueprint.category];
      if (category) this.fillColor = category.baseColor;
    }
    this.desireBox = blueprint.desireBox;
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
        const childOrigin = origin.add(blueprintChild.relativeOrigin);
        const childBlueprint = getBlueprint(blueprintChild.childKey);
        const _child = createBuilding(childOrigin, childBlueprint, this);
      }
    }
    this.tilesOccupied = getAllTiles(origin, blueprint);
  }

  public interceptsTile(t2: Tile) {
    for (const t1 of this.tilesOccupied) {
      if (t1.equals(t2)) {
        return true;
      }
    }
    return false;
  }

  public interceptsRectangle(rect: Rectangle): boolean {
    return rect.interceptsTiles(this.tilesOccupied);
  }

  public recursiveDesirabilityEffect(tile: Tile): number {
    let desirabilityEffect = this.selfDesirabilityEffect(tile);

    if (this.children) {
      for (const child of this.children) {
        desirabilityEffect += child.recursiveDesirabilityEffect(tile);
      }
    }

    return desirabilityEffect;
  }

  public selfDesirabilityEffect(tile: Tile): number {
    if (!this.desireBox) return 0;

    let desirabilityEffect = 0;

    const distFromBuilding = chebyshevDistance(tile, this.rect);

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
