/**
 * FM #4 — Voice drift · INT-RGS
 *
 * Failure mode: Sentinel's voice drifts to coach (Nexus's
 * voice), marketing (LinkedIn / vendor), or generic-assistant
 * (ChatGPT) registers. The mechanism: post-hoc validator runs
 * `checkSentinelVoice` against every response and rejects on
 * any banned phrase or missing structural element.
 *
 * This test asserts the doctrine module behaves correctly on
 * the canned anti-pattern + doctrine sample exchanges. The
 * actual model output check lands in CB-6.
 */

import {
  checkSentinelVoice,
  composeSentinelSystemPrompt,
} from '@/lib/agent/voice-doctrine/sentinel';
import { getQuestionsByCategory } from './fixtures/questions';

describe('FM #4 — Voice drift', () => {
  it('detects coach drift on canned anti-pattern responses', () => {
    const antiPatterns = [
      'You should escalate this to your sponsor immediately. PAT-PRG-CDP-001 supports the escalation pattern.',
      'The next step is to schedule a sponsor sync this week. Pattern PAT-PRG-SPN-001.',
      'I recommend reviewing the evidence ledger weekly. PAT-PRG-EVD-001.',
    ];
    for (const text of antiPatterns) {
      const r = checkSentinelVoice(text);
      expect(r.pass).toBe(false);
      expect(r.violations.some((v) => v.category === 'coach_drift')).toBe(true);
    }
  });

  it('detects marketing drift on canned anti-pattern responses', () => {
    const antiPatterns = [
      'Our revolutionary platform unlocks the value of your enterprise data. PAT-AI-001.',
      'Best-in-class AI capabilities empower your team to accelerate transformation. PAT-AI-001.',
      'The cutting-edge approach is a game-changer for next-generation enterprise software. PAT-AI-001.',
    ];
    for (const text of antiPatterns) {
      const r = checkSentinelVoice(text);
      expect(r.pass).toBe(false);
      expect(r.violations.some((v) => v.category === 'marketing')).toBe(true);
    }
  });

  it('detects hollow openers', () => {
    const r1 = checkSentinelVoice(
      "Great question! Patterns PAT-PRG-PIL-001 and PAT-PRG-CDP-001 both apply.",
    );
    const r2 = checkSentinelVoice(
      "Excellent question. The corpus shows three modes — see PAT-PRG-PIL-001.",
    );
    const r3 = checkSentinelVoice(
      "I'd be happy to help with this question. PAT-PRG-PIL-001 covers the case.",
    );
    expect(r1.violations.some((v) => v.category === 'hollow_opener')).toBe(true);
    expect(r2.violations.some((v) => v.category === 'hollow_opener')).toBe(true);
    expect(r3.violations.some((v) => v.category === 'hollow_opener')).toBe(true);
  });

  it('detects ungrounded openers', () => {
    const r1 = checkSentinelVoice(
      "Generally speaking, AI pilots fail because of organizational issues. PAT-PRG-PIL-001 names mechanisms.",
    );
    const r2 = checkSentinelVoice(
      "It's well-known that AI pilots scale poorly. PAT-PRG-PIL-001 captures the data.",
    );
    expect(r1.violations.some((v) => v.category === 'ungrounded_opener')).toBe(
      true,
    );
    expect(r2.violations.some((v) => v.category === 'ungrounded_opener')).toBe(
      true,
    );
  });

  it('passes a doctrine-compliant tenant-grounded answer', () => {
    const doctrine =
      'Three signals are open in your cross-program substrate. The HIGH-severity entry is xprog:apex:003 — CDP success depends on legacy CRM extraction; CRM extraction is unfunded. Decision target: 2026-05-31, owner Robert Vance.';
    const r = checkSentinelVoice(doctrine);
    expect(r.pass).toBe(true);
  });

  it('passes a doctrine-compliant honesty-mode answer', () => {
    const doctrine =
      "The worldview corpus is being authored. For this question I can cite the industry catalog and your tenant data only. No worldview chunk is yet retrievable.";
    const r = checkSentinelVoice(doctrine);
    expect(r.pass).toBe(true);
  });

  it('the system prompt explicitly bans every drift category', () => {
    const prompt = composeSentinelSystemPrompt({
      mode: 'corpus',
      tenantKey: null,
      surface: '/intelligence',
      vectorIndexPending: true,
      worldviewPending: true,
    });
    expect(prompt).toMatch(/coach drift/i);
    expect(prompt).toMatch(/marketing/i);
    expect(prompt).toMatch(/hollow opener/i);
    expect(prompt).toMatch(/ungrounded/i);
    // Specific banned phrases listed
    expect(prompt).toContain('you should');
    expect(prompt).toContain('the next step is');
    expect(prompt).toContain('I recommend');
    expect(prompt).toContain('unlock');
    expect(prompt).toContain('accelerate');
    expect(prompt).toContain('Great question');
  });

  it('every voice-drift probe in the fixture has bannedPhrases declared', () => {
    const probes = getQuestionsByCategory('voice_drift_probe');
    expect(probes.length).toBe(6);
    for (const probe of probes) {
      expect(probe.bannedPhrases).toBeDefined();
      expect(probe.bannedPhrases!.length).toBeGreaterThan(0);
    }
  });

  // CB-6 dependent — actual model output
  it.todo(
    'real Sentinel responses on the 6 voice-drift probes pass checkSentinelVoice (LLM-dependent — CB-6)',
  );
});
