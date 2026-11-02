/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
      check: typeof routes['auth.new_account.check']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  account: {
    profile: {
      show: typeof routes['account.profile.show']
      update: typeof routes['account.profile.update']
      updateIdentity: typeof routes['account.profile.update_identity']
    }
    accessTokens: {
      destroy: typeof routes['account.access_tokens.destroy']
    }
    weights: {
      index: typeof routes['account.weights.index']
      update: typeof routes['account.weights.update']
    }
    workouts: {
      index: typeof routes['account.workouts.index']
      store: typeof routes['account.workouts.store']
      destroyAll: typeof routes['account.workouts.destroy_all']
    }
  }
  leaderboards: {
    show: typeof routes['leaderboards.show']
  }
  duels: {
    show: typeof routes['duels.show']
  }
  players: {
    index: typeof routes['players.index']
  }
}
