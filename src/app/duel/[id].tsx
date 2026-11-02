import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { DuelHeader, VersusRow } from '@/components/Duel';
import { RankPill } from '@/components/Rank';
import { Card, Halftone, Header, Panel, Row, Screen, T } from '@/components/ui';
import { hero } from '@/data/heroes';
import { formatKg } from '@/lib/dates';
import { duel } from '@/lib/players';
import { useStore } from '@/lib/store';
import { colors } from '@/theme/tokens';

export default function DuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const d = duel(state, id ?? 'brother');
  const me = state.profile.hero;
  const them = d.rival.hero;
  const h = hero(me);
  const lead = d.score.you - d.score.them;

  return (
    <Screen>
      <Header kicker="Duel" title={`VS ${d.rival.name.toUpperCase()}`} color={h.bright} />
      <Panel color={lead >= 0 ? h.color : hero(them).color} deep={lead >= 0 ? h.deep : hero(them).deep} bg="#14121A">
        <Halftone color={hero(them).color} opacity={0.16} style={{ left: '50%' }} />
        <Halftone color={h.color} opacity={0.16} style={{ right: '50%' }} />
        <DuelHeader you={{ name: 'You', hero: me }} them={d.rival} score={d.score} big />
        <T v="title" style={{ textAlign: 'center' }} color={lead >= 0 ? h.bright : hero(them).bright}>
          {lead > 0 ? 'You are winning this week.' : lead < 0 ? `${d.rival.name} is ahead. Go train.` : 'Dead even. Next set decides it.'}
        </T>
      </Panel>

      <Card style={{ gap: 14 }}>
        <T v="kicker">Last 7 days</T>
        {d.rows.map((r) => <VersusRow key={r.label} label={r.label} you={r.you} them={r.them} youHero={me} themHero={them} />)}
      </Card>

      <Card style={{ gap: 12 }}>
        <T v="kicker">Lift vs lift</T>
        {d.lifts.length === 0 ? <T v="small">Log some lifts to compare.</T> : null}
        {d.lifts.map((l) => {
          const win = l.you > l.them ? 'you' : l.them > l.you ? 'them' : 'tie';
          return (
            <View key={l.id} style={{ gap: 6 }}>
              <T v="title" style={{ fontSize: 14, textAlign: 'center' }}>{l.name}</T>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'flex-start', gap: 4, opacity: win === 'them' ? 0.55 : 1 }}>
                  <T v="h2" color={hero(me).bright} style={{ fontSize: 20 }}>{formatKg(l.you)} kg</T>
                  <RankPill rank={l.youRank} short />
                </View>
                <T v="kicker" color={colors.faint}>{win === 'tie' ? 'tie' : win === 'you' ? '◀ win' : 'win ▶'}</T>
                <View style={{ alignItems: 'flex-end', gap: 4, opacity: win === 'you' ? 0.55 : 1 }}>
                  <T v="h2" color={hero(them).bright} style={{ fontSize: 20 }}>{formatKg(l.them)} kg</T>
                  <RankPill rank={l.themRank} short />
                </View>
              </Row>
            </View>
          );
        })}
      </Card>
      <T v="small" style={{ textAlign: 'center' }}>{`${d.rival.name}'s numbers are demo data until accounts and the server go live.`}</T>
    </Screen>
  );
}
