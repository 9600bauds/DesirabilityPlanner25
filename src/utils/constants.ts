export const GRID_SIZE = 256;
export const GRID_SIZE_BITS = 8;

// Convert x,y coordinates to a grid index
export function COORD_TO_INT16(x: number, y: number): number {
  return (y << GRID_SIZE_BITS) | x;
}

// Convert grid index back to x,y coordinates
export function INT16_TO_COORD(index: number): { x: number; y: number } {
  return {
    x: index & (GRID_SIZE - 1), // Equivalent to index % 256 but faster
    y: index >> GRID_SIZE_BITS, // Equivalent to Math.floor(index / 256)
  };
}

export const CELL_PX = 45;

export const COORD_TO_PX = (coord: number) => coord * CELL_PX;
export const PX_TO_COORD = (px: number) => Math.floor(px / CELL_PX);

export const GRID_TOTAL_PX = GRID_SIZE * CELL_PX;
export const GRID_CENTER_PX = GRID_TOTAL_PX / 2;
export const ROTATION_ANGLE = 45;
export const ROTATION_RADS = (ROTATION_ANGLE * Math.PI) / 180;

export const MIN_DESIRABILITY_COLOR = -10;
export const MAX_DESIRABILITY_COLOR = 50;
