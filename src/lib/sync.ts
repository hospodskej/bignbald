import { useEffect, useRef } from 'react';

import { api, ApiError, setApiToken } from './api';
import { accountOf, useStore } from './store';
import type { Session } from './types';
import { setKg, setReps } from './workout';

/** The app's session -> the API's workout shape (numbers instead of the text the inputs hold). */
const toUpload = (s: Session) => ({
  id: s.id,
  hero: s.hero,
  dayId: s.dayId,
  startedAt: s.startedAt,
  finishedAt: s.finishedAt ?? s.startedAt,
  entries: s.entries.map((e) => ({
    slot: e.slot,
    exerciseId: e.exerciseId,
    sets: e.sets.map((x) => ({ kg: setKg(x), reps: setReps(x), done: x.done })),
  })),
});

/**
 * Keeps the server in step with what happens on the phone:
 * finished workouts, profile edits and body weight. Works offline too:
 * unsent workouts wait in a queue and go up when the server is reachable.
 */
export function useServerSync() {
  const { state, actions } = useStore();
  const account = accountOf(state);
  const signedIn = account.status === 'registered' && Boolean(account.token);
  setApiToken(signedIn ? account.token! : null);

  // Workouts: upload the queue, retry every 30 s while anything is waiting.
  const pending = (state.pendingUploads ?? []).join(',');
  useEffect(() => {
    if (!signedIn || !pending) return;
    let stop = false;
    const flush = async () => {
      for (const id of pending.split(',')) {
        const session = state.history.find((s) => s.id === id);
        if (!session) {
          actions.markUploaded(id);
          continue;
        }
        try {
          await api('POST', '/account/workouts', toUpload(session));
          actions.markUploaded(id);
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) return actions.signOut();
          // Rejected by the server (e.g. failed validation): don't retry forever.
          if (e instanceof ApiError && e.status >= 400 && e.status < 500) actions.markUploaded(id);
          else return; // offline: try again later
        }
        if (stop) return;
      }
    };
    flush();
    const t = setInterval(flush, 30_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
    // state.history is read inside; the queue string is what should trigger a run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, pending]);

  // Profile: push edits after a short pause.
  const profileJson = JSON.stringify(state.profile);
  const lastProfile = useRef(profileJson);
  useEffect(() => {
    if (!signedIn || profileJson === lastProfile.current) return;
    const t = setTimeout(() => {
      api('PUT', '/account/profile', { profile: JSON.parse(profileJson) })
        .then(() => (lastProfile.current = profileJson))
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [signedIn, profileJson]);

  // Body weight: send the newest entry when it changes.
  const latest = [...state.weightLog].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const latestKey = latest ? `${latest.date}:${latest.kg}` : '';
  const lastWeight = useRef(latestKey);
  useEffect(() => {
    if (!signedIn || !latest || latestKey === lastWeight.current) return;
    api('PUT', '/account/weights', latest)
      .then(() => (lastWeight.current = latestKey))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, latestKey]);
}
