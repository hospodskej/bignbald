import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useState } from 'react';

import { BodyMap, HeatLegend } from '@/components/BodyMap';
import { Icon } from '@/components/Icon';
import { RankPill } from '@/components/Rank';
import { Button, Card, Chip, Halftone, Header, Row, Screen, T } from '@/components/ui';
import { exercise, FAMILIES } from '@/data/exercises';
import { hero, HeroId, HEROES } from '@/data/heroes';
import { topMuscles } from '@/data/muscles';
import { PLANS } from '@/data/plans';
import { confirm } from '@/lib/confirm';
import { formatKg } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { dayHeat, exerciseForSlot, lastSets, nextDayId, rankOf } from '@/lib/workout';
import { colors } from '@/theme/tokens';

export default function PlanScreen() {
  const params = useLocalSearchParams<{ hero: string; day?: string }>();
  const heroId = (params.hero && params.hero in HEROES ? params.hero : 'brawler') as HeroId;
  const { state, actions } = useStore();
  const h = hero(heroId);
  const plan = PLANS[heroId];
  const mine = heroId === state.profile.hero;
  const [dayId, setDayId] = useState(params.day ?? (mine ? nextDayId(state) : plan.days[0].id));
  const day = plan.days.find((d) => d.id === dayId) ?? plan.days[0];
  const heat = dayHeat(state, heroId, day.id);

  return (
    <Screen>
      <Header kicker={h.name} color={h.bright} title={`DAY ${plan.days.indexOf(day) + 1} · ${day.name.toUpperCase()}`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {plan.days.map((d, i) => (
          <Chip key={d.id} label={`${i + 1} ${d.short}`} active={d.id === day.id} color={h.color} onPress={() => setDayId(d.id)} />
        ))}
      </ScrollView>

      <Card style={{ alignItems: 'center', backgroundColor: '#12151C', overflow: 'hidden' }}>
        <Halftone color={h.color} opacity={0.1} gap={10} />
        <BodyMap heat={heat} height={280} interactive />
        <HeatLegend />
        <T v="small" color={colors.textDim}>Hits most: {topMuscles(heat).join(', ')}</T>
      </Card>

      {day.slots.map((slot, i) => {
        const id = exerciseForSlot(state, heroId, day.id, i);
        const e = exercise(id);
        const last = lastSets(state.history, id)[0];
        return (
          <Row key={i} gap={12} style={{ backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 12, paddingLeft: 14, paddingVertical: 6, paddingRight: 6 }}>
            <T v="h2" color={colors.faint} style={{ width: 16 }}>{i + 1}</T>
            <View style={{ flex: 1, gap: 3 }}>
              <T v="title" style={{ fontSize: 15 }}>{e.name}</T>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                <T v="small">{slot.any ? `Any ${FAMILIES[slot.family].toLowerCase()} · ` : ''}{slot.sets} sets{last ? ` · last ${formatKg(parseFloat(last.kg))} kg × ${last.reps}` : ''}</T>
              </Row>
              <RankPill rank={rankOf(state.history, id)} short />
            </View>
            {mine ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Swap ${e.name}`}
                onPress={() => router.push({ pathname: '/swap', params: { day: day.id, slot: String(i) } })}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="swap" size={20} color={colors.muted} />
              </Pressable>
            ) : null}
          </Row>
        );
      })}

      {mine ? (
        <Button
          title={state.active ? 'Resume workout' : `Start ${day.name}`}
          size="lg"
          color={h.color}
          onPress={() => {
            if (!state.active) actions.startWorkout(day.id);
            router.push('/workout');
          }}
        />
      ) : (
        <Button
          title={`Become ${h.short}`}
          size="lg"
          color={h.color}
          onPress={() => confirm(`Become ${h.name}?`, 'Your plan and avatar switch. Your history and ranks stay.', () => actions.updateProfile({ hero: heroId }), 'Switch')}
        />
      )}
    </Screen>
  );
}
