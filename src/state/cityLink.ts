import GridStateManager from '../classes/GridStateManager';
import { URL_LEGACY_QUERY_INDEX } from '../utils/constants';
import { decodeData } from '../utils/encoding';
import { compressCity, decompressCity } from '../utils/compression';
import { ViewState, defaultViewState } from '../utils/viewState';
import {
  bytesToGlyphs,
  glyphsToBytes,
  isHieroglyphLink,
} from '../utils/glyphs';

export interface LinkSource {
  getFragmentState: () => string | null;
  getQueryState: (index: string) => string | null;
  clearQueryState: (index: string) => void;
}

export function readCityLink(
  manager: GridStateManager,
  source: LinkSource
): ViewState | null {
  const legacy = source.getQueryState(URL_LEGACY_QUERY_INDEX);
  if (legacy) source.clearQueryState(URL_LEGACY_QUERY_INDEX);

  const saved = legacy ?? source.getFragmentState();
  if (!saved) return null;

  try {
    // A legacy link is raw triples; a fragment is compressed
    if (legacy) {
      manager.loadUInt8Array(decodeData(saved));
      return defaultViewState(manager.getUInt8Array());
    }

    const bytes = isHieroglyphLink(saved)
      ? glyphsToBytes(saved)
      : decodeData(saved);
    const city = decompressCity(bytes);
    manager.loadUInt8Array(city.buildings);
    return city.viewState ?? defaultViewState(manager.getUInt8Array());
  } catch (error) {
    console.error('Could not decode saved URL:', error);
    return null;
  }
}

export function writeCityLink(
  manager: GridStateManager,
  viewState?: ViewState | null
): string | null {
  const grid = manager.getUInt8Array();
  if (grid.length === 0) return null;

  return bytesToGlyphs(compressCity(grid, viewState));
}
