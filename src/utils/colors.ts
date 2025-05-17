import { MAX_DESIRABILITY_COLOR, MIN_DESIRABILITY_COLOR } from './constants';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

const DESIRABILITY_TO_RGB: RGBColor[] = [];

// Initialize colors at startup
function initDesirabilityColors(): void {
  const white = { r: 255, g: 255, b: 255 };
  const darkRed = { r: 180, g: 0, b: 0 };
  const goldenYellow = { r: 255, g: 215, b: 0 };
  for (
    let value = MIN_DESIRABILITY_COLOR;
    value <= MAX_DESIRABILITY_COLOR;
    value++
  ) {
    if (value === 0) {
      DESIRABILITY_TO_RGB[value - MIN_DESIRABILITY_COLOR] = { ...white };
      continue;
    }

    let ratio: number;
    let targetColor: RGBColor;

    if (value > 0) {
      // For positives, blend from white to golden yellow
      ratio = Math.log(value + 1) / Math.log(MAX_DESIRABILITY_COLOR + 1);
      targetColor = goldenYellow;
    } else {
      // For negatives, blend from white to dark red
      ratio =
        Math.log(Math.abs(value) + 1) / Math.log(1 - MIN_DESIRABILITY_COLOR);
      targetColor = darkRed;
    }

    const r = Math.round(white.r * (1 - ratio) + targetColor.r * ratio);
    const g = Math.round(white.g * (1 - ratio) + targetColor.g * ratio);
    const b = Math.round(white.b * (1 - ratio) + targetColor.b * ratio);

    DESIRABILITY_TO_RGB[value - MIN_DESIRABILITY_COLOR] = { r, g, b };
  }
}
initDesirabilityColors();

export function getDesirabilityRGB(value: number): RGBColor {
  value = Math.max(
    MIN_DESIRABILITY_COLOR,
    Math.min(value, MAX_DESIRABILITY_COLOR)
  );
  return DESIRABILITY_TO_RGB[value - MIN_DESIRABILITY_COLOR];
}

// Legacy wrapper
export function desirabilityColor(value: number): string {
  const rgb = getDesirabilityRGB(value);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export default {
  backgroundWhite: 'rgba(255,255,255,1)',
  outlineWhite: 'rgba(255,255,255,1)',
  redVeryLowTransparency: 'rgba(255, 0, 0, 0.1)',
  redLowTransparency: 'rgba(255, 0, 0, 0.2)',
  redMidTransparency: 'rgba(255, 0, 0, 0.4)',
  redHighTransparency: 'rgba(255, 0, 0, 1)',
  greenLowTransparency: 'rgba(0, 255, 0, 0.2)',
  greenMidTransparency: 'rgba(0, 255, 0, 0.4)',
  weakOutlineBlack: 'rgba(0,0,0,0.2)',
  strongOutlineBlack: 'rgba(0,0,0,0.8)',
  pureBlack: 'rgba(0,0,0,1)',

  road: 'rgb(153, 102, 51)',
  housing: 'rgb(231, 130, 132)',
  beauty_inert: 'rgb(102, 204, 0)',
  beauty_needsroad: 'rgb(166, 218, 149)',
  walker_essential: 'rgb(65, 69, 89)',
  walker_basic: 'rgb(198, 208, 245)',
  walker_midtier: 'rgb(129, 200, 190)',
  walker_fancy: 'rgb(202, 158, 230)',
  storageBase: 'rgb(204, 178, 127)',
  industryBase: 'rgb(255, 128, 0)',
};
