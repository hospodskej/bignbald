import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  /** POST /auth/signup: create the account and its profile, return a login token. */
  async store({ request, response, serialize }: HttpContext) {
    const { email, username, password, profile } = await request.validateUsing(signupValidator)

    const user = await db.transaction(async (trx) => {
      const created = await User.create({ email, username, password }, { client: trx })
      await created.related('profile').create({ hero: profile.hero, data: profile })
      return created
    })
    const token = await User.accessTokens.create(user)

    response.status(201)
    return serialize({
      user: UserTransformer.transform(user),
      profile,
      token: token.value!.release(),
    })
  }
}
