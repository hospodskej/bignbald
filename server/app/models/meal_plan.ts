import { MealPlanSchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'
import { jsonColumn } from '#models/profile'

export default class MealPlan extends MealPlanSchema {
  @column(jsonColumn)
  declare plan: Record<string, Record<string, string>>

  @column(jsonColumn)
  declare groceryChecked: string[]
}
