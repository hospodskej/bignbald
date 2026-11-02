import { useEffect, useRef } from 'react';

import { api, ApiError, setApiToken } from './api';
import { accountOf, useStore } from './store';
import type { OutboxItem } from './types';

/**
 * Sends the outbox (lib/outbox.ts) to the server, oldest first, one at a time.
 * - Offline / server down: stop and try again in 30 s. Nothing is lost.
 * - Login expired (401): sign out; the auth screen takes over.
 * - Rejected (other 4xx): drop that item so it can't block the queue forever.
 */
export function useServerSync() {
  const { state, actions } = useStore();
  const account = accountOf(state);
  const signedIn = account.status === 'registered' && Boolean(account.token);
  setApiToken(signedIn ? account.token! : null);

  // Always the latest queue, without restarting the sender on every change.
  const outbox = state.outbox ?? [];
  const queue = useRef<OutboxItem[]>(outbox);
  useEffect(() => {
    queue.current = outbox;
  });
  const sending = useRef(false);
  const hasWork = outbox.length > 0;

  useEffect(() => {
    if (!signedIn || !hasWork) return;
    let stopped = false;
    const flush = async () => {
      if (sending.current) return;
      sending.current = true;
      const done = new Set<string>();
      try {
        while (!stopped) {
          const item = queue.current.find((x) => !done.has(x.id));
          if (!item) return;
          try {
            await api(item.method, item.path, item.body);
          } catch (e) {
            if (!(e instanceof ApiError) || e.offline || e.status >= 500) return; // try again later
            if (e.status === 401) return actions.signOut();
            console.warn(`Server rejected ${item.method} ${item.path}: ${e.message}`);
          }
          done.add(item.id);
          actions.markSent(item.id);
        }
      } finally {
        sending.current = false;
      }
    };
    flush();
    const timer = setInterval(flush, 30_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [signedIn, hasWork, actions]);
}
