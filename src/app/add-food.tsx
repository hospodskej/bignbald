import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Chip, Header, Row, Screen, T } from '@/components/ui';
import { Food, FOODS } from '@/data/foods';
import { notify } from '@/lib/confirm';
import { useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/theme/tokens';

export default function AddFood() {
  const { actions } = useStore();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Food | null>(null);
  const [grams, setGrams] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return Object.values(FOODS).filter((f) => !s || f.name.toLowerCase().includes(s)).sort((a, b) => a.name.localeCompare(b.name));
  }, [q]);

  const add = () => {
    const g = parseFloat(grams.replace(',', '.'));
    if (!picked || !Number.isFinite(g) || g <= 0) return;
    actions.logFood(picked.id, Math.round(g));
    router.back();
  };

  if (picked) {
    const g = parseFloat(grams.replace(',', '.')) || 0;
    const n = (k: keyof Food['per100']) => Math.round(((picked.per100[k] ?? 0) * g) / 10) / 10;
    return (
      <Screen>
        <Header kicker="Add food" title={picked.name.toUpperCase()} color={colors.green} />
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {[1, 2].map((m) => (
            <Chip key={m} label={`${m} × ${picked.serving.label} (${picked.serving.grams * m} g)`} active={g === picked.serving.grams * m} color={colors.green} onPress={() => setGrams(String(picked.serving.grams * m))} />
          ))}
          <Chip label="100 g" active={g === 100} color={colors.green} onPress={() => setGrams('100')} />
        </Row>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12 }}>
          <T v="kicker" style={{ fontSize: 10 }}>Amount (g)</T>
          <TextInput accessibilityLabel="Grams" value={grams} onChangeText={setGrams} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.faint} style={{ fontFamily: fonts.display, fontSize: 34, color: colors.text, padding: 0 }} />
        </View>
        <Row gap={8}>
          {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
            <View key={k} style={{ flex: 1, backgroundColor: colors.surfaceSunk, borderRadius: 10, padding: 10 }}>
              <T v="kicker" style={{ fontSize: 9 }}>{k}</T>
              <T v="h2" style={{ fontSize: 20 }}>{k === 'kcal' ? Math.round(n(k)) : n(k)}</T>
            </View>
          ))}
        </Row>
        <Button title="Add to today" color={colors.green} size="lg" disabled={g <= 0} onPress={add} />
        <Button title="Pick another food" variant="ghost" color={colors.muted} onPress={() => setPicked(null)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header kicker="Diet" title="ADD FOOD" color={colors.green} />
      <Row gap={8}>
        <Row gap={8} style={{ flex: 1, height: 48, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <TextInput accessibilityLabel="Search foods" value={q} onChangeText={setQ} placeholder="Search skyr, chicken, oats…" placeholderTextColor={colors.faint} style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text }} />
        </Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
          onPress={() => notify('Barcode scanning', 'Coming with the camera build and our food database.')}
          style={{ width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="scan" size={22} />
        </Pressable>
      </Row>
      {list.map((f) => (
        <Pressable key={f.id} onPress={() => { setPicked(f); setGrams(String(f.serving.grams)); }} accessibilityRole="button">
          <Row gap={12} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
            <View style={{ flex: 1 }}>
              <T v="title" style={{ fontSize: 15 }}>{f.name}</T>
              <T v="small">{f.aisle} · per 100 g: {f.per100.kcal} kcal · {f.per100.protein} g protein</T>
            </View>
            <Icon name="plus" size={18} color={colors.green} />
          </Row>
        </Pressable>
      ))}
    </Screen>
  );
}
