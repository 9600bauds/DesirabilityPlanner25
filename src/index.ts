import { CanvasRenderer } from './classes/CanvasRenderer';
import { GridState } from './classes/GridState';
import { UIManager } from './classes/UIManager';

const gridState: GridState = new GridState();

const canvas = document.getElementById(
  'desirabilityCanvas'
) as HTMLCanvasElement;
const canvasRenderer = new CanvasRenderer(canvas, gridState);

const _uiManager = new UIManager(canvas, canvasRenderer, gridState);
