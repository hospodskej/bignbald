import type { HttpContext } from '@adonisjs/core/http'
import FoodLog from '#models/food_log'
import { dayValidator, foodLogValidator, mealPlanValidator } from '#validators/food'

/** Food log, eaten meals + water per day, and the weekly meal plan. */
export default class NutritionController {
  /** GET /account/food-logs: the last year, oldest first. */
  async foodLogs({ auth }: HttpContext) {
    const since = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10)
    const rows = await auth
      .getUserOrFail()
      .related('foodLogs')
      .query()
      .where('date', '>=', since)
      .orderBy('date')
      .orderBy('createdAt')
    return rows.map((f) => ({ id: f.id, date: f.date, foodId: f.foodId, grams: f.grams }))
  }

  /** POST /account/food-logs: safe to retry, the same id is stored once. */
  async addFood({ auth, request, response }: HttpContext) {
    const data = await request.validateUsing(foodLogValidator)
    const user = auth.getUserOrFail()
    const existing = await FoodLog.find(data.id)
    if (existing) {
      if (existing.userId !== user.id)
        return response.conflict({ errors: [{ message: 'Id clash' }] })
      return { ok: true, duplicate: true }
    }
    await user.related('foodLogs').create(data)
    response.status(201)
    return { ok: true }
  }

  /** DELETE /account/food-logs/:id: already gone counts as done. */
  async removeFood({ auth, params }: HttpContext) {
    await auth.getUserOrFail().related('foodLogs').query().where('id', params.id).delete()
    return { ok: true }
  }

  /** GET /account/days: eaten meals and water for the last year. */
  async days({ auth }: HttpContext) {
    const since = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10)
    const rows = await auth
      .getUserOrFail()
      .related('dayLogs')
      .query()
      .where('date', '>=', since)
      .orderBy('date')
    return rows.map((d) => ({ date: d.date, mealsEaten: d.mealsEaten, waterMl: d.waterMl }))
  }

  /** PUT /account/days/:date: replaces that day's meals + water. */
  async updateDay({ auth, request }: HttpContext) {
    const { params, mealsEaten, waterMl } = await request.validateUsing(dayValidator)
    await auth
      .getUserOrFail()
      .related('dayLogs')
      .updateOrCreate({ date: params.date }, { mealsEaten, waterMl })
    return { ok: true }
  }

  /** GET /account/meal-plan: plan is null until the app has saved one. */
  async mealPlan({ auth }: HttpContext) {
    const plan = await auth.getUserOrFail().related('mealPlan').query().first()
    return plan
      ? { plan: plan.plan, groceryChecked: plan.groceryChecked }
      : { plan: null, groceryChecked: [] }
  }

  /** PUT /account/meal-plan */
  async updateMealPlan({ auth, request }: HttpContext) {
    const { plan, groceryChecked } = await request.validateUsing(mealPlanValidator)
    await auth.getUserOrFail().related('mealPlan').updateOrCreate({}, { plan, groceryChecked })
    return { ok: true }
  }
}
