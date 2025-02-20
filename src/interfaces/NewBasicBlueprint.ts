import { NewDesireBox } from './NewDesireBox';
import { Tile } from '../utils/geometry';
import { NEW_BLUEPRINTS } from '../data/BLUEPRINTS';
import { CATEGORIES } from '../data/CATEGORIES';

export interface NewBasicBlueprint {
  label?: string;
  fillColor?: string;
  invisible?: boolean; //If true, this building and its children have no graphic.
  hidden?: boolean; //If true, building will not show up as a sidebar option to be placed
  width: number;
  height: number;
  cost?: number[]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired?: number;
  desireBox?: NewDesireBox;
  children?: ChildBlueprint[];
  category?: keyof typeof CATEGORIES;
}

export interface ChildBlueprint {
  childKey: keyof typeof NEW_BLUEPRINTS;
  relativeOrigin: Tile;
}
