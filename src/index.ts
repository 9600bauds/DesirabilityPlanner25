import { Point } from './utils/geometry';
import { DesireBox } from './classes/desireBox';
import { gridSize } from './utils/constants';
import { CanvasRenderer } from './renderer';

let desirabilityGrid: number[][] = Array.from({ length: gridSize }, () =>
  Array.from({ length: gridSize }, () => 0)
);

function updateDesirabilityGrid() {
  desirabilityGrid = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => 0)
  ); //Reset the grid
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const tilePoint: Point = { x, y };
      let totalDesirabilityEffect = 0;
      for (const desireBox of desireBoxes) {
        totalDesirabilityEffect +=
          desireBox.calculateDesirabilityEffect(tilePoint);
      }
      desirabilityGrid[y][x] += totalDesirabilityEffect;
    }
  }
  renderer.baseValuesUpdated();
}

function getDesirabilityGrid() {
  return desirabilityGrid;
}

const canvas = document.getElementById(
  'desirabilityCanvas'
) as HTMLCanvasElement;
const renderer = new CanvasRenderer(canvas, getDesirabilityGrid);

const resizeObserver = new ResizeObserver(() => {
  renderer.canvasSizeUpdated();
});
resizeObserver.observe(canvas);

const rotateButton = document.getElementById('rotate-btn');
if (rotateButton) {
  rotateButton.addEventListener('click', () => {
    renderer.toggleGridRotation();
  });
}

// Example DesireBoxes
const desireBoxes: DesireBox[] = [
  new DesireBox({ x: 5, y: 5 }, 4, 4, 5, -1, 2, 10),
  new DesireBox({ x: 20, y: 20 }, 2, 6, -3, 1, 3, 8),
];

updateDesirabilityGrid(); // Initial calculation
