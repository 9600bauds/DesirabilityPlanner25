import GridStateManager from '../classes/GridStateManager';
import { URL_LEGACY_QUERY_INDEX } from '../utils/constants';
import { decodeData } from '../utils/encoding';
import { compressCity, decompressCity } from '../utils/compression';
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

// Returns true if a city was loaded
export function readCityLink(
  manager: GridStateManager,
  source: LinkSource
): boolean {
  const legacy = source.getQueryState(URL_LEGACY_QUERY_INDEX);
  if (legacy) source.clearQueryState(URL_LEGACY_QUERY_INDEX);

  const saved = legacy ?? source.getFragmentState();
  if (!saved) return false;

  try {
    // A legacy link is raw triples; a fragment is compressed
    if (legacy) {
      manager.loadUInt8Array(decodeData(saved));
    } else {
      const bytes = isHieroglyphLink(saved)
        ? glyphsToBytes(saved)
        : decodeData(saved);
      manager.loadUInt8Array(decompressCity(bytes));
    }
    return true;
  } catch (error) {
    console.error('Could not decode saved URL:', error);
    return false;
  }
}

export function writeCityLink(manager: GridStateManager): string | null {
  const grid = manager.getUInt8Array();
  if (grid.length === 0) return null;

  return bytesToGlyphs(compressCity(grid));
}
