import { Text, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import type { Rank } from '@/data/ranks';
import { UNRANKED } from '@/data/ranks';
import { colors, fonts } from '@/theme/tokens';

/** Small outlined pill: "GOLD II". */
export function RankPill({ rank, short }: { rank: Rank | null; short?: boolean }) {
  const color = rank?.tier.color ?? UNRANKED.color;
  const label = rank ? (short ? `${rank.tier.name.slice(0, 4)} ${rank.division}` : rank.label) : UNRANKED.label;
  return (
    <View style={{ alignSelf: 'flex-start', borderWidth: 1.5, borderColor: color, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1, transform: [{ skewX: '-8deg' }] }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 14, color, letterSpacing: 0.5, transform: [{ skewX: '8deg' }] }}>{label.toUpperCase()}</Text>
    </View>
  );
}

/** Big hexagon emblem for rank-ups and profile. */
export function RankEmblem({ color, division, size = 200 }: { color: string; division: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 220 220">
      <Path d="M110 8 L198 58 L198 162 L110 212 L22 162 L22 58 Z" fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={2} />
      <Path d="M110 30 L178 70 L178 150 L110 190 L42 150 L42 70 Z" fill={colors.surfaceSunk} stroke={color} strokeWidth={5} />
      <Path d="M110 54 L156 80 L156 140 L110 166 L64 140 L64 80 Z" fill={color} fillOpacity={0.14} stroke={color} strokeOpacity={0.7} strokeWidth={2} />
      <Path d="M110 72 L123 100 L153 104 L131 124 L137 154 L110 139 L83 154 L89 124 L67 104 L97 100 Z" fill={color} />
      {division ? (
        <SvgText x={110} y={205} textAnchor="middle" fontFamily={fonts.display} fontSize={30} fill={color}>{division}</SvgText>
      ) : null}
    </Svg>
  );
}

/** Same look as RankPill, for ranks the server already turned into text. */
export function RankTag({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', borderWidth: 1.5, borderColor: color, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, transform: [{ skewX: '-8deg' }] }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 12, color, letterSpacing: 0.5, transform: [{ skewX: '8deg' }] }}>{label.toUpperCase()}</Text>
    </View>
  );
}
