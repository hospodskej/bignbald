import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BodyMap } from '@/components/BodyMap';
import { HeroBadge } from '@/components/HeroBadge';
import { Icon } from '@/components/Icon';
import { RankPill } from '@/components/Rank';
import { Bar, Button, Card, Halftone, Panel, Row, Screen, T } from '@/components/ui';
import { exercise } from '@/data/exercises';
import { hero } from '@/data/heroes';
import { dayNumber, planDay } from '@/data/plans';
import { formatKg, greeting } from '@/lib/dates';
import { dailyTargets, eatenToday, trainingBoost } from '@/lib/nutrition';
import { duel, rivals } from '@/lib/players';
import { useStore } from '@/lib/store';
import { allRanked, dayHeat, doneSets, exerciseForSlot, level, nextDayId, suggestion, weekStreak } from '@/lib/workout';
import { colors } from '@/theme/tokens';

export default function Home() {
  const { state, actions } = useStore();
  const h = hero(state.profile.hero);
  const lvl = level(state.history);
  const dayId = nextDayId(state);
  const day = planDay(state.profile.hero, dayId);
  const dayNo = dayNumber(state.profile.hero, dayId);
  const sets = day.slots.reduce((n, s) => n + s.sets, 0);
  const coach = h.coach[new Date().getDate() % h.coach.length];
  const target = dailyTargets(state);
  const eaten = eatenToday(state);
  const boost = trainingBoost(state);
  const rival = rivals(state)[0];
  const d = duel(state, rival.id);
  const upgrade = day.slots
    .map((_, i) => exerciseForSlot(state, state.profile.hero, dayId, i))
    .map((id) => ({ id, s: suggestion(state.history, id) }))
    .find((x) => x.s?.kind === 'upgrade');
  const top = allRanked(state.history)[0];

  const start = () => {
    if (!state.active) actions.startWorkout(dayId);
    router.push('/workout');
  };

  return (
    <Screen>
      <Row gap={12}>
        <HeroBadge id={state.profile.hero} size={52} level={lvl.level} />
        <View style={{ flex: 1 }}>
          <T v="small">{greeting()}, {state.profile.name}</T>
          <T v="title" color={h.bright} style={{ fontSize: 13 }}>
            {h.short} · Level {lvl.level} · {lvl.need - lvl.xp} XP to go
          </T>
        </View>
        <Row gap={5} style={{ backgroundColor: h.soft, borderColor: h.deep, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 }}>
          <Icon name="flame" size={16} color={h.bright} />
          <T v="title" style={{ fontSize: 14 }}>{weekStreak(state.history)} wk</T>
        </Row>
      </Row>

      {state.active ? (
        <Pressable onPress={() => router.push('/workout')} accessibilityRole="button">
          <Card tone={{ bg: h.soft, line: h.color }}>
            <Row>
              <Icon name="bolt" size={18} color={h.bright} />
              <T v="title" color={h.bright} style={{ flex: 1 }}>Workout in progress: {planDay(state.active.hero, state.active.dayId).name}</T>
              <T v="small">{doneSets(state.active)} sets · resume</T>
            </Row>
          </Card>
        </Pressable>
      ) : null}

      <Panel color={h.color} deep={h.deep} bg="#1A0F11" pad={18}>
        <Halftone color={h.color} opacity={0.3} gap={9} style={{ left: '45%', bottom: '45%' }} />
        <Row style={{ alignItems: 'flex-start' }} gap={10}>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: h.color, paddingHorizontal: 8, paddingVertical: 3, transform: [{ skewX: '-10deg' }] }}>
              <T v="kicker" color={colors.ink} style={{ transform: [{ skewX: '10deg' }] }}>{h.name} · Day {dayNo}</T>
            </View>
            <T v="display" style={{ fontSize: 46, lineHeight: 44, marginTop: 4 }}>{day.name.toUpperCase().replace(' + ', '\n+ ')}</T>
            <T v="small" color={colors.textDim}>{day.slots.length} exercises · {sets} sets · ~{Math.round(sets * 3)} min</T>
          </View>
          <BodyMap heat={dayHeat(state, state.profile.hero, dayId)} height={150} />
        </Row>
        <View style={{ alignSelf: 'flex-start', maxWidth: 280, backgroundColor: colors.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }}>
          <T v="title" color={colors.ink} style={{ fontSize: 14 }}>{coach}</T>
          <View style={{ position: 'absolute', left: 22, bottom: -7, width: 14, height: 14, backgroundColor: colors.text, transform: [{ rotate: '45deg' }] }} />
        </View>
        <Button title={state.active ? 'Resume workout' : "Let's go"} size="lg" color={h.color} onPress={start} />
        <Pressable onPress={() => router.push({ pathname: '/plan/[hero]', params: { hero: state.profile.hero, day: dayId } })}>
          <T v="small" style={{ textAlign: 'center' }}>{"See today's exercises"}</T>
        </Pressable>
      </Panel>

      <Pressable onPress={() => router.push({ pathname: '/duel/[id]', params: { id: rival.id } })} accessibilityRole="button">
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={6}>
              <Icon name="versus" size={16} color={colors.muted} />
              <T v="kicker">Duel · last 7 days</T>
            </Row>
            <T v="small">{d.score.you} – {d.score.them} · open</T>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="h2" color={h.bright}>YOU {d.week.you.sets}</T>
            <T v="kicker" color={colors.faint}>sets</T>
            <T v="h2" color={hero(rival.hero).bright}>{d.week.them.sets} {rival.name.toUpperCase()}</T>
          </Row>
          <View style={{ flexDirection: 'row', height: 10, gap: 3, borderRadius: 999, overflow: 'hidden' }}>
            <View style={{ flex: Math.max(1, d.week.you.sets), backgroundColor: h.color }} />
            <View style={{ flex: Math.max(1, d.week.them.sets), backgroundColor: hero(rival.hero).color }} />
          </View>
        </Card>
      </Pressable>

      <Row gap={10} style={{ alignItems: 'stretch' }}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push('/diet')}>
          <Card style={{ flex: 1 }}>
            <T v="kicker">Protein</T>
            <T v="h2">{Math.round(eaten.protein)}<T v="small"> / {target.protein} g</T></T>
            <Bar value={eaten.protein / target.protein} color={colors.green} />
            <T v="small" color={colors.green}>{boost.protein > 0 ? `+${boost.protein} g for ${boost.dayName.toLowerCase()}` : 'Rest day target'}</T>
          </Card>
        </Pressable>
        {upgrade?.s?.kind === 'upgrade' ? (
          <Card style={{ flex: 1 }} tone={{ bg: colors.amberSoft, line: colors.amberLine }}>
            <T v="kicker" color={colors.amber}>Upgrade ready</T>
            <T v="title" style={{ fontSize: 15 }}>{exercise(upgrade.id).name}</T>
            <T v="h2" color={colors.amber}>{formatKg(upgrade.s.fromKg)} → {formatKg(upgrade.s.toKg)} kg</T>
            <T v="small">12+ reps twice in a row</T>
          </Card>
        ) : top ? (
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/rankings')}>
            <Card style={{ flex: 1 }}>
              <T v="kicker">Top rank</T>
              <T v="title" style={{ fontSize: 15 }}>{exercise(top.id).name}</T>
              <RankPill rank={top.rank} />
              <T v="small">Best {formatKg(top.kg)} kg</T>
            </Card>
          </Pressable>
        ) : null}
      </Row>
    </Screen>
  );
}

