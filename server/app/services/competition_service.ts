import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Workout from '#models/workout'

/** Sets with fewer reps than this don't count for ranks (same rule as the app). */
export const MIN_REPS = 5

type Best = { userId: number; username: string; hero: string; kg: number }

/** Everyone's best weight on one exercise, highest first. */
export async function bestsFor(exerciseId: string): Promise<Best[]> {
  return db
    .from('workout_sets as s')
    .join('users as u', 'u.id', 's.user_id')
    .join('profiles as p', 'p.user_id', 'u.id')
    .where('s.exercise_id', exerciseId)
    .where('s.reps', '>=', MIN_REPS)
    .groupBy('u.id', 'u.username', 'p.hero')
    .select('u.id as userId', 'u.username', 'p.hero')
    .max('s.kg as kg')
    .orderBy('kg', 'desc')
}

/** One player's last 7 days and best lifts, for duels. */
export async function summary(userId: number) {
  const recent = await Workout.query()
    .where('userId', userId)
    .where('finishedAt', '>=', DateTime.now().minus({ days: 7 }).toSQL()!)
    .preload('sets')
  const sets = recent.flatMap((w) => w.sets)
  const best: { exerciseId: string; kg: number }[] = await db
    .from('workout_sets')
    .where('user_id', userId)
    .where('reps', '>=', MIN_REPS)
    .groupBy('exercise_id')
    .select('exercise_id as exerciseId')
    .max('kg as kg')

  return {
    week: {
      workouts: recent.length,
      sets: sets.length,
      volume: Math.round(sets.reduce((v, s) => v + s.kg * s.reps, 0)),
    },
    best: Object.fromEntries(best.map((b) => [b.exerciseId, Number(b.kg)])) as Record<
      string,
      number
    >,
  }
}
