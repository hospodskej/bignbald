import { test } from '@japa/runner'

const API = '/api/v1'
/** Response body without the typed-route narrowing (these tests check shapes themselves). */
const json = (res: { body(): unknown }): any => res.body()

test.group('Food log, days and meal plan', () => {
  let auth = ''
  let other = ''

  test('sign up two players', async ({ client }) => {
    const a = await client.post(`${API}/auth/signup`).json({
      email: 'eat@example.com',
      username: 'eater',
      password: 'supersecret',
      profile: { hero: 'brawler', name: 'E' },
    })
    auth = `Bearer ${json(a).data.token}`
    const b = await client.post(`${API}/auth/signup`).json({
      email: 'other@example.com',
      username: 'other',
      password: 'supersecret',
      profile: { hero: 'acrobat', name: 'O' },
    })
    other = `Bearer ${json(b).data.token}`
  })

  test('log food once even if the phone retries; unknown foods are rejected', async ({
    client,
    assert,
  }) => {
    const today = new Date().toISOString().slice(0, 10)
    const item = { id: 'food-abc-1', date: today, foodId: 'skyr', grams: 250 }
    ;(
      await client.post(`${API}/account/food-logs`).header('Authorization', auth).json(item)
    ).assertStatus(201)
    const again = await client
      .post(`${API}/account/food-logs`)
      .header('Authorization', auth)
      .json(item)
    assert.isTrue(json(again).duplicate)
    ;(
      await client
        .post(`${API}/account/food-logs`)
        .header('Authorization', auth)
        .json({ ...item, id: 'food-bad-1', foodId: 'unicorn-steak' })
    ).assertStatus(422)

    const list = await client.get(`${API}/account/food-logs`).header('Authorization', auth)
    assert.deepEqual(json(list), [item])
    // Nobody else sees it
    assert.deepEqual(
      json(await client.get(`${API}/account/food-logs`).header('Authorization', other)),
      []
    )
  })

  test("delete food; deleting twice is fine; you cannot delete someone else's", async ({
    client,
    assert,
  }) => {
    const today = new Date().toISOString().slice(0, 10)
    await client
      .post(`${API}/account/food-logs`)
      .header('Authorization', other)
      .json({ id: 'food-other-1', date: today, foodId: 'oats', grams: 60 })
    ;(
      await client.delete(`${API}/account/food-logs/food-other-1`).header('Authorization', auth)
    ).assertStatus(200)
    assert.lengthOf(
      json(await client.get(`${API}/account/food-logs`).header('Authorization', other)),
      1
    )

    ;(
      await client.delete(`${API}/account/food-logs/food-abc-1`).header('Authorization', auth)
    ).assertStatus(200)
    ;(
      await client.delete(`${API}/account/food-logs/food-abc-1`).header('Authorization', auth)
    ).assertStatus(200)
    assert.deepEqual(
      json(await client.get(`${API}/account/food-logs`).header('Authorization', auth)),
      []
    )
  })

  test('eaten meals and water per day; saving again replaces the day', async ({
    client,
    assert,
  }) => {
    const day = new Date().toISOString().slice(0, 10)
    await client
      .put(`${API}/account/days/${day}`)
      .header('Authorization', auth)
      .json({ mealsEaten: ['breakfast'], waterMl: 500 })
    await client
      .put(`${API}/account/days/${day}`)
      .header('Authorization', auth)
      .json({ mealsEaten: ['breakfast', 'lunch'], waterMl: 750 })
    ;(
      await client
        .put(`${API}/account/days/${day}`)
        .header('Authorization', auth)
        .json({ mealsEaten: ['brunch'], waterMl: 1 })
    ).assertStatus(422)
    ;(
      await client
        .put(`${API}/account/days/not-a-date`)
        .header('Authorization', auth)
        .json({ mealsEaten: [], waterMl: 1 })
    ).assertStatus(422)
    const days = await client.get(`${API}/account/days`).header('Authorization', auth)
    assert.deepEqual(json(days), [{ date: day, mealsEaten: ['breakfast', 'lunch'], waterMl: 750 }])
  })

  test('meal plan: empty at first, then saved and read back', async ({ client, assert }) => {
    assert.deepEqual(
      json(await client.get(`${API}/account/meal-plan`).header('Authorization', auth)),
      {
        plan: null,
        groceryChecked: [],
      }
    )
    const plan = {
      '0': { breakfast: 'skyr-bowl', lunch: 'chicken-rice' },
      '1': { dinner: 'beef-chili' },
    }
    ;(
      await client
        .put(`${API}/account/meal-plan`)
        .header('Authorization', auth)
        .json({ plan, groceryChecked: ['rice'] })
    ).assertStatus(200)
    await client
      .put(`${API}/account/meal-plan`)
      .header('Authorization', auth)
      .json({ plan, groceryChecked: ['rice', 'oats'] })
    const saved = await client.get(`${API}/account/meal-plan`).header('Authorization', auth)
    assert.deepEqual(json(saved), { plan, groceryChecked: ['rice', 'oats'] })
  })

  test('all of it needs a login', async ({ client }) => {
    ;(await client.get(`${API}/account/food-logs`)).assertStatus(401)
    ;(await client.get(`${API}/account/days`)).assertStatus(401)
    ;(await client.get(`${API}/account/meal-plan`)).assertStatus(401)
  })
})
