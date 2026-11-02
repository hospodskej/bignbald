import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/**
 * Duotone icon set: a soft filled shape (the "tone") plus a crisp outline.
 * Active icons fill with the accent; inactive ones stay quiet.
 */
export type IconName =
  | 'home' | 'train' | 'diet' | 'rankings' | 'me' | 'swap' | 'scan' | 'flame' | 'bolt' | 'check' | 'chevron'
  | 'back' | 'plus' | 'minus' | 'lock' | 'versus' | 'crown' | 'water' | 'cart' | 'up' | 'down' | 'close' | 'scale' | 'star';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  /** Fill the tone layer with the colour (active state). */
  active?: boolean;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = colors.text, active = false, strokeWidth = 2 }: Props) {
  const tone = active ? color : 'transparent';
  const toneOpacity = active ? 0.28 : 0;
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const fill = { fill: tone, fillOpacity: toneOpacity };

  const body = (() => {
    switch (name) {
      case 'home': // fortress / hero base
        return (
          <>
            <Path d="M4 21V10l3-2V5h3v1.5L12 5l2 1.5V5h3v3l3 2v11z" {...fill} />
            <Path d="M4 21V10l3-2V5h3v1.5L12 5l2 1.5V5h3v3l3 2v11zM10 21v-5a2 2 0 0 1 4 0v5" {...stroke} />
          </>
        );
      case 'train': // loaded dumbbell
        return (
          <>
            <Rect x="3" y="7" width="4" height="10" rx="1.2" {...fill} />
            <Rect x="17" y="7" width="4" height="10" rx="1.2" {...fill} />
            <Path d="M5 7.5V6.8C5 6.4 5.4 6 5.8 6h.4c.4 0 .8.4.8.8v10.4c0 .4-.4.8-.8.8h-.4c-.4 0-.8-.4-.8-.8V16.5M3 9.5v5M17 6.8c0-.4.4-.8.8-.8h.4c.4 0 .8.4.8.8v10.4c0 .4-.4.8-.8.8h-.4c-.4 0-.8-.4-.8-.8zM21 9.5v5M7 12h10M3.5 12H5M19 12h1.5" {...stroke} />
          </>
        );
      case 'diet': // bowl with steam
        return (
          <>
            <Path d="M3 12h18a9 7 0 0 1-18 0z" {...fill} />
            <Path d="M3 12h18a9 7 0 0 1-18 0zM8 19.5h8M9 4c1 1.2-1 2.3 0 3.5M12 3c1 1.2-1 2.3 0 3.5M15 4c1 1.2-1 2.3 0 3.5" {...stroke} />
          </>
        );
      case 'rankings': // crown on a podium
        return (
          <>
            <Path d="M5 13l-1-7 4.5 3L12 4l3.5 5L20 6l-1 7z" {...fill} />
            <Path d="M5 13l-1-7 4.5 3L12 4l3.5 5L20 6l-1 7zM5 13h14M3 21h18M7 21v-4h10v4" {...stroke} />
          </>
        );
      case 'me': // domino hero mask
        return (
          <>
            <Path d="M2 9c3-2 7-2 10 0 3-2 7-2 10 0 0 5-3 8-6 8-2 0-3-1.5-4-3-1 1.5-2 3-4 3-3 0-6-3-6-8z" {...fill} />
            <Path d="M2 9c3-2 7-2 10 0 3-2 7-2 10 0 0 5-3 8-6 8-2 0-3-1.5-4-3-1 1.5-2 3-4 3-3 0-6-3-6-8z" {...stroke} />
            <Path d="M5.5 11.5c.8-1 2.4-1 3.2 0M15.3 11.5c.8-1 2.4-1 3.2 0" {...stroke} />
          </>
        );
      case 'swap':
        return <Path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" {...stroke} />;
      case 'scan':
        return <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13.5 8v8M17 8v8" {...stroke} />;
      case 'flame':
        return (
          <>
            <Path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z" fill={color} fillOpacity={0.9} />
            <Path d="M12 22c-1.7 0-3-1.3-3-3 0-2 2-3 2-5 1.5 1 4 2.5 4 5 0 1.7-1.3 3-3 3z" fill={colors.ink} fillOpacity={0.35} />
          </>
        );
      case 'bolt':
        return <Path d="M13 2L4 14h7l-1 8 9-12h-7z" fill={color} />;
      case 'check':
        return <Path d="M5 12.5l4.5 4.5L19 7" {...stroke} />;
      case 'chevron':
        return <Path d="M6 9l6 6 6-6" {...stroke} />;
      case 'back':
        return <Path d="M15 18l-6-6 6-6" {...stroke} />;
      case 'plus':
        return <Path d="M12 5v14M5 12h14" {...stroke} />;
      case 'minus':
        return <Path d="M5 12h14" {...stroke} />;
      case 'close':
        return <Path d="M6 6l12 12M18 6L6 18" {...stroke} />;
      case 'up':
        return <Path d="M12 19V5M5 12l7-7 7 7" {...stroke} />;
      case 'down':
        return <Path d="M12 5v14M5 12l7 7 7-7" {...stroke} />;
      case 'lock':
        return (
          <>
            <Rect x="5" y="11" width="14" height="10" rx="2" {...stroke} />
            <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
          </>
        );
      case 'versus': // crossed swords
        return <Path d="M4 4l9 9M4 4h4M4 4v4M20 4l-9 9M20 4h-4M20 4v4M7 17l-3 3M17 17l3 3M9 15l-2 2 0 0M15 15l2 2M6 14l4 4M18 14l-4 4" {...stroke} />;
      case 'crown':
        return <Path d="M4 18l-1-11 5 4 4-7 4 7 5-4-1 11z" fill={color} />;
      case 'water':
        return (
          <>
            <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" {...fill} />
            <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" {...stroke} />
          </>
        );
      case 'cart':
        return <Path d="M3 4h2l2.5 11h10L20 7H6.5M9 20a1 1 0 1 0 0-.1M17 20a1 1 0 1 0 0-.1" {...stroke} />;
      case 'scale':
        return (
          <>
            <Rect x="3" y="4" width="18" height="16" rx="4" {...stroke} />
            <Path d="M8 9a5 5 0 0 1 8 0l-3 2.5" {...stroke} />
          </>
        );
      case 'star':
        return <Path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5l-5.5 2.9 1-6.3L3 9.7l6.2-.9z" fill={color} />;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {body}
    </Svg>
  );
}

export const Dot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <Svg width={size} height={size}>
    <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
  </Svg>
);
