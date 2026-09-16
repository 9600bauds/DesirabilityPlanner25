import { beforeEach, describe, expect, it } from 'vitest';
import GridStateManager from './GridStateManager';
import { ALL_BLUEPRINTS } from '../data/BLUEPRINTS';
import { Rectangle, Tile } from '../utils/geometry';

describe('a 1x1 garden', () => {
  const GARDEN = ALL_BLUEPRINTS.Garden;

  let manager: GridStateManager;
  beforeEach(() => {
    manager = new GridStateManager();
  });

  it('has positive desirability, otherwise none of these tests matter', () => {
    expect(GARDEN.desireBox!.baseDesirability).toBeGreaterThan(0);
  });

  it("does not affect the tile it's placed on", () => {
    manager.tryPlaceBlueprint(new Tile(10, 10), GARDEN);

    expect(manager.valueAt(10, 10)).toBe(0);
  });

  it('stacks with another 1x1 garden', () => {
    manager.tryPlaceBlueprint(new Tile(10, 10), GARDEN);
    manager.tryPlaceBlueprint(new Tile(12, 10), GARDEN);
    expect(manager.valueAt(11, 10)).toBe(
      GARDEN.desireBox!.baseDesirability * 2
    );
  });

  it('stops affecting desirability after deleted', () => {
    manager.tryPlaceBlueprint(new Tile(10, 10), GARDEN);
    manager.eraseRect(new Rectangle(new Tile(10, 10), 1, 1));

    expect(manager.getBuildings().size).toBe(0);
    expect(manager.getBaseValues().some((value) => value !== 0)).toBe(false);
  });

  it('stops affecting desirability after undo', () => {
    manager.tryPlaceBlueprint(new Tile(10, 10), GARDEN);
    manager.undo();

    expect(manager.getBaseValues().some((value) => value !== 0)).toBe(false);
  });
});
