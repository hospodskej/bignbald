import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { LiftAnimation } from '@/components/LiftAnimation';
import { RankPill } from '@/components/Rank';
import { Header, Row, Screen, T } from '@/components/ui';
import { exercise, FAMILIES, variantsOf } from '@/data/exercises';
import { hero } from '@/data/heroes';
import { planDay } from '@/data/plans';
import { formatKg } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { exerciseForSlot, lastSets, rankOf } from '@/lib/workout';
import { colors } from '@/theme/tokens';

/** Pick any variation of a lift. Used from a live workout (entry) or from the plan (day + slot). */
export default function Swap() {
  const { entry, day, slot } = useLocalSearchParams<{ entry?: string; day?: string; slot?: string }>();
  const { state, actions } = useStore();
  const h = hero(state.profile.hero);

  const live = entry !== undefined && state.active ? state.active.entries[Number(entry)] : null;
  const dayId = live ? state.active!.dayId : day ?? '';
  const slotIndex = live ? live.slot : Number(slot ?? 0);
  const planSlot = planDay(live ? state.active!.hero : state.profile.hero, dayId).slots[slotIndex];
  const currentId = live ? live.exerciseId : exerciseForSlot(state, state.profile.hero, dayId, slotIndex);
  const options = variantsOf(planSlot.family);

  const pick = (id: string) => {
    if (live) actions.swapExercise(Number(entry), id);
    else actions.chooseForSlot(dayId, slotIndex, id);
    router.back();
  };

  return (
    <Screen>
      <Header kicker={planSlot.any ? 'The plan says any' : 'Swap exercise'} title={FAMILIES[planSlot.family].toUpperCase()} color={h.bright} />
      <T v="small">Pick whatever your gym has free today. Each variation keeps its own history and rank, and we remember your choice.</T>
      {options.map((o) => {
        const selected = o.id === currentId;
        const last = lastSets(state.history, o.id)[0];
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => pick(o.id)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Row gap={12} style={{ padding: 8, borderRadius: 14, borderWidth: selected ? 2 : 1, borderColor: selected ? h.color : colors.line, backgroundColor: selected ? h.soft : colors.surface }}>
              <LiftAnimation pose={o.pose} gear={o.gear} accent={h.color} size={54} playing={selected} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="title" style={{ fontSize: 14 }}>{o.name}</T>
                <T v="small">{last ? `Last: ${formatKg(parseFloat(last.kg))} kg × ${last.reps}${o.perSide ? ' each' : ''}` : 'Never logged'}</T>
                <RankPill rank={rankOf(state.history, o.id)} short />
              </View>
              {selected ? <Icon name="check" size={22} color={h.color} strokeWidth={3} /> : null}
            </Row>
          </Pressable>
        );
      })}
      <T v="small" style={{ textAlign: 'center' }}>{exercise(currentId).name} is selected</T>
    </Screen>
  );
}
