import React, { useRef, useEffect, useCallback, useState } from 'react';
import './App.css';
import { toast, Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import ToastNotification from './ToastNotification';
import Subcategory from '../interfaces/Subcategory';
import CanvasRenderer from '../classes/CanvasRenderer';
import Blueprint from '../types/Blueprint';
import {
  initialInteractionState,
  InteractionState,
  InteractionType,
  isInteractionActive,
} from '../types/InteractionState';
import GridStateManager from '../classes/GridStateManager';
import { Rectangle, Tile, Coordinate } from '../utils/geometry';
import { decodeData, encodeData } from '../utils/encoding';
import { URL_STATE_INDEX } from '../utils/constants';
import { useUrlState } from '../hooks/useUrlState';
import { getClientCoordinates } from '../utils/events';
import { InteractionEvent } from '../types/InteractionEvent';

const App: React.FC = () => {
  // ===== INTERACTION STATE =====
  const [interaction, setInteraction] = useState<InteractionState>(
    initialInteractionState
  );

  // ===== APPLICATION STATE =====
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [selectedBlueprintIndex, setSelectedBlueprintIndex] =
    useState<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(true);
  const [isGridRotated, setIsGridRotated] = useState(false);

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

  const handleRotateGrid = () => {
    if (rendererRef.current) {
      rendererRef.current.toggleGridRotation();
      setIsGridRotated(rendererRef.current.isRotated);
    }
  };

  const zoomLevelUpdated = () => {
    setCanZoomIn(rendererRef?.current?.canZoomIn() ?? false);
    setCanZoomOut(rendererRef?.current?.canZoomOut() ?? false);
  };
  const handleZoomIn = () => {
    if (rendererRef.current) {
      rendererRef.current.zoomIn();
      zoomLevelUpdated();
    }
  };
  const handleZoomOut = () => {
    if (rendererRef.current) {
      rendererRef.current.zoomOut();
      zoomLevelUpdated();
    }
  };
  const handleMouseWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (rendererRef.current) {
      rendererRef.current.handleWheelZoom(event.nativeEvent);
      zoomLevelUpdated();
    }
  };

  // ===== BLUEPRINT SELECTION =====
  const selectSubcategory = useCallback((subcat: Subcategory) => {
    setInteractionType('placing');
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

  // ===== PREVIEW EFFECTS =====
  // Schedule a preview whenever any of these is updated!
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.schedulePreview();
    }
  }, [
    interaction.currentTile,
    selectedBlueprintIndex,
    selectedSubcategory,
    interaction.type,
    isInteractionActive(interaction),
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
      canvasContainer.current.style.cursor = `url(${import.meta.env.BASE_URL}/icons/eraser-cursor.png) 6 28, cell`;
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
    (event: InteractionEvent, type: InteractionType) => {
      if (!rendererRef.current) return;

      const pixel: Coordinate = getClientCoordinates(event);
      const tile: Tile | null = rendererRef.current.getMouseCoords(event);

      setInteraction({
        type,
        startPixel: pixel,
        startTile: tile,
        currentPixel: pixel,
        currentTile: tile,
        dragBox: tile ? new Rectangle(tile, 1, 1) : null,
      });
    },
    []
  );

  /**
   * Update an ongoing interaction with highly optimized state updates
   */
  const updateInteraction = useCallback(
    (event: InteractionEvent) => {
      if (!rendererRef.current) return;

      const newPixel: Coordinate = getClientCoordinates(event);
      const newTile = rendererRef.current.getMouseCoords(
        event,
        isInteractionActive(interaction) // If the interaction is already active, then we are not limited to coordinates inside the viewport, we can off-road
      );
      const newDragBox =
        interaction.startTile && newTile
          ? Rectangle.fromTiles(interaction.startTile, newTile)
          : interaction.dragBox;

      if (interaction.type === 'panning' && isInteractionActive(interaction)) {
        rendererRef.current.panningUpdate(newPixel, interaction.currentPixel);
      }

      setInteraction((prev) => ({
        ...prev,
        currentTile: newTile,
        currentPixel: newPixel,
        dragBox: newDragBox,
      }));
    },
    [interaction]
  );

  /**
   * End the current interaction
   */
  const endInteraction = useCallback(
    (event?: InteractionEvent) => {
      if (!rendererRef.current || !isInteractionActive(interaction)) return;

      // If there's a final event, update once more to get the final position
      if (event) {
        updateInteraction(event);
      }

      // Get a snapshot of the final state
      const finalState = { ...interaction };

      // Process the result based on interaction type
      if (finalState.type === 'erasing' && finalState.dragBox) {
        tryEraseRect(finalState.dragBox);
      } else if (finalState.type === 'placing' && finalState.currentTile) {
        const blueprint = getSelectedBlueprint();
        if (blueprint) {
          tryPlaceBlueprint(finalState.currentTile, blueprint);
        }
      }

      // Reset active interaction state while preserving type
      setInteraction((prev) => ({
        ...initialInteractionState,
        type: prev.type,
      }));

      return finalState;
    },
    [
      interaction,
      updateInteraction,
      tryEraseRect,
      tryPlaceBlueprint,
      getSelectedBlueprint,
    ]
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

  // Update renderer context when necessary
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateRenderContext({
        getInteractionState: () => interaction,
        getSelectedBlueprint,
      });
    }
  }, [interaction, getSelectedBlueprint]);
  // Clear our selected blueprint whenever we change our interaction to non-placing
  useEffect(() => {
    if (!canvasContainer.current) return;

    if (interaction.type !== 'placing') {
      deselectSubcategory();
    }
  }, [interaction.type, deselectSubcategory]);

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

      if (event.key === 'Escape' || event.key === ' ') {
        //Switch to panning mode, same as rightclick
        setInteractionType('panning');
      }

      if (event.key === 'Delete' || event.key === 'e' || event.key === 'E') {
        //Switch to eraser mode
        setInteractionType('erasing');
      }

      // Blueprint rotation
      if ((event.key === 'r' || event.key === 'R') && !event.repeat) {
        event.preventDefault();
        selectNextBlueprintIndex();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      event.preventDefault();
      startInteraction(event.nativeEvent, interaction.type);
    },
    [interaction.type, startInteraction]
  );

  // Mouse move effect - handle all movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      updateInteraction(event);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updateInteraction]);
  useEffect(() => {
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      updateInteraction(event);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => window.removeEventListener('touchmove', handleTouchMove);
  }, [updateInteraction, interaction]);

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      updateInteraction(event.nativeEvent);
    },
    [updateInteraction]
  );

  // Mouse up effect - complete interactions
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0 && isInteractionActive(interaction)) {
        endInteraction(event);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [endInteraction, interaction]);
  useEffect(() => {
    const handleTouchEnd = (event: TouchEvent) => {
      if (isInteractionActive(interaction)) {
        event.preventDefault();
        endInteraction(event);
      }
    };

    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [endInteraction, interaction]);

  // ===== SIDEBAR HANDLERS =====
  const handlePanClick = useCallback(() => {
    setInteractionType('panning');
  }, [setInteractionType]);

  const handleEraserClick = useCallback(() => {
    setInteractionType('erasing');
  }, [setInteractionType]);

  const handleTransparencyToggle = () => {
    if (rendererRef.current) {
      rendererRef.current.toggleBuildingTransparency();
    }
  };

  // ===== NOTIFICATIONS =====
  const showToast = useCallback(
    (message: string, hasCaps: boolean, duration?: number) => {
      toast.custom(
        (_t) => <ToastNotification message={message} hasCaps={hasCaps} />,
        {
          id: `${message.slice(0, 10)}-${Date.now()}`,
          duration: duration,
        }
      );
    },
    []
  );

  // ===== RENDER =====
  return (
    <div id="app-container">
      <div
        ref={canvasContainer}
        id="canvas-container"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onWheel={handleMouseWheel}
        onContextMenu={(event: React.MouseEvent<HTMLDivElement>) => {
          event.preventDefault(); //Prevent rightclick menu
        }}
      >
        <Toaster position="top-center" />
      </div>
      <div id="sidebar-separator"></div>
      <Sidebar
        onRotateClick={handleRotateGrid}
        onPanClick={handlePanClick}
        onEraserClick={handleEraserClick}
        onZoomInClick={handleZoomIn}
        onZoomOutClick={handleZoomOut}
        onUndoClick={tryUndo}
        onRedoClick={tryRedo}
        onRotateBlueprintClick={selectNextBlueprintIndex}
        onToggleTransparencyClick={handleTransparencyToggle}
        canUndo={canUndo}
        canRedo={canRedo}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        isGridRotated={isGridRotated}
        canRotateBlueprint={
          (selectedSubcategory?.blueprints?.length ?? 0) > 1 // Evil hack that accounts for nullness
        }
        selectSubcategory={selectSubcategory}
        selectedSubcategory={selectedSubcategory}
        currentInteractionType={interaction.type}
      />
    </div>
  );
};

export default App;
