import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.new_account.check': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'account.profile.update_identity': { paramsTuple?: []; params?: {} }
    'account.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'account.weights.index': { paramsTuple?: []; params?: {} }
    'account.weights.update': { paramsTuple?: []; params?: {} }
    'account.workouts.index': { paramsTuple?: []; params?: {} }
    'account.workouts.store': { paramsTuple?: []; params?: {} }
    'account.workouts.destroy_all': { paramsTuple?: []; params?: {} }
    'leaderboards.show': { paramsTuple: [ParamValue]; params: {'exerciseId': ParamValue} }
    'duels.show': { paramsTuple: [ParamValue]; params: {'username': ParamValue} }
    'players.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.weights.index': { paramsTuple?: []; params?: {} }
    'account.workouts.index': { paramsTuple?: []; params?: {} }
    'leaderboards.show': { paramsTuple: [ParamValue]; params: {'exerciseId': ParamValue} }
    'duels.show': { paramsTuple: [ParamValue]; params: {'username': ParamValue} }
    'players.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.weights.index': { paramsTuple?: []; params?: {} }
    'account.workouts.index': { paramsTuple?: []; params?: {} }
    'leaderboards.show': { paramsTuple: [ParamValue]; params: {'exerciseId': ParamValue} }
    'duels.show': { paramsTuple: [ParamValue]; params: {'username': ParamValue} }
    'players.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.new_account.check': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'account.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'account.workouts.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'account.profile.update_identity': { paramsTuple?: []; params?: {} }
    'account.weights.update': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'account.workouts.destroy_all': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}