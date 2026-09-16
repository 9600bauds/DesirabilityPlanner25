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
import {
  LOCALSTORAGE_KEY_SEEN_INSTRUCTIONS,
  URL_LEGACY_QUERY_INDEX,
} from '../utils/constants';
import { useUrlState } from '../hooks/useUrlState';
import { getClientCoordinates } from '../utils/events';
import { InteractionEvent } from '../types/InteractionEvent';
import HelpModal from './HelpModal';
import SimpleInstructions from './InstructionsSimple';
import FullInstructions from './InstructionsFull';

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
  const [modalPage, setModalPage] = useState<null | 'simple' | 'full'>(null);

  // ===== REFS =====
  const canvasContainer = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const gridManagerRef = useRef<GridStateManager>(new GridStateManager());

  // ===== URL MANAGEMENT =====
  const { getFragmentState, setFragmentState, getQueryState, clearQueryState } =
    useUrlState();

  const updateUrl = useCallback(() => {
    const grid = gridManagerRef.current.getUInt8Array();
    setFragmentState(grid.length > 0 ? encodeData(grid) : null);
  }, [setFragmentState]);

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
      const newRotationState = rendererRef.current.isRotated;
      setIsGridRotated(newRotationState);
      if (newRotationState === true) {
        showToast(
          'North is now UP (matches what you see in-game)',
          true,
          6000,
          'rotation-notification'
        );
      } else {
        showToast(
          'North is now TOP LEFT!',
          true,
          5000,
          'rotation-notification'
        );
      }
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

  // Show initial instructions if it's the user's first time seeing the page
  useEffect(() => {
    const hasSeen = localStorage.getItem(LOCALSTORAGE_KEY_SEEN_INSTRUCTIONS);
    if (!hasSeen) {
      setModalPage('simple');
    }
  }, []);

  // Initialize from URL
  useEffect(() => {
    // Old link handling
    const legacy = getQueryState(URL_LEGACY_QUERY_INDEX);
    if (legacy) clearQueryState(URL_LEGACY_QUERY_INDEX);

    const saved = legacy ?? getFragmentState();
    if (!saved) return;

    try {
      gridManagerRef.current.loadUInt8Array(decodeData(saved));
      // Explicitly rewrite the URL in case it was a legacy URL
      gridStateUpdated();
    } catch (error) {
      console.error('Could not decode saved URL:', error);
    }
  }, [getFragmentState, getQueryState, clearQueryState, gridStateUpdated]);

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

  // Dumb easter eggs
  useEffect(() => {
    const egg1 = () => {
      showToast(
        `𒀀 𒈾 𒂍 𒀀 𒈾 𒍢 𒅕 𒆠 𒉈 𒈠 𒌝 𒈠 𒈾 𒀭 𒉌 𒈠 𒀀 𒉡 𒌑 𒈠 𒋫 𒀠 𒇷 𒆪 𒆠 𒀀 𒄠 𒋫 𒀝 𒁉 𒄠 𒌝 𒈠 𒀜 𒋫 𒀀 𒈠 𒄖 𒁀 𒊑 𒁕 𒄠 𒆪 𒁴 𒀀 𒈾 𒄀 𒅖 𒀭 𒂗𒍪 𒀀 𒈾 𒀜 𒁲 𒅔 𒋫 𒀠 𒇷 𒅅 𒈠 𒋫 𒀝 𒁉 𒀀 𒄠 𒌑 𒆷 𒋼 𒁍 𒍑 𒄖 𒁀 𒊑 𒆷 𒁕 𒄠 𒆪 𒁴 𒀀 𒈾 𒈠 𒅈 𒅆 𒅁 𒊑 𒅀 𒋫 𒀸 𒆪 𒌦 𒈠 𒌝 𒈠 𒀜 𒋫 𒈠 𒋳 𒈠 𒋼 𒇷 𒆠 𒀀 𒇷 𒆠 𒀀 𒋳 𒈠 [𒆷] 𒋼 𒇷 𒆠 𒀀 𒀜 𒆷 𒅗 𒅀 𒋾 𒀀 𒈾 𒆠 𒈠 𒈠 𒀭 𒉌 𒅎 𒌅 𒅆 𒅎 𒈠 𒉌 𒈠 𒆠 𒀀 𒄠 𒋼 𒈨 𒊭 𒀭 𒉌 𒈠 𒊑 𒀀 𒉿 𒇷 𒀀 𒈾 𒆠 𒈠 𒅗 𒋾 𒀀 𒈾 𒆠 𒋛 𒅀 𒈠 𒄩 𒊑 𒅎 𒀸 𒁍 𒊏 𒄠 𒈠 𒌅 𒈨 𒄿 𒊭 𒄠 𒈠 𒄿 𒈾 𒂵 𒂵 𒅈 𒈾 𒀝 𒊑 𒅎 𒅖 𒋾 𒅖 𒋗 𒅇 𒅆 𒉌 𒋗 𒊑 𒆪 𒋢 𒉡 𒌅 𒋼 𒅕 𒊏 𒄠 𒄿 𒈾 𒀀 𒇷 𒅅 𒋼 𒂖 𒈬 𒌦 𒈠 𒀭 𒉡 𒌝 𒊭 𒆠 𒀀 𒄠 𒄿 𒁍 𒊭 𒀭 𒉌 𒄿 𒈠 𒀜 𒋫 𒈠 𒅈 𒅆 𒅁 𒊑 𒅀 𒌅 𒈨 𒂊 𒅖 𒀀 𒈾 𒈠 𒆷 𒅗 𒊍 𒉿 𒅎 𒊭 𒄿 𒈾 𒂵 𒋾 𒅀 𒌅 𒊺 𒍪 𒌑 𒆠 𒀀 𒄠 𒋫 𒁕 𒁍 𒌒 𒅇 𒀸 𒋳 𒄿 𒅗 𒀀 𒈾 𒂍 𒃲 𒇷 𒌋 𒐍 𒄘 𒍏 𒀀 𒈾 𒆪 𒀜 𒁲 𒅔 𒅇 𒋗 𒈪 𒀀 𒁍 𒌝 𒌋 𒐍 𒄘 𒍏 𒄿 𒁲 𒅔 𒂊 𒍣 𒅁 𒊭 𒀀 𒈾 𒂍 𒀭 𒌓 𒆪 𒉡 𒊌 𒅗 𒄠 𒉌 𒍣 𒁍 𒀀 𒈾 𒉿 𒊑 𒅎 𒊭 𒀀 𒋾 𒆠 𒄿 𒋼 𒁍 𒊭 𒀭 𒉌 𒆠 𒋛 𒄿 𒈾 𒂵 𒂵 𒅈 𒈾 𒀝 𒊑 𒌅 𒊌 𒋾 𒅋 𒆠 𒋛 𒀀 𒈾 𒂵 𒋾 𒅀 𒋗 𒇻 𒈠 𒄠 𒂊 𒇷 𒅗 𒄿 𒋗 𒆠 𒈠 𒀭 𒉌 𒆠 𒀀 𒄠 𒉿 𒊑 𒀀 𒄠 𒆷 𒁺 𒈬 𒂵 𒄠 𒆷 𒀀 𒈠 𒄩 𒊒 𒅗 𒋫 𒆷 𒈠 𒀜 𒄿 𒈾 𒆠 𒊓 𒇷 𒅀 𒅖 𒋾 𒈾 𒀀 𒌑 𒈾 𒍝 𒀝 𒈠 𒂊 𒇷 𒆠 𒅇 𒀀 𒈾 𒊭 𒌅 𒈨 𒄿 𒊭 𒀭 𒉌 𒈾 𒋛 𒄴 𒋫 𒄠 𒂊 𒁍 𒍑 𒅗`,
        true,
        10000
      );
    };
    const egg2 = () => {
      showToast(
        `Build Granaries to store the upcoming harvest`,
        true,
        3000,
        'granaries'
      );
      repeat();
    };

    let timeoutId: number;
    function repeat() {
      const averageTime = 1000 * 60 * 5; // every 5 mins on average
      timeoutId = setTimeout(
        egg2,
        Math.random() * averageTime + averageTime / 2
      );
    }
    repeat();

    const eggElem = document.getElementById('easteregg');
    if (eggElem) {
      eggElem.addEventListener('click', egg1);
    }

    return () => {
      // Responsible cleanup! This is completely unnecessary since the App component
      // will never be unloaded short of closing the page. But it's good practice.
      clearTimeout(timeoutId);
      if (eggElem && egg1) {
        eggElem.removeEventListener('click', egg1);
      }
    };
  }, []);

  // Some of our mouse events are applied to the document and the window. React does not have an easy way to do this.
  // As such, we need useEffects() to remove and re-apply these events whenever any of their state dependencies change.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalPage) return; // Do not apply keybinds while modal is open, to effectively disable them

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
    // modalPage is in the dependencies so we can effectively disable/re-enable shortcuts when its state updates
  }, [tryUndo, tryRedo, selectNextBlueprintIndex, modalPage]);

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
      if (isInteractionActive(interaction)) {
        // Only prevent default if an app interaction is active, otherwise, go ahead and let the rest of the page use the interaction
        event.preventDefault();
      }
      // Always update the application's interaction state for hover effects, etc.
      updateInteraction(event);
    };

    // { passive: false } is important because we are conditionally calling preventDefault()
    window.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [interaction, updateInteraction, modalPage]);
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
      const newTransparencyState = rendererRef.current.transparentBuildings;
      const snark = gridManagerRef.current.getBuildings().size <= 0;
      if (newTransparencyState === true) {
        showToast(
          `Building transparency enabled.${snark ? '\n(You have no buildings placed, so you might not notice a difference.)' : ''}`,
          true,
          snark ? 7000 : 3000,
          'rotation-notification'
        );
      } else {
        showToast(
          'Building transparency disabled.',
          true,
          3000,
          'rotation-notification'
        );
      }
    }
  };

  const handleHelpClick = useCallback(() => {
    setModalPage('full'); // Always show full instructions on manual click
  }, []);

  const closeHelpModal = useCallback(() => {
    setModalPage(null);
    localStorage.setItem(LOCALSTORAGE_KEY_SEEN_INSTRUCTIONS, 'true');
  }, []);

  // ===== NOTIFICATIONS =====
  const showToast = useCallback(
    (
      message: string,
      hasCaps: boolean = true,
      duration?: number,
      id?: string
    ) => {
      toast.custom(
        (_t) => <ToastNotification message={message} hasCaps={hasCaps} />,
        {
          id: id ?? `${message.slice(0, 10)}-${Date.now()}`,
          duration: duration,
        }
      );
    },
    []
  );

  // ===== RENDER =====
  return (
    <div id="app-container">
      <div id="content-container">
        <div id="toast-container">
          <Toaster
            position="top-center"
            containerStyle={{
              position: 'absolute',
            }}
          />
        </div>
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
        ></div>
      </div>
      <div id="sidebar-separator">
        <div id="easteregg" tabIndex={-1} aria-hidden="true" />
      </div>
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
        onHelpClick={handleHelpClick}
        canUndo={canUndo}
        canRedo={canRedo}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        isGridRotated={isGridRotated}
        canRotateBlueprint={
          // Evil hack that accounts for nullness.
          // Normally we'd want to have a proper flag for this, but selectedSubcategory is already a state, so this is OK.
          (selectedSubcategory?.blueprints?.length ?? 0) > 1
        }
        selectSubcategory={selectSubcategory}
        selectedSubcategory={selectedSubcategory}
        currentInteractionType={interaction.type}
      />
      <HelpModal isOpen={modalPage !== null} onClose={closeHelpModal}>
        {/* Wacky conditional rendering */}
        {modalPage === 'simple' && <SimpleInstructions />}
        {modalPage === 'full' && <FullInstructions />}
      </HelpModal>
    </div>
  );
};

export default App;
