import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app';
import { connect } from '../src/db/client';

let app: ReturnType<typeof createApp>;
beforeAll(async () => {
  app = createApp(await connect(':memory:'));
});

const call = async (method: string, path: string, body?: unknown, token?: string) => {
  const res = await app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), 'x-forwarded-for': Math.random().toString() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: (await res.json()) as any };
};

const profile = (hero = 'brawler', name = 'Pavel') => ({ hero, name, weightKg: 80, goal: 'bigger' });
const workout = (id: string, kg: number, reps = 8, exerciseId = 'bench-press') => ({
  id, hero: 'brawler', dayId: 'push', startedAt: Date.now() - 3600_000, finishedAt: Date.now(),
  entries: [{ slot: 1, exerciseId, sets: [{ kg, reps, done: true }, { kg, reps: reps - 2, done: true }] }],
});

describe('accounts', () => {
  let token = '';
  it('signs up', async () => {
    const r = await call('POST', '/auth/signup', { email: 'Pavel@Example.com', username: 'Pavel_lifts', password: 'supersecret', profile: profile() });
    expect(r.status).toBe(201);
    expect(r.json.user).toMatchObject({ email: 'pavel@example.com', username: 'pavel_lifts' });
    token = r.json.token;
  });
  it('rejects a duplicate email and a taken username', async () => {
    expect((await call('POST', '/auth/signup', { email: 'pavel@example.com', username: 'other1', password: 'supersecret', profile: profile() })).json.error).toMatch(/email/);
    expect((await call('POST', '/auth/signup', { email: 'x@example.com', username: 'pavel_lifts', password: 'supersecret', profile: profile() })).json.error).toMatch(/username/);
  });
  it('validates input with readable messages', async () => {
    const r = await call('POST', '/auth/signup', { email: 'nope', username: 'ab', password: 'short', profile: profile() });
    expect(r.status).toBe(400);
    expect(typeof r.json.error).toBe('string');
  });
  it('logs in only with the right password', async () => {
    expect((await call('POST', '/auth/login', { email: 'pavel@example.com', password: 'wrongpass' })).status).toBe(401);
    const ok = await call('POST', '/auth/login', { email: 'pavel@example.com', password: 'supersecret' });
    expect(ok.status).toBe(200);
    expect(ok.json.profile.name).toBe('Pavel');
  });
  it('protects /me', async () => {
    expect((await call('GET', '/me')).status).toBe(401);
    expect((await call('GET', '/me', undefined, 'garbage')).status).toBe(401);
    const me = await call('GET', '/me', undefined, token);
    expect(me.json.user.username).toBe('pavel_lifts');
  });
  it('updates the profile', async () => {
    expect((await call('PUT', '/me/profile', { ...profile('acrobat'), age: 25 }, token)).status).toBe(200);
    expect((await call('GET', '/me', undefined, token)).json.profile).toMatchObject({ hero: 'acrobat', age: 25 });
  });
  it('stores body weight per day', async () => {
    await call('PUT', '/me/weights', { date: '2026-11-01', kg: 80 }, token);
    await call('PUT', '/me/weights', { date: '2026-11-01', kg: 80.4 }, token);
    expect((await call('GET', '/me/weights', undefined, token)).json).toEqual([{ date: '2026-11-01', kg: 80.4 }]);
  });
});

describe('workouts, leaderboard and duels', () => {
  let a = '', b = '';
  beforeAll(async () => {
    a = (await call('POST', '/auth/signup', { email: 'a@example.com', username: 'brawly', password: 'supersecret', profile: profile('brawler', 'A') })).json.token;
    b = (await call('POST', '/auth/signup', { email: 'b@example.com', username: 'flippy', password: 'supersecret', profile: profile('acrobat', 'B') })).json.token;
  });
  it('saves a workout once even if the phone retries', async () => {
    expect((await call('POST', '/me/workouts', workout('w-aaaa-1', 100), a)).status).toBe(201);
    expect((await call('POST', '/me/workouts', workout('w-aaaa-1', 100), a)).json.duplicate).toBe(true);
    const list = (await call('GET', '/me/workouts', undefined, a)).json;
    expect(list).toHaveLength(1);
    expect(list[0].entries[0].sets).toHaveLength(2);
  });
  it('rejects unbelievable weights and unknown exercises', async () => {
    expect((await call('POST', '/me/workouts', workout('w-cheat-1', 900), a)).status).toBe(400);
    expect((await call('POST', '/me/workouts', workout('w-bad-1', 50, 8, 'flying-kick'), a)).status).toBe(400);
  });
  it('ranks players by their best set with 5+ reps', async () => {
    await call('POST', '/me/workouts', workout('w-bbbb-1', 110), b);
    await call('POST', '/me/workouts', workout('w-bbbb-2', 150, 3), b); // 3 reps: doesn't count
    const board = (await call('GET', '/leaderboard/bench-press', undefined, a)).json;
    expect(board.rows.map((r: any) => [r.username, r.kg])).toEqual([['flippy', 110], ['brawly', 100]]);
    expect(board.rows[1].you).toBe(true);
    expect(board.rows[0].rankLabel).toMatch(/Platinum/);
  });
  it('duels another player', async () => {
    const d = (await call('GET', '/duel/flippy', undefined, a)).json;
    expect(d.rival).toEqual({ username: 'flippy', hero: 'acrobat' });
    expect(d.lifts[0]).toMatchObject({ id: 'bench-press', you: 100, them: 110 });
    expect(d.score.them).toBeGreaterThan(0);
    expect((await call('GET', '/duel/nobody', undefined, a)).status).toBe(404);
  });
  it('finds players by username', async () => {
    expect((await call('GET', '/players?q=fl', undefined, a)).json).toEqual([{ username: 'flippy', hero: 'acrobat' }]);
  });
});
