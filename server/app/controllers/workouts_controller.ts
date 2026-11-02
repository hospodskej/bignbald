import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Workout from '#models/workout'
import { EXERCISES } from '#shared/exercises'
import { workoutValidator } from '#validators/workout'

/** Anti-cheat: nothing above 3.5x the Platinum weight for that lift. */
const CHEAT_FACTOR = 3.5

export default class WorkoutsController {
  /** GET /account/workouts: everything, in the app's shape (for logging in on a new phone). */
  async index({ auth }: HttpContext) {
    const workouts = await auth
      .getUserOrFail()
      .related('workouts')
      .query()
      .preload('sets', (q) => q.orderBy('slot').orderBy('position'))
      .orderBy('finishedAt', 'desc')
      .limit(500)

    return workouts.map((w) => {
      const slots = [...new Set(w.sets.map((s) => s.slot))]
      return {
        id: w.id,
        hero: w.hero,
        dayId: w.dayId,
        startedAt: w.startedAt.toMillis(),
        finishedAt: w.finishedAt.toMillis(),
        entries: slots.map((slot) => {
          const sets = w.sets.filter((s) => s.slot === slot)
          return {
            slot,
            exerciseId: sets[0].exerciseId,
            sets: sets.map((s) => ({ kg: String(s.kg), reps: String(s.reps), done: s.done })),
          }
        }),
      }
    })
  }

  /** POST /account/workouts: upload a finished workout. Safe to retry: same id is stored once. */
  async store({ auth, request, response }: HttpContext) {
    const data = await request.validateUsing(workoutValidator)
    const user = auth.getUserOrFail()

    const tooHeavy = data.entries.find((e) =>
      e.sets.some((s) => s.kg > EXERCISES[e.exerciseId].platinumKg * CHEAT_FACTOR)
    )
    if (tooHeavy) {
      return response.unprocessableEntity({
        errors: [
          {
            message: `That ${EXERCISES[tooHeavy.exerciseId].name.toLowerCase()} weight is not believable`,
          },
        ],
      })
    }

    const existing = await Workout.find(data.id)
    if (existing) {
      if (existing.userId !== user.id)
        return response.conflict({ errors: [{ message: 'Workout id clash' }] })
      return { ok: true, duplicate: true }
    }

    await db.transaction(async (trx) => {
      const workout = await Workout.create(
        {
          id: data.id,
          userId: user.id,
          hero: data.hero,
          dayId: data.dayId,
          startedAt: DateTime.fromMillis(data.startedAt),
          finishedAt: DateTime.fromMillis(data.finishedAt),
        },
        { client: trx }
      )
      // Only finished sets count for anything, so only those are stored.
      await workout.related('sets').createMany(
        data.entries.flatMap((e) =>
          e.sets
            .filter((s) => s.done)
            .map((s, position) => ({
              userId: user.id,
              exerciseId: e.exerciseId,
              slot: e.slot,
              position,
              kg: s.kg,
              reps: s.reps,
              done: true,
            }))
        )
      )
    })
    response.status(201)
    return { ok: true }
  }

  /** DELETE /account/workouts: "Delete my workouts and logs" in the app. */
  async destroyAll({ auth }: HttpContext) {
    await auth.getUserOrFail().related('workouts').query().delete()
    return { ok: true }
  }
}
