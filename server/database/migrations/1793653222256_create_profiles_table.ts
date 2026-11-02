import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The app's profile (name, hero, body stats, goal, diet…) is stored as JSON
 * because it changes shape often while we build. `hero` gets its own column
 * since leaderboards need it.
 */
export default class extends BaseSchema {
  protected tableName = 'profiles'

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
      table.string('hero', 20).notNullable()
      table.json('data').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
