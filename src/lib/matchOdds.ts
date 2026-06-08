// ─────────────────────────────────────────────────────────────────────────────
// Match-specific win probabilities sourced from Polymarket prediction market.
// Auto-updated every 6 hours by scripts/fetch-match-odds.mjs via GitHub Actions.
// Source: gamma-api.polymarket.com — fifwc-* match events
//
// Key format: "HOMEABBR_AWAYABBR"  (ESPN API home/away designation)
// pHome + pDraw + pAway = 1.0 (normalized from Polymarket market prices)
//
// Coverage:
//   Group stage  — all 72 scheduled matches (available pre-tournament)
//   Knockout     — added as each round's bracket is published on Polymarket
//   Fallback     — simulation.ts uses the Elo/strength formula for any match
//                  not covered here (hypothetical bracket paths, early in tourney)
//
// Last fetched: 2026-06-08T18:36:10.001Z
// Markets found: 38 / 99
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchOdds {
  pHome: number;
  pDraw: number;
  pAway: number;
}

/**
 * Polymarket match odds keyed by "HOMEABBR_AWAYABBR".
 * 38 markets fetched on 2026-06-08T18:36:10.001Z.
 */
export const MATCH_ODDS: Record<string, MatchOdds> = {
  ARG_AUT: { pHome: 0.5961, pDraw: 0.2414, pAway: 0.1626 },
  AUS_TUR: { pHome: 0.1823, pDraw: 0.2611, pAway: 0.5567 },
  AUT_JOR: { pHome: 0.7387, pDraw: 0.1658, pAway: 0.0955 },
  BEL_EGY: { pHome: 0.5821, pDraw: 0.2438, pAway: 0.1741 },
  BEL_IRN: { pHome: 0.6950, pDraw: 0.1950, pAway: 0.1100 },
  BIH_QAT: { pHome: 0.6181, pDraw: 0.2362, pAway: 0.1457 },
  BRA_MAR: { pHome: 0.5821, pDraw: 0.2438, pAway: 0.1741 },
  CAN_BIH: { pHome: 0.5423, pDraw: 0.2637, pAway: 0.1940 },
  CAN_QAT: { pHome: 0.7413, pDraw: 0.1741, pAway: 0.0846 },
  CIV_ECU: { pHome: 0.2663, pDraw: 0.3367, pAway: 0.3970 },
  CZE_RSA: { pHome: 0.4925, pDraw: 0.2836, pAway: 0.2239 },
  ECU_GER: { pHome: 0.1921, pDraw: 0.2414, pAway: 0.5665 },
  ENG_GHA: { pHome: 0.7313, pDraw: 0.1642, pAway: 0.1045 },
  ESP_CPV: { pHome: 0.8978, pDraw: 0.0709, pAway: 0.0313 },
  ESP_KSA: { pHome: 0.8788, pDraw: 0.0844, pAway: 0.0367 },
  FRA_IRQ: { pHome: 0.8667, pDraw: 0.0952, pAway: 0.0381 },
  FRA_SEN: { pHome: 0.6683, pDraw: 0.2060, pAway: 0.1256 },
  GER_CIV: { pHome: 0.6219, pDraw: 0.2040, pAway: 0.1741 },
  GHA_PAN: { pHome: 0.4627, pDraw: 0.2736, pAway: 0.2637 },
  IRQ_NOR: { pHome: 0.0647, pDraw: 0.1343, pAway: 0.8010 },
  JPN_SWE: { pHome: 0.4585, pDraw: 0.2780, pAway: 0.2634 },
  KSA_URU: { pHome: 0.1144, pDraw: 0.2139, pAway: 0.6716 },
  MAR_HAI: { pHome: 0.7350, pDraw: 0.1750, pAway: 0.0900 },
  MEX_RSA: { pHome: 0.6884, pDraw: 0.2060, pAway: 0.1055 },
  NED_JPN: { pHome: 0.4774, pDraw: 0.2663, pAway: 0.2563 },
  NED_SWE: { pHome: 0.5920, pDraw: 0.2338, pAway: 0.1741 },
  NOR_FRA: { pHome: 0.2206, pDraw: 0.2598, pAway: 0.5196 },
  PAN_ENG: { pHome: 0.0900, pDraw: 0.1550, pAway: 0.7550 },
  QAT_SUI: { pHome: 0.0667, pDraw: 0.1355, pAway: 0.7978 },
  SCO_BRA: { pHome: 0.1379, pDraw: 0.1970, pAway: 0.6650 },
  SCO_MAR: { pHome: 0.2239, pDraw: 0.2836, pAway: 0.4925 },
  SEN_IRQ: { pHome: 0.6733, pDraw: 0.2030, pAway: 0.1238 },
  SUI_BIH: { pHome: 0.5980, pDraw: 0.2362, pAway: 0.1658 },
  SUI_CAN: { pHome: 0.4384, pDraw: 0.2906, pAway: 0.2709 },
  TUN_JPN: { pHome: 0.1733, pDraw: 0.2673, pAway: 0.5594 },
  TUN_NED: { pHome: 0.1324, pDraw: 0.2157, pAway: 0.6520 },
  URU_CPV: { pHome: 0.6816, pDraw: 0.2040, pAway: 0.1144 },
  USA_AUS: { pHome: 0.5522, pDraw: 0.2438, pAway: 0.2040 },
};

/** ISO timestamp of the last successful fetch. */
export const MATCH_ODDS_FETCHED_AT = '2026-06-08T18:36:10.001Z';
