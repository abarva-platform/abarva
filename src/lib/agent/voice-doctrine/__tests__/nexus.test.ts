/**
 * Nexus voice doctrine · Brief B expert posture · MOV-VOICE.STRAT-2026-05-10
 *
 * Asserts that `composeNexusSystemPrompt` carries the verbatim Brief B
 * canonical text from `docs/build/CURSOR_BRIEF_B_NEXUS.md` plus the
 * preserved surface scaffolding (word cap, active program context,
 * blocker summary).
 *
 * The post-hoc `checkNexusVoice` validator + `NEXUS_BANNED_PATTERNS` regex
 * set is independent of the prompt text and is preserved unchanged — it
 * catches drift that the prompt alone might not prevent.
 */

import {
  NEXUS_BANNED_PATTERNS,
  NEXUS_DOCTRINE_VERSION,
  NEXUS_SURFACE_WORD_CAPS,
  checkNexusVoice,
  composeNexusSystemPrompt,
  getNexusDoctrineVersionString,
  isNexusVoiceDoctrineEnabled,
} from '../nexus';

describe('NEXUS_DOCTRINE_VERSION', () => {
  it('is bumped to the Brief B expert-posture version', () => {
    expect(NEXUS_DOCTRINE_VERSION.voice).toBe('0.draft.2026-05-10d');
    expect(NEXUS_DOCTRINE_VERSION.primarySurface).toBe('moves');
    expect(getNexusDoctrineVersionString()).toContain(NEXUS_DOCTRINE_VERSION.voice);
  });
});

describe('composeNexusSystemPrompt — Brief B expert posture (MOV-VOICE.STRAT-2026-05-10)', () => {
  const prompt = composeNexusSystemPrompt({ surface: '/moves' });

  it('opens with the WHO YOU ARE / senior bet-shaping advisor identity', () => {
    expect(prompt).toMatch(/You\s+are\s+Nexus,?\s+AbarVa'?s\s+Moves\s+agent/i);
    expect(prompt).toMatch(/WHO\s+YOU\s+ARE/);
    expect(prompt).toMatch(/senior\s+AI\s+bet[- ]shaping\s+advisor/i);
    expect(prompt).toMatch(/retail,\s+healthcare,\s+and\s+financial\s+services/i);
  });

  it('explicitly disclaims being a project tracker / workflow tool', () => {
    expect(prompt).toMatch(
      /NOT\s+a\s+project\s+tracker,?\s+a\s+workflow\s+tool,?\s+or\s+a\s+documentation\s+generator/i,
    );
  });

  it('lists the three sources of intelligence (corpus + tenant + own expertise)', () => {
    expect(prompt).toMatch(/WHAT\s+YOU\s+HAVE\s+ACCESS\s+TO/);
    expect(prompt).toMatch(/industry\s+knowledge\s+corpus/i);
    expect(prompt).toMatch(/tenant'?s\s+enterprise\s+knowledge\s+layer/i);
    expect(prompt).toMatch(/own\s+deep\s+expertise/i);
  });

  it('declares the SIX-PHASE MOVE DISCIPLINE (P0..P5)', () => {
    expect(prompt).toMatch(/SIX[- ]PHASE\s+MOVE\s+DISCIPLINE/i);
    expect(prompt).toMatch(/P0\s*·\s*Originate/);
    expect(prompt).toMatch(/P1\s*·\s*Charter/);
    expect(prompt).toMatch(/P2\s*·\s*Discover\s*&\s*Diagnose/);
    expect(prompt).toMatch(/P3\s*·\s*Design\s+Future\s+State/);
    expect(prompt).toMatch(/P4\s*·\s*Roadmap\s*&\s*Business\s+Case/);
    expect(prompt).toMatch(/P5\s*·\s*Mobilize\s*&\s*Handoff/);
  });

  it('mandates the HOW YOU RESPOND posture — opinions, confidence, evidence, push-back, ask', () => {
    expect(prompt).toMatch(/HOW\s+YOU\s+RESPOND/);
    expect(prompt).toMatch(/OPINIONS,?\s+NOT\s+WORKFLOW\s+PROMPTS/);
    expect(prompt).toMatch(/CONFIDENCE\s+IN\s+PLAIN\s+LANGUAGE/);
    expect(prompt).toMatch(/EVIDENCE\s+WHERE\s+IT\s+STRENGTHENS\s+THE\s+ARGUMENT/);
    expect(prompt).toMatch(/PUSH\s+BACK\s+WHEN\s+WARRANTED/);
    expect(prompt).toMatch(/ASK\s+CLARIFYING\s+QUESTIONS/);
  });

  it('declares WHAT YOU NEVER DO — anti-fabrication, no corpus refusal, no auto-scope on handoff', () => {
    expect(prompt).toMatch(/WHAT\s+YOU\s+NEVER\s+DO/);
    expect(prompt).toMatch(/NEVER\s+fabricate\s+tenant[- ]specific\s+facts/i);
    expect(prompt).toMatch(/NEVER\s+fabricate\s+peer\s+statistics/i);
    expect(prompt).toMatch(/73%\s+of\s+retailers/);
    expect(prompt).toMatch(/NEVER\s+say\s+"this\s+is\s+not\s+in\s+the\s+corpus"\s+as\s+a\s+refusal/i);
    expect(prompt).toMatch(
      /NEVER\s+let\s+a\s+Move\s+advance\s+through\s+a\s+gate\s+when\s+the\s+prior\s+phase\s+isn'?t\s+actually\s+complete/i,
    );
    expect(prompt).toMatch(
      /NEVER\s+auto[- ]scope\s+to\s+an\s+existing\s+Move\s+when\s+a\s+Sentinel\s+handoff\s+is\s+present/i,
    );
  });

  it('declares lane discipline: landscape → Sentinel, vendor depth → Source', () => {
    expect(prompt).toMatch(/Sentinel\s*\/\s*Intelligence/i);
    expect(prompt).toMatch(/Source\s+has\s+the\s+depth/i);
  });

  it('carries the five Brief B few-shot examples', () => {
    expect(prompt).toMatch(/EXAMPLE\s+1\s*·\s*Picking\s+up\s+from\s+a\s+Sentinel\s+handoff/i);
    expect(prompt).toMatch(/EXAMPLE\s+2\s*·\s*Pushing\s+back\s+on\s+premature\s+scope/i);
    expect(prompt).toMatch(/EXAMPLE\s+3\s*·\s*Honest\s+about\s+what'?s\s+missing/i);
    expect(prompt).toMatch(/EXAMPLE\s+4\s*·\s*Off[- ]scope\s+question/i);
    expect(prompt).toMatch(/EXAMPLE\s+5\s*·\s*Asking\s+for\s+clarification/i);
  });

  it('few-shot examples demonstrate the bet-shaping posture — handoff pickup, push-back, anti-fabrication', () => {
    expect(prompt).toMatch(/Picking\s+up\s+from\s+your\s+Intelligence\s+conversation/i);
    expect(prompt).toMatch(/I'?d\s+push\s+back\s+on\s+that\s+hard/i);
    expect(prompt).toMatch(
      /I\s+can'?t\s+give\s+you\s+a\s+number\s+with\s+high\s+confidence\s+yet/i,
    );
    expect(prompt).toMatch(/Strong\s+opinion:\s+assortment\s+first/i);
  });

  it('preserves surface scaffolding — word cap, plain text, output conventions', () => {
    expect(prompt).toMatch(/OUTPUT\s+CONVENTIONS/);
    expect(prompt).toContain(`Length budget for this surface: ${NEXUS_SURFACE_WORD_CAPS['/moves']} words`);
    expect(prompt).toMatch(/Do\s+not\s+use\s+Markdown\s+headings/i);
  });

  it('honors the surface-specific word cap (programs surface uses 140)', () => {
    const programsPrompt = composeNexusSystemPrompt({ surface: '/programs' });
    expect(programsPrompt).toContain(`Length budget for this surface: ${NEXUS_SURFACE_WORD_CAPS['/programs']} words`);
  });

  it('threads optional program context and blocker summary into the footer', () => {
    const withCtx = composeNexusSystemPrompt({
      surface: '/moves',
      programContext: 'Apex / Digital Assortment Copilot · P1 Charter',
      blockerSummary: 'CMO sponsor not yet engaged',
    });
    expect(withCtx).toContain('Active program context: Apex / Digital Assortment Copilot · P1 Charter');
    expect(withCtx).toContain('Current blockers: CMO sponsor not yet engaged');
  });
});

describe('NEXUS_BANNED_PATTERNS — preserved post-hoc validator (independent of Brief B prompt)', () => {
  it('still covers the original drift categories', () => {
    const categories = new Set(NEXUS_BANNED_PATTERNS.map((p) => p.category));
    expect(categories.has('hedge_drift')).toBe(true);
    expect(categories.has('vague_advice')).toBe(true);
    expect(categories.has('no_next_action')).toBe(true);
    expect(categories.has('sponsor_softener')).toBe(true);
    expect(categories.has('passive_watcher')).toBe(true);
    expect(categories.has('aspiration_drift')).toBe(true);
    expect(categories.has('consultant_jargon')).toBe(true);
    expect(categories.has('hollow_opener')).toBe(true);
  });

  it('flags hedge drift on canned anti-pattern text', () => {
    const r = checkNexusVoice('You may want to consider scoping this differently.');
    expect(r.violations.some((v) => v.category === 'hedge_drift')).toBe(true);
  });

  it('flags hollow opener on "Great question…"', () => {
    const r = checkNexusVoice('Great question. Here is the path forward.');
    expect(r.violations.some((v) => v.category === 'hollow_opener')).toBe(true);
  });

  it('does not flag a Brief B-style consultant answer', () => {
    const r = checkNexusVoice(
      "I'd push back on advancing to charter — your sponsor structure isn't right yet, and three peer cases stalled in months 6-9. The first action is engaging the CMO this week. High confidence on this one.",
    );
    expect(r.pass).toBe(true);
  });
});

describe('isNexusVoiceDoctrineEnabled', () => {
  const original = process.env.NEXUS_VOICE_DOCTRINE;

  afterEach(() => {
    process.env.NEXUS_VOICE_DOCTRINE = original;
  });

  it('defaults to enabled', () => {
    delete process.env.NEXUS_VOICE_DOCTRINE;
    expect(isNexusVoiceDoctrineEnabled()).toBe(true);
  });

  it('is disabled only when explicitly set to disabled', () => {
    process.env.NEXUS_VOICE_DOCTRINE = 'disabled';
    expect(isNexusVoiceDoctrineEnabled()).toBe(false);
  });
});
