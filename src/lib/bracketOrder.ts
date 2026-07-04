import type { Stage } from './types';

// ESPN event IDs in correct bracket display order (top → bottom).
// Adjacent pairs feed the same next-round slot: R32[2k]+R32[2k+1] → R16[k], etc.
// Derived from ESPN WC 2026 API — QF placeholder text (e.g. "RD16 W1 vs RD16 W2")
// is the authoritative source for which R16 games feed which QF.
export const BRACKET_ORDER: Partial<Record<Stage, string[]>> = {
  ROUND_OF_32: [
    // → R16 760503 (PAR/FRA) → QF 760510 → SF 760514
    '760489', '760492',
    // → R16 760502 (CAN/MAR) → QF 760510 → SF 760514
    '760486', '760488',
    // → R16 760506 (POR/ESP) → QF 760511 → SF 760514
    '760496', '760497',
    // → R16 760507 (USA/BEL) → QF 760511 → SF 760514
    '760494', '760493',
    // → R16 760504 (BRA/NOR) → QF 760512 → SF 760515
    '760487', '760490',
    // → R16 760505 (MEX/ENG) → QF 760512 → SF 760515
    '760491', '760495',
    // → R16 760508 (SUI/COL) → QF 760513 → SF 760515
    '760498', '760501',
    // → R16 760509 (ARG/EGY) → QF 760513 → SF 760515
    '760500', '760499',
  ],
  ROUND_OF_16: [
    '760503', '760502',  // PAR/FRA + CAN/MAR → QF 760510 → SF 760514
    '760506', '760507',  // POR/ESP + USA/BEL → QF 760511 → SF 760514
    '760504', '760505',  // BRA/NOR + MEX/ENG → QF 760512 → SF 760515
    '760508', '760509',  // SUI/COL + ARG/EGY → QF 760513 → SF 760515
  ],
  QUARTER_FINAL: ['760510', '760511', '760512', '760513'],
  SEMI_FINAL:    ['760514', '760515'],
};
