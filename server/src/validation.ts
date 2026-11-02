import { z } from 'zod';

import { EXERCISES } from '../../src/data/exercises';
import { HERO_IDS } from '../../src/data/heroes';

export const heroId = z.enum(HERO_IDS as [string, ...string[]]);
export const username = z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,20}$/, '3-20 letters, numbers, _ or .');
export const email = z.string().trim().toLowerCase().email('Enter a valid email');
export const password = z.string().min(8, 'At least 8 characters').max(200);

/** The app's profile object. Only hero is checked strictly; the rest is stored as-is (max ~8 KB). */
export const profile = z
  .object({ hero: heroId, name: z.string().trim().min(1).max(24) })
  .passthrough()
  .refine((p) => JSON.stringify(p).length < 8000, 'Profile too large');

export const signup = z.object({ email, username, password, profile });
export const login = z.object({ email, password: z.string().min(1) });

const exerciseId = z.string().refine((id) => id in EXERCISES, 'Unknown exercise');

/** Anti-cheat: nothing above 3.5x the Platinum weight for that lift, no 100-rep sets. */
const set = z.object({ kg: z.number().min(0).max(1000), reps: z.number().int().min(0).max(100), done: z.boolean() });
export const workout = z
  .object({
    id: z.string().min(6).max(64),
    hero: heroId,
    dayId: z.string().min(1).max(40),
    startedAt: z.number().int(),
    finishedAt: z.number().int(),
    entries: z.array(z.object({ slot: z.number().int().min(0).max(30), exerciseId, sets: z.array(set).max(20) })).max(20),
  })
  .refine((w) => w.finishedAt >= w.startedAt && w.finishedAt <= Date.now() + 60_000, 'Bad timestamps')
  .refine((w) => w.entries.every((e) => !(e.exerciseId in EXERCISES) || e.sets.every((s) => s.kg <= EXERCISES[e.exerciseId].platinumKg * 3.5)), 'That weight is not believable');

export const weight = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), kg: z.number().min(30).max(300) });
