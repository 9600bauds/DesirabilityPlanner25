export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  origin: Point;
  height: number;
  width: number;
}

export function addPoints(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function chebyshevDistance(
  tilePoint: Point,
  rectOrigin: Point,
  rectHeight: number,
  rectWidth: number
): number {
  let distanceX = 0;
  let distanceY = 0;

  if (tilePoint.x < rectOrigin.x) {
    distanceX = rectOrigin.x - tilePoint.x;
  } else if (tilePoint.x >= rectOrigin.x + rectWidth) {
    distanceX = tilePoint.x - (rectOrigin.x + rectWidth - 1);
  }

  if (tilePoint.y < rectOrigin.y) {
    distanceY = rectOrigin.y - tilePoint.y;
  } else if (tilePoint.y >= rectOrigin.y + rectHeight) {
    distanceY = tilePoint.y - (rectOrigin.y + rectHeight - 1);
  }

  return Math.max(distanceX, distanceY);
}
