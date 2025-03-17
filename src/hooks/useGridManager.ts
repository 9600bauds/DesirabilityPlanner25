import { useCallback, useEffect, useRef, useState } from 'react';
import GridStateManager, {
  BlueprintPlacement,
} from '../classes/GridStateManager';
import Blueprint from '../types/Blueprint';
import { Rectangle, Tile } from '../utils/geometry';
import { ALL_BLUEPRINTS, BLUEPRINTS_BY_ID } from '../data/BLUEPRINTS';
import { decodeData, encodeData } from '../utils/encoding';
import { UINT16_TO_COORD, URL_STATE_INDEX } from '../utils/constants';

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

    const blueprintsToAdd: Array<BlueprintPlacement> = [];
    try {
      const decoded = decodeData(compressedState);
      for (const [bpID, positions] of Object.entries(decoded)) {
        const realNumber = parseInt(bpID);
        if (!BLUEPRINTS_BY_ID.has(realNumber)) {
          console.warn(
            `Remaking gridstate from string encountered invalid ID of ${bpID}!`
          );
          continue;
        }
        const blueprint = BLUEPRINTS_BY_ID.get(realNumber)!;
        positions.forEach((pos) => {
          const coord = UINT16_TO_COORD(pos);
          blueprintsToAdd.push({
            position: Tile.fromCoordinate(coord),
            blueprint,
          });
        });
      }
    } catch (error) {
      console.error('Could not decode saved URL:', error);
    }

    if (!blueprintsToAdd.length) {
      setUrlState(URL_STATE_INDEX, null);
      return;
    }
    if (!tryPlaceBlueprints(blueprintsToAdd)) {
      setUrlState(URL_STATE_INDEX, null);
      return;
    }
  }, []);

  const updateUrl = () => {
    const compressed = gridManagerRef.current.activeGridState.compressed();
    if (Object.keys(compressed).length <= 0) {
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

  const tryPlaceBlueprints = useCallback(
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
