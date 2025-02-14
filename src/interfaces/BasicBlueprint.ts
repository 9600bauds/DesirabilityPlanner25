import { DesireBox } from './DesireBox';
import { Tile } from '../utils/geometry';
import { BUILDING_CATEGORIES } from './BuildingCategory';
import { ALL_BLUEPRINTS } from '../utils/ALL_BLUEPRINTS';

export interface BasicBlueprint {
  label?: string;
  fillColor?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost?: number[]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired?: number;
  desireBox?: DesireBox;
  children?: ChildBlueprint[];
  category?: keyof typeof BUILDING_CATEGORIES;
}

export interface ChildBlueprint {
  childKey: keyof typeof ALL_BLUEPRINTS;
  relativeOrigin: Tile;
}
