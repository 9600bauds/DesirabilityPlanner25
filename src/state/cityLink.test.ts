import { beforeEach, describe, expect, it } from 'vitest';
import GridStateManager from '../classes/GridStateManager';
import { LinkSource, readCityLink, writeCityLink } from './cityLink';
import {
  URL_LEGACY_QUERY_INDEX,
  LEGACY_README_LINK,
  README_CITY_BUILDINGS,
  README_BASE64_LINK,
  README_HIEROGLYPH_LINK,
} from '../utils/constants';

describe('readCityLink', () => {
  let manager: GridStateManager;
  let cleared: string[];

  const url = (overrides: Partial<LinkSource>): LinkSource => ({
    getFragmentState: () => null,
    getQueryState: () => null,
    clearQueryState: (index) => cleared.push(index),
    ...overrides,
  });

  beforeEach(() => {
    manager = new GridStateManager();
    cleared = [];
  });

  it('a legacy link loads its city', () => {
    const viewState = readCityLink(
      manager,
      url({ getQueryState: () => LEGACY_README_LINK })
    );

    expect(viewState).not.toBe(null);
    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
  });

  it('a fragment link loads its city', () => {
    const viewState = readCityLink(
      manager,
      url({ getFragmentState: () => README_BASE64_LINK })
    );

    expect(viewState).not.toBe(null);
    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
  });

  it('a hieroglyph fragment loads its city', () => {
    const viewState = readCityLink(
      manager,
      url({ getFragmentState: () => README_HIEROGLYPH_LINK })
    );

    expect(viewState).not.toBe(null);
    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
  });

  it('a base64 fragment loads its city', () => {
    const viewState = readCityLink(
      manager,
      url({ getFragmentState: () => README_BASE64_LINK })
    );

    expect(viewState).not.toBe(null);
    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
  });

  it('a legacy link is swept off the URL once it has been read', () => {
    readCityLink(manager, url({ getQueryState: () => LEGACY_README_LINK }));

    expect(cleared).toEqual([URL_LEGACY_QUERY_INDEX]);
  });

  it('a legacy link wins over a fragment', () => {
    readCityLink(
      manager,
      url({
        getQueryState: () => LEGACY_README_LINK,
        getFragmentState: () => {
          throw new Error('should never be read');
        },
      })
    );

    expect(manager.getBuildings().size).toBe(README_CITY_BUILDINGS);
  });

  it('an empty URL does nothing', () => {
    expect(readCityLink(manager, url({}))).toBe(null);
    expect(manager.getBuildings().size).toBe(0);
    expect(cleared).toEqual([]);
  });

  describe('writeCityLink', () => {
    it('an empty city has no link', () => {
      expect(writeCityLink(manager)).toBe(null);
    });

    it('a legacy city is written back as hieroglyphs', () => {
      readCityLink(manager, url({ getQueryState: () => LEGACY_README_LINK }));

      expect(writeCityLink(manager)).toBe(README_HIEROGLYPH_LINK);
    });
  });
});
