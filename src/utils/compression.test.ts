import { describe, expect, it } from 'vitest';
import { compressCity, decompressCity } from './compression';

describe('compressCity / decompressCity', () => {
  const city = (triples: number[]) => new Uint8Array(triples);

  it('round-trips a city', () => {
    const original = city([11, 5, 5, 12, 7, 5, 1, 9, 9, 243, 20, 30]);

    expect([...decompressCity(compressCity(original))]).toEqual([...original]);
  });

  it('round-trips buildings in the far corners of the grid', () => {
    const original = city([1, 0, 0, 11, 255, 0, 12, 0, 255, 243, 255, 255]);

    expect([...decompressCity(compressCity(original))]).toEqual([...original]);
  });

  it('round-trips every blueprint id', () => {
    const original = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      original.set([i, i, 7], i * 3);
    }

    expect([...decompressCity(compressCity(original))]).toEqual([...original]);
  });

  it('reorders buildings into reading order', () => {
    const scrambled = city([11, 9, 9, 12, 5, 5]);

    expect([...decompressCity(compressCity(scrambled))]).toEqual([
      12, 5, 5, 11, 9, 9,
    ]);
  });

  it('an empty city compresses to nothing at all', () => {
    expect(compressCity(city([])).length).toBe(0);
    expect(decompressCity(new Uint8Array(0)).length).toBe(0);
  });

  it('refuses a building array that is not whole triples', () => {
    expect(() => compressCity(city([11, 5]))).toThrow();
  });
});
