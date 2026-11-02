import { BaseSchema } from '@adonisjs/lucid/schema'

/** One body-weight entry per user per day. */
export default class extends BaseSchema {
  protected tableName = 'weight_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('date', 10).notNullable() // YYYY-MM-DD
      table.float('kg').notNullable()
      table.unique(['user_id', 'date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
