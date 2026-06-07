// ─────────────────────────────────────────────────────────────────────────────
// DRAFT CONFIG  ← the only file you need to edit as remaining picks are made
//
// Each drafter will ultimately have 12 teams (48 teams ÷ 4 drafters).
// Currently 5 teams each; add picks to the teams arrays below.
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
    name: 'Pederson',
    color: '#38bdf8',
    teams: [
      { espnAbbr: 'ESP', name: 'Spain',       flag: '🇪🇸', isoNum: '724' },
      { espnAbbr: 'NED', name: 'Netherlands', flag: '🇳🇱', isoNum: '528' },
      { espnAbbr: 'NOR', name: 'Norway',      flag: '🇳🇴', isoNum: '578' },
      { espnAbbr: 'JPN', name: 'Japan',       flag: '🇯🇵', isoNum: '392' },
      { espnAbbr: 'CRO', name: 'Croatia',     flag: '🇭🇷', isoNum: '191' },
      // ← add picks 6-12 here
    ],
  },
  {
    id: 'barber',
    name: 'Barber',
    color: '#f97316',
    teams: [
      { espnAbbr: 'FRA', name: 'France',  flag: '🇫🇷', isoNum: '250' },
      { espnAbbr: 'GER', name: 'Germany', flag: '🇩🇪', isoNum: '276' },
      { espnAbbr: 'BEL', name: 'Belgium', flag: '🇧🇪', isoNum: '056' },
      { espnAbbr: 'URU', name: 'Uruguay', flag: '🇺🇾', isoNum: '858' },
      { espnAbbr: 'MEX', name: 'Mexico',  flag: '🇲🇽', isoNum: '484' },
      // ← add picks 6-12 here
    ],
  },
  {
    id: 'lipstein',
    name: 'Lipstein',
    color: '#a3e635',
    teams: [
      { espnAbbr: 'ENG', name: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', isoNum: '826' }, // maps to GBR on world map
      { espnAbbr: 'BRA', name: 'Brazil',      flag: '🇧🇷', isoNum: '076' },
      { espnAbbr: 'COL', name: 'Colombia',    flag: '🇨🇴', isoNum: '170' },
      { espnAbbr: 'SUI', name: 'Switzerland', flag: '🇨🇭', isoNum: '756' },
      { espnAbbr: 'ECU', name: 'Ecuador',     flag: '🇪🇨', isoNum: '218' },
      // ← add picks 6-12 here
    ],
  },
  {
    id: 'martin',
    name: 'Martin',
    color: '#e879f9',
    teams: [
      { espnAbbr: 'ARG', name: 'Argentina', flag: '🇦🇷', isoNum: '032' },
      { espnAbbr: 'POR', name: 'Portugal',  flag: '🇵🇹', isoNum: '620' },
      { espnAbbr: 'MAR', name: 'Morocco',   flag: '🇲🇦', isoNum: '504' },
      { espnAbbr: 'USA', name: 'USA',       flag: '🇺🇸', isoNum: '840' },
      { espnAbbr: 'SEN', name: 'Senegal',   flag: '🇸🇳', isoNum: '686' },
      // ← add picks 6-12 here
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
