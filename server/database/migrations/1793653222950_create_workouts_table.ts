import { BaseSchema } from '@adonisjs/lucid/schema'

/** A finished workout. The id is made by the phone, so a retried upload can't create a duplicate. */
export default class extends BaseSchema {
  protected tableName = 'workouts'

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
      table.string('hero', 20).notNullable()
      table.string('day_id', 40).notNullable()
      table.timestamp('started_at').notNullable()
      table.timestamp('finished_at').notNullable()
      table.timestamp('created_at').notNullable()
      table.index(['user_id', 'finished_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
