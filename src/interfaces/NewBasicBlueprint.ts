import { DesireBox } from './DesireBox';
import { Tile } from '../utils/geometry';
import { NEW_BLUEPRINTS } from '../data/BLUEPRINTS';
import { CATEGORIES } from '../data/CATEGORIES';

export interface NewBasicBlueprint {
  label?: string;
  fillColor?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost?: number[]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired?: number;
  desireBox?: DesireBox;
  children?: ChildBlueprint[];
  category?: keyof typeof CATEGORIES;
}

export interface ChildBlueprint {
  childKey: keyof typeof NEW_BLUEPRINTS;
  relativeOrigin: Tile;
}
