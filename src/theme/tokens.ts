/**
 * Design tokens: the one place colours, fonts and spacing are defined.
 * Every component reads from here, so a palette change is a one-line edit.
 */
export const colors = {
  bg: '#0B0D12',
  surface: '#151922',
  surfaceSunk: '#0F1218',
  surfaceRaised: '#1B202A',
  line: '#262C38',
  lineStrong: '#39414F',
  text: '#F2F4F8',
  textDim: '#CFD5DF',
  muted: '#9AA3B2',
  faint: '#5E6878',
  ink: '#0B0D12', // text on bright fills
  green: '#3DDC97',
  greenDeep: '#123826',
  greenSoft: '#10231A',
  greenLine: '#1F5A40',
  amber: '#F2C14E',
  amberSoft: '#1A1710',
  amberLine: '#4D3F18',
  blue: '#7FB2FF',
  danger: '#FF5D5D',
} as const;

export const fonts = {
  /** Slanted comic-style headline face. */
  display: 'BarlowCondensed-ExtraBoldItalic',
  displayUpright: 'BarlowCondensed-ExtraBold',
  body: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  black: 'Inter-ExtraBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** Phone frame used on web so the app looks exactly like it does on a phone. */
export const device = { width: 430, height: 932, safeTop: 54, safeBottom: 30 } as const;
