import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroBadge } from '@/components/HeroBadge';
import { parseEmail, parseText, parseUsername } from '@/components/Settings';
import { Button, Halftone, Row, T } from '@/components/ui';
import { HERO_IDS, hero, HeroId } from '@/data/heroes';
import { api, setApiToken } from '@/lib/api';
import { accountOf, useStore } from '@/lib/store';
import type { Session } from '@/lib/types';
import { colors, fonts, radius } from '@/theme/tokens';

type AuthResponse = { user: { username: string; email: string }; token: string; profile?: Record<string, unknown> | null };

/**
 * The front door: you sign up or log in before anything else.
 * Sign up creates the account on the server; log in also downloads your history.
 */
export default function Auth() {
  const insets = useSafeAreaInsets();
  const { state, actions } = useStore();
  const acc = accountOf(state);
  const [mode, setMode] = useState<'signup' | 'login'>(acc.email ? 'login' : 'signup');
  const [name, setName] = useState(state.profile.name === 'You' ? '' : state.profile.name);
  const [username, setUsername] = useState(acc.username);
  const [email, setEmail] = useState(acc.email);
  const [password, setPassword] = useState('');
  const [pick, setPick] = useState<HeroId>(state.profile.hero);
  const [tried, setTried] = useState(false);
  const h = hero(pick);
  const signup = mode === 'signup';

  const errors = {
    name: signup && !parseText(1, 24)(name) ? 'Tell us what to call you' : null,
    username: signup && !parseUsername(username) ? '3-20 letters, numbers, _ or .' : null,
    email: !parseEmail(email) ? 'Enter a valid email' : null,
    password: password.length < 8 ? 'At least 8 characters' : null,
  };
  const ok = Object.values(errors).every((e) => !e);

  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async () => {
    setTried(true);
    setServerError(null);
    if (!ok || busy) return;
    setBusy(true);
    try {
      if (signup) {
        const profile = { ...state.profile, name: name.trim(), hero: pick };
        const r = await api<AuthResponse>('POST', '/auth/signup', { email, username, password, profile });
        actions.signIn({ ...r, profile });
      } else {
        const r = await api<AuthResponse>('POST', '/auth/login', { email, password });
        setApiToken(r.token);
        const [workouts, weights] = await Promise.all([
          api<Session[]>('GET', '/account/workouts'),
          api<{ date: string; kg: number }[]>('GET', '/account/weights'),
        ]);
        actions.signIn({ ...r, workouts, weights });
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const field = (label: string, value: string, onChange: (s: string) => void, error: string | null, opts: Partial<React.ComponentProps<typeof TextInput>> = {}) => (
    <View style={{ gap: 3 }}>
      <T v="kicker" style={{ fontSize: 9 }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.faint}
        style={{ height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: tried && error ? colors.danger : colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 }}
        {...opts}
      />
      {tried && error ? <T v="small" color={colors.danger} style={{ fontSize: 11 }}>{error}</T> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Halftone color={h.color} opacity={0.14} gap={12} style={{ bottom: '55%' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Row gap={14}>
            {HERO_IDS.map((id) => <HeroBadge key={id} id={id} size={52} />)}
          </Row>
          <T v="display" style={{ fontSize: 44, lineHeight: 44, textAlign: 'center' }}>BIG N BALD</T>
          <T v="small" style={{ textAlign: 'center' }}>Train like a hero. Rank up every lift.</T>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, padding: 3, borderWidth: 1, borderColor: colors.line }}>
          {(['signup', 'login'] as const).map((m) => (
            <Pressable key={m} onPress={() => { setMode(m); setTried(false); }} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}
              style={{ flex: 1, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === m ? h.color : 'transparent' }}>
              <T v="title" color={mode === m ? colors.ink : colors.muted} style={{ fontSize: 13 }}>{m === 'signup' ? 'Sign up' : 'Log in'}</T>
            </Pressable>
          ))}
        </View>

        {signup ? field('Name', name, setName, errors.name, { placeholder: 'What should we call you?', autoCapitalize: 'words' }) : null}
        {signup ? field('Username', username, setUsername, errors.username, { placeholder: 'ironbro_99' }) : null}
        {field('Email', email, setEmail, errors.email, { placeholder: 'you@example.com', keyboardType: 'email-address' })}
        {field('Password', password, setPassword, errors.password, { placeholder: '8+ characters', secureTextEntry: true, onSubmitEditing: submit })}

        {signup ? (
          <View style={{ gap: 6 }}>
            <T v="kicker" style={{ fontSize: 9 }}>Choose your hero</T>
            <Row gap={8}>
              {HERO_IDS.map((id) => {
                const o = hero(id);
                const on = id === pick;
                return (
                  <Pressable key={id} onPress={() => setPick(id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                    style={{ flex: 1, alignItems: 'center', gap: 6, padding: 10, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? o.color : colors.line, backgroundColor: on ? o.soft : colors.surface }}>
                    <HeroBadge id={id} size={40} />
                    <T v="h2" color={on ? o.bright : colors.text} style={{ fontSize: 16 }}>{o.name.toUpperCase()}</T>
                    <T v="small" style={{ fontSize: 10, textAlign: 'center' }}>{o.tags.join(' · ')}</T>
                  </Pressable>
                );
              })}
            </Row>
          </View>
        ) : null}

        {serverError ? (
          <View style={{ backgroundColor: '#2A1416', borderColor: colors.danger, borderWidth: 1, borderRadius: radius.sm, padding: 10 }}>
            <T v="small" color={colors.text}>{serverError}</T>
          </View>
        ) : null}
        <Button title={busy ? 'One sec…' : signup ? 'Create account' : 'Log in'} color={h.color} size="lg" disabled={busy} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
