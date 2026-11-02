import { ReactNode, useState } from 'react';
import { KeyboardTypeOptions, Pressable, TextInput, View } from 'react-native';

import { colors, fonts, radius } from '@/theme/tokens';
import { Icon } from './Icon';
import { Chip, Row, T } from './ui';

/** A titled group of rows, like iOS settings. */
export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <T v="kicker">{title}</T>
        {right}
      </Row>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

/**
 * One editable fact. Shows label + value; tapping opens just this row's editor.
 * `open` / `onToggle` let the screen keep a single row open at a time.
 */
export function SettingRow({ label, value, hint, open, onToggle, editor, last, readOnly }: {
  label: string; value: string; hint?: string; open?: boolean; onToggle?: () => void; editor?: ReactNode; last?: boolean; readOnly?: boolean;
}) {
  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}${readOnly ? '' : '. Edit'}`}
        disabled={readOnly}
        onPress={onToggle}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: 12, gap: 8, backgroundColor: open ? colors.surfaceRaised : pressed ? colors.surfaceRaised : 'transparent' })}>
        <View style={{ flex: 1 }}>
          <T v="body" color={colors.textDim}>{label}</T>
          {hint ? <T v="small" style={{ fontSize: 11 }}>{hint}</T> : null}
        </View>
        <T v="title" numberOfLines={1} style={{ maxWidth: '55%', textAlign: 'right' }} color={value ? colors.text : colors.faint}>{value || 'Not set'}</T>
        {readOnly ? null : (
          <View style={{ transform: [{ rotate: open ? '180deg' : '-90deg' }] }}>
            <Icon name="chevron" size={14} color={colors.faint} />
          </View>
        )}
      </Pressable>
      {open && editor ? <View style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4, backgroundColor: colors.surfaceRaised, gap: 8 }}>{editor}</View> : null}
    </View>
  );
}

const inputStyle = {
  flex: 1, minWidth: 0, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surfaceSunk,
  paddingHorizontal: 10, color: colors.text, fontFamily: fonts.semibold, fontSize: 15,
} as const;

function SaveCancel({ onSave, onCancel, accent, disabled }: { onSave: () => void; onCancel: () => void; accent: string; disabled?: boolean }) {
  return (
    <Row gap={6}>
      <Pressable onPress={onCancel} accessibilityRole="button" style={{ height: 40, paddingHorizontal: 12, borderRadius: radius.sm, justifyContent: 'center' }}>
        <T v="title" color={colors.muted}>Cancel</T>
      </Pressable>
      <Pressable onPress={onSave} disabled={disabled} accessibilityRole="button" style={{ height: 40, paddingHorizontal: 14, borderRadius: radius.sm, justifyContent: 'center', backgroundColor: accent, opacity: disabled ? 0.4 : 1 }}>
        <T v="title" color={colors.ink}>Save</T>
      </Pressable>
    </Row>
  );
}

/** Text or number editor. `parse` returns the value to save, or null if invalid. */
export function TextEditor<V>({ initial, onSave, onCancel, accent, unit, keyboard, placeholder, parse, error, secure }: {
  initial: string; onSave: (v: V) => void | Promise<void>; onCancel: () => void; accent: string; unit?: string; keyboard?: KeyboardTypeOptions;
  placeholder?: string; parse: (s: string) => V | null; error?: string; secure?: boolean;
}) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const parsed = parse(text);
  /** Saves can be async (e.g. the server checks a username); a rejection shows its message here. */
  const save = async () => {
    if (parsed === null || busy) return;
    setBusy(true);
    setFailed(null);
    try {
      await onSave(parsed);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Row gap={8}>
        <TextInput
          autoFocus
          value={text}
          onChangeText={(t) => {
            setText(t);
            setFailed(null);
          }}
          onSubmitEditing={save}
          keyboardType={keyboard}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          secureTextEntry={secure}
          autoCapitalize="none"
          selectTextOnFocus
          style={inputStyle}
        />
        {unit ? <T v="small">{unit}</T> : null}
        <SaveCancel onSave={save} onCancel={onCancel} accent={accent} disabled={parsed === null || busy} />
      </Row>
      {parsed === null && text.length > 0 && error ? <T v="small" color={colors.danger}>{error}</T> : null}
      {failed ? <T v="small" color={colors.danger}>{failed}</T> : null}
    </>
  );
}

/** Pick one option; saves immediately. */
export function ChoiceEditor<K extends string>({ options, value, onPick, accent }: {
  options: { key: K; label: string; sub?: string }[]; value: K; onPick: (k: K) => void; accent: string;
}) {
  const withSub = options.some((o) => o.sub);
  if (!withSub) {
    return (
      <Row gap={6} style={{ flexWrap: 'wrap' }}>
        {options.map((o) => <Chip key={o.key} label={o.label} active={o.key === value} color={accent} onPress={() => onPick(o.key)} />)}
      </Row>
    );
  }
  return (
    <View style={{ gap: 6 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onPick(o.key)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: on ? accent : colors.line, backgroundColor: on ? colors.surface : 'transparent' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: on ? accent : colors.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
              {on ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accent }} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <T v="title" color={on ? colors.text : colors.textDim}>{o.label}</T>
              {o.sub ? <T v="small" style={{ fontSize: 11 }}>{o.sub}</T> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export const parseNumber = (min: number, max: number, decimals = true) => (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return decimals ? Math.round(n * 10) / 10 : Math.round(n);
};
export const parseText = (min: number, max: number) => (s: string) => {
  const t = s.trim();
  return t.length >= min && t.length <= max ? t : null;
};
export const parseUsername = (s: string) => (/^[a-zA-Z0-9_.]{3,20}$/.test(s.trim()) ? s.trim().toLowerCase() : null);
export const parseEmail = (s: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim()) ? s.trim().toLowerCase() : null);
