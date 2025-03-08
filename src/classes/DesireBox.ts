import { NewDesireBox } from '../interfaces/NewDesireBox';
import { GRID_MAX_X, GRID_MAX_Y, GRID_SIZE_BITS } from '../utils/constants';
import { Rectangle, Tile } from '../utils/geometry';

class DesireBox {
  readonly effectPerRange: Int16Array;
  readonly bounds: Rectangle; //The origin of this rectangle is relative to 0,0 which is the origin of the base building
  readonly maxRange: number;

  constructor(data: NewDesireBox, origin: Tile, height: number, width: number) {
    if (data.maxRange === undefined || data.maxRange > 99) {
      throw new Error(
        'Desirebox data had an invalid max range (should be <=99, but really, <=6 is what the game uses)!'
      );
    }
    if (data.stepDist === undefined || data.stepDist < 1) {
      throw new Error(
        'Desirebox data had an invalid stepDist (should be positive)!'
      );
    }

    this.effectPerRange = new Int16Array(data.maxRange + 1);
    this.effectPerRange[0] = 0; //We don't affect tiles inside us because reasons
    for (let dist = 1; dist <= data.maxRange; dist++) {
      const stepsAway = Math.ceil(dist / data.stepDist);
      const distanceModifier = (stepsAway - 1) * data.stepVal;

      this.effectPerRange[dist] = data.baseDesirability + distanceModifier;
    }

    this.bounds = new Rectangle(origin, height, width);
    this.maxRange = data.maxRange;
  }

  public apply(grid: Int16Array, multiplier: number = 1): void {
    const origin = this.bounds.origin;
    const rectRight = origin.x + this.bounds.width - 1;
    const rectBottom = origin.y + this.bounds.height - 1;
    const minX = Math.max(0, origin.x - this.maxRange);
    const maxX = Math.min(GRID_MAX_X, rectRight + this.maxRange);
    const minY = Math.max(0, origin.y - this.maxRange);
    const maxY = Math.min(GRID_MAX_Y, rectBottom + this.maxRange);

    // Process grid row by row for SIMD-friendly access pattern
    for (let y = minY; y <= maxY; y++) {
      const isAboveRect = y < origin.y;
      const isBelowRect = y > rectBottom;

      // Pre-compute vertical distance once per row
      let distY = 0;
      if (isAboveRect) {
        distY = origin.y - y;
      } else if (isBelowRect) {
        distY = y - rectBottom;
      }

      // Pre-compute row offset for faster indexing
      const rowOffset = y << GRID_SIZE_BITS;
      // Process each cell in the row
      for (let x = minX; x <= maxX; x++) {
        const isLeftOfRect = x < origin.x;
        const isRightOfRect = x > rectRight;

        const isInsideRect =
          !isAboveRect && !isBelowRect && !isLeftOfRect && !isRightOfRect;
        if (isInsideRect) {
          continue;
        }

        // Gotta calculate horizontal distance for each one individually
        let distX = 0;
        if (isLeftOfRect) {
          distX = origin.x - x;
        } else if (isRightOfRect) {
          distX = x - rectRight;
        }

        const chebyshevDist = distX > distY ? distX : distY;

        grid[rowOffset | x] += this.effectPerRange[chebyshevDist] * multiplier;
      }
    }
  }
}

export default DesireBox;
