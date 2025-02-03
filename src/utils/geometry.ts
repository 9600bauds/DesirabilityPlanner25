export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  origin: Point;
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
  const isInsideHorizontal =
    p.x >= r.origin.x && p.x <= r.origin.x + r.width - 1;
  const isInsideVertical =
    p.y >= r.origin.y && p.y <= r.origin.y + r.height - 1;

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
