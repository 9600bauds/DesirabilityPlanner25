import PlacedBuilding from '../classes/PlacedBuilding';
import { CursorAction } from '../classes/UIManager';
import BuildingBlueprint from '../types/BuildingBlueprint';
import { Tile } from '../utils/geometry';

interface RenderContext {
  getBaseValues: () => Int16Array;
  getBuildings: () => Set<PlacedBuilding>;
  getCursorAction: () => CursorAction;
  getSelectedBlueprint: () => BuildingBlueprint | null;
  isTileOccupied: (tile: Tile) => boolean;
}

export default RenderContext;
