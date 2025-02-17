import ReactDOM from 'react-dom/client';
import CanvasRenderer from './classes/CanvasRenderer';
import UIManager from './classes/UIManager';
import Sidebar from './components/Sidebar';
import GridStateManager from './classes/GridStateManager';
import { populateCategories } from './data/CATEGORIES';
import { instantiateBlueprints } from './data/BLUEPRINTS';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById(
    'desirabilityCanvas'
  ) as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  instantiateBlueprints();
  populateCategories();

  const gridStateManager = new GridStateManager();

  const canvasRenderer = new CanvasRenderer(canvas);

  const uiManager = new UIManager(canvas, canvasRenderer, gridStateManager);

  // Render React component into the sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const reactRoot = ReactDOM.createRoot(sidebar); // Create a React root in the sidebar element
    reactRoot.render(
      <Sidebar
        onRotateClick={() =>
          canvasRenderer.toggleGridRotation(uiManager.renderContext)
        }
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
