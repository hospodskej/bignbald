import type { HttpContext } from '@adonisjs/core/http'
import { weightValidator } from '#validators/user'

export default class WeightsController {
  /** GET /account/weights */
  async index({ auth }: HttpContext) {
    const rows = await auth.getUserOrFail().related('weightLogs').query().orderBy('date', 'asc')
    return rows.map((w) => ({ date: w.date, kg: w.kg }))
  }

  /** PUT /account/weights: one entry per day, saving again overwrites it. */
  async update({ auth, request }: HttpContext) {
    const { date, kg } = await request.validateUsing(weightValidator)
    await auth.getUserOrFail().related('weightLogs').updateOrCreate({ date }, { kg })
    return { ok: true }
  }
}
