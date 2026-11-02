import vine from '@vinejs/vine'
import { EXERCISES } from '#shared/exercises'
import { HERO_IDS } from '#shared/heroes'

export const workoutValidator = vine.create({
  id: vine.string().minLength(6).maxLength(64),
  hero: vine.enum(HERO_IDS),
  dayId: vine.string().maxLength(40),
  startedAt: vine.number().withoutDecimals(),
  finishedAt: vine.number().withoutDecimals(),
  entries: vine
    .array(
      vine.object({
        slot: vine.number().withoutDecimals().min(0).max(30),
        exerciseId: vine.enum(Object.keys(EXERCISES)),
        sets: vine
          .array(
            vine.object({
              kg: vine.number().min(0).max(1000),
              reps: vine.number().withoutDecimals().min(0).max(100),
              done: vine.boolean(),
            })
          )
          .maxLength(20),
      })
    )
    .maxLength(20),
})
