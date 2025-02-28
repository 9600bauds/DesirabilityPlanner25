import React, { useRef, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import GridStateManager from '../classes/GridStateManager';
import BuildingBlueprint from '../types/BuildingBlueprint';
import Subcategory from '../interfaces/Subcategory';
import { populateCategories } from '../data/CATEGORIES';
import { instantiateBlueprints } from '../data/BLUEPRINTS';
import CanvasRenderer, { CanvasUpdateFlag } from '../classes/CanvasRenderer';
import { Svg, SVG } from '@svgdotjs/svg.js';
import CursorAction from '../types/CursorAction';
import { BuildingCategory } from '../interfaces/BuildingCategory';

const App: React.FC = () => {
  // ===== APPLICATION STATE =====
  const [cursorAction, setCursorAction] = useState<CursorAction>('panning');
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Subcategory | null>(null);
  const [selectedBlueprintIndex, setSelectedBlueprintIndex] =
    useState<number>(0);

  const [populatedCategories, setPopulatedCategories] = useState<Record<
    string,
    BuildingCategory
  > | null>(null);

  const gridStateManager = useRef(new GridStateManager()).current;
  const canvasContainer = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const svgCanvasRef = useRef<Svg | null>(null);

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (!canvasContainer.current) {
      throw new Error(
        'Somehow did not have a ref to our container when initializing!'
      );
    }
    try {
      svgCanvasRef.current = SVG();

      const renderContext = {
        getBaseValues: gridStateManager.getBaseValues,
        getBuildings: gridStateManager.getBuildings,
        getCursorAction: () => cursorAction,
        getSelectedBlueprint: getSelectedBlueprint,
        isTileOccupied: gridStateManager.isTileOccupied,
      };
      rendererRef.current = new CanvasRenderer(canvasContainer.current, renderContext);

      const instantiated = instantiateBlueprints(svgCanvasRef.current);
      setPopulatedCategories(populateCategories(instantiated));
    } catch (error) {
      console.error('Error initializing data:', error);
    }

    // Clean up on unmount
    return () => {
      if (rendererRef.current) {
        //rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Notify our renderer when the selected blueprint changes
  useEffect(() => {
    if (rendererRef.current){
      rendererRef.current.selectedBlueprintChanged();
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
    if (!rendererRef.current) return;

    if (event.button === 2) {
      // Right click
      if (cursorAction === 'placing') {
        setCursorAction('panning');
        deselectSubcategory();
      } else if (cursorAction === 'erasing') {
        setCursorAction('panning');
        rendererRef.current.stopDragging();
      }
    } else if (event.button === 0) {
      // Left click
      if (cursorAction === 'panning') {
        rendererRef.current.startPanning(event.nativeEvent);
      } else if (cursorAction === 'erasing') {
        rendererRef.current.startDragging(event.nativeEvent);
      }
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current) return;

    if (event.button === 0) {
      //Left click
      rendererRef.current.stopPanning();
      if (cursorAction === 'erasing') {
        const erasedRect = rendererRef.current.stopDragging();
        if (erasedRect) {
          if (gridStateManager.eraseRect(erasedRect)) {
            rendererRef.current.scheduleRender(CanvasUpdateFlag.ALL);
          }
        }
      } else if (cursorAction === 'placing') {
        rendererRef.current.stopPanning();
        const tile = rendererRef.current.getMouseCoords(event.nativeEvent);
        if (tile) {
          const blueprint = getSelectedBlueprint();
          if (blueprint) {
            rendererRef.current.stopPanning();
            if (gridStateManager.tryPlaceBuilding(tile, blueprint)) {
              rendererRef.current.scheduleRender(CanvasUpdateFlag.ALL);
            }
          }
        }
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current) return;

    if (cursorAction === 'panning') {
      rendererRef.current.handlePanning(event.nativeEvent);
    } else {
      rendererRef.current.handleMouseMove(event.nativeEvent);
    }
  };

  const handleMouseLeave = () => {
    if (!rendererRef.current) return;
    if (cursorAction === 'panning') {
      rendererRef.current.stopPanning();
    } else {
      rendererRef.current.handleMouseLeave();
    }
  };

  const preventRightclickMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const getSelectedBlueprint = (): BuildingBlueprint | null => {
    if (!selectedSubcategory) {
      return null;
    }
    return selectedSubcategory.blueprints[selectedBlueprintIndex];
  };

  const selectSubcategory = (subcat: Subcategory) => {
    deselectSubcategory();
    setSelectedSubcategory(subcat);
    setCursorAction('placing');
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
        className="bg-white"
        style={{
          position: 'relative',
          width: '80vw',
          height: '100vh',
          overflow: 'hidden',
        }}
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
          populatedCategories={populatedCategories}
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
