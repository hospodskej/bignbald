import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { HeroBadge } from '@/components/HeroBadge';
import {
  ChoiceEditor, parseEmail, parseNumber, parseText, parseUsername, Section, SettingRow, TextEditor,
} from '@/components/Settings';
import { Bar, Card, Halftone, Panel, Row, Screen, Stat, T } from '@/components/ui';
import { HERO_IDS, hero, HeroId } from '@/data/heroes';
import { DIET_STYLES, DietStyle } from '@/data/recipes';
import { confirm } from '@/lib/confirm';
import { formatInt, formatKg } from '@/lib/dates';
import { GOALS, leanMassKg, targets } from '@/lib/nutrition';
import { accountOf, useStore } from '@/lib/store';
import type { Goal, Profile, Sex } from '@/lib/types';
import { finished, level, weekStreak } from '@/lib/workout';
import { colors } from '@/theme/tokens';

type Field =
  | 'name' | 'username' | 'email' | 'weight' | 'height' | 'age' | 'sex' | 'bodyComp' | 'goal' | 'goalWeight' | 'diet' | 'hero' | 'rival';

export default function Me() {
  const { state, actions } = useStore();
  const p = state.profile;
  const acc = accountOf(state);
  const h = hero(p.hero);
  const lvl = level(state.history);
  const t = targets(p);
  const lean = leanMassKg(p);
  const [editing, setEditing] = useState<Field | null>(null);

  const set = (patch: Partial<Profile>) => {
    actions.updateProfile(patch);
    setEditing(null);
  };
  /** Props for one row: open/close it, and a ready-made Save/Cancel text editor when asked. */
  const row = (f: Field) => ({ open: editing === f, onToggle: () => setEditing((e) => (e === f ? null : f)) });
  const close = () => setEditing(null);

  const bodyCompLabel =
    p.bodyComp.mode === 'bodyFat' ? `${p.bodyComp.pct}% body fat` : p.bodyComp.mode === 'leanMass' ? `${formatKg(p.bodyComp.kg)} kg lean` : '';

  return (
    <Screen>
      {/* Identity */}
      <Panel color={h.color} deep={h.deep} bg="#14121A">
        <Halftone color={h.color} opacity={0.2} style={{ left: '50%' }} />
        <Row gap={12}>
          <HeroBadge id={p.hero} size={60} level={lvl.level} />
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h1" numberOfLines={1}>{p.name.toUpperCase()}</T>
            <T v="small">{acc.username ? `@${acc.username}` : acc.email}</T>
            <T v="title" color={h.bright} style={{ fontSize: 12 }}>{h.name} · Level {lvl.level}</T>
          </View>
        </Row>
        <Bar value={lvl.xp / lvl.need} color={h.color} height={5} />
        <Row gap={6}>
          <Stat label="Workouts" value={String(finished(state.history).length)} />
          <Stat label="Streak" value={String(weekStreak(state.history))} unit="wk" />
          <Stat label="XP to next" value={String(lvl.need - lvl.xp)} />
        </Row>
      </Panel>

      <Section title="Account">
        <SettingRow label="Display name" value={p.name} {...row('name')}
          editor={<TextEditor initial={p.name} accent={h.color} parse={parseText(1, 24)} error="1 to 24 characters" onCancel={close} onSave={(name) => set({ name })} />} />
        <SettingRow label="Username" value={acc.username ? `@${acc.username}` : ''} hint="Shown on leaderboards" {...row('username')}
          editor={<TextEditor initial={acc.username} accent={h.color} placeholder="ironbro_99" parse={parseUsername} error="3-20 letters, numbers, _ or ." onCancel={close} onSave={(username) => { actions.updateAccount({ username }); close(); }} />} />
        <SettingRow label="Email" value={acc.email} last {...row('email')}
          editor={<TextEditor initial={acc.email} accent={h.color} keyboard="email-address" placeholder="you@example.com" parse={parseEmail} error="Not a valid email" onCancel={close} onSave={(email) => { actions.updateAccount({ email }); close(); }} />} />
      </Section>

      <Section title="Body">
        <SettingRow label="Weight" value={`${formatKg(p.weightKg)} kg`} hint="Saving logs today's weight" {...row('weight')}
          editor={<TextEditor initial={String(p.weightKg)} accent={h.color} unit="kg" keyboard="decimal-pad" parse={parseNumber(30, 300)} error="30-300 kg" onCancel={close} onSave={(kg) => { actions.logWeight(kg); close(); }} />} />
        <SettingRow label="Height" value={`${p.heightCm} cm`} {...row('height')}
          editor={<TextEditor initial={String(p.heightCm)} accent={h.color} unit="cm" keyboard="number-pad" parse={parseNumber(120, 230, false)} error="120-230 cm" onCancel={close} onSave={(heightCm) => set({ heightCm })} />} />
        <SettingRow label="Age" value={`${p.age}`} {...row('age')}
          editor={<TextEditor initial={String(p.age)} accent={h.color} unit="years" keyboard="number-pad" parse={parseNumber(13, 99, false)} error="13-99" onCancel={close} onSave={(age) => set({ age })} />} />
        <SettingRow label="Sex" value={p.sex === 'male' ? 'Male' : 'Female'} hint="Used for calorie and micronutrient targets" {...row('sex')}
          editor={<ChoiceEditor<Sex> accent={h.color} value={p.sex} options={[{ key: 'male', label: 'Male' }, { key: 'female', label: 'Female' }]} onPick={(sex) => set({ sex })} />} />
        <SettingRow label="Body composition" value={bodyCompLabel} hint="Optional · makes targets more accurate" last {...row('bodyComp')}
          editor={<BodyCompEditor accent={h.color} profile={p} onCancel={close} onSave={(bodyComp) => set({ bodyComp })} />} />
      </Section>
      {lean ? (
        <T v="small" style={{ marginTop: -4, paddingHorizontal: 2 }}>
          Lean mass {formatKg(Math.round(lean * 10) / 10)} kg · fat {formatKg(Math.round((p.weightKg - lean) * 10) / 10)} kg ({Math.round((1 - lean / p.weightKg) * 100)}%)
        </T>
      ) : null}

      <WeightChart />

      <Section title="Goal & diet">
        <SettingRow label="Goal" value={GOALS[p.goal].label} {...row('goal')}
          editor={<ChoiceEditor<Goal> accent={h.color} value={p.goal} options={(Object.keys(GOALS) as Goal[]).map((g) => ({ key: g, label: GOALS[g].label, sub: GOALS[g].sub }))} onPick={(goal) => set({ goal })} />} />
        <SettingRow label="Goal weight" value={`${formatKg(p.goalWeightKg)} kg`} {...row('goalWeight')}
          editor={<TextEditor initial={String(p.goalWeightKg)} accent={h.color} unit="kg" keyboard="decimal-pad" parse={parseNumber(30, 300)} error="30-300 kg" onCancel={close} onSave={(goalWeightKg) => set({ goalWeightKg })} />} />
        <SettingRow label="Diet style" value={DIET_STYLES[p.dietStyle].label} hint="Changes your meal plan and macro split" last {...row('diet')}
          editor={<ChoiceEditor<DietStyle> accent={colors.green} value={p.dietStyle} options={(Object.keys(DIET_STYLES) as DietStyle[]).map((d) => ({ key: d, label: DIET_STYLES[d].label }))} onPick={(dietStyle) => set({ dietStyle })} />} />
      </Section>

      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T v="kicker">Daily target</T>
          <T v="h1">{formatInt(t.kcal)}<T v="small"> kcal</T></T>
        </Row>
        <Row gap={6}>
          <Stat label="Protein" value={String(t.protein)} unit="g" color={colors.green} />
          <Stat label="Carbs" value={String(t.carbs)} unit="g" color={colors.amber} />
          <Stat label="Fat" value={String(t.fat)} unit="g" color={colors.blue} />
        </Row>
        <T v="small" style={{ fontSize: 11 }}>{t.formula} · maintenance ~{formatInt(t.maintenance)} kcal. {t.explain} Hard training days add up to +15% protein.</T>
      </Card>

      <Section title="Training">
        <SettingRow label="Hero" value={h.name} hint="Your plan and your avatar" {...row('hero')}
          editor={<ChoiceEditor<HeroId> accent={h.color} value={p.hero} options={HERO_IDS.map((id) => ({ key: id, label: hero(id).name, sub: hero(id).tags.join(' · ') }))}
            onPick={(id) => (id === p.hero ? close() : confirm(`Become ${hero(id).name}?`, 'Your plan and avatar switch. History and ranks stay.', () => set({ hero: id }), 'Switch'))} />} />
        <SettingRow label="Main rival" value={p.rivalName} hint="Shown in your duel on Home" last {...row('rival')}
          editor={<TextEditor initial={p.rivalName} accent={h.color} parse={parseText(1, 20)} error="1 to 20 characters" onCancel={close} onSave={(rivalName) => set({ rivalName })} />} />
      </Section>

      <Section title="Session & data">
        <Pressable onPress={() => confirm('Log out?', 'Your data stays on this device.', () => actions.updateAccount({ status: 'guest' }), 'Log out')} style={dataRow}>
          <T v="body" color={colors.textDim}>Log out</T>
        </Pressable>
        <Pressable onPress={() => confirm('Load demo data?', 'Replaces workouts and diet logs with 3 weeks of sample training.', actions.loadDemo, 'Load')} style={dataRow}>
          <T v="body" color={colors.textDim}>Load demo data</T>
        </Pressable>
        <Pressable onPress={() => confirm('Start fresh?', 'Deletes all workouts and diet logs. Your profile stays.', actions.startFresh, 'Delete')} style={[dataRow, { borderBottomWidth: 0 }]}>
          <T v="body" color={colors.danger}>Delete my workouts and logs</T>
        </Pressable>
      </Section>
    </Screen>
  );
}

const dataRow = { minHeight: 44, justifyContent: 'center' as const, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.line };

function BodyCompEditor({ profile, accent, onSave, onCancel }: {
  profile: Profile; accent: string; onSave: (b: Profile['bodyComp']) => void; onCancel: () => void;
}) {
  const [mode, setMode] = useState(profile.bodyComp.mode);
  return (
    <>
      <ChoiceEditor<Profile['bodyComp']['mode']>
        accent={accent}
        value={mode}
        onPick={(m) => (m === 'none' ? onSave({ mode: 'none' }) : setMode(m))}
        options={[{ key: 'none', label: "Don't know" }, { key: 'bodyFat', label: 'Body fat %' }, { key: 'leanMass', label: 'Muscle / lean mass' }]}
      />
      {mode === 'bodyFat' ? (
        <TextEditor key="bf" initial={profile.bodyComp.mode === 'bodyFat' ? String(profile.bodyComp.pct) : ''} placeholder="e.g. 18" accent={accent} unit="%" keyboard="decimal-pad"
          parse={parseNumber(3, 60)} error="3-60 %" onCancel={onCancel} onSave={(pct) => onSave({ mode: 'bodyFat', pct })} />
      ) : null}
      {mode === 'leanMass' ? (
        <TextEditor key="lm" initial={profile.bodyComp.mode === 'leanMass' ? String(profile.bodyComp.kg) : ''} placeholder="e.g. 80" accent={accent} unit="kg" keyboard="decimal-pad"
          parse={parseNumber(20, profile.weightKg)} error={`20-${profile.weightKg} kg (can't exceed your weight)`} onCancel={onCancel} onSave={(kg) => onSave({ mode: 'leanMass', kg })} />
      ) : null}
      <T v="small" style={{ fontSize: 11 }}>From a smart scale, DEXA or InBody. With it, calories use Katch-McArdle and protein is set per kg of lean mass.</T>
    </>
  );
}

function WeightChart() {
  const { state } = useStore();
  const h = hero(state.profile.hero);
  const log = [...state.weightLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-12);
  const goal = state.profile.goalWeightKg;
  const values = [...log.map((w) => w.kg), goal];
  const min = Math.min(...values) - 0.5, max = Math.max(...values) + 0.5;
  const W = 320, H = 64;
  const y = (kg: number) => H - 5 - ((kg - min) / (max - min || 1)) * (H - 10);
  const x = (i: number) => (log.length > 1 ? 5 + (i / (log.length - 1)) * (W - 10) : W / 2);
  const delta = log.length > 1 ? log[log.length - 1].kg - log[0].kg : 0;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="kicker">Body weight</T>
        <T v="small" color={delta >= 0 ? colors.green : colors.blue}>{delta >= 0 ? '+' : ''}{formatKg(Math.round(delta * 10) / 10)} kg · goal {formatKg(goal)} kg</T>
      </Row>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" accessibilityLabel="Body weight chart">
        <Line x1={0} y1={y(goal)} x2={W} y2={y(goal)} stroke={colors.lineStrong} strokeDasharray="4 4" />
        <Polyline points={log.map((w, i) => `${x(i)},${y(w.kg)}`).join(' ')} fill="none" stroke={h.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {log.length ? <Circle cx={x(log.length - 1)} cy={y(log[log.length - 1].kg)} r={4} fill={h.color} /> : null}
      </Svg>
    </Card>
  );
}
