import { ReactNode, useId } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { router } from 'expo-router';

import { colors, fonts, radius, space } from '@/theme/tokens';
import { Icon } from './Icon';

// ---------- Text ----------

const textStyles = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 33, color: colors.text, letterSpacing: 0.3 },
  h1: { fontFamily: fonts.display, fontSize: 19, lineHeight: 21, color: colors.text, letterSpacing: 0.3 },
  h2: { fontFamily: fonts.display, fontSize: 19, lineHeight: 21, color: colors.text, letterSpacing: 0.3 },
  num: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  title: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.text },
  small: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.muted },
  kicker: { fontFamily: fonts.black, fontSize: 10, letterSpacing: 1.4, color: colors.muted, textTransform: 'uppercase' },
});

type Variant = keyof typeof textStyles;
export function T({ v = 'body', color, style, ...rest }: TextProps & { v?: Variant; color?: string }) {
  return <Text {...rest} style={[textStyles[v], color ? { color } : null, style]} />;
}

// ---------- Layout ----------

export function Screen({ children, scroll = true, padTop = true }: { children: ReactNode; scroll?: boolean; padTop?: boolean }) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: padTop ? insets.top + 8 : 16, paddingHorizontal: space.lg, paddingBottom: insets.bottom + 20, gap: 10 };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.bg }, pad]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={pad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export const Row = ({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

/** Back button + kicker + title, used by every pushed screen. */
export function Header({ kicker, title, color, right }: { kicker?: string; title: string; color?: string; right?: ReactNode }) {
  return (
    <Row gap={12}>
      <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <View style={{ flex: 1 }}>
        {kicker ? <T v="kicker" color={color}>{kicker}</T> : null}
        <T v="h1" numberOfLines={1}>{title}</T>
      </View>
      {right}
    </Row>
  );
}

// ---------- Surfaces ----------

export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: { bg: string; line: string } }) {
  return (
    <View style={[styles.card, tone && { backgroundColor: tone.bg, borderColor: tone.line }, style]}>{children}</View>
  );
}

/** Comic panel: bold border and a hard offset shadow. */
export function Panel({ children, color, deep, bg = colors.surface, style, pad = 12 }: {
  children: ReactNode; color: string; deep: string; bg?: string; style?: StyleProp<ViewStyle>; pad?: number;
}) {
  return (
    <View style={[{ marginRight: 6, marginBottom: 6 }, style]}>
      <View style={[StyleSheet.absoluteFill, { top: 6, left: 6, right: -6, bottom: -6, backgroundColor: deep, borderRadius: 10 }]} />
      <View style={{ backgroundColor: bg, borderColor: color, borderWidth: 2, borderRadius: 10, padding: pad, gap: 10, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

/** Comic halftone dots. */
export function Halftone({ color, opacity = 0.3, gap = 9, dot = 1.5, style }: { color: string; opacity?: number; gap?: number; dot?: number; style?: StyleProp<ViewStyle> }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
            <Circle cx={gap / 2} cy={gap / 2} r={dot} fill={color} fillOpacity={opacity} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

// ---------- Controls ----------

export function Button({ title, onPress, color = colors.text, textColor = colors.ink, variant = 'solid', size = 'md', disabled, icon }: {
  title: string; onPress: () => void; color?: string; textColor?: string; variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg'; disabled?: boolean; icon?: Parameters<typeof Icon>[0]['name'];
}) {
  const h = size === 'lg' ? 46 : size === 'md' ? 40 : 32;
  const fs = size === 'lg' ? 20 : size === 'md' ? 17 : 14;
  const solid = variant === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <View
        style={{
          height: h, borderRadius: 4, transform: [{ skewX: '-8deg' }], alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
          backgroundColor: solid ? color : 'transparent', borderWidth: variant === 'outline' ? 2 : 0, borderColor: color, paddingHorizontal: 18,
        }}>
        {icon ? <Icon name={icon} size={fs} color={solid ? textColor : color} /> : null}
        <Text style={{ fontFamily: fonts.display, fontSize: fs, letterSpacing: 1, color: solid ? textColor : color, transform: [{ skewX: '8deg' }] }}>
          {title.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color = colors.text, filled }: {
  icon: Parameters<typeof Icon>[0]['name']; label: string; onPress: () => void; color?: string; filled?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
        backgroundColor: filled ?? colors.surface, borderWidth: filled ? 0 : 1, borderColor: colors.line,
      })}>
      <Icon name={icon} size={17} color={color} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = colors.text, activeText = colors.ink }: {
  label: string; active?: boolean; onPress?: () => void; color?: string; activeText?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: 30, paddingHorizontal: 11, justifyContent: 'center', borderRadius: active ? 4 : radius.pill,
        backgroundColor: active ? color : colors.surface, borderWidth: active ? 0 : 1, borderColor: colors.line,
        transform: active ? [{ skewX: '-8deg' }] : [],
      }}>
      <Text style={{ fontFamily: active ? fonts.black : fonts.semibold, fontSize: 12, color: active ? activeText : colors.text, transform: active ? [{ skewX: '8deg' }] : [] }}>
        {active ? label.toUpperCase() : label}
      </Text>
    </Pressable>
  );
}

export function Bar({ value, color, height = 8, track = colors.line }: { value: number; color: string; height?: number; track?: string }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Stat({ label, value, unit, color = colors.text, style }: { label: string; value: string; unit?: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.stat, style]}>
      <T v="kicker" style={{ fontSize: 10 }}>{label}</T>
      <Text style={{ fontFamily: fonts.display, fontSize: 18, color }}>
        {value}
        {unit ? <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.muted }}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function Banner({ icon, title, body, tone, action }: {
  icon: Parameters<typeof Icon>[0]['name']; title: string; body: string; tone: { bg: string; line: string; fg: string }; action?: ReactNode;
}) {
  return (
    <View style={{ backgroundColor: tone.bg, borderColor: tone.line, borderWidth: 1, borderRadius: radius.md, padding: 10, gap: 8 }}>
      <Row gap={10} style={{ alignItems: 'flex-start' }}>
        <Icon name={icon} size={20} color={tone.fg} />
        <View style={{ flex: 1, gap: 2 }}>
          <T v="title" color={tone.fg} style={{ fontSize: 14 }}>{title}</T>
          <T v="small" color={colors.textDim}>{body}</T>
        </View>
      </Row>
      {action}
    </View>
  );
}

export const tones = {
  amber: { bg: colors.amberSoft, line: colors.amberLine, fg: colors.amber },
  green: { bg: colors.greenSoft, line: colors.greenLine, fg: colors.green },
};

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, padding: 12, gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surfaceSunk, borderRadius: radius.md, padding: 8, gap: 1 },
});

export { textStyles };
export type { TextStyle };
