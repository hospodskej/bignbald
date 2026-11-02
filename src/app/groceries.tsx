import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, Header, Row, Screen, T } from '@/components/ui';
import { MEAL_SLOTS, recipe, recipesFor, SLOT_LABEL } from '@/data/recipes';
import { weekdayIndex, WEEKDAYS } from '@/lib/dates';
import { groceryList, prepList } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { colors } from '@/theme/tokens';

export default function Groceries() {
  const { state, actions } = useStore();
  const plan = state.mealPlan;
  const prep = prepList(plan);
  const items = groceryList(plan);
  const aisles = [...new Set(items.map((i) => i.aisle))];
  const checked = items.filter((i) => state.groceryChecked.includes(i.foodId)).length;
  const today = weekdayIndex();

  /** Tap a cell to cycle through recipes that fit the slot and your diet style. */
  const cycle = (day: number, slot: (typeof MEAL_SLOTS)[number]) => {
    const kind = slot === 'breakfast' ? 'breakfast' : slot === 'snack' ? 'snack' : 'main';
    const options = recipesFor(state.profile.dietStyle, kind);
    if (!options.length) return;
    const i = options.findIndex((r) => r.id === plan[day]?.[slot]);
    actions.setMeal(day, slot, options[(i + 1) % options.length].id);
  };

  return (
    <Screen>
      <Header kicker="Meal prep" title="WEEK PLAN" color={colors.green} />
      <T v="small">Tap a meal to swap it. The shopping list and prep batches update instantly.</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {WEEKDAYS.map((d, day) => (
          <View key={d} style={{ width: 118, gap: 6 }}>
            <T v="kicker" color={day === today ? colors.green : colors.muted} style={{ textAlign: 'center' }}>{d}{day === today ? ' · today' : ''}</T>
            {MEAL_SLOTS.map((slot) => {
              const id = plan[day]?.[slot];
              return (
                <Pressable key={slot} onPress={() => cycle(day, slot)} accessibilityRole="button" accessibilityLabel={`${d} ${SLOT_LABEL[slot]}`}
                  style={{ minHeight: 64, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: day === today ? colors.greenLine : colors.line, padding: 8, gap: 2 }}>
                  <T v="kicker" style={{ fontSize: 9 }}>{SLOT_LABEL[slot]}</T>
                  <T v="small" color={colors.text} numberOfLines={3} style={{ fontSize: 12, lineHeight: 15 }}>{id ? recipe(id).name : '—'}</T>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Card>
        <T v="kicker">Prep day</T>
        {prep.map((p) => (
          <Row key={p.recipe.id} gap={10} style={{ alignItems: 'flex-start' }}>
            <View style={{ backgroundColor: colors.greenSoft, borderColor: colors.greenLine, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <T v="h2" color={colors.green} style={{ fontSize: 18 }}>×{p.batches}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T v="title" style={{ fontSize: 14 }}>{p.recipe.name}</T>
              <T v="small">{p.servings} servings this week · batch makes {p.recipe.servings}. {p.recipe.steps}</T>
            </View>
          </Row>
        ))}
      </Card>

      <Row style={{ justifyContent: 'space-between' }}>
        <T v="h2">SHOPPING LIST</T>
        <T v="title" color={colors.green}>{checked} / {items.length}</T>
      </Row>
      {aisles.map((aisle) => (
        <View key={aisle} style={{ gap: 4 }}>
          <T v="kicker">{aisle}</T>
          {items.filter((i) => i.aisle === aisle).map((i) => {
            const on = state.groceryChecked.includes(i.foodId);
            return (
              <Pressable key={i.foodId} onPress={() => actions.toggleGrocery(i.foodId)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <Row gap={12} style={{ minHeight: 46, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.surface }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: on ? colors.green : colors.lineStrong, backgroundColor: on ? colors.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {on ? <Icon name="check" size={13} color={colors.ink} strokeWidth={3.5} /> : null}
                  </View>
                  <T v="body" color={on ? colors.faint : colors.text} style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }}>{i.name}</T>
                  <T v="title" color={colors.muted} style={{ fontSize: 14 }}>{i.label}</T>
                </Row>
              </Pressable>
            );
          })}
        </View>
      ))}
      {checked > 0 ? <Button title="Clear ticks" variant="outline" color={colors.green} onPress={actions.clearGroceries} /> : null}
    </Screen>
  );
}
