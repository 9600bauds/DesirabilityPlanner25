import { useCallback, useEffect, useRef, useState } from 'react';
import GridStateManager, {
  BlueprintPlacement,
} from '../classes/GridStateManager';
import Blueprint from '../types/Blueprint';
import { Rectangle, Tile } from '../utils/geometry';
import { decodeData, encodeData } from '../utils/encoding';
import { URL_STATE_INDEX } from '../utils/constants';

export function useGridManager(gridStateUpdated: () => void) {
  const gridManagerRef = useRef<GridStateManager>(new GridStateManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const setUrlState = (index: string, url: string | null) => {
    const urlInterface = new URL(window.location.href);
    if (!url) {
      urlInterface.searchParams.delete(index);
    } else {
      urlInterface.searchParams.set(index, url);
    }
    // I think this is just to prevent bloating the history stack of the browser but I'm not entirely sure.
    window.history.replaceState({}, '', urlInterface.toString());
  };

  const getUrlState = (index: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(index);
  };

  useEffect(() => {
    // Try to retrieve the URL state, but only once, during initialization
    const compressedState = getUrlState(URL_STATE_INDEX);
    if (!compressedState) return;

    try {
      const decoded = decodeData(compressedState);
      if (!decoded.length) {
        setUrlState(URL_STATE_INDEX, null);
        return;
      }
      gridManagerRef.current.loadUInt8Array(decoded);
      updateUrl(); // Immediately update our URL, in case something needs fixing
    } catch (error) {
      console.error('Could not decode saved URL:', error);
    }
  }, []);

  const updateUrl = () => {
    const compressed = gridManagerRef.current.getUInt8Array();
    if (compressed.length <= 0) {
      setUrlState(URL_STATE_INDEX, null);
    } else {
      const encoded = encodeData(compressed);
      setUrlState(URL_STATE_INDEX, encoded);
    }
  };

  // So App can update these states as necessary
  const updateUndoRedoState = useCallback(() => {
    setCanUndo(gridManagerRef.current.canUndo());
    setCanRedo(gridManagerRef.current.canRedo());
  }, []);

  // Wrap core methods with React-friendly versions
  const tryPlaceBlueprint = useCallback(
    (position: Tile, blueprint: Blueprint) => {
      const success = gridManagerRef.current.tryPlaceBlueprint(
        position,
        blueprint
      );
      if (success) gridStateUpdated();
      return success;
    },
    [gridStateUpdated]
  );

  const _tryPlaceBlueprints = useCallback(
    (placements: Array<BlueprintPlacement>) => {
      const success = gridManagerRef.current.tryPlaceBlueprints(placements);
      if (success) gridStateUpdated();
      return success;
    },
    [gridStateUpdated]
  );

  const tryEraseRect = useCallback(
    (erasedRect: Rectangle) => {
      const success = gridManagerRef.current.eraseRect(erasedRect);
      if (success) gridStateUpdated();
      return success;
    },
    [gridStateUpdated]
  );

  const tryUndo = useCallback(() => {
    const result = gridManagerRef.current.undo();
    gridStateUpdated();
    return result;
  }, [gridStateUpdated]);

  const tryRedo = useCallback(() => {
    const result = gridManagerRef.current.redo();
    gridStateUpdated();
    return result;
  }, [gridStateUpdated]);

  return {
    gridManager: gridManagerRef.current,
    canUndo,
    canRedo,
    updateUndoRedoState,
    updateUrl,
    tryPlaceBlueprint,
    tryEraseRect,
    tryUndo,
    tryRedo,
  };
}
