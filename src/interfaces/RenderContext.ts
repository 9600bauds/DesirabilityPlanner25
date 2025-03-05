import Building from '../classes/Building';
import Blueprint from '../types/Blueprint';
import CursorAction from '../types/CursorAction';
import { Tile } from '../utils/geometry';

interface RenderContext {
  getBaseValues: () => Int16Array;
  getBuildings: () => Set<Building>;
  getCursorAction: () => CursorAction;
  getSelectedBlueprint: () => Blueprint | null;
  isTileOccupied: (tile: Tile) => boolean;
}

export default RenderContext;
