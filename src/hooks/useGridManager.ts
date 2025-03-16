import { useCallback, useEffect, useRef, useState } from 'react';
import GridStateManager, {
  blueprintPlacement,
} from '../classes/GridStateManager';
import Blueprint from '../types/Blueprint';
import { Rectangle, Tile } from '../utils/geometry';
import { ALL_BLUEPRINTS } from '../data/BLUEPRINTS';

export function useGridManager(gridStateUpdated: () => void) {
  const gridManagerRef = useRef<GridStateManager>(new GridStateManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    // Try to retrieve the URL state, but only once, during initialization
    const urlParams = new URLSearchParams(window.location.search);
    const str = urlParams.get('buildings');

    if (str) {
      const blueprintsToAdd: Array<blueprintPlacement> = [];
      const buildingStrings = str.split('␞');
      for (const buildingString of buildingStrings) {
        const [id, x, y] = buildingString.split('␟');
        if (!(id in ALL_BLUEPRINTS)) {
          console.error(
            `Remaking gridstate from string encountered invalid ID of ${id}!`
          );
          continue;
        }
        const position = new Tile(parseInt(x), parseInt(y));
        const blueprint = ALL_BLUEPRINTS[id];
        blueprintsToAdd.push({
          position,
          blueprint,
        });
      }
      gridManagerRef.current.tryPlaceBlueprints(blueprintsToAdd);
    }
  }, []);

  const updateUrl = () => {
    const gridStateString = gridManagerRef.current.activeGridState.toString();
    const url = new URL(window.location.href);
    if (gridStateString.length > 0) {
      url.searchParams.set('buildings', gridStateString);
    } else {
      url.searchParams.delete('buildings');
    }
    window.history.replaceState({}, '', url.toString());
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
