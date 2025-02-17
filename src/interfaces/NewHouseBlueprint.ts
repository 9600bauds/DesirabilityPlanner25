import { NewBasicBlueprint } from './NewBasicBlueprint';

export interface NewHouseBlueprint extends NewBasicBlueprint {
  desirabilityToEvolve: number;
  desirabilityToDevolve: number;
}
