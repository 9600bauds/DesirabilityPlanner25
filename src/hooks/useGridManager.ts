import { useCallback, useRef, useState } from 'react';
import GridStateManager from '../classes/GridStateManager';
import Blueprint from '../types/Blueprint';
import { Rectangle, Tile } from '../utils/geometry';

export function useGridManager(gridStateUpdated: () => void) {
  const gridManagerRef = useRef<GridStateManager>(new GridStateManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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
    tryPlaceBlueprint,
    tryEraseRect,
    tryUndo,
    tryRedo,
  };
}
