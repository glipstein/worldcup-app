/**
 * update-strengths.mjs
 *
 * Fetches all international match results from the public martj42/international_results
 * dataset on GitHub, computes current Elo ratings for every WC 2026 team, converts
 * them to the app's 0–100 strength scale, and rewrites src/lib/teamStrength.ts.
 *
 * Run manually after each knockout round:
 *   node scripts/update-strengths.mjs
 *
 * Or trigger via GitHub Actions (workflow_dispatch) in .github/workflows/update-strengths.yml.
 *
 * No API key required.  Node 18+ (native fetch).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRENGTHS_PATH = path.join(__dirname, '../src/lib/teamStrength.ts');

// ─── Name → ESPN abbreviation ─────────────────────────────────────────────────
// Covers all 48 WC 2026 drafted teams + undrafted teams in TEAM_STRENGTH that
// are needed for the full bracket simulation.

const NAME_TO_ESPN = {
  // ── Drafted teams ────────────────────────────────────────────────────────────
  'Argentina': 'ARG',
  'France': 'FRA',
  'England': 'ENG',
  'Brazil': 'BRA',
  'Spain': 'ESP',
  'Germany': 'GER',
  'Portugal': 'POR',
  'Netherlands': 'NED',
  'Morocco': 'MAR',
  'Belgium': 'BEL',
  'Uruguay': 'URU',
  'United States': 'USA',
  'Colombia': 'COL',
  'Japan': 'JPN',
  'Croatia': 'CRO',
  'Switzerland': 'SUI',
  'Senegal': 'SEN',
  'Mexico': 'MEX',
  'Ecuador': 'ECU',
  'Norway': 'NOR',
  "Ivory Coast": 'CIV',
  "Côte d'Ivoire": 'CIV',
  'Turkey': 'TUR',
  'Austria': 'AUT',
  'Canada': 'CAN',
  'South Korea': 'KOR',
  'Korea Republic': 'KOR',
  'Sweden': 'SWE',
  'Czech Republic': 'CZE',
  'Czechia': 'CZE',
  'Egypt': 'EGY',
  'Scotland': 'SCO',
  'Paraguay': 'PAR',
  'Australia': 'AUS',
  'Algeria': 'ALG',
  'Ghana': 'GHA',
  'Bosnia and Herzegovina': 'BIH',
  'Bosnia-Herzegovina': 'BIH',
  'Iran': 'IRN',
  'IR Iran': 'IRN',
  'Tunisia': 'TUN',
  'DR Congo': 'COD',
  'Democratic Republic of Congo': 'COD',
  'Congo DR': 'COD',
  'Saudi Arabia': 'KSA',
  'Uzbekistan': 'UZB',
  'South Africa': 'RSA',
  'Panama': 'PAN',
  'Cape Verde': 'CPV',
  'Jordan': 'JOR',
  'Iraq': 'IRQ',
  'New Zealand': 'NZL',
  'Haiti': 'HAI',
  'Curaçao': 'CUW',
  'Qatar': 'QAT',

  // ── Undrafted — needed for bracket simulation accuracy ────────────────────
  'Italy': 'ITA',
  'Denmark': 'DEN',
  'Georgia': 'GEO',
  'Poland': 'POL',
  'Ukraine': 'UKR',
  'Romania': 'ROU',
  'Slovakia': 'SVK',
  'Hungary': 'HUN',
  'Serbia': 'SRB',
  'Albania': 'ALB',
  'Slovenia': 'SVN',
  'Greece': 'GRE',
  'Indonesia': 'IDN',
  'Nigeria': 'NGA',
  'Cameroon': 'CMR',
  'Mali': 'MLI',
  'Angola': 'ANG',
  'Tanzania': 'TAN',
  'Honduras': 'HON',
  'Jamaica': 'JAM',
  'El Salvador': 'SLV',
  'Venezuela': 'VEN',
  'Chile': 'CHI',
  'Bolivia': 'BOL',
  'Peru': 'PER',
};

// ─── Elo computation ──────────────────────────────────────────────────────────

/** K-factor by tournament importance */
function getK(tournament) {
  const t = tournament.toLowerCase();
  if (t.includes('fifa world cup') && !t.includes('qualif')) return 60;
  if (
    t.includes('uefa euro') || t.includes('copa america') ||
    t.includes('africa cup') || t.includes('afcon') ||
    t.includes('asian cup') || t.includes('gold cup') ||
    t.includes('nations league')
  ) return 50;
  if (t.includes('qualif')) return 40;
  if (t.includes('friendly')) return 20;
  return 35;
}

function computeElo(rows) {
  const ratings = {};

  for (const row of rows) {
    const { home, away, homeScore, awayScore, tournament, neutral } = row;
    if (!home || !away) continue;

    ratings[home] ??= 1500;
    ratings[away] ??= 1500;

    // Home advantage: add 100 points to home team's effective rating
    const homeAdv = neutral ? 0 : 100;
    const k = getK(tournament);

    const expHome = 1 / (1 + Math.pow(10, (ratings[away] - (ratings[home] + homeAdv)) / 400));

    const actualHome = homeScore > awayScore ? 1 : homeScore < awayScore ? 0 : 0.5;
    const actualAway = 1 - actualHome;

    ratings[home] += k * (actualHome - expHome);
    ratings[away] += k * (actualAway - (1 - expHome));
  }

  return ratings;
}

/** Convert raw Elo rating to our 0–100 strength scale.
 *  Calibrated so top nations (~2050–2100 Elo) land around 90–100
 *  and the weakest WC qualifiers (~1550–1650 Elo) land around 5–20. */
function eloToStrength(elo) {
  return Math.max(0, Math.min(100, Math.round((elo - 1500) / 6)));
}

// ─── CSV parsing (no external dependencies) ───────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const get = (parts, key) => parts[headers.indexOf(key)]?.trim() ?? '';

  return lines.slice(1).map(line => {
    // Handle quoted fields (some team/tournament names may contain commas)
    const parts = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { parts.push(cur); cur = ''; }
      else { cur += ch; }
    }
    parts.push(cur);

    return {
      home: get(parts, 'home_team'),
      away: get(parts, 'away_team'),
      homeScore: parseInt(get(parts, 'home_score')),
      awayScore: parseInt(get(parts, 'away_score')),
      tournament: get(parts, 'tournament'),
      neutral: get(parts, 'neutral') === 'TRUE',
    };
  }).filter(r => !isNaN(r.homeScore) && !isNaN(r.awayScore));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('⚽  Fetching match history from martj42/international_results…');
  const res = await fetch(
    'https://raw.githubusercontent.com/martj42/international_results/master/results.csv'
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching results CSV`);
  const csv = await res.text();

  console.log('   Parsing…');
  const rows = parseCSV(csv);
  console.log(`   ${rows.length.toLocaleString()} matches processed`);

  const ratings = computeElo(rows);

  // Build ESPN → { elo, strength } for every team we care about
  const updates = new Map(); // ESPN abbr → { elo, strength }
  for (const [name, espn] of Object.entries(NAME_TO_ESPN)) {
    if (!ratings[name] || updates.has(espn)) continue; // skip duplicates (aliases)
    const elo = Math.round(ratings[name]);
    updates.set(espn, { elo, strength: eloToStrength(elo) });
  }

  // SAU is just an alias for KSA (ESPN uses both; keep them in sync)
  if (updates.has('KSA')) {
    const ksa = updates.get('KSA');
    updates.set('SAU', { ...ksa });
  }

  // ── Print summary table ───────────────────────────────────────────────────
  const sorted = [...updates.entries()].sort((a, b) => b[1].elo - a[1].elo);
  console.log('\nUpdated strength ratings:\n');
  console.log('  ESPN  Elo     0–100');
  console.log('  ─────────────────────');
  for (const [espn, { elo, strength }] of sorted) {
    console.log(`  ${espn.padEnd(5)} ${String(elo).padStart(4)}  →  ${String(strength).padStart(3)}`);
  }

  // ── Patch teamStrength.ts ─────────────────────────────────────────────────
  let source = fs.readFileSync(STRENGTHS_PATH, 'utf8');

  for (const [espn, { strength }] of updates) {
    // Replace:  ABR: NN  (with optional comma, spaces, and/or existing comment)
    // Keep all surrounding context; only the numeric value changes.
    const re = new RegExp(`\\b(${espn}:\\s*)\\d+`, 'g');
    source = source.replace(re, `$1${strength}`);
  }

  fs.writeFileSync(STRENGTHS_PATH, source, 'utf8');
  console.log(`\n✅  Wrote updated strengths to src/lib/teamStrength.ts`);
  console.log('   Review the diff, then push to deploy.');
}

main().catch(err => { console.error(err); process.exit(1); });
