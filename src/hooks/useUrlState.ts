import { useCallback } from 'react';

export function useUrlState() {
  const setUrlState = useCallback((index: string, url: string | null) => {
    const urlInterface = new URL(window.location.href);
    if (url) {
      urlInterface.searchParams.set(index, url);
    } else {
      urlInterface.searchParams.delete(index);
    }
    window.history.replaceState({}, '', urlInterface.toString());
  }, []);

  const getUrlState = useCallback((index: string) => {
    return new URLSearchParams(window.location.search).get(index);
  }, []);

  return { setUrlState, getUrlState };
}
