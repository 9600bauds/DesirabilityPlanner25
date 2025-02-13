import Building from '../classes/Building';
import { CursorAction } from '../classes/UIManager';
import BuildingBlueprint from '../types/BuildingBlueprint';
import { Point } from '../utils/geometry';

interface RenderContext {
  getBaseValues: () => number[][];
  getBuildings: () => Set<Building>;
  getCursorAction: () => CursorAction;
  getSelectedBlueprint: () => BuildingBlueprint | null;
  isTileOccupied: (tile: Point) => boolean;
}

export default RenderContext;
