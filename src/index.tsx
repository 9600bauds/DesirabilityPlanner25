import React from 'react';
import ReactDOM from 'react-dom/client';
import { CanvasRenderer } from './classes/CanvasRenderer';
import { GridState } from './classes/GridState';
import { UIManager } from './classes/UIManager';
import Sidebar from './components/Sidebar';
import BuildingSelector from './components/BuildingSelector';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById(
    'desirabilityCanvas'
  ) as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  const gridState = new GridState();
  const canvasRenderer = new CanvasRenderer(canvas, gridState);
  const uiManager = new UIManager(canvas, canvasRenderer, gridState);

  // Render React component into the sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const reactRoot = ReactDOM.createRoot(sidebar); // Create a React root in the sidebar element
    reactRoot.render(
      <Sidebar
        onRotateClick={() => canvasRenderer.toggleGridRotation()}
        onPanClick={() => uiManager.setCursorAction('panning')}
        onZoomInClick={() => canvasRenderer.zoomIn()}
        onZoomOutClick={() => canvasRenderer.zoomOut()}
        onDefaultActionClick={() => uiManager.setCursorAction('default')}
        setSelectedBlueprintKey={uiManager.setBlueprintKeyButPublic}
      />
    );
  } else {
    console.error('Sidebar element not found!');
  }
});
