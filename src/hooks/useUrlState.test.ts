// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUrlState } from './useUrlState';
import { URL_LEGACY_QUERY_INDEX } from '../utils/constants';

describe('useUrlState', () => {
  const BASE64_CITY = 'DXZ6DXZ3DXl3';

  const visit = (url: string) => window.history.replaceState({}, '', url);
  const urlState = () => renderHook(() => useUrlState()).result.current;

  beforeEach(() => {
    visit('/');
  });
  afterEach(cleanup);

  describe('fragments', () => {
    it('reads back whatever it just wrote', () => {
      const { getFragmentState, setFragmentState } = urlState();
      setFragmentState(BASE64_CITY);

      expect(window.location.hash).toBe(`#${BASE64_CITY}`);
      expect(getFragmentState()).toBe(BASE64_CITY);
    });

    it('is null when there is no fragment', () => {
      expect(urlState().getFragmentState()).toBe(null);
    });

    it('saving nothing wipes the fragment off the URL', () => {
      const { getFragmentState, setFragmentState } = urlState();
      setFragmentState(BASE64_CITY);
      setFragmentState(null);

      expect(window.location.hash).toBe('');
      expect(getFragmentState()).toBe(null);
    });
  });

  describe('legacy links', () => {
    it('the city is read out of the query', () => {
      visit(`/?${URL_LEGACY_QUERY_INDEX}=${BASE64_CITY}`);

      expect(urlState().getQueryState(URL_LEGACY_QUERY_INDEX)).toBe(
        BASE64_CITY
      );
    });

    it('clearing the query leaves the fragment alone', () => {
      visit(`/?${URL_LEGACY_QUERY_INDEX}=${BASE64_CITY}#${BASE64_CITY}`);
      const { getQueryState, clearQueryState, getFragmentState } = urlState();
      clearQueryState(URL_LEGACY_QUERY_INDEX);

      expect(window.location.search).toBe('');
      expect(getQueryState(URL_LEGACY_QUERY_INDEX)).toBe(null);
      expect(getFragmentState()).toBe(BASE64_CITY);
    });
  });
});
