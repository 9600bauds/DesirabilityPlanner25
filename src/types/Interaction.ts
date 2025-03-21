import { Tile, Rectangle, Coordinate } from '../utils/geometry';

export type InteractionType = 'panning' | 'erasing' | 'placing';

export interface InteractionState {
  type: InteractionType;

  startPixel: Coordinate | null;
  currentPixel: Coordinate | null;

  startTile: Tile | null;
  currentTile: Tile | null;

  dragBox: Rectangle | null;
}

export const isInteractionActive = (state: InteractionState): boolean => {
  return state.startTile !== null;
};
