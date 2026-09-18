import { useCallback, useEffect, useState } from 'react';
import GridStateManager from '../classes/GridStateManager';
import { useUrlState } from '../hooks/useUrlState';
import { readCityLink, writeCityLink } from './cityLink';

/*
 * Owns the city's side of the URL: reads one on startup, writes one back on
 * demand. loadedFromUrl flips once, so the caller can catch up whatever else
 * depends on the grid without this hook having to know what that is.
 */
export function useCityUrl(manager: GridStateManager) {
  const { getFragmentState, setFragmentState, getQueryState, clearQueryState } =
    useUrlState();
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);

  const saveToUrl = useCallback(() => {
    setFragmentState(writeCityLink(manager));
  }, [manager, setFragmentState]);

  useEffect(() => {
    const loaded = readCityLink(manager, {
      getFragmentState,
      getQueryState,
      clearQueryState,
    });
    if (!loaded) return;

    // A legacy link has to be rewritten as a fragment
    saveToUrl();
    setLoadedFromUrl(true);
  }, [manager, saveToUrl, getFragmentState, getQueryState, clearQueryState]);

  return { saveToUrl, loadedFromUrl };
}
