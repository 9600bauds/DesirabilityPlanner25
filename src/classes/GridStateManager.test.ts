import { beforeEach, describe, expect, it } from 'vitest';
import GridStateManager from './GridStateManager';
import { ALL_BLUEPRINTS } from '../data/BLUEPRINTS';
import { decodeData, encodeData } from '../utils/encoding';
import { Tile } from '../utils/geometry';

describe('GridStateManager', () => {
  const GARDEN = ALL_BLUEPRINTS.Garden;
  const STATUE = ALL_BLUEPRINTS['Statue, Small'];
  const GRANARY = ALL_BLUEPRINTS.Granary;
  const ROAD = ALL_BLUEPRINTS.Road;
  const PLAZA = ALL_BLUEPRINTS.Plaza;

  let manager: GridStateManager;
  beforeEach(() => {
    manager = new GridStateManager();
  });

  describe('saving and loading', () => {
    it('round-trips a simple city through a URL string', () => {
      manager.tryPlaceBlueprint(new Tile(5, 5), GARDEN);
      manager.tryPlaceBlueprint(new Tile(7, 5), STATUE);
      manager.tryPlaceBlueprint(new Tile(9, 9), ROAD);
      const saved = encodeData(manager.getUInt8Array());

      const loaded = new GridStateManager();
      loaded.loadUInt8Array(decodeData(saved));

      expect([...loaded.getUInt8Array()]).toEqual([...manager.getUInt8Array()]);
    });
  });

  describe('placement rules', () => {
    it('placement fails an occupied tile', () => {
      expect(manager.tryPlaceBlueprint(new Tile(5, 5), GARDEN)).toBe(true);
      expect(manager.tryPlaceBlueprint(new Tile(5, 5), STATUE)).toBe(false);
      expect(manager.getBuildings().size).toBe(1);
    });

    it('every tile of a multi-tile building counts as occupied', () => {
      manager.tryPlaceBlueprint(new Tile(5, 5), GRANARY);
      for (let x = 5; x < 5 + GRANARY.width; x++) {
        for (let y = 5; y < 5 + GRANARY.height; y++) {
          expect(manager.isTileOccupied(new Tile(x, y))).toBe(true);
          expect(manager.tryPlaceBlueprint(new Tile(x, y), GARDEN)).toBe(false);
        }
      }
    });

    it('no tile neighbouring a multi-tile building counts as occupied', () => {
      manager.tryPlaceBlueprint(new Tile(5, 5), GRANARY);
      for (let x = 4; x <= 5 + GRANARY.width; x++) {
        for (let y = 4; y <= 5 + GRANARY.height; y++) {
          if (
            x >= 5 &&
            x < 5 + GRANARY.width &&
            y >= 5 &&
            y < 5 + GRANARY.height
          )
            continue;

          expect(manager.isTileOccupied(new Tile(x, y))).toBe(false);
          expect(manager.tryPlaceBlueprint(new Tile(x, y), GARDEN)).toBe(true);
        }
      }
    });

    it('two 4x4s fit flush against each other', () => {
      expect(manager.tryPlaceBlueprint(new Tile(5, 5), GRANARY)).toBe(true);
      expect(manager.tryPlaceBlueprint(new Tile(9, 5), GRANARY)).toBe(true);
      expect(manager.tryPlaceBlueprint(new Tile(8, 5), GRANARY)).toBe(false);
      expect(manager.getBuildings().size).toBe(2);
    });

    it.todo('plazas can be placed over roads', () => {
      expect(manager.tryPlaceBlueprint(new Tile(5, 5), ROAD)).toBe(true);
      expect(manager.tryPlaceBlueprint(new Tile(5, 5), PLAZA)).toBe(true);
      expect(manager.getBuildings().size).toBe(1);
    });

    it('tryPlaceBlueprints places nothing at all if one building in a batch collides', () => {
      manager.tryPlaceBlueprint(new Tile(5, 5), GARDEN);

      const placed = manager.tryPlaceBlueprints([
        { position: new Tile(1, 1), blueprint: STATUE },
        { position: new Tile(5, 5), blueprint: STATUE },
      ]);

      expect(placed).toBe(false);
      expect(manager.getBuildings().size).toBe(1);
    });
  });

  describe('undo and redo', () => {
    it('works round-trip', () => {
      expect(manager.canUndo()).toBe(false);

      manager.tryPlaceBlueprint(new Tile(5, 5), GARDEN);
      expect(manager.getBuildings().size).toBe(1);

      expect(manager.undo()).toBe(true);
      expect(manager.getBuildings().size).toBe(0);

      expect(manager.redo()).toBe(true);
      expect(manager.getBuildings().size).toBe(1);
    });

    it.todo('undoing a plaza placed over a road restores the road', () => {
      manager.tryPlaceBlueprint(new Tile(5, 5), ROAD);
      manager.tryPlaceBlueprint(new Tile(5, 5), PLAZA);

      expect(manager.undo()).toBe(true);
      expect(manager.getBuildings().size).toBe(1);
      expect(manager.getInterceptingBuilding(new Tile(5, 5))?.blueprint).toBe(
        ROAD
      );
    });
  });
});
