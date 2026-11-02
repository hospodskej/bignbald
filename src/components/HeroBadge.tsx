import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { hero, HeroId } from '@/data/heroes';
import { colors, fonts } from '@/theme/tokens';
import { Halftone } from './ui';

/** Original emblems (not any publisher's logo): a fist for the Brawler, a flip arc for the Acrobat. */
const EMBLEMS: Record<HeroId, (c: string) => React.ReactNode> = {
  brawler: (c) => (
    <>
      <Path d="M6 11.5V8.2a1.8 1.8 0 0 1 3.6 0V11M9.6 9.6V6.4a1.8 1.8 0 0 1 3.6 0V10.6M13.2 9.8V7.2a1.8 1.8 0 0 1 3.6 0v3.6M16.8 10.4a1.8 1.8 0 0 1 3.6 0v2.8a8 8 0 0 1-8 8h-.8a6.8 6.8 0 0 1-6.8-6.8v-2.6a1.8 1.8 0 0 1 3.6 0" fill={c} fillOpacity={0.25} stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.5 16.5h5" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
    </>
  ),
  acrobat: (c) => (
    <>
      <Path d="M3.5 19.5C5.5 9 18.5 9 20.5 19.5" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeDasharray="0.1 3.2" />
      <Circle cx={12} cy={6.2} r={2.3} fill={c} />
      <Path d="M12 8.6l-1.2 4.6M10.8 13.2l-3.2 2.6M10.8 13.2l3.6 1.6M11.6 10.4l-3.4-1.4M11.6 10.4l3.6-2.2" stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Path d="M17.5 16.8l3 2.7.6-3.9" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

export function HeroBadge({ id, size = 48, level }: { id: HeroId; size?: number; level?: number }) {
  const h = hero(id);
  const ring = Math.max(2, Math.round(size / 22));
  return (
    <View accessibilityRole="image" accessibilityLabel={h.name} style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring, borderColor: h.color, backgroundColor: h.soft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <Halftone color={h.color} opacity={0.22} gap={Math.max(5, size / 9)} dot={Math.max(0.8, size / 60)} />
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">{EMBLEMS[id](h.bright)}</Svg>
      </View>
      {level !== undefined ? (
        <View style={{ position: 'absolute', right: -6, bottom: -4, minWidth: 22, paddingHorizontal: 4, borderRadius: 5, backgroundColor: h.color, alignItems: 'center', transform: [{ skewX: '-8deg' }] }}>
          <Text style={{ fontFamily: fonts.display, fontSize: Math.max(12, size / 4), color: colors.ink }}>{level}</Text>
        </View>
      ) : null}
    </View>
  );
}

