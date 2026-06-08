// ─────────────────────────────────────────────────────────────────────────────
// DRAFT CONFIG  ← the only file you need to edit as remaining picks are made
//
// Each drafter will ultimately have 12 teams (48 teams ÷ 4 drafters).
// Currently 43/48 teams picked (picks 1–43). One pick remaining per drafter
// except Martin who has two remaining.
//
// Fields per team:
//   espnAbbr  – ESPN 3-letter code used in the API (must match exactly)
//   name      – Display name
//   flag      – Flag emoji
//   isoNum    – ISO 3166-1 numeric code (for world map country shading)
// ─────────────────────────────────────────────────────────────────────────────

export interface DraftTeam {
  espnAbbr: string;
  name: string;
  flag: string;
  isoNum: string; // ISO 3166-1 numeric (string form used by world-atlas TopoJSON)
}

export interface DrafterConfig {
  id: string;
  name: string;
  color: string;
  teams: DraftTeam[];
}

export const DRAFT_CONFIG: DrafterConfig[] = [
  {
    id: 'pederson',
    name: 'Pedersen',
    color: '#38bdf8',
    teams: [
      { espnAbbr: 'ESP', name: 'Spain',        flag: '🇪🇸', isoNum: '724' },
      { espnAbbr: 'NED', name: 'Netherlands',  flag: '🇳🇱', isoNum: '528' },
      { espnAbbr: 'NOR', name: 'Norway',       flag: '🇳🇴', isoNum: '578' },
      { espnAbbr: 'JPN', name: 'Japan',        flag: '🇯🇵', isoNum: '392' },
      { espnAbbr: 'CRO', name: 'Croatia',      flag: '🇭🇷', isoNum: '191' },
      { espnAbbr: 'CAN', name: 'Canada',       flag: '🇨🇦', isoNum: '124' },
      { espnAbbr: 'KOR', name: 'South Korea',  flag: '🇰🇷', isoNum: '410' },
      { espnAbbr: 'ALG', name: 'Algeria',      flag: '🇩🇿', isoNum: '012' },
      { espnAbbr: 'GHA', name: 'Ghana',        flag: '🇬🇭', isoNum: '288' },
      { espnAbbr: 'RSA', name: 'South Africa', flag: '🇿🇦', isoNum: '710' },
      { espnAbbr: 'CPV', name: 'Cape Verde',   flag: '🇨🇻', isoNum: '132' },
      // ← add pick 44 here
    ],
  },
  {
    id: 'barber',
    name: 'Barber',
    color: '#f97316',
    teams: [
      { espnAbbr: 'FRA', name: 'France',               flag: '🇫🇷', isoNum: '250' },
      { espnAbbr: 'GER', name: 'Germany',              flag: '🇩🇪', isoNum: '276' },
      { espnAbbr: 'BEL', name: 'Belgium',              flag: '🇧🇪', isoNum: '056' },
      { espnAbbr: 'URU', name: 'Uruguay',              flag: '🇺🇾', isoNum: '858' },
      { espnAbbr: 'MEX', name: 'Mexico',               flag: '🇲🇽', isoNum: '484' },
      { espnAbbr: 'AUT', name: 'Austria',              flag: '🇦🇹', isoNum: '040' },
      { espnAbbr: 'SWE', name: 'Sweden',               flag: '🇸🇪', isoNum: '752' },
      { espnAbbr: 'AUS', name: 'Australia',            flag: '🇦🇺', isoNum: '036' },
      { espnAbbr: 'BIH', name: 'Bosnia & Herzegovina', flag: '🇧🇦', isoNum: '070' },
      { espnAbbr: 'UZB', name: 'Uzbekistan',           flag: '🇺🇿', isoNum: '860' },
      { espnAbbr: 'PAN', name: 'Panama',               flag: '🇵🇦', isoNum: '591' },
      // ← add pick 45 here
    ],
  },
  {
    id: 'lipstein',
    name: 'Lipstein',
    color: '#a3e635',
    teams: [
      { espnAbbr: 'ENG', name: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', isoNum: '826' }, // maps to GBR on world map
      { espnAbbr: 'BRA', name: 'Brazil',       flag: '🇧🇷', isoNum: '076' },
      { espnAbbr: 'COL', name: 'Colombia',     flag: '🇨🇴', isoNum: '170' },
      { espnAbbr: 'SUI', name: 'Switzerland',  flag: '🇨🇭', isoNum: '756' },
      { espnAbbr: 'ECU', name: 'Ecuador',      flag: '🇪🇨', isoNum: '218' },
      { espnAbbr: 'TUR', name: 'Turkey',       flag: '🇹🇷', isoNum: '792' },
      { espnAbbr: 'CZE', name: 'Czechia',      flag: '🇨🇿', isoNum: '203' },
      { espnAbbr: 'PAR', name: 'Paraguay',     flag: '🇵🇾', isoNum: '600' },
      { espnAbbr: 'IRN', name: 'Iran',         flag: '🇮🇷', isoNum: '364' },
      { espnAbbr: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦', isoNum: '682' },
      { espnAbbr: 'JOR', name: 'Jordan',       flag: '🇯🇴', isoNum: '400' },
      // ← add pick 46 here
    ],
  },
  {
    id: 'martin',
    name: 'Martin',
    color: '#e879f9',
    teams: [
      { espnAbbr: 'ARG', name: 'Argentina',  flag: '🇦🇷', isoNum: '032' },
      { espnAbbr: 'POR', name: 'Portugal',   flag: '🇵🇹', isoNum: '620' },
      { espnAbbr: 'MAR', name: 'Morocco',    flag: '🇲🇦', isoNum: '504' },
      { espnAbbr: 'USA', name: 'USA',        flag: '🇺🇸', isoNum: '840' },
      { espnAbbr: 'SEN', name: 'Senegal',    flag: '🇸🇳', isoNum: '686' },
      { espnAbbr: 'CIV', name: 'Ivory Coast',flag: '🇨🇮', isoNum: '384' },
      { espnAbbr: 'EGY', name: 'Egypt',      flag: '🇪🇬', isoNum: '818' },
      { espnAbbr: 'SCO', name: 'Scotland',   flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', isoNum: '826' }, // shares GBR polygon with England on world map
      { espnAbbr: 'TUN', name: 'Tunisia',    flag: '🇹🇳', isoNum: '788' },
      { espnAbbr: 'COD', name: 'DR Congo',   flag: '🇨🇩', isoNum: '180' },
      // ← add picks 47 & 48 here
    ],
  },
];

// ─── Derived lookup maps (auto-built from DRAFT_CONFIG — don't edit) ──────────

export const DRAFTER_BY_ID = new Map<string, DrafterConfig>(
  DRAFT_CONFIG.map(d => [d.id, d])
);

/** ESPN abbreviation → drafter id */
export const DRAFTER_BY_ABBR = new Map<string, string>(
  DRAFT_CONFIG.flatMap(d => d.teams.map(t => [t.espnAbbr, d.id]))
);

/** ISO numeric string → drafter id (for world map) */
export const DRAFTER_BY_ISO_NUM = new Map<string, string>(
  DRAFT_CONFIG.flatMap(d => d.teams.map(t => [t.isoNum.replace(/^0+/, ''), d.id]))
);

/** Set of all drafted ESPN abbreviations */
export const DRAFTED_ABBRS = new Set<string>(
  DRAFT_CONFIG.flatMap(d => d.teams.map(t => t.espnAbbr))
);
