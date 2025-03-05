interface Viewport {
  coords: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    width: number;
    height: number;
  };
  tiles: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    width: number;
    height: number;
  };
}
export default Viewport;
