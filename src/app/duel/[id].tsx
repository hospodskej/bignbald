import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { DuelHeader, VersusRow } from '@/components/Duel';
import { RankTag } from '@/components/Rank';
import { Status } from '@/components/Status';
import { Button, Card, Halftone, Header, Panel, Row, Screen, T } from '@/components/ui';
import { asHero, hero } from '@/data/heroes';
import { formatKg } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { Duel, useApi } from '@/lib/useApi';
import { colors } from '@/theme/tokens';

/** You vs one player (the param is their username). */
export default function DuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const username = String(id ?? '').toLowerCase();
  const { state, actions } = useStore();
  const { data: d, error, loading, reload } = useApi<Duel>(`/duels/${encodeURIComponent(username)}`);
  const me = state.profile.hero;
  const h = hero(me);
  const isRival = state.profile.rivalName.toLowerCase() === username;

  if (!d) {
    return (
      <Screen>
        <Header kicker="Duel" title={`VS @${username.toUpperCase()}`} color={h.bright} />
        <Status loading={loading} error={error} onRetry={reload} />
      </Screen>
    );
  }
  const them = asHero(d.rival.hero);
  const lead = d.score.you - d.score.them;

  return (
    <Screen>
      <Header kicker="Duel" title={`VS @${d.rival.username.toUpperCase()}`} color={h.bright} />
      <Panel color={lead >= 0 ? h.color : hero(them).color} deep={lead >= 0 ? h.deep : hero(them).deep} bg="#14121A">
        <Halftone color={hero(them).color} opacity={0.16} style={{ left: '50%' }} />
        <Halftone color={h.color} opacity={0.16} style={{ right: '50%' }} />
        <DuelHeader you={{ name: 'You', hero: me }} them={{ name: d.rival.username, hero: them }} score={d.score} big />
        <T v="title" style={{ textAlign: 'center' }} color={lead >= 0 ? h.bright : hero(them).bright}>
          {lead > 0 ? 'You are winning this week.' : lead < 0 ? `@${d.rival.username} is ahead. Go train.` : 'Dead even. Next set decides it.'}
        </T>
      </Panel>
      {!isRival ? (
        <Button title="Make my main rival" variant="outline" color={h.color} onPress={() => actions.updateProfile({ rivalName: d.rival.username })} />
      ) : null}

      <Card style={{ gap: 12 }}>
        <T v="kicker">Last 7 days</T>
        {d.rows.map((r) => <VersusRow key={r.label} label={r.label} you={r.you} them={r.them} youHero={me} themHero={them} />)}
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="kicker">Lift vs lift</T>
        {d.lifts.length === 0 ? <T v="small">{"No lifts you've both logged yet."}</T> : null}
        {d.lifts.map((l) => {
          const win = l.you > l.them ? 'you' : l.them > l.you ? 'them' : 'tie';
          return (
            <View key={l.id} style={{ gap: 4 }}>
              <T v="title" style={{ fontSize: 13, textAlign: 'center' }}>{l.name}</T>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'flex-start', gap: 3, opacity: win === 'them' ? 0.55 : 1 }}>
                  <T v="h2" color={hero(me).bright} style={{ fontSize: 17 }}>{formatKg(l.you)} kg</T>
                  <RankTag label={l.youRank} color={l.youColor} />
                </View>
                <T v="kicker" color={colors.faint}>{win === 'tie' ? 'tie' : win === 'you' ? '◀ win' : 'win ▶'}</T>
                <View style={{ alignItems: 'flex-end', gap: 3, opacity: win === 'you' ? 0.55 : 1 }}>
                  <T v="h2" color={hero(them).bright} style={{ fontSize: 17 }}>{formatKg(l.them)} kg</T>
                  <RankTag label={l.themRank} color={l.themColor} />
                </View>
              </Row>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
