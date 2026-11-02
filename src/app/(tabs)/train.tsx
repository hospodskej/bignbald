import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BodyMap } from '@/components/BodyMap';
import { HeroBadge } from '@/components/HeroBadge';
import { Icon } from '@/components/Icon';
import { Button, Card, Halftone, Panel, Row, Screen, T } from '@/components/ui';
import { HERO_IDS, hero, HeroId } from '@/data/heroes';
import { PLANS } from '@/data/plans';
import { confirm } from '@/lib/confirm';
import { formatInt } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { dayHeat, doneSets, finished, nextDayId, volume } from '@/lib/workout';
import { colors } from '@/theme/tokens';

export default function Train() {
  const { state, actions } = useStore();
  const mine = state.profile.hero;
  const h = hero(mine);
  const next = nextDayId(state);
  const plan = PLANS[mine];
  const recent = finished(state.history).slice(0, 5);

  const switchTo = (id: HeroId) =>
    confirm(`Become ${hero(id).name}?`, 'Your plan and avatar switch. Your history and ranks stay.', () => actions.updateProfile({ hero: id }), 'Switch');

  return (
    <Screen>
      <View>
        <T v="kicker">Your path</T>
        <T v="display">TRAIN</T>
      </View>

      <Panel color={h.color} deep={h.deep}>
        <Halftone color={h.color} opacity={0.25} style={{ left: '55%', bottom: '60%' }} />
        <Row gap={12}>
          <HeroBadge id={mine} size={56} />
          <View style={{ flex: 1 }}>
            <T v="h1" color={h.bright}>{h.name.toUpperCase()}</T>
            <T v="small">{plan.schedule === 'rotation' ? 'Rotation · rest when you need it' : `${plan.days.length}-day split`} · {plan.minPerWeek}+ per week</T>
          </View>
        </Row>
        <T v="small" color={colors.textDim}>{h.tagline}</T>
        <View style={{ gap: 8 }}>
          {plan.days.map((d, i) => {
            const isNext = d.id === next;
            return (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/plan/[hero]', params: { hero: mine, day: d.id } })}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <Row gap={12} style={{ backgroundColor: isNext ? h.soft : colors.surfaceSunk, borderRadius: 12, borderWidth: 1, borderColor: isNext ? h.color : colors.line, padding: 10 }}>
                  <T v="h2" color={isNext ? h.bright : colors.faint} style={{ width: 22 }}>{i + 1}</T>
                  <View style={{ flex: 1 }}>
                    <T v="title">{d.name}</T>
                    <T v="small">{d.slots.length} exercises · {d.slots.reduce((n, s) => n + s.sets, 0)} sets</T>
                  </View>
                  {isNext ? (
                    <View style={{ backgroundColor: h.color, paddingHorizontal: 7, paddingVertical: 2, transform: [{ skewX: '-10deg' }] }}>
                      <T v="kicker" color={colors.ink}>Next</T>
                    </View>
                  ) : null}
                  <BodyMap heat={dayHeat(state, mine, d.id)} height={56} />
                </Row>
              </Pressable>
            );
          })}
        </View>
        <Button
          title={state.active ? 'Resume workout' : `Start ${plan.days.find((d) => d.id === next)?.name}`}
          color={h.color}
          size="lg"
          onPress={() => {
            if (!state.active) actions.startWorkout(next);
            router.push('/workout');
          }}
        />
      </Panel>

      <T v="kicker" style={{ marginTop: 8 }}>Other heroes</T>
      {HERO_IDS.filter((id) => id !== mine).map((id) => {
        const o = hero(id);
        return (
          <Pressable key={id} onPress={() => router.push({ pathname: '/plan/[hero]', params: { hero: id } })} accessibilityRole="button">
            <Card>
              <Row gap={12}>
                <HeroBadge id={id} size={48} />
                <View style={{ flex: 1 }}>
                  <T v="h2" color={o.bright}>{o.name.toUpperCase()}</T>
                  <T v="small">{o.tags.join(' · ')}</T>
                </View>
                <Button title="Switch" size="sm" variant="outline" color={o.color} onPress={() => switchTo(id)} />
              </Row>
              <T v="small" color={colors.textDim}>{o.tagline}</T>
            </Card>
          </Pressable>
        );
      })}
      <Card style={{ borderStyle: 'dashed' }}>
        <Row gap={10}>
          <Icon name="lock" size={20} color={colors.muted} />
          <T v="small">More heroes coming soon</T>
        </Row>
      </Card>

      <T v="kicker" style={{ marginTop: 8 }}>Recent workouts</T>
      {recent.length === 0 ? <T v="small">Nothing yet. Your first workout shows up here.</T> : null}
      {recent.map((s) => {
        const o = hero(s.hero);
        return (
          <Row key={s.id} gap={12} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
            <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: o.color }} />
            <View style={{ flex: 1 }}>
              <T v="title">{PLANS[s.hero].days.find((d) => d.id === s.dayId)?.name}</T>
              <T v="small">{new Date(s.finishedAt ?? s.startedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</T>
            </View>
            <T v="small">{doneSets(s)} sets · {formatInt(volume(s))} kg</T>
          </Row>
        );
      })}
    </Screen>
  );
}
