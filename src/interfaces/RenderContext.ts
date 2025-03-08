import Building from '../classes/Building';
import Blueprint from '../types/Blueprint';
import { Tile } from '../utils/geometry';

interface RenderContext {
  getBaseValues: () => Int16Array;
  getBuildings: () => Set<Building>;
  getSelectedBlueprint: () => Blueprint | null;
  isTileOccupied: (tile: Tile) => boolean;
}

export default RenderContext;
