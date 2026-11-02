import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { LiftAnimation } from '@/components/LiftAnimation';
import { RankPill } from '@/components/Rank';
import { Banner, Button, Panel, Row, Screen, T, tones } from '@/components/ui';
import { exercise, FAMILIES } from '@/data/exercises';
import { hero } from '@/data/heroes';
import { planDay } from '@/data/plans';
import { confirm } from '@/lib/confirm';
import { formatClock, formatKg } from '@/lib/dates';
import { useStore } from '@/lib/store';
import type { LoggedSet } from '@/lib/types';
import { lastSets, MIN_REPS, rankOf, suggestion } from '@/lib/workout';
import { colors, fonts } from '@/theme/tokens';

function useClock(from: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return formatClock(now - from);
}

const entryDone = (sets: LoggedSet[]) => sets.every((s) => s.done);

export default function Workout() {
  const { state, actions } = useStore();
  const session = state.active;
  const firstOpen = session ? Math.max(0, session.entries.findIndex((e) => !entryDone(e.sets))) : 0;
  const [open, setOpen] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const clock = useClock(session?.startedAt ?? 0);
  if (!session) return <Redirect href="/" />;

  const h = hero(session.hero);
  const day = planDay(session.hero, session.dayId);
  const current = open ?? firstOpen;

  const finish = () =>
    confirm('Finish workout?', 'Your sets are saved and ranks update.', () => {
      actions.finishWorkout();
      router.replace('/rankup');
    }, 'Finish');
  const quit = () => confirm('Discard workout?', 'Nothing from this session will be saved.', () => {
    actions.discardWorkout();
    router.replace('/');
  }, 'Discard');

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={quit} accessibilityRole="button" accessibilityLabel="Discard workout" style={{ width: 44, height: 44, justifyContent: 'center' }}>
          <Icon name="close" size={22} color={colors.muted} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <T v="kicker" color={h.bright}>{h.name}</T>
          <T v="h1">{day.name.toUpperCase()}</T>
        </View>
        <T v="title" color={colors.muted} style={{ fontVariant: ['tabular-nums'] }}>{clock}</T>
        <Pressable onPress={finish} accessibilityRole="button" style={{ height: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.green, justifyContent: 'center', marginLeft: 10 }}>
          <T v="title" color={colors.ink} style={{ fontSize: 14 }}>Finish</T>
        </Pressable>
      </Row>

      <Row gap={4}>
        {session.entries.map((e, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: entryDone(e.sets) ? h.color : e.sets.some((s) => s.done) ? h.deep : colors.line }} />
        ))}
      </Row>

      {session.entries.map((entry, i) => {
        const e = exercise(entry.exerciseId);
        const slot = day.slots[entry.slot];
        const done = entryDone(entry.sets);
        if (i !== current) {
          return (
            <Pressable key={i} onPress={() => setOpen(i)} accessibilityRole="button">
              <Row gap={10} style={{ backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, minHeight: 50 }}>
                {done ? <Icon name="check" size={18} color={colors.green} strokeWidth={3} /> : <T v="h2" color={colors.faint} style={{ fontSize: 18, width: 18 }}>{i + 1}</T>}
                <View style={{ flex: 1 }}>
                  <T v="title" color={done ? colors.muted : colors.text} style={{ fontSize: 15 }}>{e.name}</T>
                </View>
                <T v="small">{entry.sets.filter((s) => s.done).length}/{entry.sets.length} sets</T>
              </Row>
            </Pressable>
          );
        }
        const sug = dismissed[e.id] ? null : suggestion(state.history, e.id);
        const last = lastSets(state.history, e.id);
        return (
          <Panel key={i} color={h.color} deep={h.deep} pad={14}>
            <Row gap={12} style={{ alignItems: 'flex-start' }}>
              <LiftAnimation pose={e.pose} gear={e.gear} accent={h.color} size={104} />
              <View style={{ flex: 1, gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="kicker" style={{ flex: 1 }}>{i + 1} of {session.entries.length}{slot.any ? ` · any ${FAMILIES[slot.family].toLowerCase()}` : ''}</T>
                </Row>
                <T v="h2" style={{ fontSize: 26, lineHeight: 26 }}>{e.name.toUpperCase()}</T>
                <RankPill rank={rankOf(state.history, e.id)} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/swap', params: { entry: String(i) } })}
                  style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surfaceSunk }}>
                  <Icon name="swap" size={14} color={colors.text} />
                  <T v="small" color={colors.text}>{slot.any ? 'Pick variation' : 'Swap'}</T>
                </Pressable>
              </View>
            </Row>

            {sug?.kind === 'upgrade' ? (
              <Banner
                icon="up"
                tone={tones.amber}
                title="Time for an upgrade"
                body={`${sug.reps[0]} and ${sug.reps[1]} reps at ${formatKg(sug.fromKg)} kg the last two times. Try ${formatKg(sug.toKg)} kg.`}
                action={
                  <Row>
                    <View style={{ flex: 1 }}><Button title={`Use ${formatKg(sug.toKg)} kg`} size="sm" color={colors.amber} onPress={() => { actions.useWeight(i, sug.toKg); setDismissed((d) => ({ ...d, [e.id]: true })); }} /></View>
                    <View style={{ flex: 1 }}><Button title="Not yet" size="sm" variant="outline" color={colors.amber} onPress={() => { actions.useWeight(i, sug.fromKg); setDismissed((d) => ({ ...d, [e.id]: true })); }} /></View>
                  </Row>
                }
              />
            ) : sug?.kind === 'deload' ? (
              <Banner icon="down" tone={tones.amber} title="Ease off a little" body={`Under ${MIN_REPS} reps last time at ${formatKg(sug.fromKg)} kg. Try ${formatKg(sug.toKg)} kg and own the reps.`} />
            ) : null}

            <Row gap={8}>
              <T v="kicker" style={{ width: 30, fontSize: 10 }}>Set</T>
              <T v="kicker" style={{ flex: 1, fontSize: 10 }}>Last</T>
              <T v="kicker" style={{ width: 72, fontSize: 10 }}>{e.perSide ? 'Kg each' : 'Kg'}</T>
              <T v="kicker" style={{ width: 58, fontSize: 10 }}>Reps</T>
              <View style={{ width: 44 }} />
            </Row>
            {entry.sets.map((s, si) => {
              const prev = last[si];
              return (
                <Row key={si} gap={8} style={{ backgroundColor: s.done ? '#13261D' : 'transparent', borderRadius: 10, paddingVertical: 3 }}>
                  <T v="h2" style={{ width: 30, textAlign: 'center', fontSize: 20 }}>{si + 1}</T>
                  <T v="small" style={{ flex: 1 }}>{prev ? `${formatKg(parseFloat(prev.kg))} × ${prev.reps}` : '—'}</T>
                  <SetInput label={`Set ${si + 1} weight`} value={s.kg} onChange={(kg) => actions.updateSet(i, si, { kg })} width={72} decimal />
                  <SetInput label={`Set ${si + 1} reps`} value={s.reps} placeholder={`${MIN_REPS}+`} onChange={(reps) => actions.updateSet(i, si, { reps })} width={58} highlight={!s.done && si === entry.sets.findIndex((x) => !x.done) ? h.color : undefined} />
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: s.done }}
                    accessibilityLabel={`Set ${si + 1} done`}
                    onPress={() => {
                      if (!s.done && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      actions.updateSet(i, si, { done: !s.done, reps: !s.done && !s.reps && prev ? prev.reps : s.reps });
                    }}
                    style={{ width: 44, height: 40, borderRadius: 10, borderWidth: 1, borderColor: s.done ? colors.green : colors.lineStrong, backgroundColor: s.done ? colors.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={18} color={s.done ? colors.ink : colors.faint} strokeWidth={3} />
                  </Pressable>
                </Row>
              );
            })}
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="small">Minimum {MIN_REPS} reps. Go to failure.</T>
              <Row gap={6}>
                <Pressable onPress={() => actions.removeSet(i)} accessibilityLabel="Remove a set" style={smallBtn}><Icon name="minus" size={16} color={colors.textDim} /></Pressable>
                <Pressable onPress={() => actions.addSet(i)} accessibilityLabel="Add a set" style={smallBtn}><Icon name="plus" size={16} color={colors.textDim} /></Pressable>
              </Row>
            </Row>
            {done && i < session.entries.length - 1 ? (
              <Button title="Next exercise" color={h.color} onPress={() => setOpen(i + 1)} />
            ) : null}
            {done && i === session.entries.length - 1 ? <Button title="Finish workout" color={colors.green} onPress={finish} /> : null}
          </Panel>
        );
      })}
    </Screen>
  );
}

const smallBtn = { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' } as const;

function SetInput({ label, value, onChange, width, placeholder, decimal, highlight }: {
  label: string; value: string; onChange: (s: string) => void; width: number; placeholder?: string; decimal?: boolean; highlight?: string;
}) {
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={(t) => onChange(t.replace(/[^0-9.,]/g, ''))}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      selectTextOnFocus
      style={{
        width, height: 40, borderRadius: 10, borderWidth: 1, borderColor: highlight ?? colors.lineStrong, backgroundColor: colors.surfaceSunk,
        color: colors.text, textAlign: 'center', fontFamily: fonts.bold, fontSize: 16,
      }}
    />
  );
}
