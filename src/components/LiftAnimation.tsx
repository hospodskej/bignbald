import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polyline, Rect } from 'react-native-svg';

import type { GearId, PoseId } from '@/data/exercises';
import { add, dir, lerp, lerpPt, limb, Pt, rotate, smoothPath } from '@/lib/geometry';
import { colors } from '@/theme/tokens';
import { Halftone } from './ui';

/**
 * Animated lift demo. A jointed figure with real proportions (about 7.5 heads tall)
 * is posed by joint angles; each exercise is just two key poses + equipment,
 * so adding a lift is a few numbers, not a new drawing.
 */

const G_Y = 188; // floor
const L = { torso: 50, neck: 7, headR: 10.5, upper: 30, fore: 26, thigh: 43, shin: 42 } as const;

type Seg = 'upperArm' | 'forearm' | 'torso' | 'thigh' | 'shin' | 'shoulder';
type Anchor = 'toe' | 'hip' | 'knee' | 'hand';

/** Joint angles in degrees. Limb angles: 0 = pointing down, 90 = forward, 180 = up. */
interface Rig {
  t: number; // torso lean (0 upright, + forward)
  sh: number; // upper arm
  el: number; // elbow bend (+ forearm folds forward/up)
  hip: number; // thigh
  kn: number; // knee bend (+ shin folds back)
  ft?: number; // foot pitch (+ heel up)
}

interface PoseDef {
  anchor: Anchor;
  at: Pt;
  a: Rig;
  b: Rig;
  work: Seg[];
  scene?: (j: Joints) => React.ReactNode;
  pulley?: Pt;
  /** Where the weight sits: in the hands (default), on the back, or none. */
  load?: 'hands' | 'back' | 'none';
  ms?: number;
}

interface Joints {
  hip: Pt; sh: Pt; head: Pt; el: Pt; wr: Pt; hand: Pt; kn: Pt; an: Pt; heel: Pt; toe: Pt; t: number;
}

function solve(r: Rig, anchor: Anchor, at: Pt): Joints {
  const hip: Pt = [0, 0];
  const up = spine(r.t);
  const sh = add(hip, up, L.torso);
  const head = add(sh, up, L.neck + L.headR);
  const el = add(sh, dir(r.sh), L.upper);
  const wr = add(el, dir(r.sh + r.el), L.fore);
  const hand = add(wr, dir(r.sh + r.el), 4);
  const kn = add(hip, dir(r.hip), L.thigh);
  const an = add(kn, dir(r.hip - r.kn), L.shin);
  const ft = r.ft ?? 0;
  const heel = add(an, rotate([-6, 6], ft));
  const toe = add(an, rotate([18, 6], ft));
  const pick: Record<Anchor, Pt> = { toe, hip, knee: kn, hand };
  const off: Pt = [at[0] - pick[anchor][0], at[1] - pick[anchor][1]];
  const m = (p: Pt) => add(p, off);
  return { hip: m(hip), sh: m(sh), head: m(head), el: m(el), wr: m(wr), hand: m(hand), kn: m(kn), an: m(an), heel: m(heel), toe: m(toe), t: r.t };
}

/** Unit vector up the spine for a torso lean (0 = upright, + = leaning forward). */
const spine = (t: number): Pt => [Math.sin((t * Math.PI) / 180), -Math.cos((t * Math.PI) / 180)];
/** Unit vector out of the chest. */
const chest = (t: number): Pt => [Math.cos((t * Math.PI) / 180), Math.sin((t * Math.PI) / 180)];

const mix = (a: Rig, b: Rig, k: number): Rig => ({
  t: lerp(a.t, b.t, k), sh: lerp(a.sh, b.sh, k), el: lerp(a.el, b.el, k), hip: lerp(a.hip, b.hip, k), kn: lerp(a.kn, b.kn, k),
  ft: lerp(a.ft ?? 0, b.ft ?? 0, k),
});

// ---------- Scenery ----------

const METAL = '#8C95A5';
const FRAME = '#3A4250';
const PAD = '#2B313D';

const Bench = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <G>
    <Rect x={x1} y={y} width={x2 - x1} height={7} rx={3} fill={PAD} />
    <Line x1={x1 + 10} y1={y + 7} x2={x1 + 10} y2={G_Y} stroke={FRAME} strokeWidth={4} />
    <Line x1={x2 - 10} y1={y + 7} x2={x2 - 10} y2={G_Y} stroke={FRAME} strokeWidth={4} />
  </G>
);

/** A seat under the hip plus a backrest along the torso. */
const Seat = ({ j, back = true }: { j: Joints; back?: boolean }) => {
  const up = spine(j.t);
  const b1 = add(j.hip, chest(j.t), -9);
  const b2 = add(b1, up, 50);
  return (
    <G>
      <Rect x={j.hip[0] - 14} y={j.hip[1] + 7} width={42} height={7} rx={3} fill={PAD} />
      <Line x1={j.hip[0] + 6} y1={j.hip[1] + 14} x2={j.hip[0] + 6} y2={G_Y} stroke={FRAME} strokeWidth={4} />
      {back ? <Line x1={b1[0]} y1={b1[1]} x2={b2[0]} y2={b2[1]} stroke={PAD} strokeWidth={8} strokeLinecap="round" /> : null}
    </G>
  );
};

const POSES: Record<PoseId, PoseDef> = {
  curl: { anchor: 'toe', at: [116, G_Y - 1], a: { t: 0, sh: 4, el: 2, hip: 0, kn: 2 }, b: { t: -3, sh: 12, el: 138, hip: 0, kn: 2 }, work: ['upperArm'] },
  pressFlat: {
    anchor: 'hip', at: [124, 131], a: { t: -90, sh: 25, el: 155, hip: 50, kn: 112 }, b: { t: -90, sh: 180, el: 0, hip: 50, kn: 112 },
    work: ['torso', 'upperArm', 'shoulder'], scene: (j) => <Bench x1={j.sh[0] - 22} x2={j.hip[0] + 12} y={j.hip[1] + 6} />,
  },
  jmPress: {
    anchor: 'hip', at: [124, 131], a: { t: -90, sh: 215, el: 85, hip: 50, kn: 112 }, b: { t: -90, sh: 180, el: 0, hip: 50, kn: 112 },
    work: ['upperArm'], scene: (j) => <Bench x1={j.sh[0] - 22} x2={j.hip[0] + 12} y={j.hip[1] + 6} />,
  },
  pressIncline: {
    anchor: 'hip', at: [124, 142], a: { t: -55, sh: 40, el: 140, hip: 80, kn: 95 }, b: { t: -55, sh: 175, el: 5, hip: 80, kn: 95 },
    work: ['torso', 'shoulder', 'upperArm'], scene: (j) => <Seat j={j} />,
  },
  pressShoulder: {
    anchor: 'hip', at: [96, 140], a: { t: -6, sh: 22, el: 158, hip: 90, kn: 90 }, b: { t: -6, sh: 178, el: 2, hip: 90, kn: 90 },
    work: ['shoulder', 'upperArm'], scene: (j) => <Seat j={j} />,
  },
  pushdown: {
    anchor: 'toe', at: [112, G_Y - 1], a: { t: 12, sh: -8, el: 98, hip: 0, kn: 8 }, b: { t: 12, sh: -6, el: 4, hip: 0, kn: 8 },
    work: ['upperArm'], pulley: [158, 18],
  },
  overheadExt: {
    anchor: 'toe', at: [116, G_Y - 1], a: { t: 8, sh: 170, el: 150, hip: 0, kn: 4 }, b: { t: 8, sh: 172, el: 6, hip: 0, kn: 4 },
    work: ['upperArm'],
  },
  dip: {
    anchor: 'hand', at: [112, 98], a: { t: 16, sh: -4, el: 2, hip: -6, kn: 72 }, b: { t: 24, sh: -72, el: 78, hip: -6, kn: 72 },
    work: ['torso', 'upperArm'], load: 'none',
    scene: () => (
      <G>
        <Line x1={84} y1={103} x2={150} y2={103} stroke={METAL} strokeWidth={4} strokeLinecap="round" />
        <Line x1={144} y1={103} x2={144} y2={G_Y} stroke={FRAME} strokeWidth={4} />
      </G>
    ),
  },
  pulldown: {
    anchor: 'hip', at: [92, 142], a: { t: -12, sh: 172, el: 4, hip: 90, kn: 95 }, b: { t: -14, sh: -28, el: 152, hip: 90, kn: 95 },
    work: ['torso', 'upperArm'], pulley: [104, 14], scene: (j) => <Seat j={j} back={false} />,
  },
  cableRow: {
    anchor: 'hip', at: [70, 152], a: { t: 10, sh: 84, el: 2, hip: 82, kn: 16 }, b: { t: -12, sh: -38, el: 118, hip: 82, kn: 16 },
    work: ['torso', 'upperArm'], pulley: [184, 150],
    scene: (j) => (
      <G>
        <Rect x={j.hip[0] - 16} y={j.hip[1] + 7} width={40} height={7} rx={3} fill={PAD} />
        <Line x1={j.hip[0] - 6} y1={j.hip[1] + 14} x2={j.hip[0] - 6} y2={G_Y} stroke={FRAME} strokeWidth={4} />
        <Line x1={j.toe[0] + 2} y1={j.toe[1] - 22} x2={j.toe[0] + 2} y2={G_Y} stroke={FRAME} strokeWidth={5} strokeLinecap="round" />
      </G>
    ),
  },
  bentRow: {
    anchor: 'toe', at: [124, G_Y - 1], a: { t: 55, sh: 0, el: 0, hip: 18, kn: 30 }, b: { t: 55, sh: -58, el: 78, hip: 18, kn: 30 },
    work: ['torso', 'upperArm'],
  },
  reverseFly: {
    anchor: 'toe', at: [122, G_Y - 1], a: { t: 68, sh: 4, el: 14, hip: 18, kn: 26 }, b: { t: 68, sh: -82, el: 14, hip: 18, kn: 26 },
    work: ['shoulder'],
  },
  squat: {
    anchor: 'toe', at: [122, G_Y - 1], a: { t: 8, sh: -42, el: 128, hip: 0, kn: 0 }, b: { t: 40, sh: -50, el: 128, hip: 96, kn: 122 },
    work: ['thigh'], load: 'back', ms: 2600,
  },
  legPress: {
    anchor: 'hip', at: [84, 158], a: { t: -62, sh: 40, el: 30, hip: 128, kn: 4 }, b: { t: -62, sh: 40, el: 30, hip: 168, kn: 112 },
    work: ['thigh'], load: 'none',
    scene: (j) => {
      // The sled rides a 45° rail; the foot plate sits under the feet.
      const along = dir(135);
      const perp: Pt = [along[1], -along[0]];
      const p1 = add(j.toe, perp, 16), p2 = add(j.toe, perp, -16);
      const r1 = add(j.toe, along, -60), r2 = add(j.toe, along, 40);
      return (
        <G>
          <Seat j={j} />
          <Line x1={r1[0]} y1={r1[1]} x2={r2[0]} y2={r2[1]} stroke={FRAME} strokeWidth={4} />
          <Line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={METAL} strokeWidth={6} strokeLinecap="round" />
        </G>
      );
    },
  },
  rdl: {
    anchor: 'toe', at: [120, G_Y - 1], a: { t: 0, sh: 2, el: 0, hip: 0, kn: 6 }, b: { t: 78, sh: 0, el: 0, hip: 14, kn: 20 },
    work: ['thigh', 'torso'], ms: 2600,
  },
  legExtension: {
    anchor: 'hip', at: [92, 138], a: { t: -10, sh: 20, el: 30, hip: 90, kn: 95 }, b: { t: -10, sh: 20, el: 30, hip: 90, kn: 5 },
    work: ['thigh'], load: 'none',
    scene: (j) => (
      <G>
        <Seat j={j} />
        <Circle cx={j.an[0] + 4} cy={j.an[1] - 2} r={6} fill={PAD} stroke={METAL} strokeWidth={2} />
      </G>
    ),
  },
  legCurl: {
    anchor: 'hip', at: [104, 130], a: { t: -90, sh: 25, el: 40, hip: 90, kn: 0 }, b: { t: -90, sh: 25, el: 40, hip: 90, kn: -118 },
    work: ['thigh'], load: 'none',
    scene: (j) => (
      <G>
        <Bench x1={j.sh[0] - 18} x2={j.kn[0] + 4} y={j.hip[1] + 7} />
        <Circle cx={j.an[0]} cy={j.an[1] - 8} r={6} fill={PAD} stroke={METAL} strokeWidth={2} />
      </G>
    ),
  },
  calfRaise: {
    anchor: 'toe', at: [118, G_Y - 12], a: { t: 0, sh: -40, el: 132, hip: 0, kn: 0, ft: -14 }, b: { t: 0, sh: -40, el: 132, hip: 0, kn: 0, ft: 26 },
    work: ['shin'], load: 'back',
    scene: () => <Rect x={98} y={G_Y - 11} width={34} height={11} rx={2} fill={PAD} />,
  },
  cableCrunch: {
    anchor: 'knee', at: [104, G_Y - 5], a: { t: 14, sh: 162, el: 160, hip: 0, kn: 90 }, b: { t: 78, sh: 162, el: 160, hip: -6, kn: 84 },
    work: ['torso'], pulley: [118, 12],
  },
  // Frontal-plane lifts use the front view below.
  lateralRaise: { anchor: 'toe', at: [0, 0], a: { t: 0, sh: 0, el: 0, hip: 0, kn: 0 }, b: { t: 0, sh: 0, el: 0, hip: 0, kn: 0 }, work: ['shoulder'] },
  adductor: { anchor: 'toe', at: [0, 0], a: { t: 0, sh: 0, el: 0, hip: 0, kn: 0 }, b: { t: 0, sh: 0, el: 0, hip: 0, kn: 0 }, work: ['thigh'] },
};

// ---------- Equipment ----------

function Weight({ gear, at, pose, accent }: { gear: GearId; at: Pt; pose: PoseId; accent: string }) {
  // Bars are drawn in 3/4 view so you can see them: near plate big, far plate small.
  const near = add(at, [-13, 7]);
  const far = add(at, [13, -7]);
  const plate = (p: Pt, s: number) => (
    <G>
      <Ellipse cx={p[0]} cy={p[1]} rx={4 * s} ry={13 * s} fill={PAD} stroke={accent} strokeWidth={2} rotation={-28} origin={`${p[0]}, ${p[1]}`} />
      <Ellipse cx={p[0]} cy={p[1]} rx={1.5 * s} ry={4 * s} fill={METAL} rotation={-28} origin={`${p[0]}, ${p[1]}`} />
    </G>
  );
  if (gear === 'dumbbell') {
    const a = add(at, [-6, 3]), b = add(at, [6, -3]);
    return (
      <G>
        <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={METAL} strokeWidth={3} />
        {[a, b].map((p, i) => <Ellipse key={i} cx={p[0]} cy={p[1]} rx={3.5} ry={6.5} fill={PAD} stroke={accent} strokeWidth={1.6} rotation={-28} origin={`${p[0]}, ${p[1]}`} />)}
      </G>
    );
  }
  if (gear === 'ezBar' || gear === 'barbell' || gear === 'smith') {
    const pts: Pt[] = gear === 'ezBar'
      ? [near, add(at, [-6, 6.5]), add(at, [-3, 0.5]), add(at, [3, -0.5]), add(at, [6, -6.5]), far]
      : [near, far];
    return (
      <G>
        {gear === 'smith' ? <Line x1={at[0] + 22} y1={10} x2={at[0] + 22} y2={G_Y} stroke={FRAME} strokeWidth={3} /> : null}
        {plate(far, 0.75)}
        <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={METAL} strokeWidth={2.6} strokeLinejoin="round" />
        {plate(near, 1)}
      </G>
    );
  }
  if (gear === 'landmine') {
    return (
      <G>
        <Line x1={22} y1={G_Y - 2} x2={at[0]} y2={at[1]} stroke={METAL} strokeWidth={3} />
        {plate(add(at, [-8, 4]), 1)}
      </G>
    );
  }
  if (gear === 'machine' && pose !== 'lateralRaise') {
    return <Rect x={at[0] - 4} y={at[1] - 3} width={8} height={6} rx={2} fill={METAL} />;
  }
  return null;
}

// ---------- Figure ----------

const SKIN = '#D6DCE4';
const FAR = '#6B7484';

function Figure({ j, work, accent, far }: { j: Joints; work: Seg[]; accent: string; far?: boolean }) {
  const c = (s: Seg) => (far ? FAR : work.includes(s) ? accent : SKIN);
  const up = spine(j.t);
  const fwd = chest(j.t);
  const at = (u: number, v: number): Pt => add(add(j.hip, up, u * L.torso), fwd, v);
  // Torso outline in torso space: u along the spine (0 hip, 1 shoulder), v forward.
  const torso = smoothPath([
    at(-0.08, -11), at(0.2, -8.5), at(0.55, -7.5), at(0.92, -9.5), at(1.05, -5), at(1.04, 4), at(0.86, 12), at(0.66, 11),
    at(0.45, 8), at(0.15, 8.5), at(-0.06, 6), at(-0.14, -2),
  ]);
  const shinLen = Math.hypot(j.an[0] - j.kn[0], j.an[1] - j.kn[1]) || 1;
  const shinDir: Pt = [(j.an[0] - j.kn[0]) / shinLen, (j.an[1] - j.kn[1]) / shinLen];
  const calf = add(lerpPt(j.kn, j.an, 0.33), rotate(shinDir, 90), 2.5);
  if (far) {
    return (
      <G opacity={0.9}>
        <Path d={limb(j.hip, j.kn, 8, 5.5)} fill={FAR} />
        <Path d={limb(j.kn, j.an, 5.2, 3.4)} fill={FAR} />
        <Path d={limb(j.heel, j.toe, 3, 2.4)} fill={FAR} />
        <Path d={limb(j.sh, j.el, 5.5, 4.2)} fill={FAR} />
        <Path d={limb(j.el, j.wr, 4.2, 3)} fill={FAR} />
      </G>
    );
  }
  const neckTop = add(j.sh, up, L.neck + 2);
  return (
    <G>
      <Path d={limb(j.hip, j.kn, 9, 5.8)} fill={c('thigh')} />
      <Path d={limb(j.kn, j.an, 5.6, 3.4)} fill={c('shin')} />
      <Circle cx={calf[0]} cy={calf[1]} r={5.2} fill={c('shin')} />
      <Path d={limb(j.heel, j.toe, 3.2, 2.4)} fill={SKIN} />
      <Path d={torso} fill={c('torso')} />
      <Path d={limb(j.sh, neckTop, 4.6, 4.2)} fill={SKIN} />
      <Ellipse cx={j.head[0]} cy={j.head[1]} rx={9.6} ry={11} fill={SKIN} rotation={j.t * 0.6} origin={`${j.head[0]}, ${j.head[1]}`} />
      <Circle cx={j.sh[0]} cy={j.sh[1] + 1} r={7} fill={c('shoulder')} />
      <Path d={limb(j.sh, j.el, 6.2, 4.4)} fill={c('upperArm')} />
      <Path d={limb(j.el, j.wr, 4.6, 3)} fill={c('forearm')} />
      <Circle cx={j.hand[0]} cy={j.hand[1]} r={3.6} fill={SKIN} />
    </G>
  );
}

/** Front view for lateral raises and adductors. */
function FrontFigure({ pose, k, accent, gear }: { pose: 'lateralRaise' | 'adductor'; k: number; accent: string; gear: GearId }) {
  const seated = pose === 'adductor';
  const top = seated ? 36 : 22;
  const head: Pt = [100, top + 11];
  const sL: Pt = [78, top + 34], sR: Pt = [122, top + 34];
  const hipY = top + 98;
  const torso = smoothPath([
    [86, top + 26], [78, top + 30], [76, top + 50], [82, top + 74], [84, top + 88], [82, hipY], [100, hipY + 6], [118, hipY], [116, top + 88], [118, top + 74], [124, top + 50], [122, top + 30], [114, top + 26],
  ]);
  const a = pose === 'lateralRaise' ? lerp(8, 86, k) : 10;
  const arm = (s: Pt, side: -1 | 1) => {
    const e = add(s, [side * Math.sin((a * Math.PI) / 180), Math.cos((a * Math.PI) / 180)], 30);
    const w = add(e, [side * Math.sin(((a + 6) * Math.PI) / 180), Math.cos(((a + 6) * Math.PI) / 180)], 27);
    return { e, w };
  };
  const L1 = arm(sL, -1), R1 = arm(sR, 1);
  const armColor = pose === 'lateralRaise' ? accent : SKIN;
  const legColor = pose === 'adductor' ? accent : SKIN;
  const spread = seated ? lerp(30, 9, k) : 0;
  const kneeY = seated ? hipY + 12 : hipY + 46;
  const kL: Pt = [100 - spread - 8, kneeY], kR: Pt = [100 + spread + 8, kneeY];
  const fL: Pt = seated ? [kL[0], G_Y - 4] : [92, G_Y - 4], fR: Pt = seated ? [kR[0], G_Y - 4] : [108, G_Y - 4];
  return (
    <G>
      {seated ? <Rect x={70} y={hipY + 2} width={60} height={8} rx={3} fill={PAD} /> : null}
      {seated ? (
        <G>
          <Ellipse cx={(91 + kL[0]) / 2} cy={hipY + 6} rx={Math.abs(91 - kL[0]) / 2 + 9} ry={9} fill={legColor} />
          <Ellipse cx={(109 + kR[0]) / 2} cy={hipY + 6} rx={Math.abs(109 - kR[0]) / 2 + 9} ry={9} fill={legColor} />
          <Rect x={kL[0] - 16} y={kneeY - 8} width={7} height={18} rx={3} fill={METAL} />
          <Rect x={kR[0] + 9} y={kneeY - 8} width={7} height={18} rx={3} fill={METAL} />
        </G>
      ) : (
        <G>
          <Path d={limb([91, hipY], [93, hipY + 46], 9, 6)} fill={legColor} />
          <Path d={limb([109, hipY], [107, hipY + 46], 9, 6)} fill={legColor} />
        </G>
      )}
      <Path d={limb(kL, fL, 5.6, 3.6)} fill={SKIN} />
      <Path d={limb(kR, fR, 5.6, 3.6)} fill={SKIN} />
      <Path d={torso} fill={SKIN} />
      <Path d={limb([100, top + 22], [100, top + 30], 5, 5)} fill={SKIN} />
      <Ellipse cx={head[0]} cy={head[1]} rx={10} ry={12} fill={SKIN} />
      {[[sL, L1], [sR, R1]].map(([s, arm2], i) => {
        const sp = s as Pt;
        const ar = arm2 as { e: Pt; w: Pt };
        return (
          <G key={i}>
            <Circle cx={sp[0]} cy={sp[1]} r={7.5} fill={pose === 'lateralRaise' ? accent : SKIN} />
            <Path d={limb(sp, ar.e, 6, 4.4)} fill={armColor} />
            <Path d={limb(ar.e, ar.w, 4.4, 3)} fill={SKIN} />
            {pose === 'lateralRaise' && gear !== 'machine' ? (
              <G>
                <Line x1={ar.w[0]} y1={ar.w[1] - 6} x2={ar.w[0]} y2={ar.w[1] + 6} stroke={METAL} strokeWidth={3} />
                <Rect x={ar.w[0] - 4} y={ar.w[1] - 9} width={8} height={4} rx={1.5} fill={PAD} stroke={accent} strokeWidth={1.2} />
                <Rect x={ar.w[0] - 4} y={ar.w[1] + 5} width={8} height={4} rx={1.5} fill={PAD} stroke={accent} strokeWidth={1.2} />
              </G>
            ) : null}
          </G>
        );
      })}
    </G>
  );
}

// ---------- Animation ----------

/** Up (ease) - hold - down (ease) - hold, looping. */
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
function phase(p: number) {
  if (p < 0.4) return ease(p / 0.4);
  if (p < 0.5) return 1;
  if (p < 0.9) return 1 - ease((p - 0.5) / 0.4);
  return 0;
}

function useLoop(ms: number, playing: boolean) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = 0;
    const start = Date.now();
    const tick = () => {
      const now = Date.now();
      if (now - last > 33) {
        last = now;
        setP(((now - start) % ms) / ms);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms, playing]);
  return playing ? phase(p) : 0.55;
}

export function LiftAnimation({ pose, gear, accent, size = 120, playing = true }: {
  pose: PoseId; gear: GearId; accent: string; size?: number; playing?: boolean;
}) {
  const def = POSES[pose];
  const k = useLoop(def.ms ?? 2400, playing);
  const front = pose === 'lateralRaise' || pose === 'adductor';
  const j = front ? null : solve(mix(def.a, def.b, k), def.anchor, def.at);
  const farJ = j ? { ...j, ...Object.fromEntries((['hip', 'sh', 'el', 'wr', 'hand', 'kn', 'an', 'heel', 'toe'] as const).map((key) => [key, add(j[key], [4, -3])])) } as Joints : null;
  const loadAt = j ? (def.load === 'back' ? add(j.sh, chest(j.t), -8) : j.hand) : null;

  return (
    <View style={{ width: size, height: size, borderRadius: 16, backgroundColor: colors.surfaceSunk, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
      <Halftone color={accent} opacity={0.18} gap={8} dot={1.1} />
      <Svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute', left: 0, top: 0 }}>
        <Line x1={8} y1={G_Y} x2={192} y2={G_Y} stroke={FRAME} strokeWidth={2} />
        {front ? (
          <FrontFigure pose={pose as 'lateralRaise' | 'adductor'} k={k} accent={accent} gear={gear} />
        ) : j && farJ && loadAt ? (
          <G>
            {def.scene?.(j)}
            {def.pulley ? (
              <G>
                <Line x1={def.pulley[0]} y1={def.pulley[1]} x2={j.hand[0]} y2={j.hand[1]} stroke={METAL} strokeWidth={1.4} />
                <Circle cx={def.pulley[0]} cy={def.pulley[1]} r={5} fill={PAD} stroke={METAL} strokeWidth={2} />
              </G>
            ) : null}
            <Figure j={farJ} work={def.work} accent={accent} far />
            <Figure j={j} work={def.work} accent={accent} />
            {def.load !== 'none' && !def.pulley ? <Weight gear={gear} at={loadAt} pose={pose} accent={accent} /> : null}
            {def.pulley ? <Rect x={j.hand[0] - 7} y={j.hand[1] - 2} width={14} height={4} rx={2} fill={METAL} /> : null}
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
