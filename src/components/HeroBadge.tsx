import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { hero, HeroId } from '@/data/heroes';
import { colors, fonts } from '@/theme/tokens';
import { Halftone } from './ui';

/**
 * Emblems, drawn in-house: a battle helmet with slit visor for the Brawler,
 * a swept wing-chevron for the Acrobat. Each is a solid shape with a highlight
 * and a dark cut-line so it reads at 20 px and at 120 px.
 */
const EMBLEMS: Record<HeroId, (c: string, hi: string) => React.ReactNode> = {
  brawler: (c, hi) => (
    <>
      {/* helmet shell: taller than wide, slight chin point */}
      <Path d="M12 1.8c-5 0-8 3.8-8 9 0 4.2 2 7.6 4.6 9.6 1 .8 2.2 1.6 3.4 1.6s2.4-.8 3.4-1.6c2.6-2 4.6-5.4 4.6-9.6 0-5.2-3-9-8-9z" fill={c} />
      {/* side panel seams */}
      <Path d="M5.2 13.6c1.4 1.6 1.9 3.6 2 5.6M18.8 13.6c-1.4 1.6-1.9 3.6-2 5.6" stroke={colors.ink} strokeOpacity={0.35} strokeWidth={0.9} fill="none" strokeLinecap="round" />
      {/* shine */}
      <Path d="M7 7c1-1.8 2.8-2.9 5-3" stroke={hi} strokeOpacity={0.7} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      {/* angled white visor eyes */}
      <Path d="M5 10.4l5.8 2.3-.6 1.6L5.3 12.6z" fill={hi} stroke={colors.ink} strokeWidth={0.6} strokeLinejoin="round" />
      <Path d="M19 10.4l-5.8 2.3.6 1.6 4.9-1.7z" fill={hi} stroke={colors.ink} strokeWidth={0.6} strokeLinejoin="round" />
    </>
  ),
  acrobat: (c, hi) => (
    <>
      {/* swept wings meeting in a sharp V */}
      <Path d="M0.6 6.6C5 7.4 9 9.6 12 13.4 15 9.6 19 7.4 23.4 6.6 20.6 9.6 16.4 14.6 12 20.6 7.6 14.6 3.4 9.6 0.6 6.6Z" fill={c} />
      <Path d="M3.4 8C7 9.2 10 11.6 12 14.8 14 11.6 17 9.2 20.6 8" stroke={hi} strokeOpacity={0.55} strokeWidth={0.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
        <Svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24">{EMBLEMS[id](h.color, '#FFFFFF')}</Svg>
      </View>
      {level !== undefined ? (
        <View style={{ position: 'absolute', right: -6, bottom: -4, minWidth: 22, paddingHorizontal: 4, borderRadius: 5, backgroundColor: h.color, alignItems: 'center', transform: [{ skewX: '-8deg' }] }}>
          <Text style={{ fontFamily: fonts.display, fontSize: Math.max(12, size / 4), color: colors.ink }}>{level}</Text>
        </View>
      ) : null}
    </View>
  );
}

