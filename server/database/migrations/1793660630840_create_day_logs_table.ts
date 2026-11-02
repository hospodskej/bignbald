import { BaseSchema } from '@adonisjs/lucid/schema'

/** Per user per day: which planned meals were eaten and how much water. */
export default class extends BaseSchema {
  protected tableName = 'day_logs'

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
      table.string('date', 10).notNullable()
      table.json('meals_eaten').notNullable()
      table.integer('water_ml').notNullable().defaultTo(0)
      table.unique(['user_id', 'date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
