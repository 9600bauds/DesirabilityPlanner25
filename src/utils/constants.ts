export const gridSize = 200;
export const canvasTilePx = 45;
export const gridPixelSize = gridSize * canvasTilePx;
export const gridPixelCenter = gridPixelSize / 2;
export const rotationAngle = 45;
export const rotationRadians = (rotationAngle * Math.PI) / 180;
export const coordToPx = (coord: number) => coord * canvasTilePx;
export const pxToCoord = (px: number) => Math.floor(px / canvasTilePx);
