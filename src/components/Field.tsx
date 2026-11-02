import { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

import { colors, fonts, radius } from '@/theme/tokens';
import { T } from './ui';

/** Number input that keeps what you type and only commits a valid number on blur. */
export function NumberField({ label, value, unit, onCommit, decimals = true, style }: {
  label: string; value: number; unit?: string; onCommit: (n: number) => void; decimals?: boolean; style?: TextInputProps['style'];
}) {
  const [text, setText] = useState(String(value));
  // Re-sync when the stored value changes elsewhere (React's "adjust state on prop change" pattern).
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(String(value));
  }
  const commit = () => {
    const n = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(n) && n > 0) onCommit(decimals ? Math.round(n * 10) / 10 : Math.round(n));
    else setText(String(value));
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, gap: 2 }}>
      <T v="kicker" style={{ fontSize: 10 }}>{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <TextInput
          accessibilityLabel={label}
          value={text}
          onChangeText={setText}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          style={[{ flex: 1, minWidth: 0, fontFamily: fonts.display, fontSize: 21, color: colors.text, padding: 0 }, style]}
        />
        {unit ? <T v="small">{unit}</T> : null}
      </View>
    </View>
  );
}

export function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, gap: 2 }}>
      <T v="kicker" style={{ fontSize: 10 }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text, padding: 0 }}
      />
    </View>
  );
}
