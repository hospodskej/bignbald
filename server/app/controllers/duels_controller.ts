import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { EXERCISES } from '#shared/exercises'
import { rankFor } from '#shared/ranks'
import { summary } from '#services/competition_service'

export default class DuelsController {
  /** GET /duels/:username: you vs them over the last 7 days, plus every lift you've both logged. */
  async show({ auth, params, response }: HttpContext) {
    const them = await User.query()
      .where('username', String(params.username).toLowerCase())
      .preload('profile')
      .first()
    if (!them) return response.notFound({ errors: [{ message: 'No player with that username' }] })

    const [a, b] = await Promise.all([summary(auth.getUserOrFail().id), summary(them.id)])
    const rows = [
      { label: 'Workouts', you: a.week.workouts, them: b.week.workouts },
      { label: 'Sets', you: a.week.sets, them: b.week.sets },
      { label: 'Volume (kg)', you: a.week.volume, them: b.week.volume },
    ]
    const lifts = Object.keys(a.best)
      .filter((id) => id in b.best && id in EXERCISES)
      .map((id) => {
        const e = EXERCISES[id]
        const youRank = rankFor(e, a.best[id])
        const themRank = rankFor(e, b.best[id])
        return {
          id,
          name: e.name,
          you: a.best[id],
          them: b.best[id],
          youRank: youRank.label,
          youColor: youRank.tier.color,
          themRank: themRank.label,
          themColor: themRank.tier.color,
        }
      })
    const score = [...rows, ...lifts].reduce(
      (s, x) => ({
        you: s.you + (x.you > x.them ? 1 : 0),
        them: s.them + (x.them > x.you ? 1 : 0),
      }),
      { you: 0, them: 0 }
    )
    return {
      rival: { username: them.username, hero: them.profile?.hero ?? 'brawler' },
      rows,
      lifts,
      score,
    }
  }
}
