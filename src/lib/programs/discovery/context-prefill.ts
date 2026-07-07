// =============================================================================
// Discovery Intake — context-layer pre-fill (S4a)
// -----------------------------------------------------------------------------
// Pure mapper: "don't ask what we already know." Given normalized facts the
// context layer already holds for a tenant, pre-fill the DiscoveryShape so the
// maestro only fills the deltas. Systems become context-sourced (confirmed)
// landscape facts; general facts become `known` entries.
//
// Pure + deterministic. The broker fetch that produces `ContextFact[]` (through
// the AgentContextBroker contract — the app tier never imports the data-room
// directly) is S4b; this is the testable mapping in the middle.
// =============================================================================

import { captureField, type DiscoveryShape, type LandscapeFact } from './discovery-intake';

/** A normalized fact from the context layer (broker output, S4b populates it). */
export interface ContextFact {
  /** `system` → a known system in the landscape; `fact` → a general known. */
  kind: 'system' | 'fact';
  label: string;
  /** optional domain for a system (e.g. "clinical"). */
  domain?: string;
}

/**
 * Pre-fill a DiscoveryShape from known context-layer facts. Context-sourced
 * facts are `confirmed` (we already hold them — the maestro can still correct).
 * `known` is deduplicated. Returns a new shape; never mutates the input.
 */
export function applyContextToShape(shape: DiscoveryShape, facts: ContextFact[]): DiscoveryShape {
  if (facts.length === 0) return shape;

  const systems = facts.filter((f) => f.kind === 'system');
  const knownFacts = facts.filter((f) => f.kind === 'fact').map((f) => f.label);

  let next: DiscoveryShape = {
    ...shape,
    known: Array.from(new Set([...shape.known, ...knownFacts])),
  };

  if (systems.length > 0) {
    const fromContext: LandscapeFact[] = systems.map((s) => ({
      domain: s.domain ?? 'context',
      system: s.label,
      source: 'context' as const,
      review: 'confirmed' as const,
    }));
    const merged = [...(shape.landscape.value ?? []), ...fromContext];
    next = {
      ...next,
      landscape: captureField(shape.landscape, merged, 'context', { confidence: 'high' }),
    };
  }

  return next;
}
