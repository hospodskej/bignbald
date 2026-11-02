import { BaseSchema } from '@adonisjs/lucid/schema'

/** Usernames are public (leaderboards, duels) and unique. */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('username', 20).notNullable().defaultTo('').unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('username')
    })
  }
}
