// ─────────────────────────────────────────────────────────────────────────────
// EURO 2024 FICTIONAL DRAFT CONFIG — used by the Debug page only.
//
// 24 Euro 2024 teams assigned to the same four drafters (Pedersen, Barber,
// Lipstein, Martin) via a snake draft ordered by expected finishing position.
// This is entirely fictional — it just provides realistic test data.
//
// Snake draft order (4 drafters × 6 rounds):
//   R1 (1→4): Pedersen=ESP, Barber=ENG, Lipstein=FRA, Martin=GER
//   R2 (4→1): Martin=NED, Lipstein=POR, Barber=SUI, Pedersen=TUR
//   R3 (1→4): Pedersen=ITA, Barber=BEL, Lipstein=AUT, Martin=ROU
//   R4 (4→1): Martin=GEO, Lipstein=SVK, Barber=UKR, Pedersen=CRO
//   R5 (1→4): Pedersen=CZE, Barber=DEN, Lipstein=SRB, Martin=POL
//   R6 (4→1): Martin=HUN, Lipstein=ALB, Barber=SCO, Pedersen=SVN
// ─────────────────────────────────────────────────────────────────────────────

import type { DrafterConfig } from './draft';

export const EURO_DRAFT_CONFIG: DrafterConfig[] = [
  {
    id: 'pederson',
    name: 'Pedersen',
    color: '#38bdf8',
    teams: [
      { espnAbbr: 'ESP', name: 'Spain',       flag: '🇪🇸', isoNum: '724' },
      { espnAbbr: 'TUR', name: 'Turkey',       flag: '🇹🇷', isoNum: '792' },
      { espnAbbr: 'ITA', name: 'Italy',        flag: '🇮🇹', isoNum: '380' },
      { espnAbbr: 'CRO', name: 'Croatia',      flag: '🇭🇷', isoNum: '191' },
      { espnAbbr: 'CZE', name: 'Czechia',      flag: '🇨🇿', isoNum: '203' },
      { espnAbbr: 'SVN', name: 'Slovenia',     flag: '🇸🇮', isoNum: '705' },
    ],
  },
  {
    id: 'barber',
    name: 'Barber',
    color: '#f97316',
    teams: [
      { espnAbbr: 'ENG', name: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', isoNum: '826' },
      { espnAbbr: 'SUI', name: 'Switzerland',  flag: '🇨🇭', isoNum: '756' },
      { espnAbbr: 'BEL', name: 'Belgium',      flag: '🇧🇪', isoNum: '056' },
      { espnAbbr: 'UKR', name: 'Ukraine',      flag: '🇺🇦', isoNum: '804' },
      { espnAbbr: 'DEN', name: 'Denmark',      flag: '🇩🇰', isoNum: '208' },
      { espnAbbr: 'SCO', name: 'Scotland',     flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', isoNum: '826' },
    ],
  },
  {
    id: 'lipstein',
    name: 'Lipstein',
    color: '#a3e635',
    teams: [
      { espnAbbr: 'FRA', name: 'France',       flag: '🇫🇷', isoNum: '250' },
      { espnAbbr: 'POR', name: 'Portugal',     flag: '🇵🇹', isoNum: '620' },
      { espnAbbr: 'AUT', name: 'Austria',      flag: '🇦🇹', isoNum: '040' },
      { espnAbbr: 'SVK', name: 'Slovakia',     flag: '🇸🇰', isoNum: '703' },
      { espnAbbr: 'SRB', name: 'Serbia',       flag: '🇷🇸', isoNum: '688' },
      { espnAbbr: 'ALB', name: 'Albania',      flag: '🇦🇱', isoNum: '008' },
    ],
  },
  {
    id: 'martin',
    name: 'Martin',
    color: '#e879f9',
    teams: [
      { espnAbbr: 'GER', name: 'Germany',      flag: '🇩🇪', isoNum: '276' },
      { espnAbbr: 'NED', name: 'Netherlands',  flag: '🇳🇱', isoNum: '528' },
      { espnAbbr: 'ROU', name: 'Romania',      flag: '🇷🇴', isoNum: '642' },
      { espnAbbr: 'GEO', name: 'Georgia',      flag: '🇬🇪', isoNum: '268' },
      { espnAbbr: 'POL', name: 'Poland',       flag: '🇵🇱', isoNum: '616' },
      { espnAbbr: 'HUN', name: 'Hungary',      flag: '🇭🇺', isoNum: '348' },
    ],
  },
];

/** ESPN abbreviation → drafter id for Euro 2024 */
export const EURO_DRAFTER_BY_ABBR = new Map<string, string>(
  EURO_DRAFT_CONFIG.flatMap(d => d.teams.map(t => [t.espnAbbr, d.id]))
);
