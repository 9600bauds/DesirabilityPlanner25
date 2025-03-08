import React, { useRef, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import GridStateManager from '../classes/GridStateManager';
import Subcategory from '../interfaces/Subcategory';
import CanvasRenderer, { CanvasUpdateFlag } from '../classes/CanvasRenderer';
import CursorAction from '../types/CursorAction';
import Blueprint from '../types/Blueprint';

const App: React.FC = () => {
  // ===== APPLICATION STATE =====
  const [cursorAction, setCursorAction] = useState<CursorAction>('panning');
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [selectedBlueprintIndex, setSelectedBlueprintIndex] =
    useState<number>(0);

  const gridStateManager = useRef(new GridStateManager()).current;
  const canvasContainer = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (!canvasContainer.current) {
      throw new Error(
        'Somehow did not have a ref to our container when initializing!'
      );
    }
    try {
      if (!rendererRef.current) {
        const renderContext = {
          getBaseValues: gridStateManager.getBaseValues,
          getBuildings: gridStateManager.getBuildings,
          getSelectedBlueprint: getSelectedBlueprint,
          isTileOccupied: gridStateManager.isTileOccupied,
        };
        rendererRef.current = new CanvasRenderer(
          canvasContainer.current,
          renderContext
        );
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    }

    // Clean up on unmount
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Notify our renderer when the selected blueprint changes
  useEffect(() => {
    if (rendererRef.current) {
      if (cursorAction === 'placing') {
        rendererRef.current.handlePlacementPreview();
      }
    }

    // ...We also need to re-apply these events every single time we change our selected blueprint because React caches the current values or something.
    // I don't entirely understand what's going on here. But the performance hit is undetectable so whatever.
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle 'r' key for blueprint rotation
      if (
        (event.key === 'r' || event.key === 'R') &&
        !event.repeat &&
        selectedSubcategory
      ) {
        setSelectedBlueprintIndex(
          (prev) => (prev + 1) % selectedSubcategory.blueprints.length
        );
      }

      // Handle Control key for building transparency
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
  }, [selectedSubcategory, selectedBlueprintIndex]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (event.button === 2) {
      // Right click
      if (cursorAction === 'placing') {
        setCursorAction('panning');
        deselectSubcategory();
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
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (event.button === 0) {
      //Left click
      renderer.stopPanning();
      if (cursorAction === 'erasing') {
        const erasedRect = renderer.stopDragging();
        if (erasedRect) {
          if (gridStateManager.eraseRect(erasedRect)) {
            renderer.scheduleRender(CanvasUpdateFlag.ALL);
          }
        }
      } else if (cursorAction === 'placing') {
        const tile = renderer.getMouseCoords(event.nativeEvent);
        if (tile) {
          const blueprint = getSelectedBlueprint();
          if (blueprint) {
            if (gridStateManager.tryPlaceBuilding(tile, blueprint)) {
              renderer.scheduleRender(CanvasUpdateFlag.ALL);
            }
          }
        }
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const tileChanged = renderer.checkForTileChange(event.nativeEvent);

    if (cursorAction === 'panning') {
      renderer.handlePanning(event.nativeEvent);
    }
    if (tileChanged) {
      handleTileChange();
    }
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const tileChanged = renderer.checkForTileChange(event.nativeEvent);
    if (cursorAction === 'panning') {
      renderer.stopPanning();
    }
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
      renderer.handlePlacementPreview();
    }
  };

  const preventRightclickMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const getSelectedBlueprint = (): Blueprint | null => {
    if (!selectedSubcategory) {
      return null;
    }
    return selectedSubcategory.blueprints[selectedBlueprintIndex];
  };

  const selectSubcategory = (subcat: Subcategory) => {
    deselectSubcategory();
    setCursorAction('placing');
    setSelectedSubcategory(subcat);
  };

  const deselectSubcategory = () => {
    setSelectedSubcategory(null);
    setSelectedBlueprintIndex(0);
  };

  return (
    <div id="app-container" className="d-flex">
      <div
        ref={canvasContainer}
        id="canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={preventRightclickMenu}
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
          selectSubcategory={selectSubcategory}
        />
      </div>
    </div>
  );
};

export default App;
