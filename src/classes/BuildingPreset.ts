import { BUILDING_PRESETS } from '../utils/building_presets';
import { Point } from '../utils/geometry';
import { DesireBox } from './DesireBox';

export interface BuildingPreset {
  name?: string;
  color?: string;
  borderColor?: string;
  width: number;
  height: number;
  cost: number[]; //Array of 5 costs: v.easy, easy, normal, hard, v.hard
  employeesRequired: number;
  desireBox?: DesireBox;
  children?: ChildPreset[];
}

export interface ChildPreset {
  childKey: keyof typeof BUILDING_PRESETS;
  relativeOrigin: Point;
}
