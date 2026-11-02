import { BaseSchema } from '@adonisjs/lucid/schema'

/** One row per food you logged. The id comes from the phone so retries can't double-log. */
export default class extends BaseSchema {
  protected tableName = 'food_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).primary()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('date', 10).notNullable() // YYYY-MM-DD
      table.string('food_id', 60).notNullable()
      table.float('grams').notNullable()
      table.timestamp('created_at').notNullable()
      table.index(['user_id', 'date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
