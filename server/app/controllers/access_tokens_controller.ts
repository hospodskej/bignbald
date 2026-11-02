import User from '#models/user'
import Profile from '#models/profile'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class AccessTokensController {
  /** POST /auth/login: check email + password, return a token and the saved profile. */
  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const profile = await Profile.findBy('userId', user.id)
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      profile: profile?.data ?? null,
      token: token.value!.release(),
    })
  }

  /** POST /account/logout: revoke the token used for this request. */
  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }
    return { message: 'Logged out' }
  }
}
