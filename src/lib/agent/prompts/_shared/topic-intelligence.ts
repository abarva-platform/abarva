import { getServerSupabase } from '@/lib/supabase-server';
import type { DiagnosticQuestion, TopicRow, VendorEntry } from '@/lib/topics/db';

// Pack L v2 · TOPIC INTELLIGENCE system-prompt block.
// Reads the engagement's assigned topics and assembles a phase-aware block
// that names the playbook priorities for the current phase, the unasked
// diagnostic questions (with probe_depth sorting), the contradictions to
// scan for, and the vendor landscape to probe about.
//
// Returns '' when no topics are assigned — Nexus falls back to the generic
// phase prompt, no behavioral regression.

interface TopicIntelligenceArgs {
  engagementId: string;
  currentPhase: number;
  recentTurns: Array<{ sender: string; text: string }>;
}

const PHASE_KEYS = ['phase_0_charter', 'phase_1_diagnose', 'phase_2_design', 'phase_3_business_case', 'phase_4_execute'];
const PHASE_LABELS = ['Phase 0 · Start', 'Phase 1 · Diagnose', 'Phase 2 · Design', 'Phase 3 · Execute', 'Phase 4 · Verify'];

function looksAsked(question: string, userText: string): boolean {
  const qLower = question.toLowerCase();
  const tLower = userText.toLowerCase();
  // Pull content words (≥4 chars) from the question, skip stop words.
  const stopWords = new Set(['what', 'which', 'where', 'when', 'have', 'does', 'that', 'this', 'your', 'their', 'with', 'from', 'been', 'will', 'would', 'could', 'about', 'into']);
  const contentWords = qLower
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));
  if (contentWords.length === 0) return false;
  const matches = contentWords.filter((w) => tLower.includes(w)).length;
  return matches / contentWords.length >= 0.5;
}

function phasePlaybookEntry(
  playbook: TopicRow['phase_playbook'],
  phase: number,
): { priorities?: string[]; deliverable?: string } | null {
  const key = PHASE_KEYS[phase];
  if (!key) return null;
  const entry = playbook[key] ?? playbook[String(phase)];
  if (!entry) return null;
  if (typeof entry === 'string') return { priorities: [entry] };
  return entry;
}

function formatVendorLandscape(landscape: TopicRow['vendor_landscape']): string[] {
  const lines: string[] = [];
  for (const [category, vendors] of Object.entries(landscape)) {
    if (!vendors || (Array.isArray(vendors) && vendors.length === 0)) continue;
    const categoryLabel = category.replace(/_/g, ' ');
    const names: string[] = (vendors as Array<VendorEntry | string>).map((v) => {
      if (typeof v === 'string') return v;
      return v.name;
    });
    if (names.length === 0) continue;
    lines.push(`  · ${categoryLabel}: ${names.slice(0, 5).join(', ')}`);
  }
  return lines;
}

function formatContradictions(
  list: TopicRow['common_contradictions'],
): string[] {
  return list.slice(0, 5).map((c) => {
    if (typeof c === 'string') return `  · ${c}`;
    const prefix = c.type ? `${c.type.replace(/_/g, ' ')}: ` : '';
    return `  · ${prefix}${c.description}`;
  });
}

export async function assembleTopicIntelligenceBlock(args: TopicIntelligenceArgs): Promise<string> {
  const sb = getServerSupabase();

  // Pull assigned topics + their progress
  const { data: mapRows } = await sb
    .from('engagement_topics_map')
    .select('topic_key, is_primary, progress')
    .eq('engagement_id', args.engagementId)
    .order('is_primary', { ascending: false });

  const mapList = (mapRows as Array<{ topic_key: string; is_primary: boolean; progress: Record<string, boolean> | null }> | null) ?? [];
  if (mapList.length === 0) return '';

  const topicKeys = mapList.map((m) => m.topic_key);
  const { data: topicRows } = await sb
    .from('engagement_topics')
    .select('*')
    .in('topic_key', topicKeys);

  const topics = (topicRows as TopicRow[] | null) ?? [];
  if (topics.length === 0) return '';

  // Concatenate recent user turns so we can mark questions likely-asked
  const userTurnText = args.recentTurns
    .filter((t) => t.sender === 'user')
    .map((t) => t.text)
    .join('\n');

  const blocks: string[] = [];

  // Sort: primary first, then by assignment order
  const topicsInOrder = mapList
    .map((m) => topics.find((t) => t.topic_key === m.topic_key))
    .filter((t): t is TopicRow => Boolean(t));

  for (let i = 0; i < topicsInOrder.length; i += 1) {
    const topic = topicsInOrder[i];
    const mapEntry = mapList[i];
    const isPrimary = mapEntry?.is_primary ?? false;
    const progress = mapEntry?.progress ?? {};

    const lines: string[] = [];
    const header = `TOPIC INTELLIGENCE: ${topic.title.toUpperCase()}${isPrimary ? ' (primary)' : ''}`;
    lines.push(header);
    lines.push(topic.tagline ?? '');
    lines.push('');
    lines.push(`Current phase: ${PHASE_LABELS[args.currentPhase] ?? `Phase ${args.currentPhase}`}`);

    // Phase playbook priorities
    const phaseEntry = phasePlaybookEntry(topic.phase_playbook, args.currentPhase);
    if (phaseEntry?.priorities && phaseEntry.priorities.length > 0) {
      lines.push('Playbook priorities for this phase:');
      for (const p of phaseEntry.priorities) lines.push(`  · ${p}`);
    }

    // Diagnostic questions — sort by probe_depth desc, filter to unasked
    const questionsWithIds: Array<DiagnosticQuestion & { _qid: string }> = topic.diagnostic_questions.map(
      (q, idx) => ({ ...q, _qid: q.id ?? `q-${idx}` }),
    );
    const remainingQuestions = questionsWithIds.filter((q) => {
      if (progress[q._qid]) return false;
      if (looksAsked(q.question, userTurnText)) return false;
      return true;
    });
    remainingQuestions.sort((a, b) => (b.probe_depth ?? 0) - (a.probe_depth ?? 0));
    if (remainingQuestions.length > 0) {
      lines.push(
        `Diagnostic questions not yet asked in this engagement (${remainingQuestions.length} of ${questionsWithIds.length}):`,
      );
      for (const q of remainingQuestions.slice(0, 6)) {
        const depth = typeof q.probe_depth === 'number' ? ` [depth ${q.probe_depth}]` : '';
        lines.push(`  · ${q.question}${depth}`);
      }
    }

    // Contradictions to scan for
    if (topic.common_contradictions.length > 0) {
      lines.push('Contradictions to scan for in this engagement:');
      lines.push(...formatContradictions(topic.common_contradictions));
    }

    // Vendor landscape
    const vendorLines = formatVendorLandscape(topic.vendor_landscape);
    if (vendorLines.length > 0) {
      lines.push('Typical vendors in this landscape to probe about:');
      lines.push(...vendorLines);
    }

    // Genome patterns this topic commonly triggers
    if (topic.key_patterns.length > 0) {
      lines.push(`Key Genome patterns commonly linked to this topic: ${topic.key_patterns.join(', ')}`);
    }

    blocks.push(lines.filter((l) => l.length > 0 || true).join('\n'));
  }

  return blocks.join('\n\n');
}
