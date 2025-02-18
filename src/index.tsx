import ReactDOM from 'react-dom/client';
import CanvasRenderer from './classes/CanvasRenderer';
import UIManager from './classes/UIManager';
import Sidebar from './components/Sidebar';
import GridStateManager from './classes/GridStateManager';
import { populateCategories } from './data/CATEGORIES';
import { instantiateBlueprints } from './data/BLUEPRINTS';
import { SVG } from '@svgdotjs/svg.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvasContainer = document.getElementById(
    'canvas-container'
  ) as HTMLElement;
  if (!canvasContainer) {
    console.error('Canvas container not found!');
    return;
  }
  const svgCanvas = SVG().addTo(canvasContainer).size('100%', '100%');

  instantiateBlueprints(svgCanvas);
  populateCategories();

  const gridStateManager = new GridStateManager();

  const canvasRenderer = new CanvasRenderer(svgCanvas, canvasContainer);

  const uiManager = new UIManager(
    canvasContainer,
    canvasRenderer,
    gridStateManager
  );

  // Render React component into the sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const reactRoot = ReactDOM.createRoot(sidebar); // Create a React root in the sidebar element
    reactRoot.render(
      <Sidebar
        onRotateClick={() => canvasRenderer.toggleGridRotation()}
        onPanClick={() => uiManager.setCursorAction('panning')}
        onEraserClick={() => uiManager.setCursorAction('erasing')}
        onZoomInClick={() => canvasRenderer.zoomIn()}
        onZoomOutClick={() => canvasRenderer.zoomOut()}
        setSelectedSubcategory={uiManager.setSelectedSubcategory}
      />
    );
  } else {
    console.error('Sidebar element not found!');
  }
});
