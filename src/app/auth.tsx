import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, TextInputProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BodyMap } from '@/components/BodyMap';
import { HeroBadge } from '@/components/HeroBadge';
import { Icon } from '@/components/Icon';
import { parseEmail, parseText, parseUsername } from '@/components/Settings';
import { Button, Halftone, Row, Stat, T } from '@/components/ui';
import { exercise } from '@/data/exercises';
import { HERO_IDS, hero, HeroId } from '@/data/heroes';
import { combineHeat } from '@/data/muscles';
import { PLANS } from '@/data/plans';
import { api, setApiToken } from '@/lib/api';
import { dayKey, formatInt } from '@/lib/dates';
import { GOALS, targets } from '@/lib/nutrition';
import { defaultProfile } from '@/lib/seed';
import { useStore } from '@/lib/store';
import type { FoodLogItem, Goal, MealPlan, Profile, Session, Sex } from '@/lib/types';
import { colors, fonts, radius } from '@/theme/tokens';

type AuthResponse = { user: { username: string; email: string }; token: string; profile?: Record<string, unknown> | null };
type Step = 'account' | 'hero' | 'body' | 'goal';
const STEPS: Step[] = ['account', 'hero', 'body', 'goal'];
const STEP_TITLE: Record<Step, string> = {
  account: 'CREATE YOUR ACCOUNT',
  hero: 'CHOOSE YOUR HERO',
  body: 'ABOUT YOUR BODY',
  goal: "WHAT'S THE GOAL?",
};

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
const inRange = (s: string, min: number, max: number) => num(s) >= min && num(s) <= max;

/** How hard each plan works each muscle over a whole week. */
const planHeat = (id: HeroId) =>
  combineHeat(PLANS[id].days.flatMap((d) => d.slots.map((s) => ({ heat: exercise(s.exercise).heat, weight: s.sets }))));

/**
 * The front door. Log in is one screen; sign up is four short steps
 * (account, hero, body, goal) ending with your daily targets.
 * Diet style is picked later, in the Diet tab.
 */
export default function Auth() {
  const insets = useSafeAreaInsets();
  const { actions } = useStore();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [taken, setTaken] = useState<{ email: string | null; username: string | null }>({ email: null, username: null });

  // Account
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Hero
  const [heroId, setHeroId] = useState<HeroId>('brawler');
  // Body
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [compMode, setCompMode] = useState<Profile['bodyComp']['mode']>('none');
  const [compValue, setCompValue] = useState('');
  // Goal
  const [goal, setGoal] = useState<Goal>('bigger');
  const [goalWeight, setGoalWeight] = useState('');

  const h = hero(heroId);
  const signup = mode === 'signup';
  const current = STEPS[step];

  const errors: Record<string, string | null> = {
    name: signup && !parseText(1, 24)(name) ? 'Tell us what to call you' : null,
    username: signup && !parseUsername(username) ? '3-20 letters, numbers, _ or .' : taken.username,
    email: !parseEmail(email) ? 'Enter a valid email' : taken.email,
    password: password.length < 8 ? 'At least 8 characters' : null,
    age: !inRange(age, 13, 99) ? 'Age 13-99' : null,
    height: !inRange(height, 120, 230) ? 'Height in cm, 120-230' : null,
    weight: !inRange(weight, 30, 300) ? 'Weight in kg, 30-300' : null,
    comp:
      compMode === 'bodyFat' && !inRange(compValue, 3, 60) ? 'Body fat 3-60 %'
      : compMode === 'leanMass' && !inRange(compValue, 20, num(weight) || 300) ? "Lean mass can't be more than your weight"
      : null,
    goalWeight: !inRange(goalWeight, 30, 300) ? 'Goal weight in kg, 30-300' : null,
  };
  const stepFields: Record<Step, string[]> = {
    account: signup ? ['name', 'username', 'email', 'password'] : ['email', 'password'],
    hero: [],
    body: ['age', 'height', 'weight', 'comp'],
    goal: ['goalWeight'],
  };
  const stepOk = stepFields[current].every((f) => !errors[f]);

  const profile: Profile = useMemo(
    () => ({
      ...defaultProfile,
      name: name.trim(),
      hero: heroId,
      sex,
      age: Math.round(num(age)) || defaultProfile.age,
      heightCm: Math.round(num(height)) || defaultProfile.heightCm,
      weightKg: num(weight) || defaultProfile.weightKg,
      bodyComp:
        compMode === 'bodyFat' ? { mode: 'bodyFat', pct: num(compValue) }
        : compMode === 'leanMass' ? { mode: 'leanMass', kg: num(compValue) }
        : { mode: 'none' },
      goal,
      goalWeightKg: num(goalWeight) || defaultProfile.goalWeightKg,
      rivalName: '',
    }),
    [name, heroId, sex, age, height, weight, compMode, compValue, goal, goalWeight],
  );

  const fail = (e: unknown) => setServerError(e instanceof Error ? e.message : 'Something went wrong');

  const login = async () => {
    const r = await api<AuthResponse>('POST', '/auth/login', { email, password });
    setApiToken(r.token);
    const [workouts, weights, foodLogs, days, mealPlan] = await Promise.all([
      api<Session[]>('GET', '/account/workouts'),
      api<{ date: string; kg: number }[]>('GET', '/account/weights'),
      api<FoodLogItem[]>('GET', '/account/food-logs'),
      api<{ date: string; mealsEaten: string[]; waterMl: number }[]>('GET', '/account/days'),
      api<{ plan: MealPlan | null; groceryChecked: string[] }>('GET', '/account/meal-plan'),
    ]);
    actions.signIn({ ...r, workouts, weights, foodLogs, days, mealPlan: mealPlan.plan ? { plan: mealPlan.plan, groceryChecked: mealPlan.groceryChecked } : null });
  };

  const createAccount = async () => {
    const r = await api<AuthResponse>('POST', '/auth/signup', { email, username, password, profile });
    setApiToken(r.token);
    await api('PUT', '/account/weights', { date: dayKey(), kg: profile.weightKg }).catch(() => {});
    actions.signIn({ ...r, profile });
  };

  const next = async () => {
    setTried(true);
    setServerError(null);
    if (!stepOk || busy) return;
    setBusy(true);
    try {
      if (!signup) return await login();
      if (current === 'account') {
        const t = await api<{ email: string | null; username: string | null }>('POST', '/auth/check', { email, username });
        setTaken(t);
        if (t.email || t.username) return;
      }
      if (current === 'body' && !goalWeight) setGoalWeight(String(Math.round(num(weight) + (goal === 'bigger' ? 5 : 0))));
      if (current === 'goal') return await createAccount();
      setStep((s) => s + 1);
      setTried(false);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setServerError(null);
    setTried(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const t = targets(profile);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Halftone color={h.color} opacity={0.12} gap={12} style={{ bottom: '60%' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Row gap={12}>{HERO_IDS.map((id) => <HeroBadge key={id} id={id} size={46} />)}</Row>
            <T v="display" style={{ fontSize: 40, lineHeight: 42, textAlign: 'center' }}>BIG N BALD</T>
            <T v="small" style={{ textAlign: 'center' }}>Train like a hero. Rank up every lift.</T>
          </View>
        ) : (
          <Row gap={10}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="back" size={18} />
            </Pressable>
            <T v="kicker" style={{ flex: 1 }}>Step {step + 1} of {STEPS.length}</T>
          </Row>
        )}

        {signup ? (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {STEPS.map((s, i) => (
              <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? h.color : colors.line }} />
            ))}
          </View>
        ) : null}

        {step === 0 ? (
          <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, padding: 3, borderWidth: 1, borderColor: colors.line }}>
            {(['signup', 'login'] as const).map((m) => (
              <Pressable key={m} onPress={() => { setMode(m); setTried(false); setServerError(null); }} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}
                style={{ flex: 1, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === m ? h.color : 'transparent' }}>
                <T v="title" color={mode === m ? colors.ink : colors.muted} style={{ fontSize: 13 }}>{m === 'signup' ? 'Sign up' : 'Log in'}</T>
              </Pressable>
            ))}
          </View>
        ) : null}

        {signup ? <T v="h1">{STEP_TITLE[current]}</T> : null}

        {current === 'account' ? (
          <>
            {signup ? <Field label="Name" value={name} onChangeText={setName} error={tried ? errors.name : null} placeholder="What should we call you?" autoCapitalize="words" /> : null}
            {signup ? <Field label="Username" value={username} onChangeText={(v) => { setUsername(v); setTaken((x) => ({ ...x, username: null })); }} error={tried || taken.username ? errors.username : null} placeholder="ironbro_99" /> : null}
            <Field label="Email" value={email} onChangeText={(v) => { setEmail(v); setTaken((x) => ({ ...x, email: null })); }} error={tried || taken.email ? errors.email : null} placeholder="you@example.com" keyboardType="email-address" />
            <Field label="Password" value={password} onChangeText={setPassword} error={tried ? errors.password : null} placeholder="8+ characters" secureTextEntry onSubmitEditing={next} />
          </>
        ) : null}

        {current === 'hero' ? (
          <>
            <T v="small">Your hero is your training plan and your avatar. You can switch later.</T>
            {HERO_IDS.map((id) => {
              const o = hero(id);
              const on = id === heroId;
              return (
                <Pressable key={id} onPress={() => setHeroId(id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? o.color : colors.line, backgroundColor: on ? o.soft : colors.surface }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Row gap={8}>
                      <HeroBadge id={id} size={36} />
                      <T v="h2" color={on ? o.bright : colors.text}>{o.name.toUpperCase()}</T>
                    </Row>
                    <T v="small" color={colors.textDim}>{o.tagline}</T>
                    <T v="kicker" color={on ? o.bright : colors.muted} style={{ fontSize: 9 }}>{o.tags.join(' · ')}</T>
                  </View>
                  <BodyMap heat={planHeat(id)} height={110} />
                </Pressable>
              );
            })}
          </>
        ) : null}

        {current === 'body' ? (
          <>
            <T v="small">Used to work out your calories and protein.</T>
            <Choice options={[['male', 'Male'], ['female', 'Female']]} value={sex} onPick={setSex} accent={h.color} />
            <Row gap={8} style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}><Field label="Age" value={age} onChangeText={setAge} error={tried ? errors.age : null} placeholder="24" keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Field label="Height (cm)" value={height} onChangeText={setHeight} error={tried ? errors.height : null} placeholder="183" keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Field label="Weight (kg)" value={weight} onChangeText={setWeight} error={tried ? errors.weight : null} placeholder="80" keyboardType="decimal-pad" /></View>
            </Row>
            <T v="kicker" style={{ fontSize: 9, marginTop: 4 }}>Body composition (optional)</T>
            <Choice options={[['none', "Don't know"], ['bodyFat', 'Body fat %'], ['leanMass', 'Muscle mass']]} value={compMode} onPick={(m) => { setCompMode(m); setCompValue(''); }} accent={h.color} />
            {compMode !== 'none' ? (
              <Field
                label={compMode === 'bodyFat' ? 'Body fat (%)' : 'Muscle / lean mass (kg)'}
                value={compValue}
                onChangeText={setCompValue}
                error={tried ? errors.comp : null}
                placeholder={compMode === 'bodyFat' ? '18' : '65'}
                keyboardType="decimal-pad"
              />
            ) : null}
            <T v="small" style={{ fontSize: 11 }}>From a smart scale or DEXA scan. With it, calories and protein are based on your lean mass, which is more accurate for big lifters.</T>
          </>
        ) : null}

        {current === 'goal' ? (
          <>
            {(Object.keys(GOALS) as Goal[]).map((g) => {
              const on = g === goal;
              return (
                <Pressable key={g} onPress={() => setGoal(g)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={{ padding: 12, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? h.color : colors.line, backgroundColor: on ? h.soft : colors.surface, gap: 2 }}>
                  <T v="h2" color={on ? h.bright : colors.text}>{GOALS[g].label.toUpperCase()}</T>
                  <T v="small">{GOALS[g].sub}</T>
                </Pressable>
              );
            })}
            <Field label="Goal weight (kg)" value={goalWeight} onChangeText={setGoalWeight} error={tried ? errors.goalWeight : null} placeholder="85" keyboardType="decimal-pad" />
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: h.color, padding: 12, gap: 8 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <T v="kicker">Your daily target</T>
                <T v="h1">{formatInt(t.kcal)}<T v="small"> kcal</T></T>
              </Row>
              <Row gap={6}>
                <Stat label="Protein" value={String(t.protein)} unit="g" color={colors.green} />
                <Stat label="Carbs" value={String(t.carbs)} unit="g" color={colors.amber} />
                <Stat label="Fat" value={String(t.fat)} unit="g" color={colors.blue} />
              </Row>
              <T v="small" style={{ fontSize: 11 }}>{t.explain} Goes up on hard training days. Pick your diet style in the Diet tab. You can change all of this later.</T>
            </View>
          </>
        ) : null}

        {serverError ? (
          <View style={{ backgroundColor: '#2A1416', borderColor: colors.danger, borderWidth: 1, borderRadius: radius.sm, padding: 10 }}>
            <T v="small" color={colors.text}>{serverError}</T>
          </View>
        ) : null}

        <Button
          title={busy ? 'One sec…' : !signup ? 'Log in' : current === 'goal' ? 'Create account' : 'Next'}
          color={h.color}
          size="lg"
          disabled={busy}
          onPress={next}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, ...input }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ gap: 3 }}>
      <T v="kicker" style={{ fontSize: 9 }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.faint}
        style={{ height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: error ? colors.danger : colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 }}
        {...input}
      />
      {error ? <T v="small" color={colors.danger} style={{ fontSize: 11 }}>{error}</T> : null}
    </View>
  );
}

function Choice<K extends string>({ options, value, onPick, accent }: { options: [K, string][]; value: K; onPick: (k: K) => void; accent: string }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, padding: 3, borderWidth: 1, borderColor: colors.line }}>
      {options.map(([k, label]) => (
        <Pressable key={k} onPress={() => onPick(k)} accessibilityRole="radio" accessibilityState={{ selected: value === k }}
          style={{ flex: 1, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: value === k ? accent : 'transparent' }}>
          <T v="title" color={value === k ? colors.ink : colors.muted} style={{ fontSize: 13 }}>{label}</T>
        </Pressable>
      ))}
    </View>
  );
}
