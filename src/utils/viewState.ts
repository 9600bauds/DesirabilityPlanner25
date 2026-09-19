import {
  DEFAULT_ZOOM,
  GRID_MAX_X,
  GRID_MAX_Y,
  MAX_ZOOM,
  MIN_ZOOM,
} from './constants';
import { Rectangle, Tile } from './geometry';

export interface ViewState {
  center: Tile;
  zoom: number;
  rotated: boolean;
  transparent: boolean;
}

export const VIEW_STATE_BYTES = 3;

const ROTATED_FLAG = 0b1000_0000;
const TRANSPARENT_FLAG = 0b0100_0000;
const FLAGS = ROTATED_FLAG | TRANSPARENT_FLAG;
const ZOOM_STEPS = 63;
const ZOOM_RANGE = Math.log(MAX_ZOOM / MIN_ZOOM);

const clamp = (value: number, max: number) =>
  Math.max(0, Math.min(max, Math.round(value)));

// Zoom is spaced along a log scale
export function zoomToByte(zoom: number): number {
  const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
  return Math.round((Math.log(clamped / MIN_ZOOM) / ZOOM_RANGE) * ZOOM_STEPS);
}

export function byteToZoom(byte: number): number {
  return MIN_ZOOM * Math.exp((byte / ZOOM_STEPS) * ZOOM_RANGE);
}

export function viewStateToBytes(viewState: ViewState): Uint8Array {
  return new Uint8Array([
    clamp(viewState.center.x, GRID_MAX_X),
    clamp(viewState.center.y, GRID_MAX_Y),
    zoomToByte(viewState.zoom) |
      (viewState.rotated ? ROTATED_FLAG : 0) |
      (viewState.transparent ? TRANSPARENT_FLAG : 0),
  ]);
}

export function bytesToViewState(bytes: Uint8Array, at: number): ViewState {
  const packed = bytes[at + 2];
  return {
    center: new Tile(bytes[at], bytes[at + 1]),
    zoom: byteToZoom(packed & ~FLAGS),
    rotated: (packed & ROTATED_FLAG) !== 0,
    transparent: (packed & TRANSPARENT_FLAG) !== 0,
  };
}

export function defaultViewState(triples: Uint8Array): ViewState | null {
  const box = Rectangle.boundingBoxOfSavedCity(triples);
  if (!box) return null;

  return {
    center: new Tile(
      Math.round((box.startX + box.endX) / 2),
      Math.round((box.startY + box.endY) / 2)
    ),
    zoom: DEFAULT_ZOOM,
    rotated: false,
    transparent: false,
  };
}
