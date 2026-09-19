// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import GridStateManager from '../classes/GridStateManager';
import { useCityUrl } from './useCityUrl';
import { ALL_BLUEPRINTS } from '../data/BLUEPRINTS';
import { Rectangle, Tile } from '../utils/geometry';
import {
  GRID_SIZE,
  URL_LEGACY_QUERY_INDEX,
  LEGACY_README_LINK,
  README_CITY_BUILDINGS,
  README_BASE64_LINK,
  README_HIEROGLYPH_LINK,
} from '../utils/constants';

import { decompressCity } from '../utils/compression';
import { glyphsToBytes } from '../utils/glyphs';

describe('useCityUrl', () => {
  let manager: GridStateManager;

  const visit = (url: string) => window.history.replaceState({}, '', url);
  const cityUrl = () =>
    renderHook(() => useCityUrl(manager, () => null)).result;
  const fragment = () =>
    decodeURIComponent(window.location.hash.replace(/^#/, ''));

  beforeEach(() => {
    manager = new GridStateManager();
    visit('/');
  });
  afterEach(cleanup);

  it('a legacy link is loaded and rewritten as a fragment', () => {
    visit(`/?${URL_LEGACY_QUERY_INDEX}=${LEGACY_README_LINK}`);

    const result = cityUrl();

    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
    expect(window.location.search).toBe('');
    expect(fragment()).toBe(README_HIEROGLYPH_LINK);
    expect(result.current.loadedFromUrl).toBe(true);
  });

  it('a fragment link is loaded and left where it is', () => {
    visit(`/#${README_HIEROGLYPH_LINK}`);

    const result = cityUrl();

    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
    expect(fragment()).toBe(README_HIEROGLYPH_LINK);
    expect(result.current.loadedFromUrl).toBe(true);
  });

  it('a base64 fragment is loaded and upgraded to hieroglyphs', () => {
    visit(`/#${README_BASE64_LINK}`);

    const result = cityUrl();

    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
    expect(fragment()).toBe(README_HIEROGLYPH_LINK);
    expect(result.current.loadedFromUrl).toBe(true);
  });

  it('an empty URL loads nothing', () => {
    const result = cityUrl();

    expect(manager.getBuildings().size).toBe(0);
    expect(result.current.loadedFromUrl).toBe(false);
  });

  it('saving puts the city in the fragment', () => {
    const result = cityUrl();
    manager.tryPlaceBlueprint(new Tile(5, 5), ALL_BLUEPRINTS.Garden);

    act(() => result.current.saveToUrl());

    expect(window.location.hash).not.toBe('');
    const reopened = new GridStateManager();
    reopened.loadUInt8Array(
      decompressCity(glyphsToBytes(fragment())).buildings
    );
    expect(reopened.getBuildings().size).toBe(1);
  });

  it('saving an empty city leaves no fragment behind', () => {
    visit(`/#${README_HIEROGLYPH_LINK}`);
    const result = cityUrl();
    manager.eraseRect(new Rectangle(new Tile(0, 0), GRID_SIZE, GRID_SIZE));

    act(() => result.current.saveToUrl());

    expect(window.location.hash).toBe('');
  });
});
