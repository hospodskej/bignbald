import { useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { Heat, MuscleId, MUSCLES } from '@/data/muscles';
import { smoothPath, toPts } from '@/lib/geometry';
import { colors } from '@/theme/tokens';
import { T } from './ui';

/**
 * Anatomical front + back muscle map. Shapes are rough outlines that get
 * smoothed into organic curves (Catmull-Rom), drawn once for the left side
 * and mirrored. Proportions follow an ~8-heads-tall athletic figure.
 */

type Pts = number[]; // x1,y1,x2,y2,...
const W = 200;
const smooth = (p: Pts, mirror = false) => smoothPath(toPts(p, mirror ? W : undefined));

// Left half of the silhouette, top of head -> down the outside -> back up the inside leg to the crotch.
const OUTLINE_LEFT: Pts = [
  100, 6, 87, 9, 80, 22, 80, 40, 84, 54, 91, 63, 91, 72, 78, 78, 62, 84, 48, 92, 40, 104, 36, 122, 34, 146, 33, 172,
  34, 196, 31, 216, 27, 240, 26, 262, 28, 276, 25, 290, 27, 304, 34, 312, 41, 306, 44, 290, 45, 276, 47, 252, 50, 228,
  53, 208, 55, 188, 58, 160, 61, 132, 63, 146, 65, 172, 68, 198, 65, 222, 62, 246, 61, 278, 63, 312, 67, 336, 65, 360,
  67, 388, 72, 410, 66, 422, 72, 432, 92, 432, 93, 420, 90, 408, 92, 380, 90, 352, 92, 334, 96, 300, 98, 266, 100, 256,
];
function outline() {
  const left: [number, number][] = [];
  for (let i = 0; i < OUTLINE_LEFT.length; i += 2) left.push([OUTLINE_LEFT[i], OUTLINE_LEFT[i + 1]]);
  const right = left.slice(1, -1).reverse().map(([x, y]) => [W - x, y]);
  return smooth([...left, ...right].flat());
}
const SILHOUETTE = outline();

type Shape = { m: MuscleId; p: Pts };
const FRONT: Shape[] = [
  { m: 'neck', p: [95, 64, 88, 70, 90, 78, 98, 77] },
  { m: 'traps', p: [89, 74, 76, 79, 66, 85, 80, 86, 92, 81] },
  { m: 'frontDelts', p: [70, 88, 56, 92, 49, 104, 52, 122, 60, 128, 67, 112, 72, 98] },
  { m: 'sideDelts', p: [52, 92, 43, 102, 39, 118, 40, 134, 46, 126, 48, 108] },
  { m: 'chestUpper', p: [98, 92, 82, 90, 70, 96, 66, 108, 82, 108, 98, 110] },
  { m: 'chestMid', p: [98, 113, 66, 111, 65, 124, 80, 130, 98, 128] },
  { m: 'chestLower', p: [98, 131, 80, 133, 66, 128, 70, 142, 84, 150, 98, 148] },
  { m: 'serratus', p: [68, 148, 64, 156, 68, 160, 73, 154] },
  { m: 'serratus', p: [68, 163, 65, 170, 69, 174, 74, 168] },
  { m: 'biceps', p: [57, 134, 46, 136, 41, 156, 43, 180, 50, 190, 56, 172, 59, 150] },
  { m: 'brachialis', p: [39, 174, 36, 190, 40, 198, 43, 186] },
  { m: 'brachioradialis', p: [37, 204, 31, 220, 30, 236, 37, 226, 44, 210] },
  { m: 'forearmFlexors', p: [45, 210, 38, 232, 33, 258, 37, 270, 44, 248, 49, 222] },
  { m: 'absUpper', p: [98, 154, 87, 154, 86, 170, 98, 171] },
  { m: 'absUpper', p: [98, 175, 86, 175, 86, 191, 98, 192] },
  { m: 'absLower', p: [98, 196, 86, 196, 87, 212, 98, 213] },
  { m: 'absLower', p: [98, 217, 87, 217, 90, 238, 98, 246] },
  { m: 'obliques', p: [82, 154, 73, 166, 70, 196, 75, 220, 84, 214, 83, 182] },
  { m: 'abductors', p: [69, 222, 64, 238, 66, 256, 72, 244] },
  { m: 'adductors', p: [95, 258, 86, 266, 83, 290, 90, 300, 97, 280] },
  { m: 'rectusFemoris', p: [83, 252, 76, 270, 75, 304, 81, 324, 88, 306, 89, 272] },
  { m: 'vastusLateralis', p: [71, 254, 64, 280, 65, 314, 71, 330, 75, 302, 75, 266] },
  { m: 'vastusMedialis', p: [90, 300, 84, 312, 84, 330, 92, 334, 96, 316] },
  { m: 'tibialis', p: [80, 346, 75, 366, 76, 396, 80, 402, 84, 372, 85, 350] },
  { m: 'gastroLateral', p: [70, 344, 66, 362, 69, 390, 74, 372, 74, 352] },
];
const BACK: Shape[] = [
  { m: 'traps', p: [100, 64, 88, 72, 64, 86, 78, 92, 100, 104] },
  { m: 'rhomboids', p: [100, 107, 80, 98, 77, 116, 88, 140, 100, 150] },
  { m: 'rearDelts', p: [62, 88, 48, 96, 41, 112, 52, 114, 66, 100] },
  { m: 'sideDelts', p: [45, 98, 39, 110, 38, 130, 44, 124] },
  { m: 'teres', p: [74, 118, 64, 122, 65, 132, 76, 128] },
  { m: 'lats', p: [78, 130, 64, 136, 65, 168, 76, 200, 92, 196, 90, 160] },
  { m: 'lowerBack', p: [98, 154, 92, 158, 90, 200, 94, 222, 98, 224] },
  { m: 'tricepsLong', p: [58, 128, 51, 136, 51, 170, 56, 190, 60, 170, 62, 142] },
  { m: 'tricepsLateral', p: [48, 124, 40, 134, 38, 160, 44, 182, 48, 160, 50, 138] },
  { m: 'forearmExtensors', p: [42, 206, 32, 230, 31, 262, 38, 270, 45, 240, 49, 214] },
  { m: 'gluteMed', p: [72, 212, 64, 226, 68, 240, 81, 232] },
  { m: 'gluteMax', p: [98, 226, 80, 226, 67, 246, 72, 268, 90, 274, 98, 266] },
  { m: 'adductors', p: [96, 274, 92, 278, 92, 300, 97, 296] },
  { m: 'bicepsFemoris', p: [74, 276, 66, 296, 67, 330, 76, 336, 81, 302, 81, 280] },
  { m: 'semitendinosus', p: [90, 280, 84, 290, 84, 326, 90, 336, 95, 310, 96, 286] },
  { m: 'gastroLateral', p: [71, 342, 65, 360, 68, 384, 76, 378, 80, 358, 78, 344] },
  { m: 'gastroMedial', p: [88, 340, 81, 348, 80, 376, 88, 388, 94, 370, 92, 348] },
  { m: 'soleus', p: [72, 388, 70, 398, 78, 406, 90, 404, 92, 392, 84, 392] },
];

// 0 = untouched … 1 = hammered. Each step is lighter too, so it reads without colour.
const SCALE = ['#2A303B', '#4E232A', '#7C262C', '#AE2B2A', '#E2392F', '#FF5D3F'];
export const HEAT_SCALE = SCALE;

const level = (heat: Heat, m: MuscleId) => heat[m] ?? 0;
/** react-native-svg on web leaks touch-responder props into the DOM; a plain click handler is clean there. */
const tapProps = (fn?: () => void) => (!fn ? {} : Platform.OS === 'web' ? ({ onClick: fn } as object) : { onPress: fn });

const fill = (v: number) => SCALE[Math.round(Math.max(0, Math.min(1, v)) * (SCALE.length - 1))];

function Figure({ shapes, heat, height, onPick, picked }: {
  shapes: Shape[]; heat: Heat; height: number; onPick?: (m: MuscleId) => void; picked?: MuscleId | null;
}) {
  return (
    <Svg width={height * 0.5} height={height} viewBox="0 0 200 440">
      <Path d={SILHOUETTE} fill="#171B23" stroke="#222833" strokeWidth={1.5} />
      <G>
        {shapes.flatMap((s, i) =>
          [false, true].map((mirror) => (
            <Path
              key={`${i}-${mirror}`}
              d={smooth(s.p, mirror)}
              fill={fill(level(heat, s.m))}
              stroke={picked === s.m ? colors.text : colors.bg}
              strokeWidth={picked === s.m ? 2 : 1.4}
              {...tapProps(onPick ? () => onPick(s.m) : undefined)}
            />
          )),
        )}
      </G>
    </Svg>
  );
}

export function BodyMap({ heat, height = 300, interactive = false }: { heat: Heat; height?: number; interactive?: boolean }) {
  const [picked, setPicked] = useState<MuscleId | null>(null);
  const onPick = interactive ? (m: MuscleId) => setPicked((p) => (p === m ? null : m)) : undefined;
  return (
    <View style={{ alignItems: 'center', gap: 6 }} accessibilityRole="image" accessibilityLabel="Muscle map, front and back">
      <View style={{ flexDirection: 'row', gap: height * 0.06 }}>
        <Figure shapes={FRONT} heat={heat} height={height} onPick={onPick} picked={picked} />
        <Figure shapes={BACK} heat={heat} height={height} onPick={onPick} picked={picked} />
      </View>
      {interactive ? (
        <T v="small" color={picked ? colors.text : colors.muted}>
          {picked ? `${MUSCLES[picked].label} · ${Math.round((heat[picked] ?? 0) * 100)}% effort` : 'Tap a muscle to see its name'}
        </T>
      ) : null}
    </View>
  );
}

export function HeatLegend() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <T v="small" style={{ fontSize: 11 }}>Rest</T>
      {SCALE.map((c) => (
        <View key={c} style={{ width: 16, height: 9, borderRadius: 3, backgroundColor: c }} />
      ))}
      <T v="small" style={{ fontSize: 11 }}>Max</T>
    </View>
  );
}
