/**
 * Heroes = training plans. Each hero owns a colour, an emblem and a coach voice.
 * Add a hero here (and its plan in plans.ts) and the whole app picks it up.
 */
export const HEROES = {
  brawler: {
    id: 'brawler',
    name: 'The Brawler',
    short: 'Brawler',
    color: '#FF4D3D',
    bright: '#FF6B5E',
    deep: '#4A1A17',
    soft: '#2A1416',
    tagline: 'Raw power and volume.',
    tags: ['6 days', '5+ reps to failure'],
    coach: [
      'Make this one count.',
      'No skipped sets. No excuses.',
      'Heavy is a feeling. Chase it.',
      'You came here to fight. Lift like it.',
    ],
  },
  acrobat: {
    id: 'acrobat',
    name: 'The Acrobat',
    short: 'Acrobat',
    color: '#5B9DFF',
    bright: '#82B5FF',
    deep: '#16294A',
    soft: '#121C2E',
    tagline: 'Lean and athletic.',
    tags: ['3-4 days', 'Upper / lower'],
    coach: [
      'Light feet, strong back.',
      'Control the weight. Own the rep.',
      'Fast up, slow down.',
      'Stay sharp. Stay moving.',
    ],
  },
} as const;

export type HeroId = keyof typeof HEROES;
export type Hero = (typeof HEROES)[HeroId];
export const HERO_IDS = Object.keys(HEROES) as HeroId[];
export const hero = (id: HeroId): Hero => HEROES[id];
/** Server data is just text; fall back to the Brawler if a hero id is unknown. */
export const asHero = (id: string): HeroId => (id in HEROES ? (id as HeroId) : 'brawler');
