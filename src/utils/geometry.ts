export interface Point {
  x: number;
  y: number;
}

export function arePointsEqual(p1: Point, p2: Point): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}

export function isPointInSet(p: Point, set: Set<Point>): boolean {
  for (const point of set) {
    if (arePointsEqual(p, point)) {
      return true;
    }
  }
  return false;
}

export interface Line {
  p1: Point;
  p2: Point;
}

export interface Rectangle {
  origin: Point;
  //Note that for all rectangle math, height and width are effectively +1:
  //A rectangle that starts at y=0 and ends at y=0 is considered to have a height of 1.
  height: number;
  width: number;
}

export function createRectangleFromPoints(p1: Point, p2: Point): Rectangle {
  const originX = Math.min(p1.x, p2.x);
  const originY = Math.min(p1.y, p2.y);
  const width = Math.abs(p1.x - p2.x) + 1;
  const height = Math.abs(p1.y - p2.y) + 1;

  return {
    origin: { x: originX, y: originY },
    width: width,
    height: height,
  };
}

export function rectangleInterceptsPoint(p: Point, r: Rectangle): boolean {
  const isInsideHorizontal = p.x >= r.origin.x && p.x < r.origin.x + r.width;
  const isInsideVertical = p.y >= r.origin.y && p.y < r.origin.y + r.height;

  return isInsideHorizontal && isInsideVertical;
}

export function rectangleInterceptsSetOfPoints(
  rect: Rectangle,
  points: Set<Point>
) {
  for (const point of points) {
    if (rectangleInterceptsPoint(point, rect)) {
      return true;
    }
  }
  return false;
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
