import { FoodLogSchema } from '#database/schema'

export default class FoodLog extends FoodLogSchema {
  /** The id comes from the phone. */
  static selfAssignPrimaryKey = true
}
