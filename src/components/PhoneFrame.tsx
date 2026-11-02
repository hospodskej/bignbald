import { ReactNode } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { colors, device, fonts } from '@/theme/tokens';
import { Halftone } from './ui';

/**
 * On a wide web screen, the app renders inside a phone so it looks exactly like
 * the mobile app. On phones (native, or a phone browser) it fills the screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > 560;
  if (!framed) return <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>;

  const h = Math.min(device.height, height - 40);
  const fixedInsets = { top: device.safeTop, bottom: device.safeBottom, left: 0, right: 0 };
  return (
    <View style={{ flex: 1, backgroundColor: '#05070A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 64 }}>
      <Halftone color="#FF4D3D" opacity={0.08} gap={14} dot={1.4} />
      {width > 1000 ? (
        <View style={{ maxWidth: 300, gap: 10 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 64, lineHeight: 60, color: colors.text }}>BIG N{'\n'}BALD</Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.muted }}>
            Train like a hero. Rank up every lift. Eat for the work you did today.
          </Text>
        </View>
      ) : null}
      <View style={{ width: device.width + 24, height: h + 24, borderRadius: 64, backgroundColor: '#000', padding: 12, borderWidth: 2, borderColor: '#2A2F38' }}>
        <View style={{ flex: 1, borderRadius: 52, overflow: 'hidden', backgroundColor: colors.bg }}>
          <SafeAreaInsetsContext.Provider value={fixedInsets}>{children}</SafeAreaInsetsContext.Provider>
          <View pointerEvents="none" style={{ position: 'absolute', top: 11, alignSelf: 'center', width: 124, height: 36, borderRadius: 20, backgroundColor: '#000' }} />
        </View>
      </View>
    </View>
  );
}
