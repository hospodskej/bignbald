import { useCallback, useEffect, useState } from 'react';

import { api } from './api';

/** GET something from the API with loading / error state. Pass null to skip. */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: Boolean(path) });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    // Fetching is the external system this effect syncs with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, loading: true, error: null }));
    api<T>('GET', path)
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((e: Error) => live && setState({ data: null, error: e.message, loading: false }));
    return () => {
      live = false;
    };
  }, [path, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export interface BoardRow {
  position: number;
  username: string;
  hero: string;
  kg: number;
  rankLabel: string;
  rankColor: string;
  you: boolean;
}
export interface Leaderboard {
  total: number;
  rows: BoardRow[];
  me: BoardRow | null;
}
export interface Duel {
  rival: { username: string; hero: string };
  rows: { label: string; you: number; them: number }[];
  lifts: { id: string; name: string; you: number; them: number; youRank: string; youColor: string; themRank: string; themColor: string }[];
  score: { you: number; them: number };
}
