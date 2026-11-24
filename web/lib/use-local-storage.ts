"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// localStorage-backed state that is safe for server rendering and stays in
// sync across tabs. Storage may be unavailable (private mode, blocked site
// data); every access is guarded and the default is used instead.

const EVENT = "clindex-local-storage";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useLocalStorage<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
    // `fallback` is intentionally excluded: callers pass literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = (() => {
        const r = read(key);
        if (r === null) return fallback;
        try {
          return JSON.parse(r) as T;
        } catch {
          return fallback;
        }
      })();
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, set];
}
