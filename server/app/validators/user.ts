import vine from '@vinejs/vine'
import { HERO_IDS } from '#shared/heroes'

const email = () => vine.string().trim().toLowerCase().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(72)
const hero = () => vine.enum(HERO_IDS)

/**
 * The app's profile object. Name and hero are checked; the other fields
 * (body stats, goal, diet style…) are stored as sent.
 */
export const profileShape = () =>
  vine
    .object({ hero: hero(), name: vine.string().trim().minLength(1).maxLength(24) })
    .allowUnknownProperties()

export const signupValidator = vine.create({
  email: email().unique({ table: 'users', column: 'email' }),
  username: vine
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,20}$/)
    .unique({ table: 'users', column: 'username' }),
  password: password(),
  profile: profileShape(),
})

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

export const profileValidator = vine.create({ profile: profileShape() })

export const weightValidator = vine.create({
  date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kg: vine.number().min(30).max(300),
})

/** Change username and/or email. Your own current values don't count as "taken". */
export const identityValidator = vine.withMetaData<{ userId: number }>().create({
  email: email()
    .unique({
      table: 'users',
      column: 'email',
      filter: (db, _value, field) => {
        db.whereNot('id', field.meta.userId)
      },
    })
    .optional(),
  username: vine
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,20}$/)
    .unique({
      table: 'users',
      column: 'username',
      filter: (db, _value, field) => {
        db.whereNot('id', field.meta.userId)
      },
    })
    .optional(),
})
