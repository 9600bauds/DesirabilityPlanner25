import ReactDOM from 'react-dom/client';
import CanvasRenderer from './classes/CanvasRenderer';
import UIManager from './classes/UIManager';
import Sidebar from './components/Sidebar';
import GridStateManager from './classes/GridStateManager';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById(
    'desirabilityCanvas'
  ) as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  const gridStateManager = new GridStateManager();

  const canvasRenderer = new CanvasRenderer(canvas, gridStateManager);

  const uiManager = new UIManager(canvas, canvasRenderer, gridStateManager);

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
        setSelectedBlueprints={uiManager.setSelectedBlueprints}
      />
    );
  } else {
    console.error('Sidebar element not found!');
  }
});
