import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class PlayersController {
  /** GET /players?q=pav: find people to duel by username. */
  async index({ request }: HttpContext) {
    const q = String(request.input('q', ''))
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '')
    if (q.length < 2) return []
    const users = await User.query().whereLike('username', `${q}%`).preload('profile').limit(10)
    return users.map((u) => ({ username: u.username, hero: u.profile?.hero ?? 'brawler' }))
  }
}
