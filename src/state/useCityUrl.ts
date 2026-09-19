import { useCallback, useEffect, useRef, useState } from 'react';
import GridStateManager from '../classes/GridStateManager';
import { useUrlState } from '../hooks/useUrlState';
import { ViewState } from '../utils/viewState';
import { readCityLink, writeCityLink } from './cityLink';

/*
 * Owns the city's side of the URL: reads one on startup, writes one back on
 * demand. loadedFromUrl flips once, so the caller can catch up whatever else
 * depends on the grid without this hook having to know what that is.
 *
 */
export function useCityUrl(
  manager: GridStateManager,
  getViewState: () => ViewState | null
) {
  const { getFragmentState, setFragmentState, getQueryState, clearQueryState } =
    useUrlState();
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);
  const viewStateFromUrl = useRef<ViewState | null>(null);

  // Held in a ref so a fresh callback each render cannot re-run the load below
  const currentViewport = useRef(getViewState);
  currentViewport.current = getViewState;

  const saveToUrl = useCallback(() => {
    setFragmentState(writeCityLink(manager, currentViewport.current()));
  }, [manager, setFragmentState]);

  useEffect(() => {
    const viewState = readCityLink(manager, {
      getFragmentState,
      getQueryState,
      clearQueryState,
    });
    if (!viewState) return;

    viewStateFromUrl.current = viewState;
    // A legacy link has to be rewritten as a fragment
    saveToUrl();
    setLoadedFromUrl(true);
  }, [manager, saveToUrl, getFragmentState, getQueryState, clearQueryState]);

  return { saveToUrl, loadedFromUrl, viewStateFromUrl };
}
