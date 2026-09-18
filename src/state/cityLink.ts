import GridStateManager from '../classes/GridStateManager';
import { URL_LEGACY_QUERY_INDEX } from '../utils/constants';
import { decodeData, encodeData } from '../utils/encoding';

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
    manager.loadUInt8Array(decodeData(saved));
    return true;
  } catch (error) {
    console.error('Could not decode saved URL:', error);
    return false;
  }
}

export function writeCityLink(manager: GridStateManager): string | null {
  const grid = manager.getUInt8Array();
  return grid.length > 0 ? encodeData(grid) : null;
}
