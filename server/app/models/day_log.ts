import { DayLogSchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'
import { jsonColumn } from '#models/profile'

export default class DayLog extends DayLogSchema {
  @column(jsonColumn)
  declare mealsEaten: string[]
}
