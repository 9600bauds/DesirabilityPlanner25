import React, { useRef, useEffect, useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Subcategory from '../interfaces/Subcategory';
import CanvasRenderer from '../classes/CanvasRenderer';
import Blueprint from '../types/Blueprint';
import CursorAction from '../types/CursorAction';
import GridStateManager from '../classes/GridStateManager';
import { Rectangle, Tile } from '../utils/geometry';
import { decodeData, encodeData } from '../utils/encoding';
import { URL_STATE_INDEX } from '../utils/constants';
import { useUrlState } from '../hooks/useUrlState';

const App: React.FC = () => {
  // ===== APPLICATION STATE =====
  const [cursorAction, setCursorAction] = useState<CursorAction>('panning');
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [selectedBlueprintIndex, setSelectedBlueprintIndex] =
    useState<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ===== REFS =====
  const canvasContainer = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const gridManagerRef = useRef<GridStateManager>(new GridStateManager());

  // ===== URL MANAGEMENT =====
  const { setUrlState, getUrlState } = useUrlState();

  const updateUrl = useCallback(() => {
    const compressed = gridManagerRef.current.getUInt8Array();
    if (compressed.length <= 0) {
      setUrlState(URL_STATE_INDEX, null);
    } else {
      const encoded = encodeData(compressed);
      setUrlState(URL_STATE_INDEX, encoded);
    }
  }, [setUrlState]);

  // ===== GRID STATE MANAGEMENT =====
  const gridStateUpdated = useCallback(() => {
    setCanUndo(gridManagerRef.current.canUndo());
    setCanRedo(gridManagerRef.current.canRedo());

    // Update renderer
    if (rendererRef.current) {
      rendererRef.current.scheduleRerender();
    }

    updateUrl();
  }, [updateUrl]);

  // ===== GRID OPERATIONS =====
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

  // ===== BLUEPRINT SELECTION =====
  const selectSubcategory = useCallback((subcat: Subcategory) => {
    setCursorAction('placing');
    setSelectedSubcategory(subcat);
    setSelectedBlueprintIndex(0);
  }, []);

  const deselectSubcategory = useCallback(() => {
    setSelectedSubcategory(null);
    setSelectedBlueprintIndex(0);
  }, []);

  const selectNextBlueprintIndex = useCallback(() => {
    if (selectedSubcategory) {
      const newIndex =
        (selectedBlueprintIndex + 1) % selectedSubcategory.blueprints.length;
      setSelectedBlueprintIndex(newIndex);
    }
  }, [selectedSubcategory, selectedBlueprintIndex]);

  const getSelectedBlueprint = useCallback((): Blueprint | null => {
    if (!selectedSubcategory) return null;
    return selectedSubcategory.blueprints[selectedBlueprintIndex];
  }, [selectedSubcategory, selectedBlueprintIndex]);

  // ===== CURSOR MANAGEMENT =====
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

  const handleTileChange = useCallback(
    (newTile: Tile | undefined) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      renderer.lastMouseoverTile = newTile;

      if (cursorAction === 'erasing') {
        renderer.handleDragging(newTile);
      } else if (cursorAction === 'placing') {
        renderer.schedulePreview();
      }
    },
    [cursorAction]
  );

  // ===== INITIALIZATION EFFECTS =====

  // Initialize from URL
  useEffect(() => {
    const compressedState = getUrlState(URL_STATE_INDEX);
    if (!compressedState) return;

    try {
      const decoded = decodeData(compressedState);
      if (!decoded.length) {
        setUrlState(URL_STATE_INDEX, null);
        return;
      }
      gridManagerRef.current.loadUInt8Array(decoded);

      // Update undo/redo state directly
      setCanUndo(gridManagerRef.current.canUndo());
      setCanRedo(gridManagerRef.current.canRedo());

      updateUrl();
    } catch (error) {
      console.error('Could not decode saved URL:', error);
    }
  }, [getUrlState, setUrlState, updateUrl]);

  // Initialize renderer once, don't recreate based on blueprint changes
  useEffect(() => {
    if (!canvasContainer.current) {
      throw new Error(
        'Somehow did not have a ref to our container when initializing!'
      );
    }

    try {
      if (!rendererRef.current) {
        const renderContext = {
          getBaseValues: gridManagerRef.current.getBaseValues,
          getBuildings: gridManagerRef.current.getBuildings,
          getSelectedBlueprint: getSelectedBlueprint,
          isTileOccupied: gridManagerRef.current.isTileOccupied,
        };
        rendererRef.current = new CanvasRenderer(
          canvasContainer.current,
          renderContext
        );
      }
    } catch (error) {
      console.error('Error initializing renderer:', error);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Update renderer context when blueprint selection changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateRenderContext({
        getSelectedBlueprint,
      });
      rendererRef.current.schedulePreview();
    }
  }, [getSelectedBlueprint]);

  // Update cursor when cursor action changes
  useEffect(() => {
    updateCursor();
    if (cursorAction !== 'placing') {
      deselectSubcategory();
    }
  }, [cursorAction, updateCursor, deselectSubcategory]);

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
  }, [tryUndo, tryRedo, selectNextBlueprintIndex]);

  // 2. Mouse Up Events
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      if (event.button === 0) {
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
        renderer.schedulePreview();
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
  ]);

  // 3. Mouse Move Events
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      if (cursorAction === 'panning') {
        renderer.handlePanning(event);
      }

      const [tileChanged, newTile] = renderer.checkForTileChange(event);
      if (tileChanged) {
        handleTileChange(newTile);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cursorAction, handleTileChange]);

  // These mouseevent handlers are used directly in components, so we don't need to do any voodoo with them.
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
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
          renderer.startDragging(event.nativeEvent);
        }
        updateCursor();
        renderer.schedulePreview();
      }
    },
    [cursorAction, updateCursor]
  );

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const [tileChanged, newTile] = renderer.checkForTileChange(
        event.nativeEvent
      );
      if (tileChanged) {
        handleTileChange(newTile);
      }
    },
    [handleTileChange]
  );

  // ===== RENDER =====
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
