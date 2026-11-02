import { test } from '@japa/runner'

const API = '/api/v1'
/** Responses built with serialize() arrive as { data: ... }. */
const body = (res: { body(): unknown }): any => (res.body() as any).data ?? res.body()
const profile = (hero: 'brawler' | 'acrobat' = 'brawler', name = 'Pavel') => ({
  hero,
  name,
  weightKg: 80,
  goal: 'bigger',
})
const workout = (id: string, kg: number, reps = 8, exerciseId = 'bench-press') => ({
  id,
  hero: 'brawler',
  dayId: 'push',
  startedAt: Date.now() - 3_600_000,
  finishedAt: Date.now(),
  entries: [
    {
      slot: 1,
      exerciseId,
      sets: [
        { kg, reps, done: true },
        { kg, reps: reps - 2, done: true },
        { kg, reps: 0, done: false },
      ],
    },
  ],
})

test.group('Accounts', () => {
  let token = ''

  test('sign up', async ({ client, assert }) => {
    const res = await client.post(`${API}/auth/signup`).json({
      email: 'Pavel@Example.com',
      username: 'Pavel_lifts',
      password: 'supersecret',
      profile: profile(),
    })
    res.assertStatus(201)
    assert.containsSubset(body(res).user, { email: 'pavel@example.com', username: 'pavel_lifts' })
    assert.notProperty(body(res).user, 'password')
    token = body(res).token
  })

  test('duplicate email and taken username get readable errors', async ({ client, assert }) => {
    const a = await client.post(`${API}/auth/signup`).json({
      email: 'pavel@example.com',
      username: 'other1',
      password: 'supersecret',
      profile: profile(),
    })
    a.assertStatus(422)
    assert.equal(body(a).errors[0].message, 'That email already has an account')
    const b = await client.post(`${API}/auth/signup`).json({
      email: 'x@example.com',
      username: 'pavel_lifts',
      password: 'supersecret',
      profile: profile(),
    })
    assert.equal(body(b).errors[0].message, 'That username is taken')
  })

  test('bad input is rejected', async ({ client }) => {
    const res = await client
      .post(`${API}/auth/signup`)
      .json({ email: 'nope', username: 'ab', password: 'short', profile: profile() })
    res.assertStatus(422)
  })

  test('log in only with the right password, and get the profile back', async ({
    client,
    assert,
  }) => {
    ;(
      await client
        .post(`${API}/auth/login`)
        .json({ email: 'pavel@example.com', password: 'wrongpass' })
    ).assertStatus(400)
    const ok = await client
      .post(`${API}/auth/login`)
      .json({ email: 'pavel@example.com', password: 'supersecret' })
    ok.assertStatus(200)
    assert.equal(body(ok).profile.name, 'Pavel')
  })

  test('account routes need a token', async ({ client, assert }) => {
    ;(await client.get(`${API}/account/profile`)).assertStatus(401)
    ;(
      await client.get(`${API}/account/profile`).header('Authorization', 'Bearer garbage')
    ).assertStatus(401)
    const me = await client.get(`${API}/account/profile`).header('Authorization', `Bearer ${token}`)
    assert.equal(body(me).user.username, 'pavel_lifts')
  })

  test('update the profile', async ({ client, assert }) => {
    const auth = `Bearer ${token}`
    ;(
      await client
        .put(`${API}/account/profile`)
        .header('Authorization', auth)
        .json({ profile: { ...profile('acrobat'), age: 25 } })
    ).assertStatus(200)
    const me = await client.get(`${API}/account/profile`).header('Authorization', auth)
    assert.containsSubset(body(me).profile, { hero: 'acrobat', age: 25 })
  })

  test('change username and email, but not to one that is taken', async ({ client, assert }) => {
    const auth = `Bearer ${token}`
    await client.post(`${API}/auth/signup`).json({
      email: 'taken@example.com',
      username: 'taken_name',
      password: 'supersecret',
      profile: profile(),
    })
    const bad = await client
      .put(`${API}/account/identity`)
      .header('Authorization', auth)
      .json({ username: 'taken_name' })
    assert.equal(body(bad).errors[0].message, 'That username is taken')
    const same = await client
      .put(`${API}/account/identity`)
      .header('Authorization', auth)
      .json({ username: 'pavel_lifts' })
    same.assertStatus(200)
    const ok = await client
      .put(`${API}/account/identity`)
      .header('Authorization', auth)
      .json({ username: 'Pavel_2' })
    assert.equal(body(ok).user.username, 'pavel_2')
    await client
      .put(`${API}/account/identity`)
      .header('Authorization', auth)
      .json({ username: 'pavel_lifts' })
  })

  test('body weight: one entry per day', async ({ client, assert }) => {
    const auth = `Bearer ${token}`
    await client
      .put(`${API}/account/weights`)
      .header('Authorization', auth)
      .json({ date: '2026-11-01', kg: 80 })
    await client
      .put(`${API}/account/weights`)
      .header('Authorization', auth)
      .json({ date: '2026-11-01', kg: 80.4 })
    const res = await client.get(`${API}/account/weights`).header('Authorization', auth)
    assert.deepEqual(body(res), [{ date: '2026-11-01', kg: 80.4 }])
  })

  test('log out revokes the token', async ({ client }) => {
    const login = await client
      .post(`${API}/auth/login`)
      .json({ email: 'pavel@example.com', password: 'supersecret' })
    const t = `Bearer ${body(login).token}`
    ;(await client.post(`${API}/account/logout`).header('Authorization', t)).assertStatus(200)
    ;(await client.get(`${API}/account/profile`).header('Authorization', t)).assertStatus(401)
  })
})

test.group('Workouts, leaderboards and duels', () => {
  let a = ''
  let b = ''

  test('players sign up', async ({ client }) => {
    a = body(
      await client.post(`${API}/auth/signup`).json({
        email: 'a@example.com',
        username: 'brawly',
        password: 'supersecret',
        profile: profile('brawler', 'A'),
      })
    ).token
    b = body(
      await client.post(`${API}/auth/signup`).json({
        email: 'b@example.com',
        username: 'flippy',
        password: 'supersecret',
        profile: profile('acrobat', 'B'),
      })
    ).token
  })

  test('a workout is saved once even if the phone retries', async ({ client, assert }) => {
    const auth = `Bearer ${a}`
    ;(
      await client
        .post(`${API}/account/workouts`)
        .header('Authorization', auth)
        .json(workout('w-aaaa-1', 100))
    ).assertStatus(201)
    const again = await client
      .post(`${API}/account/workouts`)
      .header('Authorization', auth)
      .json(workout('w-aaaa-1', 100))
    assert.isTrue(body(again).duplicate)
    const list = body(await client.get(`${API}/account/workouts`).header('Authorization', auth))
    assert.lengthOf(list, 1)
    assert.lengthOf(list[0].entries[0].sets, 2) // the unfinished set isn't stored
    assert.deepEqual(list[0].entries[0].sets[0], { kg: '100', reps: '8', done: true })
  })

  test('unbelievable weights and unknown exercises are rejected', async ({ client }) => {
    const auth = `Bearer ${a}`
    ;(
      await client
        .post(`${API}/account/workouts`)
        .header('Authorization', auth)
        .json(workout('w-cheat-1', 900))
    ).assertStatus(422)
    ;(
      await client
        .post(`${API}/account/workouts`)
        .header('Authorization', auth)
        .json(workout('w-bad-1', 50, 8, 'flying-kick'))
    ).assertStatus(422)
  })

  test('leaderboard ranks best sets with 5+ reps', async ({ client, assert }) => {
    await client
      .post(`${API}/account/workouts`)
      .header('Authorization', `Bearer ${b}`)
      .json(workout('w-bbbb-1', 110))
    await client
      .post(`${API}/account/workouts`)
      .header('Authorization', `Bearer ${b}`)
      .json(workout('w-bbbb-2', 150, 3)) // 3 reps: doesn't count
    const board = body(
      await client.get(`${API}/leaderboards/bench-press`).header('Authorization', `Bearer ${a}`)
    )
    assert.deepEqual(
      board.rows.map((r: any) => [r.username, r.kg]),
      [
        ['flippy', 110],
        ['brawly', 100],
      ]
    )
    assert.isTrue(board.rows[1].you)
    assert.match(board.rows[0].rankLabel, /Platinum/)
  })

  test('duel another player', async ({ client, assert }) => {
    const d = body(await client.get(`${API}/duels/flippy`).header('Authorization', `Bearer ${a}`))
    assert.deepEqual(d.rival, { username: 'flippy', hero: 'acrobat' })
    assert.containsSubset(d.lifts[0], { id: 'bench-press', you: 100, them: 110 })
    assert.isAbove(d.score.them, 0)
    ;(await client.get(`${API}/duels/nobody`).header('Authorization', `Bearer ${a}`)).assertStatus(
      404
    )
  })

  test('find players by username', async ({ client, assert }) => {
    const res = await client
      .get(`${API}/players`)
      .qs({ q: 'fl' })
      .header('Authorization', `Bearer ${a}`)
    assert.deepEqual(body(res), [{ username: 'flippy', hero: 'acrobat' }])
  })
})
