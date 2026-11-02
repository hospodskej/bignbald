import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { DuelHeader } from '@/components/Duel';
import { HeroBadge } from '@/components/HeroBadge';
import { RankPill, RankTag } from '@/components/Rank';
import { Status } from '@/components/Status';
import { Bar, Button, Card, Chip, Halftone, Panel, Row, Screen, T } from '@/components/ui';
import { exercise } from '@/data/exercises';
import { asHero, hero } from '@/data/heroes';
import { formatKg } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { BoardRow, Duel, Leaderboard, useApi } from '@/lib/useApi';
import { allRanked } from '@/lib/workout';
import { colors, fonts, radius } from '@/theme/tokens';

type Tab = 'duels' | 'board' | 'mine';

/** Lifts with a global leaderboard. */
const BOARD_LIFTS = [
  'bench-press', 'hack-squat', 'ez-bar-curl', 'barbell-rdl', 'incline-barbell-press',
  'lat-pulldown-wide', 't-bar-row', 'dumbbell-shoulder-press',
];

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
  const rival = state.profile.rivalName.trim().toLowerCase();
  const duel = useApi<Duel>(rival ? `/duels/${encodeURIComponent(rival)}` : null);
  const [q, setQ] = useState('');
  const found = useApi<{ username: string; hero: string }[]>(q.trim().length >= 2 ? `/players?q=${encodeURIComponent(q.trim())}` : null);

  return (
    <>
      {rival ? (
        duel.data ? (
          <Panel color={h.color} deep={h.deep} bg="#14121A">
            <Halftone color={hero(asHero(duel.data.rival.hero)).color} opacity={0.18} style={{ left: '50%' }} />
            <Halftone color={h.color} opacity={0.18} style={{ right: '50%' }} />
            <T v="kicker" style={{ textAlign: 'center' }}>Your rival · last 7 days</T>
            <DuelHeader you={{ name: 'You', hero: state.profile.hero }} them={{ name: duel.data.rival.username, hero: asHero(duel.data.rival.hero) }} score={duel.data.score} big />
            <Button title="Open duel" color={h.color} onPress={() => router.push({ pathname: '/duel/[id]', params: { id: rival } })} />
          </Panel>
        ) : (
          <Status loading={duel.loading} error={duel.error && `${duel.error}. Your rival is set to @${rival} in Me.`} onRetry={duel.reload} />
        )
      ) : (
        <Card>
          <T v="title">No rival yet</T>
          <T v="small">Search for your brother or a friend below and make them your main rival.</T>
        </Card>
      )}

      <T v="kicker" style={{ marginTop: 6 }}>Find a player</T>
      <TextInput
        accessibilityLabel="Search players by username"
        value={q}
        onChangeText={setQ}
        placeholder="Username…"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.faint}
        style={{ height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 }}
      />
      {found.error ? <T v="small" color={colors.danger}>{found.error}</T> : null}
      {(found.data ?? []).map((p) => (
        <Pressable key={p.username} onPress={() => router.push({ pathname: '/duel/[id]', params: { id: p.username } })} accessibilityRole="button">
          <Row gap={10} style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: colors.line }}>
            <HeroBadge id={asHero(p.hero)} size={34} />
            <T v="title" style={{ flex: 1 }}>@{p.username}</T>
            <T v="small">Duel ›</T>
          </Row>
        </Pressable>
      ))}
      {q.trim().length >= 2 && found.data?.length === 0 ? <T v="small">Nobody with that username yet.</T> : null}
    </>
  );
}

function Board() {
  const { state } = useStore();
  const [lift, setLift] = useState(BOARD_LIFTS[0]);
  const board = useApi<Leaderboard>(`/leaderboards/${lift}`);
  const h = hero(state.profile.hero);
  const rows = board.data?.rows ?? [];
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {BOARD_LIFTS.map((id) => (
          <Chip key={id} label={exercise(id).name.replace('Barbell ', '').replace(' (wide)', '')} active={id === lift} color={h.color} onPress={() => setLift(id)} />
        ))}
      </ScrollView>
      <Status loading={board.loading} error={board.error} onRetry={board.reload} />
      {board.data && rows.length === 0 ? (
        <Card><T v="small">Nobody has logged {exercise(lift).name.toLowerCase()} yet. Be the first: 5+ reps puts you on the board.</T></Card>
      ) : null}
      {rows.map((r) => <BoardItem key={r.username} r={r} />)}
      {board.data?.me ? (
        <>
          <T v="small" style={{ textAlign: 'center' }}>…</T>
          <BoardItem r={board.data.me} />
        </>
      ) : null}
      {board.data ? <T v="small" style={{ textAlign: 'center' }}>{board.data.total} {board.data.total === 1 ? 'player' : 'players'} ranked</T> : null}
    </>
  );
}

function BoardItem({ r }: { r: BoardRow }) {
  const h = hero(asHero(r.hero));
  const medal = ['#F2C14E', '#C9D1DA', '#D08B57'][r.position - 1];
  return (
    <Row gap={10} style={{ backgroundColor: r.you ? h.soft : colors.surface, borderColor: r.you ? h.color : medal ?? colors.surface, borderWidth: 1, borderRadius: radius.md, padding: 9 }}>
      <T v="h2" color={medal ?? (r.you ? h.bright : colors.muted)} style={{ width: 30, fontSize: 16 }}>{r.position}</T>
      <HeroBadge id={asHero(r.hero)} size={32} />
      <View style={{ flex: 1 }}>
        <T v="title" style={{ fontSize: 13 }}>{r.you ? 'You' : `@${r.username}`}</T>
        <T v="small" style={{ fontSize: 11 }}>{h.short}</T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <T v="title" style={{ fontSize: 13 }}>{formatKg(r.kg)} kg</T>
        <RankTag label={r.rankLabel} color={r.rankColor} />
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
        <Card key={id} style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="title" style={{ flex: 1 }}>{exercise(id).name}</T>
            <RankPill rank={rank} />
          </Row>
          <Bar value={rank.progress} color={rank.tier.color} height={5} />
          <T v="small">Best {formatKg(kg)} kg{rank.nextKg ? ` · ${formatKg(rank.nextKg)} kg for ${rank.nextLabel}` : ' · top tier'}</T>
        </Card>
      ))}
    </>
  );
}
