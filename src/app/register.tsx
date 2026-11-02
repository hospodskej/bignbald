import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Banner, Button, Chip, Header, Row, Screen, T, tones } from '@/components/ui';
import { parseEmail, parseUsername } from '@/components/Settings';
import { hero } from '@/data/heroes';
import { accountOf, useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/theme/tokens';

/**
 * Sign up / log in. The form, validation and local profile are ready; the
 * server call plugs in here when the backend exists.
 */
export default function Register() {
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const { state, actions } = useStore();
  const h = hero(state.profile.hero);
  const acc = accountOf(state);
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode === 'login' ? 'login' : 'signup');
  const [username, setUsername] = useState(acc.username);
  const [email, setEmail] = useState(acc.email);
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);

  const errors = {
    username: mode === 'signup' && !parseUsername(username) ? '3-20 letters, numbers, _ or .' : null,
    email: !parseEmail(email) ? 'Enter a valid email' : null,
    password: password.length < 8 ? 'At least 8 characters' : null,
  };
  const ok = !errors.username && !errors.email && !errors.password;

  const submit = () => {
    setTried(true);
    if (!ok) return;
    actions.updateAccount({ status: 'registered', email: parseEmail(email)!, username: mode === 'signup' ? parseUsername(username)! : acc.username });
    router.back();
  };

  const field = (label: string, value: string, onChange: (s: string) => void, error: string | null, opts: Partial<React.ComponentProps<typeof TextInput>> = {}) => (
    <View style={{ gap: 4 }}>
      <T v="kicker" style={{ fontSize: 9 }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        placeholderTextColor={colors.faint}
        style={{ height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: tried && error ? colors.danger : colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontFamily: fonts.semibold, fontSize: 15 }}
        {...opts}
      />
      {tried && error ? <T v="small" color={colors.danger} style={{ fontSize: 11 }}>{error}</T> : null}
    </View>
  );

  return (
    <Screen>
      <Header kicker="Account" title={mode === 'signup' ? 'SIGN UP' : 'LOG IN'} color={h.bright} />
      <Row gap={6}>
        <Chip label="Sign up" active={mode === 'signup'} color={h.color} onPress={() => setMode('signup')} />
        <Chip label="Log in" active={mode === 'login'} color={h.color} onPress={() => setMode('login')} />
      </Row>
      {mode === 'signup' ? field('Username', username, setUsername, errors.username, { placeholder: 'ironbro_99' }) : null}
      {field('Email', email, setEmail, errors.email, { placeholder: 'you@example.com', keyboardType: 'email-address' })}
      {field('Password', password, setPassword, errors.password, { placeholder: '8+ characters', secureTextEntry: true })}
      <Button title={mode === 'signup' ? 'Create account' : 'Log in'} color={h.color} onPress={submit} />
      <Banner icon="lock" tone={tones.amber} title="Server not live yet" body="Your username and email are saved on this phone. When accounts go live, this screen signs you in for real and syncs everything you logged." />
    </Screen>
  );
}
