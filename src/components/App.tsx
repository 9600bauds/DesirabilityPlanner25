import React, { useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import GridStateManager from '../classes/GridStateManager';
import Subcategory from '../interfaces/Subcategory';
import CanvasRenderer from '../classes/CanvasRenderer';
import Blueprint from '../types/Blueprint';
import CursorAction from '../types/CursorAction';

const App: React.FC = () => {
  // ===== APPLICATION STATE (or refs, I guess?) =====
  const selectedSubcategoryRef = useRef<Subcategory | null>(null);
  const selectedBlueprintIndexRef = useRef<number>(0);
  const cursorActionRef = useRef<CursorAction>('panning');

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
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    } catch (error) {
      console.error('Error initializing data:', error);
    }

    // Clean up on unmount
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (event.button === 2) {
      // Right click
      if (cursorActionRef.current === 'placing') {
        cursorActionRef.current = 'panning';
        deselectSubcategory();
      } else if (cursorActionRef.current === 'erasing') {
        cursorActionRef.current = 'panning';
        deselectSubcategory();
        renderer.stopDragging();
      }
    } else if (event.button === 0) {
      // Left click
      if (cursorActionRef.current === 'panning') {
        renderer.startPanning(event.nativeEvent);
      } else if (cursorActionRef.current === 'erasing') {
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
      if (cursorActionRef.current === 'erasing') {
        const erasedRect = renderer.stopDragging();
        if (erasedRect) {
          if (gridStateManager.eraseRect(erasedRect)) {
            renderer.scheduleRerender();
          }
        }
      } else if (cursorActionRef.current === 'placing') {
        const tile = renderer.getMouseCoords(event.nativeEvent);
        if (tile) {
          const blueprint = getSelectedBlueprint();
          if (blueprint) {
            if (gridStateManager.tryPlaceBuilding(tile, blueprint)) {
              renderer.scheduleRerender();
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

    if (cursorActionRef.current === 'panning') {
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
    if (cursorActionRef.current === 'panning') {
      renderer.stopPanning();
    }
    if (tileChanged) {
      handleTileChange();
    }
  };

  const handleTileChange = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (cursorActionRef.current === 'erasing') {
      renderer.handleDragging();
    } else if (cursorActionRef.current === 'placing') {
      renderer.schedulePreview();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Handle 'r' key for blueprint rotation
    if ((event.key === 'r' || event.key === 'R') && !event.repeat) {
      const subcategory = selectedSubcategoryRef.current;
      if (subcategory) {
        selectedBlueprintIndexRef.current =
          (selectedBlueprintIndexRef.current + 1) %
          subcategory.blueprints.length;

        // Since changing a ref doesn't trigger re-renders, manually notify the renderer
        if (rendererRef.current && cursorActionRef.current === 'placing') {
          rendererRef.current.schedulePreview();
        }
      }
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

  const preventRightclickMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const selectSubcategory = (subcat: Subcategory) => {
    cursorActionRef.current = 'placing';
    selectedSubcategoryRef.current = subcat;
    selectedBlueprintIndexRef.current = 0;
    // Notify renderer if needed
    if (rendererRef.current) {
      rendererRef.current.schedulePreview();
    }
  };

  const deselectSubcategory = () => {
    selectedSubcategoryRef.current = null;
    selectedBlueprintIndexRef.current = 0;
    // Notify renderer if needed
    if (rendererRef.current) {
      rendererRef.current.schedulePreview();
    }
  };

  const getSelectedBlueprint = (): Blueprint | null => {
    if (!selectedSubcategoryRef.current) {
      return null;
    }
    return selectedSubcategoryRef.current.blueprints[
      selectedBlueprintIndexRef.current
    ];
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
            cursorActionRef.current = 'panning';
            deselectSubcategory();
          }}
          onEraserClick={() => {
            cursorActionRef.current = 'erasing';
            deselectSubcategory();
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
