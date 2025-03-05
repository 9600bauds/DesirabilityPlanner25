interface BuildingGraphic {
  outline: Path2D;
  fillPaths: fillPath[];
}

export interface fillPath {
  path: Path2D;
  fillColor: string;
}

export default BuildingGraphic;
