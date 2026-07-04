import { describe, it, expect } from 'vitest';
import { BRACKET_ORDER } from './bracketOrder';

// Ground truth derived from ESPN WC 2026 API.
// QF placeholder text (e.g. "RD16 W5 vs RD16 W6") is authoritative.
// R32 → R16 feeding derived from which teams appear in each R16 matchup.

const R32_FEEDS_R16: Record<string, string> = {
  '760489': '760503', '760492': '760503',  // GER/PAR + FRA/SWE → PAR/FRA R16
  '760486': '760502', '760488': '760502',  // RSA/CAN + NED/MAR → CAN/MAR R16
  '760496': '760506', '760497': '760506',  // POR/CRO + ESP/AUT → POR/ESP R16
  '760494': '760507', '760493': '760507',  // USA/BIH + BEL/SEN → USA/BEL R16
  '760487': '760504', '760490': '760504',  // BRA/JPN + CIV/NOR → BRA/NOR R16
  '760491': '760505', '760495': '760505',  // MEX/ECU + ENG/COD → MEX/ENG R16
  '760498': '760508', '760501': '760508',  // SUI/ALG + COL/GHA → SUI/COL R16
  '760500': '760509', '760499': '760509',  // ARG/CPV + AUS/EGY → ARG/EGY R16
};

const R16_FEEDS_QF: Record<string, string> = {
  '760503': '760510', '760502': '760510',  // PAR/FRA + CAN/MAR → QF1
  '760506': '760511', '760507': '760511',  // POR/ESP + USA/BEL → QF2
  '760504': '760512', '760505': '760512',  // BRA/NOR + MEX/ENG → QF3
  '760508': '760513', '760509': '760513',  // SUI/COL + ARG/EGY → QF4
};

const QF_FEEDS_SF: Record<string, string> = {
  '760510': '760514', '760511': '760514',  // QF1 + QF2 → SF1
  '760512': '760515', '760513': '760515',  // QF3 + QF4 → SF2
};

describe('BRACKET_ORDER', () => {
  it('R32 adjacent pairs both feed the same R16 event (ESPN ground truth)', () => {
    const r32 = BRACKET_ORDER.ROUND_OF_32!;
    expect(r32).toHaveLength(16);
    const errors: string[] = [];
    for (let k = 0; k < 8; k++) {
      const a = r32[2 * k], b = r32[2 * k + 1];
      const targetA = R32_FEEDS_R16[a];
      const targetB = R32_FEEDS_R16[b];
      if (!targetA) errors.push(`R32[${2*k}]=${a} not in feeding map`);
      if (!targetB) errors.push(`R32[${2*k+1}]=${b} not in feeding map`);
      if (targetA && targetB && targetA !== targetB) {
        errors.push(`R32 pair [${a},${b}] feeds different R16 events: ${targetA} vs ${targetB}`);
      }
    }
    expect(errors).toHaveLength(0);
  });

  it('R32 pairs feed the R16 at the expected position', () => {
    const r32 = BRACKET_ORDER.ROUND_OF_32!;
    const r16 = BRACKET_ORDER.ROUND_OF_16!;
    expect(r16).toHaveLength(8);
    const errors: string[] = [];
    for (let k = 0; k < 8; k++) {
      const a = r32[2 * k];
      const expectedR16 = R32_FEEDS_R16[a];
      const actualR16 = r16[k];
      if (expectedR16 !== actualR16) {
        errors.push(`R32 pair ${k} feeds ${expectedR16} but R16[${k}]=${actualR16}`);
      }
    }
    expect(errors).toHaveLength(0);
  });

  it('R16 adjacent pairs both feed the same QF event (ESPN ground truth)', () => {
    const r16 = BRACKET_ORDER.ROUND_OF_16!;
    const errors: string[] = [];
    for (let k = 0; k < 4; k++) {
      const a = r16[2 * k], b = r16[2 * k + 1];
      const targetA = R16_FEEDS_QF[a];
      const targetB = R16_FEEDS_QF[b];
      if (!targetA) errors.push(`R16[${2*k}]=${a} not in feeding map`);
      if (!targetB) errors.push(`R16[${2*k+1}]=${b} not in feeding map`);
      if (targetA && targetB && targetA !== targetB) {
        errors.push(`R16 pair [${a},${b}] feeds different QF events: ${targetA} vs ${targetB}`);
      }
    }
    expect(errors).toHaveLength(0);
  });

  it('R16 pairs feed the QF at the expected position', () => {
    const r16 = BRACKET_ORDER.ROUND_OF_16!;
    const qf = BRACKET_ORDER.QUARTER_FINAL!;
    expect(qf).toHaveLength(4);
    const errors: string[] = [];
    for (let k = 0; k < 4; k++) {
      const a = r16[2 * k];
      const expectedQF = R16_FEEDS_QF[a];
      const actualQF = qf[k];
      if (expectedQF !== actualQF) {
        errors.push(`R16 pair ${k} feeds ${expectedQF} but QF[${k}]=${actualQF}`);
      }
    }
    expect(errors).toHaveLength(0);
  });

  it('QF adjacent pairs both feed the same SF event (ESPN ground truth)', () => {
    const qf = BRACKET_ORDER.QUARTER_FINAL!;
    const sf = BRACKET_ORDER.SEMI_FINAL!;
    expect(sf).toHaveLength(2);
    const errors: string[] = [];
    for (let k = 0; k < 2; k++) {
      const a = qf[2 * k], b = qf[2 * k + 1];
      const targetA = QF_FEEDS_SF[a];
      const targetB = QF_FEEDS_SF[b];
      if (!targetA) errors.push(`QF[${2*k}]=${a} not in feeding map`);
      if (!targetB) errors.push(`QF[${2*k+1}]=${b} not in feeding map`);
      if (targetA && targetB && targetA !== targetB) {
        errors.push(`QF pair [${a},${b}] feeds different SF events: ${targetA} vs ${targetB}`);
      }
      // Also verify the SF ID matches
      const actualSF = sf[k];
      if (targetA && targetA !== actualSF) {
        errors.push(`QF pair ${k} feeds ${targetA} but SF[${k}]=${actualSF}`);
      }
    }
    expect(errors).toHaveLength(0);
  });

  it('no duplicate event IDs within any round', () => {
    for (const [stage, ids] of Object.entries(BRACKET_ORDER)) {
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const id of ids!) {
        if (seen.has(id)) dupes.push(id);
        seen.add(id);
      }
      expect(dupes, `Duplicate IDs in ${stage}: ${dupes.join(', ')}`).toHaveLength(0);
    }
  });
});
