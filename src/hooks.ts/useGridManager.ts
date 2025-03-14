import { useCallback, useRef, useState } from 'react';
import GridStateManager from '../classes/GridStateManager';
import Blueprint from '../types/Blueprint';
import { Rectangle, Tile } from '../utils/geometry';

export function useGridManager() {
  const gridManagerRef = useRef<GridStateManager>(new GridStateManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update the app's state (the booleans!) each time
  const updateUndoRedoState = useCallback(() => {
    setCanUndo(gridManagerRef.current.canUndo());
    setCanRedo(gridManagerRef.current.canRedo());
  }, []);

  // Wrap core methods with React-friendly versions
  const placeBlueprint = useCallback(
    (position: Tile, blueprint: Blueprint) => {
      const success = gridManagerRef.current.tryPlaceBlueprint(
        position,
        blueprint
      );
      if (success) updateUndoRedoState();
      return success;
    },
    [updateUndoRedoState]
  );

  const eraseRect = useCallback(
    (erasedRect: Rectangle) => {
      const success = gridManagerRef.current.eraseRect(erasedRect);
      if (success) updateUndoRedoState();
      return success;
    },
    [updateUndoRedoState]
  );

  return {
    gridManager: gridManagerRef.current,
    canUndo,
    canRedo,
    placeBlueprint,
    eraseRect,
    undo: useCallback(() => {
      const result = gridManagerRef.current.undo();
      updateUndoRedoState();
      return result;
    }, [updateUndoRedoState]),
    redo: useCallback(() => {
      const result = gridManagerRef.current.redo();
      updateUndoRedoState();
      return result;
    }, [updateUndoRedoState]),
  };
}
