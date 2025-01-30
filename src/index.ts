import { Point } from './utils/geometry';
import { BUILDING_PRESETS, gridSize } from './utils/constants';
import { CanvasRenderer } from './renderer';
import { Building } from './classes/building';

let desirabilityGrid: number[][] = Array.from({ length: gridSize }, () =>
  Array.from({ length: gridSize }, () => 0)
);
function getDesirabilityGrid() {
  return desirabilityGrid;
}

const placedBuildings: Set<Building> = new Set();
function placeBuildingFromPreset(
  presetId: keyof typeof BUILDING_PRESETS,
  position: Point
): Building {
  const preset = BUILDING_PRESETS[presetId];
  if (!preset) {
    throw new Error(`Unknown building preset: ${presetId}`);
  }
  const newBuilding = new Building(
    position,
    preset.height,
    preset.width,
    preset.name,
    preset.cost,
    preset.desireBoxes
  );
  placedBuildings.add(newBuilding);
  updateDesirabilityGrid();
  return newBuilding;
}

let cursorAction = 'default';
function getCursorAction() {
  return cursorAction;
}
const selectedPreset: keyof typeof BUILDING_PRESETS = 'GARDEN';
function getSelectedPreset() {
  return selectedPreset;
}

function updateDesirabilityGrid() {
  desirabilityGrid = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => 0)
  ); //Reset the grid
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const tilePoint: Point = { x, y };
      let totalDesirabilityEffect = 0;
      placedBuildings.forEach(function (building) {
        totalDesirabilityEffect +=
          building.calculateDesirabilityEffect(tilePoint);
      });
      desirabilityGrid[y][x] += totalDesirabilityEffect;
    }
  }
  renderer.baseValuesUpdated();
}

const canvas = document.getElementById(
  'desirabilityCanvas'
) as HTMLCanvasElement;
const renderer = new CanvasRenderer(
  canvas,
  getDesirabilityGrid,
  getCursorAction,
  getSelectedPreset,
  placeBuildingFromPreset
);

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
const zoomInButton = document.getElementById('zoomin-btn');
if (zoomInButton) {
  zoomInButton.addEventListener('click', () => {
    renderer.zoomIn();
  });
}
const zoomOutButton = document.getElementById('zoomout-btn');
if (zoomOutButton) {
  zoomOutButton.addEventListener('click', () => {
    renderer.zoomOut();
  });
}
const panButton = document.getElementById('pan-btn');
if (panButton) {
  panButton.addEventListener('click', () => {
    cursorAction = 'panning';
  });
}
const defaultActionButton = document.getElementById('default-action-btn');
if (defaultActionButton) {
  defaultActionButton.addEventListener('click', () => {
    cursorAction = 'default';
  });
}

/*// Example DesireBoxes
const desireBoxes: DesireBox[] = [
  new DesireBox({ x: 5, y: 5 }, 4, 4, 5, -1, 2, 10),
  new DesireBox({ x: 20, y: 20 }, 2, 6, -3, 1, 3, 8),
];*/

updateDesirabilityGrid(); // Initial calculation
