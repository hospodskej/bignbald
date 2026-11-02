import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { formatInt } from '@/lib/dates';
import { colors } from '@/theme/tokens';
import { T } from './ui';

export function MacroRing({ value, target, color = colors.green, size = 116, label = 'kcal' }: {
  value: number; target: number; color?: string; size?: number; label?: string;
}) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / Math.max(1, target)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`${formatInt(value)} of ${formatInt(target)} ${label}`}>
      <Svg width={size} height={size} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
        <Circle cx={60} cy={60} r={r} fill="none" stroke={colors.line} strokeWidth={12} />
        <Circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} rotation={-90} origin="60, 60" />
      </Svg>
      <T v="h2" style={{ fontSize: size / 4.2, lineHeight: size / 4 }}>{formatInt(value)}</T>
      <T v="small" style={{ fontSize: 11 }}>of {formatInt(target)} {label}</T>
    </View>
  );
}
