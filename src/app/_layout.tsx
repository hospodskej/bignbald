import {
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_800ExtraBold_Italic,
} from '@expo-google-fonts/barlow-condensed';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PhoneFrame } from '@/components/PhoneFrame';
import { accountOf, StoreProvider, useStore } from '@/lib/store';
import { colors, fonts } from '@/theme/tokens';

const Loading = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
    <ActivityIndicator color="#FF4D3D" />
  </View>
);

export default function RootLayout() {
  const [loaded] = useFonts({
    [fonts.display]: BarlowCondensed_800ExtraBold_Italic,
    [fonts.displayUpright]: BarlowCondensed_800ExtraBold,
    [fonts.body]: Inter_400Regular,
    [fonts.medium]: Inter_500Medium,
    [fonts.semibold]: Inter_600SemiBold,
    [fonts.bold]: Inter_700Bold,
    [fonts.black]: Inter_800ExtraBold,
  });

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <PhoneFrame>
        {loaded ? (
          <StoreProvider fallback={<Loading />}>
            <RootStack />
          </StoreProvider>
        ) : (
          <Loading />
        )}
      </PhoneFrame>
    </SafeAreaProvider>
  );
}

/** Signed out: only the auth screen exists. Signed in: the whole app. */
function RootStack() {
  const { state } = useStore();
  const signedIn = accountOf(state).status === 'registered';
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout" options={{ gestureEnabled: false }} />
        <Stack.Screen name="swap" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="rankup" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="add-food" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="plan/[hero]" />
        <Stack.Screen name="duel/[id]" />
        <Stack.Screen name="groceries" />
      </Stack.Protected>
    </Stack>
  );
}
