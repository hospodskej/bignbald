/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.new_account.check': {
    methods: ["POST"],
    pattern: '/api/v1/auth/check',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"check"]],
    types: placeholder as Registry['auth.new_account.check']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'account.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['account.profile.show']['types'],
  },
  'account.profile.update': {
    methods: ["PUT"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['account.profile.update']['types'],
  },
  'account.profile.update_identity': {
    methods: ["PUT"],
    pattern: '/api/v1/account/identity',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"identity"]],
    types: placeholder as Registry['account.profile.update_identity']['types'],
  },
  'account.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['account.access_tokens.destroy']['types'],
  },
  'account.weights.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/weights',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"weights"]],
    types: placeholder as Registry['account.weights.index']['types'],
  },
  'account.weights.update': {
    methods: ["PUT"],
    pattern: '/api/v1/account/weights',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"weights"]],
    types: placeholder as Registry['account.weights.update']['types'],
  },
  'account.workouts.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/workouts',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"workouts"]],
    types: placeholder as Registry['account.workouts.index']['types'],
  },
  'account.workouts.store': {
    methods: ["POST"],
    pattern: '/api/v1/account/workouts',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"workouts"]],
    types: placeholder as Registry['account.workouts.store']['types'],
  },
  'account.workouts.destroy_all': {
    methods: ["DELETE"],
    pattern: '/api/v1/account/workouts',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"workouts"]],
    types: placeholder as Registry['account.workouts.destroy_all']['types'],
  },
  'leaderboards.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/leaderboards/:exerciseId',
    tokens: [[0,"api"],[0,"v1"],[0,"leaderboards"],[1,"exerciseId"]],
    types: placeholder as Registry['leaderboards.show']['types'],
  },
  'duels.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/duels/:username',
    tokens: [[0,"api"],[0,"v1"],[0,"duels"],[1,"username"]],
    types: placeholder as Registry['duels.show']['types'],
  },
  'players.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/players',
    tokens: [[0,"api"],[0,"v1"],[0,"players"]],
    types: placeholder as Registry['players.index']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
