import { WorkoutSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import WorkoutSet from '#models/workout_set'

export default class Workout extends WorkoutSchema {
  /** The id comes from the phone. */
  static selfAssignPrimaryKey = true

  @hasMany(() => WorkoutSet)
  declare sets: HasMany<typeof WorkoutSet>
}
