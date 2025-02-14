import Building from '../classes/Building';
import { CursorAction } from '../classes/UIManager';
import BuildingBlueprint from '../types/BuildingBlueprint';
import { Tile } from '../utils/geometry';

interface RenderContext {
  getBaseValues: () => number[][];
  getBuildings: () => Set<Building>;
  getCursorAction: () => CursorAction;
  getSelectedBlueprint: () => BuildingBlueprint | null;
  isTileOccupied: (tile: Tile) => boolean;
}

export default RenderContext;
