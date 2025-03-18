import React, { useRef, useEffect, useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Subcategory from '../interfaces/Subcategory';
import CanvasRenderer from '../classes/CanvasRenderer';
import Blueprint from '../types/Blueprint';
import CursorAction from '../types/CursorAction';
import { useGridManager } from '../hooks/useGridManager';

const App: React.FC = () => {
  // ===== APPLICATION STATE (or refs, I guess?) =====
  const [cursorAction, setCursorAction] = useState<CursorAction>('panning');

  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [selectedBlueprintIndex, setSelectedBlueprintIndex] =
    useState<number>(0);

  const canvasContainer = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const gridStateUpdated = useCallback(() => {
    updateUndoRedoState();
    if (rendererRef.current) {
      rendererRef.current.scheduleRerender();
    }
    updateUrl();
  }, []);

  const {
    gridManager,
    canUndo,
    canRedo,
    updateUndoRedoState,
    updateUrl,
    tryPlaceBlueprint,
    tryEraseRect,
    tryUndo,
    tryRedo,
  } = useGridManager(gridStateUpdated);

  // Initialize the renderer once, on mount
  useEffect(() => {
    if (!canvasContainer.current) {
      throw new Error(
        'Somehow did not have a ref to our container when initializing!'
      );
    }
    try {
      if (!rendererRef.current) {
        const renderContext = {
          getBaseValues: gridManager.getBaseValues,
          getBuildings: gridManager.getBuildings,
          getSelectedBlueprint: getSelectedBlueprint,
          isTileOccupied: gridManager.isTileOccupied,
        };
        rendererRef.current = new CanvasRenderer(
          canvasContainer.current,
          renderContext
        );
      }
    } catch (error) {
      console.error('Error initializing renderer:', error);
    }

    // Clean up on unmount
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  const selectSubcategory = (subcat: Subcategory) => {
    setCursorAction('placing');
    setSelectedSubcategory(subcat);
    setSelectedBlueprintIndex(0);
  };
  const deselectSubcategory = () => {
    setSelectedSubcategory(null);
    setSelectedBlueprintIndex(0);
  };
  const selectNextBlueprintIndex = () => {
    if (selectedSubcategory) {
      const newIndex =
        (selectedBlueprintIndex + 1) % selectedSubcategory.blueprints.length;
      setSelectedBlueprintIndex(newIndex);
    }
  };

  // useCallback gives us a stable reference between rerenders, so we can pass it down to the rendercontext
  const getSelectedBlueprint = useCallback((): Blueprint | null => {
    if (!selectedSubcategory) return null;
    return selectedSubcategory.blueprints[selectedBlueprintIndex];
  }, [selectedSubcategory, selectedBlueprintIndex]);
  // When our blueprint is updated: Keep the rendercontext updated with the latest reference
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateRenderContext({
        getSelectedBlueprint,
      });
      // Also tell it to preview the change for good measure
      rendererRef.current.schedulePreview();
    }
  }, [getSelectedBlueprint]);

  const updateCursor = useCallback(() => {
    if (!canvasContainer.current) return;
    if (cursorAction === 'placing') {
      document.body.style.cursor = 'auto';
      canvasContainer.current.style.cursor = 'copy';
    } else if (cursorAction === 'erasing') {
      document.body.style.cursor = 'auto';
      canvasContainer.current.style.cursor = 'cell';
    } else if (cursorAction === 'panning') {
      if (rendererRef.current?.isPanning) {
        document.body.style.cursor = 'grabbing';
        canvasContainer.current.style.cursor = 'grabbing';
      } else {
        document.body.style.cursor = 'auto';
        canvasContainer.current.style.cursor = 'grab';
      }
    }
  }, [cursorAction]);
  // Actually update the cursor automatically too
  useEffect(() => {
    updateCursor();
    if (cursorAction !== 'placing') {
      deselectSubcategory();
    }
  }, [cursorAction, updateCursor]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (event.button === 2) {
      // Right click
      if (cursorAction === 'placing') {
        setCursorAction('panning');
      } else if (cursorAction === 'erasing') {
        setCursorAction('panning');
        renderer.stopDragging();
      }
    } else if (event.button === 0) {
      // Left click
      if (cursorAction === 'panning') {
        renderer.startPanning(event.nativeEvent);
      } else if (cursorAction === 'erasing') {
        renderer.startDragging();
      }
      updateCursor();
    }
  };
  const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const tileChanged = renderer.checkForTileChange(event.nativeEvent);
    if (tileChanged) {
      handleTileChange();
    }
  };
  const handleTileChange = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (cursorAction === 'erasing') {
      renderer.handleDragging();
    } else if (cursorAction === 'placing') {
      renderer.schedulePreview();
    }
  };
  // Some of our mouse events are applied to the document and the window. React does not have an easy way to do this.
  // As such, we need useEffects() to remove and re-apply these events whenever any of their state dependencies change.

  // 1. Keyboard Events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo/Redo keyboard shortcuts
      if (
        event.ctrlKey &&
        (event.key === 'z' || event.key === 'Z') &&
        !event.shiftKey
      ) {
        event.preventDefault();
        tryUndo();
        return;
      }

      if (
        (event.ctrlKey && (event.key === 'y' || event.key === 'Y')) ||
        (event.ctrlKey &&
          event.shiftKey &&
          (event.key === 'z' || event.key === 'Z'))
      ) {
        event.preventDefault();
        tryRedo();
        return;
      }

      // Blueprint rotation
      if ((event.key === 'r' || event.key === 'R') && !event.repeat) {
        event.preventDefault();
        selectNextBlueprintIndex();
      }

      // Building transparency
      if (event.key === 'Control' && !event.repeat && rendererRef.current) {
        rendererRef.current.setBuildingTransparency(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control' && rendererRef.current) {
        rendererRef.current.setBuildingTransparency(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [tryUndo, tryRedo, selectNextBlueprintIndex, rendererRef]);

  // 2. Mouse Up Events
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      if (event.button === 0) {
        //Left click
        renderer.stopPanning();

        if (cursorAction === 'erasing') {
          const erasedRect = renderer.stopDragging();
          if (erasedRect) {
            tryEraseRect(erasedRect);
          }
        } else if (cursorAction === 'placing') {
          const tile = renderer.getMouseCoords(event);
          if (tile) {
            const blueprint = getSelectedBlueprint();
            if (blueprint) {
              tryPlaceBlueprint(tile, blueprint);
            }
          }
        }

        updateCursor();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    cursorAction,
    getSelectedBlueprint,
    tryEraseRect,
    tryPlaceBlueprint,
    updateCursor,
    rendererRef,
  ]);

  // 3. Mouse Move Events
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const tileChanged = renderer.checkForTileChange(event);

      if (cursorAction === 'panning') {
        renderer.handlePanning(event);
      }

      if (tileChanged) {
        handleTileChange();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cursorAction, handleTileChange, rendererRef]);

  return (
    <div id="app-container" className="d-flex">
      <div
        ref={canvasContainer}
        id="canvas-container"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(event) => {
          event.preventDefault(); //Prevent rightclick menu
        }}
      />
      <div
        id="sidebar-container"
        style={{ minWidth: '150px', width: '20vw', height: '100vh' }}
      >
        <Sidebar
          onRotateClick={() => {
            if (rendererRef.current) {
              rendererRef.current.toggleGridRotation();
            }
          }}
          onPanClick={() => {
            setCursorAction('panning');
          }}
          onEraserClick={() => {
            setCursorAction('erasing');
          }}
          onZoomInClick={() => {
            if (rendererRef.current) {
              rendererRef.current.zoomIn();
            }
          }}
          onZoomOutClick={() => {
            if (rendererRef.current) {
              rendererRef.current.zoomOut();
            }
          }}
          onUndoClick={tryUndo}
          onRedoClick={tryRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          selectSubcategory={selectSubcategory}
        />
      </div>
    </div>
  );
};

export default App;
