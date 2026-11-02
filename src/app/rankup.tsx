import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

import { RankEmblem } from '@/components/Rank';
import { Button, Card, Row, Screen, Stat, T } from '@/components/ui';
import { exercise } from '@/data/exercises';
import { hero } from '@/data/heroes';
import { planDay } from '@/data/plans';
import { formatInt, formatKg } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { doneSets, finished, level, volume } from '@/lib/workout';
import { colors } from '@/theme/tokens';

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 53) % 360, delay: (i * 97) % 600, w: 8 + (i % 3) * 4, rot: (i * 47) % 180,
}));

export default function RankUp() {
  const { state } = useStore();
  const session = finished(state.history)[0];
  const ups = state.lastRankUps;
  const main = ups[0];
  const h = hero(state.profile.hero);
  const [pop] = useState(() => new Animated.Value(0));
  const [fall] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: Platform.OS !== 'web' }).start();
    Animated.timing(fall, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [pop, fall]);

  const accent = main?.color ?? h.color;
  const lvl = level(state.history);

  return (
    <Screen>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 420 }}>
        {CONFETTI.map((c, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', left: c.x + 10, top: -20, width: c.w, height: 5, borderRadius: 2,
              backgroundColor: [accent, colors.amber, h.color, colors.text, colors.blue][i % 5],
              opacity: fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, 260 + ((i * 31) % 160)] }) },
                { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: [`${c.rot}deg`, `${c.rot + 360}deg`] }) },
              ],
            }}
          />
        ))}
      </View>

      <View style={{ alignItems: 'center', gap: 10, marginTop: 20 }}>
        <T v="kicker" color={accent} style={{ letterSpacing: 4, fontSize: 12 }}>{main ? 'Rank up' : 'Workout complete'}</T>
        <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }], opacity: pop }}>
          <RankEmblem color={accent} division={main ? main.to.split(' ')[1] ?? '' : ''} size={200} />
        </Animated.View>
        {main ? (
          <>
            <T v="display" color={accent} style={{ fontSize: 37, lineHeight: 37, textAlign: 'center' }}>{main.to.toUpperCase()}</T>
            <T v="title">{exercise(main.exerciseId).name}</T>
            <Row gap={10}>
              <T v="h2" color={colors.muted}>{main.from.toUpperCase()}</T>
              <T v="h2" color={colors.muted}>→</T>
              <T v="h2" color={accent}>{main.to.toUpperCase()}</T>
            </Row>
            <T v="small">Best set {formatKg(main.kg)} kg × {main.reps}</T>
          </>
        ) : (
          <T v="display" color={h.bright} style={{ textAlign: 'center' }}>{session ? planDay(session.hero, session.dayId).name.toUpperCase() : 'DONE'}</T>
        )}
      </View>

      {session ? (
        <Row gap={8}>
          <Stat label="Time" value={String(Math.round(((session.finishedAt ?? 0) - session.startedAt) / 60000))} unit="min" />
          <Stat label="Sets" value={String(doneSets(session))} />
          <Stat label="Volume" value={formatInt(volume(session))} unit="kg" />
        </Row>
      ) : null}
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="kicker" color={h.bright}>{h.short} level {lvl.level}</T>
          <T v="small">{lvl.xp} / {lvl.need} XP</T>
        </Row>
        <View style={{ height: 8, borderRadius: 8, backgroundColor: colors.line, overflow: 'hidden' }}>
          <View style={{ width: `${(lvl.xp / lvl.need) * 100}%`, height: '100%', backgroundColor: h.color }} />
        </View>
      </Card>

      {ups.length > 1 ? (
        <Card>
          <T v="kicker">Also ranked up</T>
          {ups.slice(1).map((u) => (
            <Row key={u.exerciseId} style={{ justifyContent: 'space-between' }}>
              <T v="body" style={{ flex: 1 }}>{exercise(u.exerciseId).name}</T>
              <T v="h2" color={u.color} style={{ fontSize: 14 }}>{u.to.toUpperCase()}</T>
            </Row>
          ))}
        </Card>
      ) : null}

      <Button title="Keep going" size="lg" color={accent} onPress={() => router.replace('/')} />
    </Screen>
  );
}
