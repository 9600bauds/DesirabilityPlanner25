import { beforeEach, describe, expect, it } from 'vitest';
import GridStateManager from '../classes/GridStateManager';
import { LinkSource, readCityLink, writeCityLink } from './cityLink';
import {
  URL_LEGACY_QUERY_INDEX,
  LEGACY_README_LINK,
  README_FRAGMENT_LINK,
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
    const loaded = readCityLink(
      manager,
      url({ getQueryState: () => LEGACY_README_LINK })
    );

    expect(loaded).toBe(true);
    expect(manager.getBuildings().size).toBe(99);
  });

  it('a fragment link loads its city', () => {
    const loaded = readCityLink(
      manager,
      url({ getFragmentState: () => README_FRAGMENT_LINK })
    );

    expect(loaded).toBe(true);
    expect(manager.getBuildings().size).toBe(99);
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

    expect(manager.getBuildings().size).toBe(99);
  });

  it('an empty URL does nothing', () => {
    expect(readCityLink(manager, url({}))).toBe(false);
    expect(manager.getBuildings().size).toBe(0);
    expect(cleared).toEqual([]);
  });

  describe('writeCityLink', () => {
    it('an empty city has no link', () => {
      expect(writeCityLink(manager)).toBe(null);
    });

    it('a legacy city is written back compressed', () => {
      readCityLink(manager, url({ getQueryState: () => LEGACY_README_LINK }));

      expect(writeCityLink(manager)).toBe(README_FRAGMENT_LINK);
    });
  });
});
