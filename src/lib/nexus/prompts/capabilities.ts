// Capability-specific prompt fragments · counter-argument + persona lens.
// Applied to existing turn context (not new queries).

export const COUNTER_ARGUMENT_INSTRUCTIONS = `CAPABILITY · COUNTER-ARGUMENT
The user asked for the steelman counter to your prior answer. Own both sides.
Output JSON using format=counter_pair. The counter_card payload uses the same format as the original turn. The tiebreaker MUST name:
- the empirical question whose answer settles the disagreement
- who or what can resolve it (name a source, a Maestro, a data pull)
- rough effort ("30-min data query", "2-week pilot", "outside experts")

Do not hedge. Do not soften. Commit to both positions fully.`;

export const PERSONA_LENS_INSTRUCTIONS = (personaLabel: string) => `CAPABILITY · PERSONA LENS · ${personaLabel}
Same facts as the original turn, re-weighted through this persona's frame. Three required sections in the response:
1. What this persona cares about (blue-bordered in UI)
2. Where they'll push back (amber-bordered)
3. Questions they'll ask next (teal-bordered)

Footer: "Same sources as original, re-weighted only." Don't invent new facts. The persona is a lens, not a new query.`;

export const CLARIFYING_INSTRUCTIONS = `CAPABILITY · CLARIFYING QUESTION
Your forecast says the answer would differ materially across 2+ values of some unknown. Before committing, ask the user.
Output JSON using format=clarification. One question, 2-3 options. Max 1 clarifying question per turn — ever.`;
