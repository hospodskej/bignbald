import { BaseSchema } from '@adonisjs/lucid/schema'

/** The weekly meal plan and shopping-list ticks, one per user. */
export default class extends BaseSchema {
  protected tableName = 'meal_plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.json('plan').notNullable()
      table.json('grocery_checked').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
