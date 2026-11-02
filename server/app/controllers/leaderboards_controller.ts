import type { HttpContext } from '@adonisjs/core/http'
import { EXERCISES } from '#shared/exercises'
import { rankFor } from '#shared/ranks'
import { bestsFor } from '#services/competition_service'

export default class LeaderboardsController {
  /** GET /leaderboards/:exerciseId: top 50, plus where you stand if you're lower. */
  async show({ auth, params, response }: HttpContext) {
    const exercise = EXERCISES[params.exerciseId]
    if (!exercise) return response.notFound({ errors: [{ message: 'Unknown exercise' }] })
    const me = auth.getUserOrFail().id

    const bests = await bestsFor(exercise.id)
    const rows = bests.map((row, i) => {
      const rank = rankFor(exercise, Number(row.kg))
      return {
        position: i + 1,
        username: row.username,
        hero: row.hero,
        kg: Number(row.kg),
        rankLabel: rank.label,
        rankColor: rank.tier.color,
        you: row.userId === me,
      }
    })
    const top = rows.slice(0, 50)
    const mine = rows.find((r) => r.you)
    return { total: rows.length, rows: top, me: mine && !top.includes(mine) ? mine : null }
  }
}
