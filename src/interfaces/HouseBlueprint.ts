import { BasicBlueprint } from './BasicBlueprint';

export interface HouseBlueprint extends BasicBlueprint {
  desirabilityToEvolve: number;
  desirabilityToDevolve: number;
}
