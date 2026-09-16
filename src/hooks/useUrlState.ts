import { useCallback } from 'react';

function readFragment() {
  const frag = window.location.hash.replace(/^#/, '');
  try {
    return decodeURIComponent(frag);
  } catch {
    // ???
    return frag;
  }
}

export function useUrlState() {
  const getFragmentState = useCallback(() => readFragment() || null, []);

  const setFragmentState = useCallback((state: string | null) => {
    const urlInterface = new URL(window.location.href);
    urlInterface.hash = state ?? '';
    window.history.replaceState({}, '', urlInterface.toString());
  }, []);

  // Queries (everything aftere the ?) are legacy and not supported anymore, so this is read-and-clear-only.
  const getQueryState = useCallback(
    (index: string) => new URLSearchParams(window.location.search).get(index),
    []
  );

  const clearQueryState = useCallback((index: string) => {
    const urlInterface = new URL(window.location.href);
    if (!urlInterface.searchParams.has(index)) {
      return;
    }
    urlInterface.searchParams.delete(index);
    window.history.replaceState({}, '', urlInterface.toString());
  }, []);

  return { getFragmentState, setFragmentState, getQueryState, clearQueryState };
}
