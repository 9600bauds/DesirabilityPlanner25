export const gridSize = 50;
export const canvasTilePx = 45;
export const gridPixelSize = gridSize * canvasTilePx;
export const gridPixelCenter = gridPixelSize / 2;
export const rotationAngle = 45;
export const rotationRadians = (rotationAngle * Math.PI) / 180;
export const coordToPx = (coord: number) => coord * canvasTilePx;
