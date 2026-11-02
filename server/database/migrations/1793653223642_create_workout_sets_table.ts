import { BaseSchema } from '@adonisjs/lucid/schema'

/** Every logged set. Ranks, leaderboards and duels are all computed from this table. */
export default class extends BaseSchema {
  protected tableName = 'workout_sets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .string('workout_id', 64)
        .notNullable()
        .references('id')
        .inTable('workouts')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('exercise_id', 60).notNullable()
      table.integer('slot').notNullable()
      table.integer('position').notNullable()
      table.float('kg').notNullable()
      table.integer('reps').notNullable()
      table.boolean('done').notNullable()
      table.index(['exercise_id', 'kg'])
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
