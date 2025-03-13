import { BuildingBlueprint } from './BuildingBlueprint';

export interface HouseBlueprint extends BuildingBlueprint {
  desirabilityToDevolve?: number;
  desirabilityToBeStable: number;
  desirabilityToEvolve?: number;
}
