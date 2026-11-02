import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the API lives.
 * 1. EXPO_PUBLIC_API_URL if set (production, or a custom server).
 * 2. Otherwise the computer running the dev server, on port 3333:
 *    the browser's own host on web, Expo's dev host (your PC's Wi-Fi IP) on a phone.
 */
export function apiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host =
    Platform.OS === 'web'
      ? globalThis.location?.hostname ?? 'localhost'
      : (Constants.expoConfig?.hostUri ?? 'localhost').split(':')[0];
  return `http://${host}:3333/api/v1`;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
  /** No connection at all (server down, offline). */
  get offline() {
    return this.status === 0;
  }
}

let authToken: string | null = null;
export const setApiToken = (t: string | null) => {
  authToken = t;
};

/** JSON request. Unwraps AdonisJS's { data } envelope and turns errors into readable messages. */
export async function api<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiBase() + path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Is it running?", 0);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.errors?.[0]?.message ?? json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status === 400 && /credentials/i.test(message) ? 'Wrong email or password' : message, res.status);
  }
  return (json && typeof json === 'object' && 'data' in json ? json.data : json) as T;
}
