import Building from '../classes/Building';
import { CursorAction } from '../classes/UIManager';
import { BuildingBlueprint } from './BuildingBlueprint';

interface RenderGetters {
  getBaseValues: () => number[][];
  getBuildings: () => Set<Building>;
  getCursorAction: () => CursorAction;
  getSelectedBlueprint: () => BuildingBlueprint | null;
}

export default RenderGetters;
