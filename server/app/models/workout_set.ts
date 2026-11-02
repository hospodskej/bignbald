import { WorkoutSetSchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'

export default class WorkoutSet extends WorkoutSetSchema {
  /** SQLite stores booleans as 0/1. */
  @column({ consume: (v: unknown) => Boolean(v) })
  declare done: boolean
}
