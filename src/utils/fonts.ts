export function smallestFontSizeInBounds(
  text: string,
  divWidth: number,
  divHeight: number,
  includeZWS = true
) {
  // &#8203; is some kind of zero width space that works4me
  const delimiterPattern = includeZWS ? /\s|&#8203;|<br>/g : /\s|<br>/g;

  // Split text based on the chosen delimiters, remove invisible characters so our logic doesn't think a zero-width space is actually a seven-width space, and filter out empty segments
  const segments = text
    .split(delimiterPattern)
    .map((segment) => removeInvisibleCharacters(segment))
    .filter((segment) => segment.length > 0);

  const longestSegment = segments.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    ''
  );

  const avgCharWidth = 0.6; //Rough estimation
  const lineHeight = 1.2; //Rough estimation

  // Calculate what font size would make the longest segment fit
  const fontSizeForWidth = divWidth / (longestSegment.length * avgCharWidth);
  const fontSizeForHeight = divHeight / (segments.length * lineHeight);

  return Math.min(fontSizeForWidth, fontSizeForHeight);
}

function removeInvisibleCharacters(text: string) {
  return text.replace(/&#8203;|[\u200B-\u200D\uFEFF]|<br>|\r?\n|\s+/g, '');
}
