/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import { VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Human-readable error messages the app can show as-is.
 */
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  'email.email': 'Enter a valid email',
  'email.database.unique': 'That email already has an account',
  'username.regex': 'Username: 3-20 letters, numbers, _ or .',
  'username.database.unique': 'That username is taken',
  'password.minLength': 'Password needs at least 8 characters',
  'profile.name.minLength': 'Tell us what to call you',
  'required': 'The {{ field }} field is required',
})
