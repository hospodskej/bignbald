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

  /**
   * POST /auth/check: is this email / username still free? Lets the sign-up flow
   * tell you on step 1 instead of after you've filled in everything else.
   */
  async check({ request }: HttpContext) {
    const email = String(request.input('email', '')).trim().toLowerCase()
    const username = String(request.input('username', '')).trim().toLowerCase()
    const [emailTaken, usernameTaken] = await Promise.all([
      email ? User.findBy('email', email) : null,
      username ? User.findBy('username', username) : null,
    ])
    return {
      email: emailTaken ? 'That email already has an account' : null,
      username: usernameTaken ? 'That username is taken' : null,
    }
  }
}
