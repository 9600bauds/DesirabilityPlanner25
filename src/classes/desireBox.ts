import { Point } from '../utils/geometry';

interface DesireBoxBase {
  baseDesirability: number;
  stepVal: number;
  stepDist: number;
  maxRange: number;
}

export interface ComplexDesireBox extends DesireBoxBase {
  relativeOrigin: Point; //Relative to the origin of the parent building, so (1, 1) means
  //this box has its origin at parentx+1 parenty+1.
  //Note that 0,0 is the TOP-LEFT corner!! Not bottom-left!
  height: number;
  width: number;
}

export type DesireBox = DesireBoxBase | ComplexDesireBox;
