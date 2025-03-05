import { BuildingBlueprint } from './BuildingBlueprint';

export interface HouseBlueprint extends BuildingBlueprint {
  desirabilityToEvolve: number;
  desirabilityToDevolve: number;
}
