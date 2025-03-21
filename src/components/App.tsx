import React, { useRef, useEffect, useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Subcategory from '../interfaces/Subcategory';
import CanvasRenderer from '../classes/CanvasRenderer';
import Blueprint from '../types/Blueprint';
import {
  InteractionState,
  InteractionType,
  isInteractionActive,
} from '../types/Interaction';
import GridStateManager from '../classes/GridStateManager';
import { Rectangle, Tile, Coordinate } from '../utils/geometry';
import { decodeData, encodeData } from '../utils/encoding';
import { URL_STATE_INDEX } from '../utils/constants';
import { useUrlState } from '../hooks/useUrlState';

const App: React.FC = () => {
  // ===== INTERACTION STATE =====
  const [interaction, setInteraction] = useState<InteractionState>({
    type: 'panning',
    startPixel: null,
    startTile: null,
    currentPixel: null,
    currentTile: null,
    dragBox: null,
  });

  // ===== APPLICATION STATE =====
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
    setInteractionType('placing');
    setSelectedSubcategory(subcat);
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

  // ===== PREVIEW EFFECTS =====
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.schedulePreview();
    }
  }, [
    interaction.currentTile,
    selectedBlueprintIndex,
    selectedSubcategory,
    interaction.type,
  ]);

  // ===== CURSOR MANAGEMENT =====
  // Update cursor style based on interaction state
  useEffect(() => {
    if (!canvasContainer.current) return;

    if (interaction.type === 'placing') {
      document.body.style.cursor = 'auto';
      canvasContainer.current.style.cursor = 'copy';
    } else if (interaction.type === 'erasing') {
      document.body.style.cursor = 'auto';
      canvasContainer.current.style.cursor = 'cell';
    } else if (interaction.type === 'panning') {
      if (isInteractionActive(interaction)) {
        document.body.style.cursor = 'grabbing';
        canvasContainer.current.style.cursor = 'grabbing';
      } else {
        document.body.style.cursor = 'auto';
        canvasContainer.current.style.cursor = 'grab';
      }
    }
  }, [interaction.type, isInteractionActive(interaction)]);

  // ===== INTERACTION MANAGEMENT =====

  /**
   * Set the interaction type (panning, erasing, placing)
   */
  const setInteractionType = useCallback((type: InteractionType) => {
    setInteraction((prev) => ({
      ...prev,
      type,
      // If we're switching types, cancel any active interaction
      startPixel: null,
      startTile: null,
      dragBox: null,
    }));
  }, []);

  /**
   * Start a new interaction
   */
  const startInteraction = useCallback(
    (event: MouseEvent, type: InteractionType) => {
      if (!rendererRef.current) return;

      const pixel: Coordinate = [event.clientX, event.clientY];
      const tile = rendererRef.current.getMouseCoords(event);

      setInteraction({
        type,
        startPixel: pixel,
        startTile: tile || null,
        currentPixel: pixel,
        currentTile: tile || null,
        dragBox: tile ? new Rectangle(tile, 1, 1) : null,
      });
    },
    []
  );

  /**
   * Update an ongoing interaction with highly optimized state updates
   */
  const updateInteraction = useCallback(
    (event: MouseEvent) => {
      if (!rendererRef.current) return;

      const newPixel: Coordinate = [event.clientX, event.clientY];

      if (interaction.type === 'panning') {
        if (interaction.currentPixel && isInteractionActive(interaction)) {
          const deltaX = newPixel[0] - interaction.currentPixel[0];
          const deltaY = newPixel[1] - interaction.currentPixel[1];
          if (deltaX !== 0 || deltaY !== 0) {
            rendererRef.current.updateOffset(deltaX, deltaY);
          }
        }
        // Just update the currentPixel for next delta calculation, but don't trigger
        // any preview renders since this is handled directly by updateOffset
        setInteraction((prev) => ({
          ...prev,
          currentPixel: newPixel,
        }));
      } else {
        const newTile = rendererRef.current.getMouseCoords(
          event,
          isInteractionActive(interaction)
        );
        const tileChanged =
          // Either one is null but not both
          (newTile === null) !== (interaction.currentTile === null) ||
          // Both non-null but different values
          (newTile !== null &&
            interaction.currentTile !== null &&
            !newTile.equals(interaction.currentTile));

        // Only update state if something meaningful has changed
        if (tileChanged) {
          const newDragBox =
            interaction.startTile && newTile
              ? Rectangle.fromTiles(interaction.startTile, newTile)
              : interaction.dragBox;

          // Update the state with the new tile and other calculated values
          setInteraction((prev) => ({
            ...prev,
            currentTile: newTile || null,
            currentPixel: newPixel,
            dragBox: newDragBox,
          }));
        }
      }
    },
    [interaction]
  );

  /**
   * End the current interaction
   */
  const endInteraction = useCallback(
    (event?: MouseEvent) => {
      if (!rendererRef.current) return interaction;

      // If there's a final event, update one last time
      if (event) {
        updateInteraction(event);
      }

      // Get a snapshot of the final state
      const finalState = { ...interaction };

      // Reset active interaction state while preserving type and current position
      setInteraction((prev) => ({
        type: prev.type,
        startPixel: null,
        startTile: null,
        currentPixel: null,
        currentTile: null,
        dragBox: null,
      }));

      return finalState;
    },
    [interaction, updateInteraction]
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

    const renderContext = {
      getBaseValues: gridManagerRef.current.getBaseValues,
      getBuildings: gridManagerRef.current.getBuildings,
      getSelectedBlueprint: getSelectedBlueprint,
      isTileOccupied: gridManagerRef.current.isTileOccupied,
      getInteractionState: () => interaction,
    };
    rendererRef.current = new CanvasRenderer(
      canvasContainer.current,
      renderContext
    );

    const resizeObserver = new ResizeObserver(() => {
      rendererRef.current?.updateDimensions(
        canvasContainer.current!.clientWidth,
        canvasContainer.current!.clientHeight
      );
    });
    resizeObserver.observe(canvasContainer.current);

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array means this runs once on mount

  // Update renderer context when the interaction state changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateRenderContext({
        getInteractionState: () => interaction,
      });
    }
  }, [interaction]);

  // Update renderer context when the selected blueprint changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateRenderContext({
        getSelectedBlueprint,
      });
    }
  }, [getSelectedBlueprint]);

  // Some of our mouse events are applied to the document and the window. React does not have an easy way to do this.
  // As such, we need useEffects() to remove and re-apply these events whenever any of their state dependencies change.
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

  // ===== EVENT HANDLERS =====

  // Mouse down handler - start interactions
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button === 2) {
        // Right click - switch to panning mode
        setInteractionType('panning');
      } else if (event.button === 0) {
        // Left click - start interaction based on current type
        startInteraction(event.nativeEvent, interaction.type);
      }
    },
    [interaction.type, setInteractionType, startInteraction]
  );

  // Mouse move effect - handle all movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      updateInteraction(event);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updateInteraction]);

  // Mouse up effect - complete interactions
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0 && isInteractionActive(interaction)) {
        const finalState = endInteraction(event);

        // Process the result based on interaction type
        if (finalState.type === 'erasing' && finalState.dragBox) {
          tryEraseRect(finalState.dragBox);
        } else if (finalState.type === 'placing' && finalState.currentTile) {
          const blueprint = getSelectedBlueprint();
          if (blueprint) {
            tryPlaceBlueprint(finalState.currentTile, blueprint);
          }
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [
    endInteraction,
    getSelectedBlueprint,
    interaction,
    tryEraseRect,
    tryPlaceBlueprint,
  ]);

  // ===== SIDEBAR HANDLERS =====
  const handlePanClick = useCallback(() => {
    setInteractionType('panning');
  }, [setInteractionType]);

  const handleEraserClick = useCallback(() => {
    setInteractionType('erasing');
  }, [setInteractionType]);

  // ===== RENDER =====
  return (
    <div id="app-container" className="d-flex">
      <div
        ref={canvasContainer}
        id="canvas-container"
        onMouseDown={handleMouseDown}
        onContextMenu={(event: React.MouseEvent<HTMLDivElement>) => {
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
          onPanClick={handlePanClick}
          onEraserClick={handleEraserClick}
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
          currentInteractionType={interaction.type}
        />
      </div>
    </div>
  );
};

export default App;
