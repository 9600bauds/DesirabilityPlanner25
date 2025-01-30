import { BuildingPreset } from '../classes/building';

export const gridSize = 50;
export const rotationAngle = (45 * Math.PI) / 180;

export const BUILDING_PRESETS: Record<string, BuildingPreset> = {
  GARDEN: {
    id: 'garden',
    name: 'Garden',
    height: 1,
    width: 1,
    cost: 100,
    desireBoxes: [
      {
        baseDesirability: 3,
        stepVal: -1,
        stepDist: 1,
        maxRange: 4,
      },
    ],
  },
} as const;
