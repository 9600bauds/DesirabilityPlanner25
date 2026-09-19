import { describe, expect, it } from 'vitest';
import { compressCity, decompressCity } from './compression';
import { Tile } from './geometry';
import { ALL_BLUEPRINTS, BLUEPRINTS_BY_ID } from '../data/BLUEPRINTS';
import { decodeData } from './encoding';
import { LEGACY_README_LINK, README_CITY_BUILDINGS } from './constants';

describe('compressCity / decompressCity', () => {
  const city = (triples: number[]) => new Uint8Array(triples);

  // Straight out of the legacy link, so the codec under test had no hand in
  // building its own input
  const README_CITY = decodeData(LEGACY_README_LINK);

  const FORT = ALL_BLUEPRINTS.Fort;
  const FORT_YARD = ALL_BLUEPRINTS['Fort Yard'];
  const GARDEN = ALL_BLUEPRINTS.Garden;

  it('round-trips a city', () => {
    const original = city([11, 5, 5, 12, 7, 5, 1, 9, 9, 243, 20, 30]);

    expect([...decompressCity(compressCity(original)).buildings]).toEqual([
      ...original,
    ]);
  });

  it('round-trips buildings in the far corners of the grid', () => {
    const original = city([1, 0, 0, 11, 255, 0, 12, 0, 255, 243, 255, 255]);

    expect([...decompressCity(compressCity(original)).buildings]).toEqual([
      ...original,
    ]);
  });

  it('round-trips every blueprint id', () => {
    const ids = [...BLUEPRINTS_BY_ID.keys()];
    const original = new Uint8Array(ids.length * 3);
    ids.forEach((id, i) => {
      original.set([id, (i % 16) * 16, Math.floor(i / 16) * 16], i * 3);
    });

    expect([...decompressCity(compressCity(original)).buildings]).toEqual([
      ...original,
    ]);
  });

  it('reorders buildings into reading order', () => {
    const scrambled = city([11, 9, 9, 12, 5, 5]);

    expect([...decompressCity(compressCity(scrambled)).buildings]).toEqual([
      12, 5, 5, 11, 9, 9,
    ]);
  });

  /*
   * The fort is the one building that isn't a rectangle, so let's add bespoke tests to ensure it doesn't break encoding
   */
  describe('the fort', () => {
    it('the fort is still the shape these tests assume, otherwise these tests are useless', () => {
      expect([FORT.width, FORT.height]).toEqual([3, 3]);
      expect([FORT_YARD.width, FORT_YARD.height]).toEqual([4, 4]);

      const yard = FORT.children![0];
      expect(yard.childKey).toBe('Fort Yard');
      expect([yard.relativeOrigin.x, yard.relativeOrigin.y]).toEqual([3, -1]);
    });

    it('a fort keeps the buildings packed around it', () => {
      // The fort covers (10,10)-(12,12) and its yard (13,9)-(16,12), so every one
      // of these sits just outside it
      const original = city([
        GARDEN.id,
        10,
        9,
        GARDEN.id,
        9,
        10,
        FORT.id,
        10,
        10,
        GARDEN.id,
        17,
        10,
        GARDEN.id,
        10,
        13,
        GARDEN.id,
        13,
        13,
      ]);

      expect([...decompressCity(compressCity(original)).buildings]).toEqual([
        ...original,
      ]);
    });

    it('two forts interlock without losing either', () => {
      const original = city([FORT.id, 5, 5, FORT.id, 5, 9]);

      expect([...decompressCity(compressCity(original)).buildings]).toEqual([
        ...original,
      ]);
    });
  });

  describe('the camera', () => {
    it('saves and loads correctly', () => {
      const original = city([GARDEN.id, 5, 5]);
      const viewState = {
        center: new Tile(40, 70),
        zoom: 2.5,
        rotated: true,
        transparent: true,
      };

      const back = decompressCity(compressCity(original, viewState));

      expect(back.viewState?.center.x).toBe(40);
      expect(back.viewState?.center.y).toBe(70);
      expect(back.viewState?.zoom).toBeCloseTo(2.5, 1);
      expect(back.viewState?.rotated).toBe(true);
      expect(back.viewState?.transparent).toBe(true);
    });

    it('is absent from a city saved without one', () => {
      const back = decompressCity(compressCity(city([GARDEN.id, 5, 5])));

      expect(back.viewState).toBe(null);
    });

    it('does not disturb the buildings', () => {
      const viewState = {
        center: new Tile(0, 255),
        zoom: 0.1,
        rotated: false,
        transparent: false,
      };

      const aimed = decompressCity(
        compressCity(README_CITY, viewState)
      ).buildings;
      const plain = decompressCity(compressCity(README_CITY)).buildings;

      expect(aimed.length / 3).toBe(README_CITY_BUILDINGS);
      expect([...aimed]).toEqual([...plain]);
    });
  });

  it('an empty city compresses to nothing at all', () => {
    expect(compressCity(city([])).length).toBe(0);
    expect(decompressCity(new Uint8Array(0)).buildings.length).toBe(0);
  });

  it('refuses a building array that is not whole triples', () => {
    expect(() => compressCity(city([11, 5]))).toThrow();
  });
});
