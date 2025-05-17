import { Coordinate } from './geometry';

export const GRID_SIZE = 256;
export const GRID_MAX_X = GRID_SIZE - 1;
export const GRID_MAX_Y = GRID_SIZE - 1;
export const GRID_SIZE_BITS = 8;

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8.0;
export const ZOOM_SENSITIVITY_FACTOR = 1.001;
export const MIN_ZOOM_FOR_LABELS = 0.3;
export const MIN_LABEL_FONTSIZE_WITHOUT_BREAKS = 12;
export const MIN_LABEL_FONTSIZE_WITH_BREAKS = 6;

// Convert x,y coordinates to a grid index
export function COORD_TO_UINT16([x, y]: Coordinate): number {
  return (y << GRID_SIZE_BITS) | x;
}

// Convert grid index back to x,y coordinates
export function UINT16_TO_COORD(index: number): Coordinate {
  return [
    index & GRID_MAX_Y, // Equivalent to index % 256 but faster
    index >> GRID_SIZE_BITS, // Equivalent to Math.floor(index / 256)
  ];
}

export const CELL_PX = 45;

export const COORD_TO_PX = (coord: number) => coord * CELL_PX;
export const PX_TO_COORD = (px: number) => Math.floor(px / CELL_PX);

export const GRID_TOTAL_PX = GRID_SIZE * CELL_PX;
export const GRID_CENTER_PX = GRID_TOTAL_PX / 2;
export const ROTATION_ANGLE = 45;
export const ROTATION_RADS = 0.785398; // PI/4
export const SINE_COSINE = 0.7071067811865475; // sin(45) === cos(45) === sqrt(2)/2 === 0.7071067811865475

export function ROTATE_AROUND_ORIGIN(point: Coordinate): Coordinate {
  return [
    point[0] * SINE_COSINE - point[1] * SINE_COSINE,
    point[0] * SINE_COSINE + point[1] * SINE_COSINE,
  ];
}

export function ROTATE_AROUND_CENTER(
  point: Coordinate,
  center: Coordinate
): Coordinate {
  return [
    (point[0] - center[0]) * SINE_COSINE - (point[1] - center[1]) * SINE_COSINE,
    (point[0] - center[0]) * SINE_COSINE + (point[1] - center[1]) * SINE_COSINE,
  ];
}

export function COUNTERROTATE_AROUND_ORIGIN(point: Coordinate): Coordinate {
  return [
    point[0] * SINE_COSINE + point[1] * SINE_COSINE,
    -point[0] * SINE_COSINE + point[1] * SINE_COSINE,
  ];
}

export const MIN_DESIRABILITY_COLOR = -10;
export const MAX_DESIRABILITY_COLOR = 50;

export const URL_STATE_INDEX = 'buildings';
export const LOCALSTORAGE_KEY_SEEN_INSTRUCTIONS: string =
  'desirabilityPlanner_hasSeenInstructions';
