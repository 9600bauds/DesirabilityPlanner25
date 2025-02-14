export function desirabilityColor(value: number): string {
  value = Math.max(-10, Math.min(value, 50));

  const white = { r: 255, g: 255, b: 255 };
  const darkRed = { r: 180, g: 0, b: 0 };
  const goldenYellow = { r: 255, g: 215, b: 0 };

  if (value === 0) return '#FFFFFF';

  let ratio: number;
  let targetColor: { r: number; g: number; b: number };

  if (value > 0) {
    // For positives, blend from white to golden yellow.
    // We use +1 inside the log so that 0 maps to 0.
    ratio = Math.log(value + 1) / Math.log(50 + 1);
    targetColor = goldenYellow;
  } else {
    // For negatives, blend from white to dark red.
    ratio = Math.log(Math.abs(value) + 1) / Math.log(10 + 1);
    targetColor = darkRed;
  }

  // Interpolate between white and the target color.
  const r = Math.round(white.r * (1 - ratio) + targetColor.r * ratio);
  const g = Math.round(white.g * (1 - ratio) + targetColor.g * ratio);
  const b = Math.round(white.b * (1 - ratio) + targetColor.b * ratio);

  return rgbToHex(r, g, b);
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

const backgroundWhite = 'rgba(255,255,255,1)';
const outlineWhite = 'rgba(255,255,255,1)';
const redLowTransparency = 'rgba(255, 0, 0, 0.2)';
const redMidTransparency = 'rgba(255, 0, 0, 0.4)';
const redHighTransparency = 'rgba(255, 0, 0, 1)';
const greenLowTransparency = 'rgba(0, 255, 0, 0.2)';
const greenMidTransparency = 'rgba(0, 255, 0, 0.4)';
const weakOutlineBlack = 'rgba(0,0,0,0.2)';
const strongOutlineBlack = 'rgba(0,0,0,0.8)';
const pureBlack = 'rgba(0,0,0,1)';
export default {
  backgroundWhite,
  outlineWhite,
  redLowTransparency,
  redMidTransparency,
  redHighTransparency,
  greenLowTransparency,
  greenMidTransparency,
  weakOutlineBlack,
  strongOutlineBlack,
  pureBlack,
};
