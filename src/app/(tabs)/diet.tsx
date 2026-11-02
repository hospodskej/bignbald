import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { MacroRing } from '@/components/MacroRing';
import { Bar, Banner, Chip, IconButton, Panel, Row, Screen, T, tones } from '@/components/ui';
import { food } from '@/data/foods';
import { EXTRA_NUTRIENTS, NUTRIENTS } from '@/data/nutrients';
import { DIET_STYLES, DietStyle, MEAL_SLOTS, recipe, servingNutrition, SLOT_LABEL } from '@/data/recipes';
import { dayKey, formatInt, weekdayIndex } from '@/lib/dates';
import { notify } from '@/lib/confirm';
import { dailyTargets, eatenToday, trainingBoost } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { colors } from '@/theme/tokens';

const fmt = (n: number) => (n >= 100 ? formatInt(n) : String(Math.round(n * 10) / 10));

export default function Diet() {
  const { state, actions } = useStore();
  const [more, setMore] = useState(false);
  const [pickStyle, setPickStyle] = useState(false);
  const target = dailyTargets(state);
  const eaten = eatenToday(state);
  const boost = trainingBoost(state);
  const today = state.mealPlan[weekdayIndex()] ?? {};
  const eatenSlots = state.mealsEaten[dayKey()] ?? [];
  const logged = state.foodLog.filter((f) => f.date === dayKey());
  const water = state.waterMl[dayKey()] ?? 0;
  const waterGoal = state.profile.sex === 'female' ? 2700 : 3500;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <T v="kicker" color={boost.intensity > 0.45 ? '#FF6B5E' : colors.muted}>{boost.dayName} · {boost.label}</T>
          <T v="display">FUEL UP</T>
        </View>
        <Pressable onPress={() => setPickStyle((v) => !v)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.greenLine, backgroundColor: colors.greenSoft }}>
          <T v="title" color={colors.green} style={{ fontSize: 12 }}>{DIET_STYLES[state.profile.dietStyle].label}</T>
          <Icon name="chevron" size={14} color={colors.green} />
        </Pressable>
      </Row>
      {pickStyle ? (
        <View style={{ gap: 6 }}>
          <T v="small">Your diet style sets your meal plan, shopping list and how your calories split into protein, carbs and fat.</T>
          {(Object.keys(DIET_STYLES) as DietStyle[]).map((d) => {
            const on = d === state.profile.dietStyle;
            return (
              <Pressable
                key={d}
                onPress={() => { actions.updateProfile({ dietStyle: d }); setPickStyle(false); }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? colors.green : colors.line, backgroundColor: on ? colors.greenSoft : colors.surface }}>
                <View style={{ flex: 1 }}>
                  <T v="title" color={on ? colors.green : colors.text}>{DIET_STYLES[d].label}</T>
                  <T v="small" style={{ fontSize: 11 }}>{DIET_STYLES[d].blurb}</T>
                </View>
                {on ? <Icon name="check" size={18} color={colors.green} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Panel color={colors.green} deep={colors.greenDeep}>
        <Row gap={16}>
          <MacroRing value={eaten.kcal} target={target.kcal} />
          <View style={{ flex: 1, gap: 10 }}>
            {([['protein', colors.green], ['carbs', colors.amber], ['fat', colors.blue]] as const).map(([id, c]) => (
              <View key={id} style={{ gap: 4 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="title" style={{ fontSize: 12 }}>{NUTRIENTS[id].label}</T>
                  <T v="small" style={{ fontSize: 12 }}>{Math.round(eaten[id])} / {target[id]} g</T>
                </Row>
                <Bar value={eaten[id] / target[id]} color={c} height={7} />
              </View>
            ))}
          </View>
        </Row>
        <Pressable onPress={() => setMore((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: more }} style={{ height: 44, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <T v="title" color={colors.textDim} style={{ fontSize: 13 }}>{more ? 'Hide extra nutrients' : `More nutrients (${EXTRA_NUTRIENTS.length + 1})`}</T>
          <View style={{ transform: [{ rotate: more ? '180deg' : '0deg' }] }}><Icon name="chevron" size={16} color={colors.textDim} /></View>
        </Pressable>
        {more ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={nutrientCell}>
              <Row style={{ justifyContent: 'space-between' }}><T v="title" style={{ fontSize: 12 }}>Water</T><T v="kicker" style={{ fontSize: 9 }}>Goal</T></Row>
              <T v="small" style={{ fontSize: 12 }}>{(water / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} L</T>
              <Bar value={water / waterGoal} color={colors.blue} height={5} />
            </View>
            {EXTRA_NUTRIENTS.map((id) => {
              const n = NUTRIENTS[id];
              const pct = eaten[id] / Math.max(0.001, target[id]);
              const limit = n.kind === 'limit';
              return (
                <View key={id} style={nutrientCell}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T v="title" style={{ fontSize: 12 }}>{n.label}</T>
                    <T v="kicker" color={limit ? colors.amber : colors.muted} style={{ fontSize: 9 }}>{limit ? 'Max' : 'Goal'}</T>
                  </Row>
                  <T v="small" style={{ fontSize: 12 }}>{fmt(eaten[id])} / {fmt(target[id])} {n.unit}</T>
                  <Bar value={pct} color={limit ? (pct >= 0.8 ? colors.amber : colors.blue) : colors.green} height={5} />
                </View>
              );
            })}
          </View>
        ) : null}
        <Row gap={8}>
          <Icon name="water" size={20} color={colors.blue} active />
          <T v="small" style={{ flex: 1 }}>Water {(water / 1000).toFixed(2)} L</T>
          <Chip label="+250 ml" onPress={() => actions.addWater(250)} />
          <Chip label="+500 ml" onPress={() => actions.addWater(500)} />
        </Row>
      </Panel>

      {boost.protein > 0 ? (
        <Banner icon="bolt" tone={tones.green} title={`+${boost.protein} g protein${boost.carbs ? `, +${boost.carbs} g carbs` : ''} today`} body={`${boost.dayName} is ${boost.label.toLowerCase()}. Targets go up on the days you train hardest.`} />
      ) : null}

      <Row style={{ justifyContent: 'space-between' }}>
        <T v="kicker">{"Today's meals"}</T>
        <Row>
          <IconButton icon="scan" label="Scan barcode" onPress={() => notify('Barcode scanning', 'Coming with the camera build and our food database. For now, search foods with the + button.')} />
          <IconButton icon="plus" label="Add food" color={colors.ink} filled={colors.green} onPress={() => router.push('/add-food')} />
        </Row>
      </Row>
      {MEAL_SLOTS.map((slot) => {
        const id = today[slot];
        if (!id) return null;
        const r = recipe(id);
        const n = servingNutrition(r);
        const done = eatenSlots.includes(slot);
        return (
          <Pressable key={slot} onPress={() => actions.toggleMeal(slot)} accessibilityRole="checkbox" accessibilityState={{ checked: done }}>
            <Row gap={12} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: done ? colors.greenLine : colors.line, borderRadius: 12, padding: 12, opacity: done ? 1 : 0.75 }}>
              <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: done ? colors.green : colors.lineStrong, backgroundColor: done ? colors.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Icon name="check" size={14} color={colors.ink} strokeWidth={3.5} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <T v="kicker" style={{ fontSize: 10 }}>{SLOT_LABEL[slot]}</T>
                <T v="title" style={{ fontSize: 14 }}>{r.name}</T>
                <T v="small">{Math.round(n.kcal)} kcal · {done ? 'eaten' : 'tap when eaten'}{r.servings > 1 ? ' · meal prep' : ''}</T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="h2" color={colors.green}>{Math.round(n.protein)} g</T>
                <T v="small" style={{ fontSize: 11 }}>protein</T>
              </View>
            </Row>
          </Pressable>
        );
      })}
      {logged.map((item) => {
        const f = food(item.foodId);
        return (
          <Row key={item.id} gap={12} style={{ backgroundColor: colors.surface, borderRadius: 12, paddingLeft: 12, paddingVertical: 6, paddingRight: 6 }}>
            <View style={{ flex: 1 }}>
              <T v="title" style={{ fontSize: 13 }}>{f.name}</T>
              <T v="small">{item.grams} g · {Math.round(((f.per100.kcal ?? 0) * item.grams) / 100)} kcal · {Math.round(((f.per100.protein ?? 0) * item.grams) / 100)} g protein</T>
            </View>
            <Pressable onPress={() => actions.removeFood(item.id)} accessibilityLabel={`Remove ${f.name}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color={colors.muted} />
            </Pressable>
          </Row>
        );
      })}

      <Pressable onPress={() => router.push('/groceries')} accessibilityRole="button">
        <Row gap={12} style={{ backgroundColor: colors.greenSoft, borderColor: colors.greenLine, borderWidth: 1, borderRadius: 14, padding: 14 }}>
          <Icon name="cart" size={22} color={colors.green} />
          <View style={{ flex: 1 }}>
            <T v="title" color={colors.green}>Week plan & shopping list</T>
            <T v="small">Meal prep batches and everything to buy</T>
          </View>
          <View style={{ transform: [{ rotate: '-90deg' }] }}><Icon name="chevron" size={18} color={colors.green} /></View>
        </Row>
      </Pressable>
    </Screen>
  );
}

const nutrientCell = { width: '48%', backgroundColor: colors.surfaceSunk, borderRadius: 10, padding: 9, gap: 4 } as const;
