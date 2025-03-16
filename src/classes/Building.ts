import Blueprint from '../types/Blueprint';
import { Tile, Rectangle, getOutlinePath } from '../utils/geometry';
import * as Collections from 'typescript-collections';
import DesireBox from './desireBox';
import BuildingGraphic, { fillPath } from '../interfaces/BuildingGraphic';
import { ALL_BLUEPRINTS } from '../data/BLUEPRINTS';
import { COORD_TO_PX, GRID_MAX_X, GRID_MAX_Y } from '../utils/constants';
import { ALL_CATEGORIES } from '../data/CATEGORIES';
import colors from '../utils/colors';

class Building {
  bpKey: string;
  id: string;
  origin: Tile;
  width: number;
  height: number;

  tilesOccupied: Collections.Set<Tile>;

  desireBoxes: DesireBox[];

  cost: number[] = [0, 0, 0, 0, 0]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number = 0;

  baseLabel?: string;
  graphic?: BuildingGraphic;

  constructor(origin: Tile, blueprint: Blueprint) {
    if (
      origin.x < 0 ||
      origin.y < 0 ||
      origin.x > GRID_MAX_X ||
      origin.y > GRID_MAX_Y
    ) {
      throw new Error(
        `Tried to create a building outside the edges of the grid! x:${origin.x} y:${origin.y}`
      );
    }

    //Todo: Assigning key should probably be done in-situ for ALL_BLUEPRINTS
    const key = Object.keys(ALL_BLUEPRINTS).find(
      (key) => ALL_BLUEPRINTS[key] === blueprint
    );
    if (!key) {
      throw new Error(
        'Building blueprint did not have a key in the blueprints lookup!'
      );
    }
    this.bpKey = key;
    this.id = `${key};${origin.x};${origin.y}`;
    this.origin = origin;
    this.height = blueprint.height;
    this.width = blueprint.width;

    this.baseLabel = blueprint.label;

    if (blueprint.cost) {
      this.cost = blueprint.cost;
    }
    if (blueprint.employeesRequired) {
      this.employeesRequired = blueprint.employeesRequired;
    }
    this.desireBoxes = [];
    this.recursiveAddDesireBox(blueprint, this.origin);

    this.tilesOccupied = new Collections.Set<Tile>();
    this.recursiveAddToTilesOccupied(blueprint, this.origin);

    this.graphic = this.buildGraphic(blueprint);
  }

  private recursiveAddToTilesOccupied = (data: Blueprint, origin: Tile) => {
    for (let x = 0; x < data.width; x++) {
      for (let y = 0; y < data.height; y++) {
        const thisTile = new Tile(x, y).add(origin);
        this.tilesOccupied.add(thisTile);
      }
    }
    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = ALL_BLUEPRINTS[child.childKey];
        this.recursiveAddToTilesOccupied(
          childBlueprint,
          origin.add(child.relativeOrigin)
        );
      }
    }
  };

  private recursiveAddDesireBox = (data: Blueprint, origin: Tile) => {
    if (data.desireBox) {
      this.desireBoxes.push(
        new DesireBox(data.desireBox, origin, data.height, data.width)
      );
    }
    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = ALL_BLUEPRINTS[child.childKey];
        this.recursiveAddDesireBox(
          childBlueprint,
          origin.add(child.relativeOrigin)
        );
      }
    }
  };

  private buildGraphic(newBp: Blueprint): BuildingGraphic | undefined {
    if (newBp.invisible) return;
    const outline = getOutlinePath(this.origin, this.tilesOccupied);
    const fillPaths: fillPath[] = [];

    this.recursiveAddFillPaths(newBp, fillPaths, this.origin);

    const graphic = { outline, fillPaths };
    return graphic;
  }

  private recursiveAddFillPaths = (
    data: Blueprint,
    fillPaths: fillPath[],
    origin: Tile
  ) => {
    if (data.invisible) {
      return;
    }
    const fillColor = this.getBpFillColor(data);
    const x = COORD_TO_PX(origin.x);
    const y = COORD_TO_PX(origin.y);
    const width = COORD_TO_PX(data.width);
    const height = COORD_TO_PX(data.height);

    const path = new Path2D();
    path.rect(x, y, width, height);
    fillPaths.push({ path, fillColor });

    if (data.children) {
      for (const child of data.children) {
        const childBlueprint = ALL_BLUEPRINTS[child.childKey];
        this.recursiveAddFillPaths(
          childBlueprint,
          fillPaths,
          origin.add(child.relativeOrigin)
        );
      }
    }
  };

  private getBpFillColor(bp: Blueprint): string {
    if (bp.fillColor) {
      return bp.fillColor;
    }
    if (bp.category) {
      const category = ALL_CATEGORIES[bp.category];
      if (category) return category.baseColor;
    }
    return colors.backgroundWhite;
  }

  public getLabel(_tileValues: Int16Array) {
    return this.baseLabel;
  }

  public interceptsTile(t2: Tile) {
    return this.tilesOccupied.contains(t2);
  }

  public interceptsRectangle(rect: Rectangle): boolean {
    return rect.interceptsTiles(this.tilesOccupied);
  }
}

export default Building;
