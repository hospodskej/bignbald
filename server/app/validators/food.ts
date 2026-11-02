import vine from '@vinejs/vine'
import { FOODS } from '#shared/foods'

const date = () => vine.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']

export const foodLogValidator = vine.create({
  id: vine.string().minLength(6).maxLength(64),
  date: date(),
  foodId: vine.enum(Object.keys(FOODS)),
  grams: vine.number().min(1).max(5000),
})

export const dayValidator = vine.create({
  params: vine.object({ date: date() }),
  mealsEaten: vine.array(vine.enum(MEAL_SLOTS)).maxLength(4),
  waterMl: vine.number().withoutDecimals().min(0).max(20000),
})

/** Plan: day index "0".."6" -> slot -> recipe id. Kept loose; the app owns the recipes. */
export const mealPlanValidator = vine.create({
  plan: vine.record(vine.record(vine.string().maxLength(60))),
  groceryChecked: vine.array(vine.string().maxLength(60)).maxLength(200),
})
