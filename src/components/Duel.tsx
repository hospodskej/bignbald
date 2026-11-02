import { View } from 'react-native';

import { hero, HeroId } from '@/data/heroes';
import { formatInt } from '@/lib/dates';
import { colors } from '@/theme/tokens';
import { HeroBadge } from './HeroBadge';
import { Icon } from './Icon';
import { Row, T } from './ui';

/** "YOU vs THEM" header with both hero badges and the score. */
export function DuelHeader({ you, them, score, big }: {
  you: { name: string; hero: HeroId }; them: { name: string; hero: HeroId }; score: { you: number; them: number }; big?: boolean;
}) {
  const size = big ? 76 : 52;
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ alignItems: 'center', gap: 6, width: '34%' }}>
        <HeroBadge id={you.hero} size={size} />
        <T v="h2" color={hero(you.hero).bright} numberOfLines={1} style={{ fontSize: big ? 22 : 18 }}>{you.name.toUpperCase()}</T>
      </View>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Icon name="versus" size={big ? 26 : 20} color={colors.muted} />
        <T v="display" style={{ fontSize: big ? 44 : 32, lineHeight: big ? 46 : 34 }}>{score.you}–{score.them}</T>
        <T v="kicker" style={{ fontSize: 9 }}>categories won</T>
      </View>
      <View style={{ alignItems: 'center', gap: 6, width: '34%' }}>
        <HeroBadge id={them.hero} size={size} />
        <T v="h2" color={hero(them.hero).bright} numberOfLines={1} style={{ fontSize: big ? 22 : 18 }}>{them.name.toUpperCase()}</T>
      </View>
    </Row>
  );
}

/** One stat, both sides, with a tug-of-war bar in each hero's colour. */
export function VersusRow({ label, you, them, youHero, themHero, format = formatInt }: {
  label: string; you: number; them: number; youHero: HeroId; themHero: HeroId; format?: (n: number) => string;
}) {
  const win = you > them ? 'you' : them > you ? 'them' : 'tie';
  return (
    <View style={{ gap: 5 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="h2" color={win === 'you' ? hero(youHero).bright : colors.muted} style={{ fontSize: 16 }}>{format(you)}</T>
        <T v="kicker" style={{ fontSize: 10 }}>{label}</T>
        <T v="h2" color={win === 'them' ? hero(themHero).bright : colors.muted} style={{ fontSize: 16 }}>{format(them)}</T>
      </Row>
      <View style={{ flexDirection: 'row', height: 7, gap: 3, borderRadius: 7, overflow: 'hidden' }}>
        <View style={{ flex: Math.max(0.05, you), backgroundColor: hero(youHero).color, opacity: win === 'them' ? 0.45 : 1 }} />
        <View style={{ flex: Math.max(0.05, them), backgroundColor: hero(themHero).color, opacity: win === 'you' ? 0.45 : 1 }} />
      </View>
    </View>
  );
}
