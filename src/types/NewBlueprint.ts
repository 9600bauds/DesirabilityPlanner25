import { NewBasicBlueprint } from '../interfaces/NewBasicBlueprint';
import { NewHouseBlueprint } from '../interfaces/NewHouseBlueprint';

type NewBlueprint = NewBasicBlueprint | NewHouseBlueprint;

export default NewBlueprint;

/*export function getAllTiles(origin: Tile, bp: NewBlueprint): TileSet {
  const tiles = new TileSet();
  for (let x = origin.x; x < origin.x + bp.width; x++) {
    for (let y = origin.y; y < origin.y + bp.height; y++) {
      const thisTile = new Tile(x, y);
      tiles.add(thisTile);
    }
  }
  if (bp.children) {
    for (const child of bp.children) {
      const childBlueprint = getBlueprint(child.childKey);
      const childOrigin = origin.add(child.relativeOrigin);
      for (const tile of getAllTiles(childOrigin, childBlueprint)) {
        tiles.add(tile);
      }
    }
  }
  return tiles;
}*/
