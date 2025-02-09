import Building from '../classes/Building';
import { CursorAction } from '../classes/UIManager';
import { Point } from '../utils/geometry';
import { BuildingBlueprint } from './BuildingBlueprint';

interface RenderGetters {
  getBaseValues: () => number[][];
  getBuildings: () => Set<Building>;
  getCursorAction: () => CursorAction;
  getSelectedBlueprint: () => BuildingBlueprint | null;
  isTileOccupied: (tile: Point) => boolean;
}

export default RenderGetters;
