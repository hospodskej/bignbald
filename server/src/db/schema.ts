import { boolean, index, integer, jsonb, pgTable, primaryKey, real, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/** One row per account. Passwords are only ever stored as scrypt hashes. */
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email), uniqueIndex('users_username_idx').on(t.username)],
);

/**
 * The app's profile (name, hero, body stats, goal, diet style…) as JSON.
 * It changes shape often while we co-develop, so it isn't split into columns yet.
 * `hero` is copied out because leaderboards need it.
 */
export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  hero: text('hero').notNull(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A finished workout. The id comes from the phone so retries can't create duplicates. */
export const workouts = pgTable(
  'workouts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    hero: text('hero').notNull(),
    dayId: text('day_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('workouts_user_idx').on(t.userId, t.finishedAt)],
);

/** Every logged set: this is what ranks, leaderboards and duels are computed from. */
export const sets = pgTable(
  'sets',
  {
    id: serial('id').primaryKey(),
    workoutId: text('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id').notNull(),
    slot: integer('slot').notNull(),
    position: integer('position').notNull(),
    kg: real('kg').notNull(),
    reps: integer('reps').notNull(),
    done: boolean('done').notNull(),
  },
  (t) => [index('sets_exercise_idx').on(t.exerciseId, t.kg), index('sets_user_idx').on(t.userId)],
);

export const weightLogs = pgTable(
  'weight_logs',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // YYYY-MM-DD
    kg: real('kg').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] })],
);
