import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Profile from '#models/profile'
import Workout from '#models/workout'
import WeightLog from '#models/weight_log'
import FoodLog from '#models/food_log'
import DayLog from '#models/day_log'
import MealPlan from '#models/meal_plan'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /** Login tokens: stored hashed, revoked on log out, expire after 30 days. */
  static accessTokens = DbAccessTokensProvider.forModel(User, { expiresIn: '30 days' })
  declare currentAccessToken?: AccessToken

  @hasOne(() => Profile)
  declare profile: HasOne<typeof Profile>

  @hasMany(() => Workout)
  declare workouts: HasMany<typeof Workout>

  @hasMany(() => WeightLog)
  declare weightLogs: HasMany<typeof WeightLog>

  @hasMany(() => FoodLog)
  declare foodLogs: HasMany<typeof FoodLog>

  @hasMany(() => DayLog)
  declare dayLogs: HasMany<typeof DayLog>

  @hasOne(() => MealPlan)
  declare mealPlan: HasOne<typeof MealPlan>
}
