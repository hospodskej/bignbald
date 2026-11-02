import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hero } from '@/data/heroes';
import { useStore } from '@/lib/store';
import { colors, fonts } from '@/theme/tokens';
import { Icon, IconName } from './Icon';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  train: { label: 'Train', icon: 'train' },
  diet: { label: 'Diet', icon: 'diet' },
  rankings: { label: 'Rankings', icon: 'rankings' },
  me: { label: 'Me', icon: 'me' },
};

/** Custom tab bar: active tab glows in your hero's colour. */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { state: app } = useStore();
  const accent = hero(app.profile.hero).color;
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#10131A', borderTopWidth: 1, borderTopColor: '#222833', paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: 6 }}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const color = focused ? accent : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 3, minHeight: 48 }}>
            <View style={{ width: 46, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? hero(app.profile.hero).soft : 'transparent' }}>
              <Icon name={tab.icon} size={24} color={color} active={focused} />
            </View>
            <Text style={{ fontFamily: focused ? fonts.bold : fonts.medium, fontSize: 11, color }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
