import { ProfileSchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'

/** SQLite hands JSON back as text, Postgres as an object: accept both. */
export const jsonColumn = {
  prepare: (value: unknown) => JSON.stringify(value),
  consume: (value: unknown) => (typeof value === 'string' ? JSON.parse(value) : value),
}

export default class Profile extends ProfileSchema {
  @column(jsonColumn)
  declare data: Record<string, unknown>
}
