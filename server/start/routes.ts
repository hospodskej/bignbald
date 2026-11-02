/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
| Everything lives under /api/v1. Only signup and login are public.
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const NewAccountController = () => import('#controllers/new_account_controller')
const AccessTokensController = () => import('#controllers/access_tokens_controller')
const ProfileController = () => import('#controllers/profile_controller')
const WeightsController = () => import('#controllers/weights_controller')
const WorkoutsController = () => import('#controllers/workouts_controller')
const LeaderboardsController = () => import('#controllers/leaderboards_controller')
const DuelsController = () => import('#controllers/duels_controller')
const PlayersController = () => import('#controllers/players_controller')

router.get('/', () => ({ name: 'Big N Bald API', ok: true }))

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [NewAccountController, 'store'])
        router.post('login', [AccessTokensController, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [ProfileController, 'show'])
        router.put('profile', [ProfileController, 'update'])
        router.put('identity', [ProfileController, 'updateIdentity'])
        router.post('logout', [AccessTokensController, 'destroy'])
        router.get('weights', [WeightsController, 'index'])
        router.put('weights', [WeightsController, 'update'])
        router.get('workouts', [WorkoutsController, 'index'])
        router.post('workouts', [WorkoutsController, 'store'])
        router.delete('workouts', [WorkoutsController, 'destroyAll'])
      })
      .prefix('account')
      .as('account')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('leaderboards/:exerciseId', [LeaderboardsController, 'show'])
        router.get('duels/:username', [DuelsController, 'show'])
        router.get('players', [PlayersController, 'index'])
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
