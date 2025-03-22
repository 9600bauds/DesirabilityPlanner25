import { InteractionState } from '../types/InteractionState';
import Blueprint from '../types/Blueprint';
import Building from '../classes/Building';
import { Tile } from '../utils/geometry';

interface RenderContext {
  getBaseValues: () => Int16Array;
  getBuildings: () => Set<Building>;
  getSelectedBlueprint: () => Blueprint | null;
  isTileOccupied: (tile: Tile) => boolean;
  getInteractionState: () => InteractionState;
}

export default RenderContext;
