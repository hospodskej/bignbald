import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { NumberField, TextField } from '@/components/Field';
import { HeroBadge } from '@/components/HeroBadge';
import { Bar, Button, Card, Chip, Panel, Row, Screen, Stat, T } from '@/components/ui';
import { hero } from '@/data/heroes';
import { DIET_STYLES, DietStyle } from '@/data/recipes';
import { confirm } from '@/lib/confirm';
import { formatInt, formatKg } from '@/lib/dates';
import { GOALS, leanMassKg, targets } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import type { Goal, Profile } from '@/lib/types';
import { level } from '@/lib/workout';
import { colors } from '@/theme/tokens';

export default function Me() {
  const { state, actions } = useStore();
  const p = state.profile;
  const h = hero(p.hero);
  const lvl = level(state.history);
  const t = targets(p);
  const lean = leanMassKg(p);
  const set = (patch: Partial<Profile>) => actions.updateProfile(patch);

  return (
    <Screen>
      <Row gap={14}>
        <HeroBadge id={p.hero} size={80} level={lvl.level} />
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h1" numberOfLines={1}>{p.name.toUpperCase()}</T>
          <T v="title" color={h.bright} style={{ fontSize: 13 }}>{h.name} · Level {lvl.level}</T>
          <Bar value={lvl.xp / lvl.need} color={h.color} height={6} />
        </View>
      </Row>

      <TextField label="Name" value={p.name} onChange={(name) => set({ name })} />

      <T v="kicker" style={{ marginTop: 6 }}>Body</T>
      <Row gap={8}>
        <NumberField label="Weight" unit="kg" value={p.weightKg} onCommit={(kg) => actions.logWeight(kg)} />
        <NumberField label="Height" unit="cm" value={p.heightCm} decimals={false} onCommit={(heightCm) => set({ heightCm })} />
        <NumberField label="Age" unit="yrs" value={p.age} decimals={false} onCommit={(age) => set({ age })} />
      </Row>
      <Row gap={6}>
        <Chip label="Male" active={p.sex === 'male'} color={h.color} onPress={() => set({ sex: 'male' })} />
        <Chip label="Female" active={p.sex === 'female'} color={h.color} onPress={() => set({ sex: 'female' })} />
      </Row>

      <Card>
        <T v="kicker">Body composition (optional)</T>
        <T v="small">Know your body fat or muscle mass (smart scale, DEXA, InBody)? Add it and calories and protein are based on your lean mass, not total weight. Much more accurate for big lifters.</T>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Chip label="Don't know" active={p.bodyComp.mode === 'none'} color={h.color} onPress={() => set({ bodyComp: { mode: 'none' } })} />
          <Chip label="Body fat %" active={p.bodyComp.mode === 'bodyFat'} color={h.color} onPress={() => set({ bodyComp: { mode: 'bodyFat', pct: 20 } })} />
          <Chip label="Muscle / lean mass" active={p.bodyComp.mode === 'leanMass'} color={h.color} onPress={() => set({ bodyComp: { mode: 'leanMass', kg: Math.round(p.weightKg * 0.75) } })} />
        </Row>
        {p.bodyComp.mode === 'bodyFat' ? (
          <NumberField label="Body fat" unit="%" value={p.bodyComp.pct} onCommit={(pct) => set({ bodyComp: { mode: 'bodyFat', pct: Math.min(60, pct) } })} />
        ) : null}
        {p.bodyComp.mode === 'leanMass' ? (
          <NumberField label="Muscle / lean mass" unit="kg" value={p.bodyComp.kg} onCommit={(kg) => set({ bodyComp: { mode: 'leanMass', kg: Math.min(p.weightKg, kg) } })} />
        ) : null}
        {lean ? (
          <T v="small" color={colors.textDim}>
            Lean mass {formatKg(Math.round(lean * 10) / 10)} kg · fat mass {formatKg(Math.round((p.weightKg - lean) * 10) / 10)} kg ({Math.round((1 - lean / p.weightKg) * 100)}%)
          </T>
        ) : null}
      </Card>

      <WeightChart />

      <T v="kicker" style={{ marginTop: 6 }}>Your goal</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(Object.keys(GOALS) as Goal[]).map((g) => {
          const on = p.goal === g;
          return (
            <Pressable key={g} onPress={() => set({ goal: g })} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={{ width: '48%', minHeight: 70, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: on ? h.color : colors.line, backgroundColor: on ? h.soft : colors.surface, gap: 3 }}>
              <T v="h2" color={on ? h.bright : colors.text} style={{ fontSize: 20 }}>{GOALS[g].label.toUpperCase()}</T>
              <T v="small" style={{ fontSize: 12 }}>{GOALS[g].sub}</T>
            </Pressable>
          );
        })}
      </View>
      <NumberField label="Goal weight" unit="kg" value={p.goalWeightKg} onCommit={(goalWeightKg) => set({ goalWeightKg })} />

      <T v="kicker" style={{ marginTop: 6 }}>Diet style</T>
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {(Object.keys(DIET_STYLES) as DietStyle[]).map((s) => (
          <Chip key={s} label={DIET_STYLES[s].label} active={p.dietStyle === s} color={colors.green} onPress={() => set({ dietStyle: s })} />
        ))}
      </Row>

      <Panel color={h.color} deep={h.deep}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T v="kicker">Daily target</T>
          <T v="display" style={{ fontSize: 34 }}>{formatInt(t.kcal)}<T v="small"> kcal</T></T>
        </Row>
        <Row gap={8}>
          <Stat label="Protein" value={String(t.protein)} unit="g" color={colors.green} />
          <Stat label="Carbs" value={String(t.carbs)} unit="g" color={colors.amber} />
          <Stat label="Fat" value={String(t.fat)} unit="g" color={colors.blue} />
        </Row>
        <T v="small">{t.formula}. Maintenance about {formatInt(t.maintenance)} kcal. {t.explain} Hard training days add up to +15% protein on top.</T>
      </Panel>

      <T v="kicker" style={{ marginTop: 6 }}>Hero</T>
      <Button title={`Change hero (now ${h.short})`} variant="outline" color={h.color} onPress={() => router.push('/train')} />
      <TextField label="Your main rival's name" value={p.rivalName} onChange={(rivalName) => set({ rivalName })} placeholder="Brother" />

      <T v="kicker" style={{ marginTop: 6 }}>Data</T>
      <Row gap={8}>
        <View style={{ flex: 1 }}>
          <Button title="Load demo" size="sm" variant="outline" color={colors.muted} onPress={() => confirm('Load demo data?', 'Replaces your workouts and diet log with 3 weeks of sample training.', actions.loadDemo, 'Load')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Start fresh" size="sm" variant="outline" color={colors.danger} onPress={() => confirm('Start fresh?', 'Deletes all workouts and diet logs. Your profile stays.', actions.startFresh, 'Delete')} />
        </View>
      </Row>
    </Screen>
  );
}

function WeightChart() {
  const { state } = useStore();
  const h = hero(state.profile.hero);
  const log = [...state.weightLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-12);
  const goal = state.profile.goalWeightKg;
  const values = [...log.map((w) => w.kg), goal];
  const min = Math.min(...values) - 0.5, max = Math.max(...values) + 0.5;
  const W = 320, H = 80;
  const y = (kg: number) => H - 6 - ((kg - min) / (max - min || 1)) * (H - 12);
  const x = (i: number) => (log.length > 1 ? 6 + (i / (log.length - 1)) * (W - 12) : W / 2);
  const delta = log.length > 1 ? log[log.length - 1].kg - log[0].kg : 0;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="kicker">Body weight</T>
        <T v="title" color={delta >= 0 ? colors.green : colors.blue} style={{ fontSize: 13 }}>{delta >= 0 ? '+' : ''}{formatKg(Math.round(delta * 10) / 10)} kg</T>
      </Row>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" accessibilityLabel="Body weight chart">
        <Line x1={0} y1={y(goal)} x2={W} y2={y(goal)} stroke={colors.lineStrong} strokeDasharray="4 4" />
        <Polyline points={log.map((w, i) => `${x(i)},${y(w.kg)}`).join(' ')} fill="none" stroke={h.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {log.length ? <Circle cx={x(log.length - 1)} cy={y(log[log.length - 1].kg)} r={5} fill={h.color} /> : null}
      </Svg>
      <T v="small">Dashed line: goal {formatKg(goal)} kg. Change your weight above to log today.</T>
    </Card>
  );
}
