# AbarVa Build Pack · Nexus Depth

**Date:** April 19, 2026
**Scope:** Natural conversational flow + 4-choice affordance with free-type fallback + Maestro memory layer. Product-quality pack that makes Nexus feel familiar by the 4th engagement.
**Slots in:** between Pack 10 (Tower Shell) and Pack 11 (Tier 1 Integrations). Non-blocking for Tower. Highly valuable for Shail demo.

---

## Why this pack

Three things Shail will notice within 60 seconds of sitting down:

1. **Does Nexus listen, or does it lecture?** Current prompts push Nexus to produce long first-turn monologues. Shail wants to see Nexus ask, not tell.
2. **Does the interaction feel like a product or a chat window?** 4 tappable choices under every question — 3 structured + 1 free-type — is the affordance that separates "I'm using a well-designed product" from "I'm typing to a chatbot."
3. **Does Nexus recognize the Maestro?** By engagement 4, Nexus should open with reference to how prior engagements unfolded. Not a fresh start every time.

Everything in this pack addresses one of those three. Every change is a file-level change that Claude Code can execute from this doc — no paste-into-Supabase steps.

---

## Prerequisites

- Packs 1-10 shipped
- `persons` table exists with `maestro_profile` column absent (we'll add it)
- At least one active Maestro (you) with turn history across ≥2 engagements to test

---

## How to use this document

Four phases sequentially. Each phase is a set of file writes + one migration. After each: commit with the stated message, continue.

---

## Phase 1 · Migration 023 — Maestro profile + Maestro-scoped relationship notes

**Intent:** Add structured Maestro profile that accumulates over time. Reuse `relationship_notes` for Maestro-scoped notes (keyed to the Maestro's own `person_id`).

### File: `db/migrations/023_maestro_profile.sql`

```sql
BEGIN;

-- Structured, evolving profile for each person that can act as a Maestro.
-- JSONB so the schema can evolve without migrations — Haiku merges into it.
ALTER TABLE persons ADD COLUMN IF NOT EXISTS maestro_profile JSONB DEFAULT '{}'::jsonb;
ALTER TABLE persons ADD COLUMN IF NOT EXISTS maestro_profile_updated_at TIMESTAMPTZ;

-- Expected shape, for reference:
-- {
--   "background": "former MD at top consulting firm, 15+ years enterprise transformation",
--   "domain_depth": ["healthcare IDN", "FinServ", "data & AI growth"],
--   "communication_style": "concise, direct, no hedging, pushes value framing early",
--   "preferences": ["composite orgs not real names", "avoids named incumbents"],
--   "recent_patterns": [
--     {"pattern": "validates scope before diagnostic", "seen_in_engagements": 3},
--     {"pattern": "surfaces F007 chain risk when CDO mentioned", "seen_in_engagements": 2}
--   ],
--   "engagements_run": 3,
--   "industries_touched": ["HEALTHCARE_IDN", "FINSERV", "RETAIL"],
--   "last_updated_from_turn_id": "uuid"
-- }

-- relationship_notes already supports arbitrary person_id, so Maestro notes use
-- the Maestro's own persons.id. No schema change needed there.

-- But we add a category enum hint so we can distinguish:
ALTER TABLE relationship_notes ADD COLUMN IF NOT EXISTS subject_type TEXT
  DEFAULT 'sponsor'
  CHECK (subject_type IN ('sponsor', 'maestro', 'observer'));

-- Backfill: all existing notes are about sponsors
UPDATE relationship_notes SET subject_type = 'sponsor' WHERE subject_type IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
```

### Commit

```
feat(nexus-depth): migration 023 — Maestro profile JSONB + subject_type on relationship_notes
```

---

## Phase 2 · Turn stream format — `<choices>` block

**Intent:** Nexus's streaming response can include a structured choices block. Client parses it out, renders as chips below the bubble. Chip click sends that exact text as the next user turn. The 4th slot is always a free-type fallback.

### File: `src/lib/agent/stream.ts` (additions)

The existing NDJSON stream emits `{type: 'text', value: '...'}` chunks. Add two new event types:

```typescript
// Emit when agent starts a choices block
{ type: 'choices_start' }

// Emit once per choice as it streams
{ type: 'choice', label: 'Whole analytics org (people + tools + infra)', value: 'Whole analytics org — people, tools, and infra' }

// Emit when choices block closes
{ type: 'choices_end' }
```

The stream parser in `src/lib/agent/stream.ts`:

```typescript
export function parseChoicesFromText(fullText: string): {
  text: string;                 // text with <choices> block removed
  choices: Array<{ label: string; value: string; freeType?: boolean }>;
} {
  const CHOICES_RE = /<choices>([\s\S]*?)<\/choices>/;
  const match = fullText.match(CHOICES_RE);
  if (!match) return { text: fullText, choices: [] };

  const textBefore = fullText.slice(0, match.index);
  const textAfter = fullText.slice(match.index! + match[0].length);
  const cleanedText = (textBefore + textAfter).trim();

  const CHOICE_RE = /<choice(?:\s+free_type="([^"]*)")?>([\s\S]*?)<\/choice>/g;
  const choices: Array<{ label: string; value: string; freeType?: boolean }> = [];
  let m: RegExpExecArray | null;
  while ((m = CHOICE_RE.exec(match[1])) !== null) {
    const label = m[2].trim();
    choices.push({
      label,
      value: label, // value defaults to label; agents can override if needed
      freeType: m[1] !== undefined,
    });
  }

  return { text: cleanedText, choices };
}
```

### Turn handler wiring

In `/api/engage/[id]/turn/route.ts` (and the other two Nexus modes), after full streaming completes, parse choices from the captured text and include them in the final event:

```typescript
const { text, choices } = parseChoicesFromText(agentFullText);

// Persist the cleaned text (without <choices> markup) as the agent turn
await appendTurn({ sender: 'agent', text });

// Final stream event carries the choices
yield JSON.stringify({ type: 'turn_complete', choices });
```

### Commit

```
feat(nexus-depth): <choices> block in turn stream, parser + propagation to UI
```

---

## Phase 3 · Prompt template additions — listen first, probe, then propose

**Intent:** Three additions that go into every Nexus mode's system prompt. Each is a natural-language instruction the model obeys well.

### File: `src/lib/agent/prompts/_shared/conversation_principles.ts`

```typescript
export const CONVERSATION_PRINCIPLES = `
CONVERSATION PRINCIPLES

1 · Listen before you propose.
When the user shares context, resist the urge to summarize it back with a plan.
First acknowledge what you heard in one short line. Then ask ONE probing question
that deepens your understanding of their intent. Only after you understand the
intent should you propose a frame or next step.

Bad: "Sounds like cost takeout. Here are the three levers we should pull..."
Good: "Got it — the forcing event is the board mandating 30%. Before I go
deeper, help me triangulate: when you say cost, do you mean the whole analytics
org, just tools, or something narrower?"

2 · Offer choices, not essays.
When your next step requires the user to pick a direction, emit a <choices>
block with 3 structured options plus 1 free-type fallback. Keep each choice
label under 10 words. The 4th choice always has free_type="true" and reads
"Something else — tell me" or similar.

<choices>
<choice>Whole analytics org — people, tools, infra</choice>
<choice>Tools and licenses only</choice>
<choice>Vendor sprawl — consolidation play</choice>
<choice free_type="true">Something else — tell me</choice>
</choices>

Only use <choices> when a decision genuinely splits into 2-3 distinct paths.
Never use it for yes/no or for reflective questions.

3 · Honor what you already know.
Before asking anything, check your context for whether the answer is already
there. Prior turns, Maestro profile, client documents, active Genome patterns —
if the signal is already in any of those, do not re-ask. If you must reference
something you know, do it conversationally, not as a recap.
`;
```

### Wire into each mode

In `src/lib/agent/prompts/engagement.ts`, `identity.ts`, and `data.ts` — prepend `CONVERSATION_PRINCIPLES` to the existing system prompt:

```typescript
import { CONVERSATION_PRINCIPLES } from './_shared/conversation_principles';

export function assembleEngagementSystemPrompt(ctx: EngagementPromptContext): string {
  return [
    CONVERSATION_PRINCIPLES,
    // ... existing role + retrieval context + phase prompt
  ].join('\n\n');
}
```

### Commit

```
feat(nexus-depth): shared conversation principles — listen first, offer choices, honor known
```

---

## Phase 4 · UI — choice chips + composer integration

**Intent:** When a turn completes with choices, render chips below the agent bubble. Clicking a structured chip sends that label as the next user turn. Clicking the free-type chip focuses the composer with the chip's label pre-filled as a placeholder.

### File: `src/components/engagement/ChoiceChips.tsx`

```tsx
'use client';

interface Choice {
  label: string;
  value: string;
  freeType?: boolean;
}

interface ChoiceChipsProps {
  choices: Choice[];
  onPick: (value: string) => void;
  onFreeType: (placeholder: string) => void;
  disabled?: boolean;
}

export function ChoiceChips({ choices, onPick, onFreeType, disabled }: ChoiceChipsProps) {
  if (choices.length === 0) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      marginTop: 12, marginLeft: 16,
    }}>
      {choices.map((c, i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => c.freeType ? onFreeType(c.label) : onPick(c.value)}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            color: c.freeType ? '#8B8680' : '#F5F5F0',
            border: `0.5px solid ${c.freeType ? 'rgba(139,134,128,0.4)' : 'rgba(45,212,200,0.5)'}`,
            borderRadius: 999,
            fontSize: 12,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            fontFamily: 'inherit',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={e => {
            if (disabled) return;
            e.currentTarget.style.background = c.freeType ? 'rgba(139,134,128,0.1)' : 'rgba(45,212,200,0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
```

### Wire into EngagementConsole

In `src/components/engagement/EngagementConsole.tsx`, where the turn bubbles are rendered:

```tsx
{turn.sender === 'agent' && turn.id === lastAgentTurnId && choices.length > 0 && (
  <ChoiceChips
    choices={choices}
    onPick={(value) => sendTurn(value)}
    onFreeType={(placeholder) => {
      composerRef.current?.focus();
      setComposerPlaceholder(placeholder);
    }}
    disabled={isStreaming}
  />
)}
```

Chips only render under the *most recent* agent turn — once the user picks or types, the next turn's choices replace them. Past turns don't show chips.

### Wire equivalents into IdentityConsole + DataConsole

Same pattern in the other two Nexus modes.

### Commit

```
feat(nexus-depth): ChoiceChips component + wire into three Nexus consoles
```

---

## Phase 5 · Maestro background extractor

**Intent:** After every Maestro-authored turn in any mode, a background Haiku pass distills new signal into their `maestro_profile`. Runs async so it never blocks the user.

### File: `src/lib/agent/maestro-extractor.ts`

```typescript
import { getAnthropicClient } from './stream';
import { createClient } from '@/lib/supabase/server';

export interface MaestroTurnContext {
  maestroPersonId: string;
  turnId: string;
  turnText: string;
  engagementId?: string;
  engagementIndustry?: string;
}

const EXTRACTION_PROMPT = (currentProfile: object, turnText: string, industry?: string) => `
You're updating a Maestro's evolving profile based on their latest turn. The
Maestro is a senior practitioner running AbarVa engagements. Their profile
accumulates across every turn.

CURRENT PROFILE
${JSON.stringify(currentProfile, null, 2)}

LATEST TURN (from the Maestro)
"""
${turnText}
"""

${industry ? `ENGAGEMENT INDUSTRY: ${industry}` : ''}

TASK
Return a JSON object with ONLY the fields that should be updated or added.
Do not restate fields that haven't changed.

Possible fields:
- background (string) — biographical/career summary
- domain_depth (string[]) — areas of deep expertise
- communication_style (string) — how they communicate
- preferences (string[]) — specific preferences (e.g., avoids certain names)
- recent_patterns (array of {pattern, seen_in_engagements}) — observed behaviors
- engagements_run (number) — increment if this turn starts a new engagement
- industries_touched (string[]) — add new industries

RULES
- If nothing is new or significant, return {}.
- Never remove fields, only add or refine.
- Keep strings concise — 1 sentence max each.
- For recent_patterns, merge with existing by pattern name; increment counter.

Return ONLY the JSON object, no prose.
`;

export async function updateMaestroProfile(ctx: MaestroTurnContext): Promise<void> {
  const supabase = await createClient();
  const { data: person } = await supabase
    .from('persons')
    .select('maestro_profile, maestro_profile_updated_at')
    .eq('id', ctx.maestroPersonId)
    .single();

  if (!person) return;
  const currentProfile = person.maestro_profile ?? {};

  const client = getAnthropicClient();
  let update: Record<string, unknown> = {};
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: EXTRACTION_PROMPT(currentProfile, ctx.turnText, ctx.engagementIndustry) }],
    });
    const text = response.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return;
    update = JSON.parse(match[0]);
  } catch (err) {
    console.error('[maestro-extractor]', err);
    return;
  }

  if (Object.keys(update).length === 0) return;

  // Merge — naive shallow merge for top-level fields; arrays concat-unique; recent_patterns merge by pattern name
  const merged = { ...currentProfile };
  for (const [k, v] of Object.entries(update)) {
    if (k === 'recent_patterns' && Array.isArray(v) && Array.isArray(merged[k])) {
      const existing = merged[k] as Array<{ pattern: string; seen_in_engagements: number }>;
      const incoming = v as Array<{ pattern: string; seen_in_engagements: number }>;
      for (const newP of incoming) {
        const i = existing.findIndex(e => e.pattern === newP.pattern);
        if (i >= 0) existing[i].seen_in_engagements += newP.seen_in_engagements ?? 1;
        else existing.push(newP);
      }
      merged[k] = existing;
    } else if (Array.isArray(v) && Array.isArray(merged[k])) {
      merged[k] = Array.from(new Set([...(merged[k] as unknown[]), ...v]));
    } else {
      merged[k] = v;
    }
  }
  (merged as { last_updated_from_turn_id?: string }).last_updated_from_turn_id = ctx.turnId;

  await supabase.from('persons').update({
    maestro_profile: merged,
    maestro_profile_updated_at: new Date().toISOString(),
  }).eq('id', ctx.maestroPersonId);
}
```

### Wire into every Nexus turn handler

In `/api/engage/[id]/turn/route.ts` and the other two modes, alongside the existing `relationship_notes` background extraction:

```typescript
void (async () => {
  try {
    await updateMaestroProfile({
      maestroPersonId: currentMaestro.id,
      turnId: newTurn.id,
      turnText: userMessage,
      engagementId: engagement?.id,
      engagementIndustry: engagement?.industry_code,
    });
  } catch (err) {
    console.error('[maestro-extractor-bg]', err);
  }
})();
```

### Commit

```
feat(nexus-depth): Maestro background extractor — Haiku distills turn signal into maestro_profile
```

---

## Phase 6 · MAESTRO CONTEXT block in every Nexus system prompt

**Intent:** Every Nexus turn pulls the current Maestro's profile and the 3-5 most-recent relationship_notes (where subject_type='maestro') into a block at the top of the system prompt. This is what makes engagement 4 feel different from engagement 1.

### File: `src/lib/agent/prompts/_shared/maestro_context.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export interface MaestroContextBlock {
  personId: string;
  personName: string;
}

export async function assembleMaestroContextBlock(args: MaestroContextBlock): Promise<string> {
  const supabase = await createClient();

  const { data: person } = await supabase
    .from('persons')
    .select('name, maestro_profile')
    .eq('id', args.personId)
    .single();

  if (!person) return '';

  const profile = (person.maestro_profile ?? {}) as {
    background?: string;
    domain_depth?: string[];
    communication_style?: string;
    preferences?: string[];
    recent_patterns?: Array<{ pattern: string; seen_in_engagements: number }>;
    engagements_run?: number;
    industries_touched?: string[];
  };

  // Pull recent maestro-scoped relationship notes
  const { data: notes } = await supabase
    .from('relationship_notes')
    .select('note_text, created_at')
    .eq('person_id', args.personId)
    .eq('subject_type', 'maestro')
    .order('created_at', { ascending: false })
    .limit(5);

  const lines: string[] = [];
  lines.push(`MAESTRO CONTEXT (you're working with ${person.name} today)`);
  if (profile.background) lines.push(`- Background: ${profile.background}`);
  if (profile.domain_depth?.length) lines.push(`- Domain depth: ${profile.domain_depth.join(', ')}`);
  if (profile.communication_style) lines.push(`- Style: ${profile.communication_style}`);
  if (profile.preferences?.length) lines.push(`- Preferences: ${profile.preferences.join('; ')}`);
  if (profile.engagements_run) {
    lines.push(`- Engagements run together: ${profile.engagements_run}${profile.industries_touched?.length ? ` across ${profile.industries_touched.join(', ')}` : ''}`);
  }
  if (profile.recent_patterns?.length) {
    const top = profile.recent_patterns.sort((a, b) => b.seen_in_engagements - a.seen_in_engagements).slice(0, 3);
    lines.push(`- Patterns you've noticed: ${top.map(p => `${p.pattern} (${p.seen_in_engagements}x)`).join('; ')}`);
  }
  if (notes?.length) {
    lines.push(`- Recent notes: ${notes.map(n => n.note_text).join(' | ')}`);
  }

  lines.push('');
  lines.push('Use this context naturally. Reference shared history when relevant. Do not list these facts back at them.');

  return lines.join('\n');
}
```

### Wire into each Nexus mode's system prompt assembly

In `src/lib/agent/prompts/engagement.ts`:

```typescript
export async function assembleEngagementSystemPrompt(ctx: EngagementPromptContext): Promise<string> {
  const maestroBlock = ctx.currentMaestroId
    ? await assembleMaestroContextBlock({ personId: ctx.currentMaestroId, personName: ctx.currentMaestroName })
    : '';

  return [
    CONVERSATION_PRINCIPLES,
    maestroBlock,
    // ... existing role + retrieval context + phase prompt
  ].filter(Boolean).join('\n\n');
}
```

Same in `identity.ts` and `data.ts`.

### Commit

```
feat(nexus-depth): MAESTRO CONTEXT block injected into every Nexus system prompt
```

---

## Verification — the "does it know me by engagement 4" test

After all phases ship:

1. Create a fresh test engagement. Start talking. Pay attention to whether Nexus asks before proposing, whether it emits 4 choices at decision points, and whether the choices feel specific to your context.

2. Complete Phase 0 Charter. Open a new engagement (different client, different industry). Does Nexus open with any reference to how the prior engagement unfolded? If yes, the Maestro extractor is working.

3. Run this SQL to inspect your accumulated profile:
   ```sql
   SELECT name, maestro_profile, maestro_profile_updated_at
   FROM persons
   WHERE id = 'your-person-id';
   ```
   You should see `background`, `communication_style`, `recent_patterns` populated after 10-20 turns.

4. Check the maestro-scoped notes:
   ```sql
   SELECT note_text, created_at
   FROM relationship_notes
   WHERE person_id = 'your-person-id' AND subject_type = 'maestro'
   ORDER BY created_at DESC LIMIT 10;
   ```

5. **By engagement 4:** Nexus should open with a line like *"Anand — fourth engagement, third industry. Given the F007 chain-risk pattern you flagged in the first two healthcare ones, I want to check that first this time."* That's the test passing.

---

## Open items after this pack

| Item | When |
|---|---|
| Choices UI polish — keyboard navigation (1-4 number keys) | Polish sprint |
| Long-running patterns that shouldn't decay (e.g., naming rules) | Nexus Depth v2 |
| Maestro patterns surfaced as predictions ("Nexus expects you'll push for Phase 2 within 3 turns") | Nexus Depth v2 |
| Cross-Maestro learning (patterns shared across the whole org once you hire) | Pack 8 follow-up |

---

## What this pack ships

By the end:
- Nexus listens and probes before proposing, in every mode
- Every decision point can surface 4 tappable choices with 1 free-type fallback
- Every Maestro turn updates a structured profile in the background
- Every Nexus system prompt carries that profile forward
- The 4th engagement *feels* different from the 1st — because the agent genuinely carries your patterns forward

**This is the pack that makes Shail say "it feels like it knows you."**
