import { Point } from '../utils/geometry';

export interface DesireBox {
  relativeOrigin?: Point; //Relative to the origin of the parent building, so (1, 1) means this box has its origin at parentx+1 parenty+1. If empty, defaults to 0,0.
  height?: number; //If empty, defaults to the parent's height
  width?: number; //If empty, defaults to the parent's width
  baseDesirability: number;
  stepVal: number;
  stepDist: number;
  maxRange: number;
}
