import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** What the app sees about an account. Never includes the password hash. */
export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, ['id', 'email', 'username', 'createdAt'])
  }
}
