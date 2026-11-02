import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import { identityValidator, profileValidator } from '#validators/user'
import Profile from '#models/profile'

export default class ProfileController {
  /** GET /account/profile */
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const profile = await Profile.findBy('userId', user.id)
    return serialize({ user: UserTransformer.transform(user), profile: profile?.data ?? null })
  }

  /** PUT /account/profile: replace the profile (the app sends the whole object). */
  async update({ auth, request }: HttpContext) {
    const { profile } = await request.validateUsing(profileValidator)
    const user = auth.getUserOrFail()
    await user.related('profile').updateOrCreate({}, { hero: profile.hero, data: profile })
    return { ok: true }
  }

  /** PUT /account/identity: change username and/or email. */
  async updateIdentity({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const changes = await request.validateUsing(identityValidator, { meta: { userId: user.id } })
    user.merge(changes)
    await user.save()
    return serialize({ user: UserTransformer.transform(user) })
  }
}
