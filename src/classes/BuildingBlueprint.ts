import { BUILDING_BLUEPRINTS } from '../utils/buildingBlueprints';
import { Point } from '../utils/geometry';
import { DesireBox } from './DesireBox';

export interface BuildingBlueprint {
  name?: string;
  color?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost?: number[]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired?: number;
  desireBox?: DesireBox;
  children?: ChildBlueprint[];
}

export interface ChildBlueprint {
  childKey: keyof typeof BUILDING_BLUEPRINTS;
  relativeOrigin: Point;
}
