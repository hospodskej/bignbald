import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { DuelHeader } from '@/components/Duel';
import { HeroBadge } from '@/components/HeroBadge';
import { RankPill } from '@/components/Rank';
import { Bar, Button, Card, Chip, Halftone, Panel, Row, Screen, T } from '@/components/ui';
import { exercise } from '@/data/exercises';
import { hero } from '@/data/heroes';
import { formatKg } from '@/lib/dates';
import { duel, leaderboard, LEADERBOARD_LIFTS, rivals } from '@/lib/players';
import { useStore } from '@/lib/store';
import { allRanked } from '@/lib/workout';
import { colors } from '@/theme/tokens';

type Tab = 'duels' | 'board' | 'mine';

export default function Rankings() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('duels');
  const h = hero(state.profile.hero);

  return (
    <Screen>
      <View>
        <T v="kicker">Compete</T>
        <T v="display">RANKINGS</T>
      </View>
      <Row gap={6}>
        {([['duels', 'Duels'], ['board', 'Leaderboard'], ['mine', 'My ranks']] as const).map(([id, label]) => (
          <Chip key={id} label={label} active={tab === id} color={h.color} onPress={() => setTab(id)} />
        ))}
      </Row>
      {tab === 'duels' ? <Duels /> : tab === 'board' ? <Board /> : <MyRanks />}
    </Screen>
  );
}

function Duels() {
  const { state } = useStore();
  const h = hero(state.profile.hero);
  const list = rivals(state);
  const main = duel(state, list[0].id);
  const you = { name: 'You', hero: state.profile.hero };
  return (
    <>
      <Panel color={h.color} deep={h.deep} bg="#14121A">
        <Halftone color={hero(main.rival.hero).color} opacity={0.18} style={{ left: '50%' }} />
        <Halftone color={h.color} opacity={0.18} style={{ right: '50%' }} />
        <T v="kicker" style={{ textAlign: 'center' }}>Last 7 days</T>
        <DuelHeader you={you} them={main.rival} score={main.score} big />
        <Button title="Open duel" color={h.color} onPress={() => router.push({ pathname: '/duel/[id]', params: { id: main.rival.id } })} />
      </Panel>
      <T v="kicker" style={{ marginTop: 6 }}>Other rivals</T>
      {list.slice(1).map((r) => {
        const d = duel(state, r.id);
        const lead = d.score.you - d.score.them;
        return (
          <Pressable key={r.id} onPress={() => router.push({ pathname: '/duel/[id]', params: { id: r.id } })} accessibilityRole="button">
            <Row gap={12} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line }}>
              <HeroBadge id={r.hero} size={35} />
              <View style={{ flex: 1 }}>
                <T v="title">{r.name}</T>
                <T v="small">{hero(r.hero).short} · {lead > 0 ? `you lead by ${lead}` : lead < 0 ? `they lead by ${-lead}` : 'all square'}</T>
              </View>
              <T v="h2" color={lead >= 0 ? h.bright : hero(r.hero).bright}>{d.score.you}–{d.score.them}</T>
            </Row>
          </Pressable>
        );
      })}
      <T v="small" style={{ textAlign: 'center' }}>Rivals use demo numbers until accounts and the server go live.</T>
    </>
  );
}

function Board() {
  const { state } = useStore();
  const [lift, setLift] = useState(LEADERBOARD_LIFTS[0]);
  const rows = leaderboard(state, lift);
  const me = rows.find((r) => r.you);
  const podium = [rows[1], rows[0], rows[2]];
  const h = hero(state.profile.hero);
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {LEADERBOARD_LIFTS.map((id) => (
          <Chip key={id} label={exercise(id).name.replace('Barbell ', '').replace(' (wide)', '')} active={id === lift} color={h.color} onPress={() => setLift(id)} />
        ))}
      </ScrollView>
      <Row gap={8} style={{ alignItems: 'flex-end' }}>
        {podium.map((r, i) => (
          <View key={r.id} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <HeroBadge id={r.hero} size={40} />
            <T v="title" numberOfLines={1} style={{ fontSize: 12 }}>{r.name}</T>
            <T v="h2" style={{ fontSize: 14 }}>{formatKg(r.kg)} kg</T>
            <View style={{ width: '100%', height: [70, 96, 54][i], borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: ['#C9D1DA', '#F2C14E', '#D08B57'][i], alignItems: 'center', paddingTop: 6 }}>
              <T v="display" color={['#C9D1DA', '#F2C14E', '#D08B57'][i]} style={{ fontSize: 22 }}>{r.position}</T>
            </View>
          </View>
        ))}
      </Row>
      {rows.slice(3, 12).map((r) => <BoardRow key={r.id} r={r} />)}
      {me && me.position > 12 ? (
        <>
          <T v="small" style={{ textAlign: 'center' }}>…</T>
          <BoardRow r={me} />
        </>
      ) : null}
      {!me ? <T v="small" style={{ textAlign: 'center' }}>Log {exercise(lift).name.toLowerCase()} with 5+ reps to get on the board.</T> : null}
      <T v="small" style={{ textAlign: 'center' }}>Global players are demo data until the server goes live.</T>
    </>
  );
}

function BoardRow({ r }: { r: ReturnType<typeof leaderboard>[number] }) {
  const h = hero(r.hero);
  return (
    <Row gap={12} style={{ backgroundColor: r.you ? h.soft : colors.surface, borderColor: r.you ? h.color : colors.surface, borderWidth: 1, borderRadius: 12, padding: 10 }}>
      <T v="h2" color={r.you ? h.bright : colors.muted} style={{ width: 34, fontSize: 14 }}>{r.position}</T>
      <HeroBadge id={r.hero} size={29} />
      <View style={{ flex: 1 }}>
        <T v="title" style={{ fontSize: 13 }}>{r.you ? 'You' : r.name}</T>
        <T v="small" style={{ fontSize: 12 }}>{r.you ? h.short : `${r.country} · ${h.short}`}</T>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <T v="title" style={{ fontSize: 13 }}>{formatKg(r.kg)} kg</T>
        <T v="h2" color={r.rankColor} style={{ fontSize: 13 }}>{r.rankLabel.toUpperCase()}</T>
      </View>
    </Row>
  );
}

function MyRanks() {
  const { state } = useStore();
  const ranked = allRanked(state.history);
  if (!ranked.length) return <Card><T v="small">Finish a workout to earn your first ranks.</T></Card>;
  return (
    <>
      {ranked.map(({ id, rank, kg }) => rank && (
        <Card key={id} style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="title" style={{ flex: 1 }}>{exercise(id).name}</T>
            <RankPill rank={rank} />
          </Row>
          <Bar value={rank.progress} color={rank.tier.color} height={6} />
          <T v="small">Best {formatKg(kg)} kg{rank.nextKg ? ` · ${formatKg(rank.nextKg)} kg for ${rank.nextLabel}` : ' · top tier'}</T>
        </Card>
      ))}
    </>
  );
}
