// SOL11 · Solution Canvas View (deterministic).
//
// Pure read model that projects a deterministic solution canvas from a
// caller-supplied seed input. Consumed by the SOL11 Server Component
// (src/components/solutions/SolutionCanvas.tsx) so the canvas can render
// without a live Nexus runtime, retrieval, or model call.
//
// No clock reads, no random sources, no fetch, no model providers.
// Every output field is a deterministic projection of the input fields.

export interface SolutionCanvasComponent {
  readonly key: string;
  readonly name: string;
  readonly role: string;
}

export interface SolutionCanvasRisk {
  readonly key: string;
  readonly label: string;
  readonly level: 'low' | 'medium' | 'high';
}

export interface SolutionCanvasWorkshopRef {
  readonly key: string;
  readonly name: string;
  readonly why: string;
}

export interface SolutionCanvasDeliverableRef {
  readonly key: string;
  readonly name: string;
}

export interface SolutionCanvasMissingInput {
  readonly key: string;
  readonly label: string;
}

export interface SolutionCanvasInput {
  readonly title: string;
  readonly brief: string;
  readonly currentInputs: readonly string[];
  readonly archetypeKey: string | null;
  readonly archetypeLabel: string | null;
  readonly components: readonly SolutionCanvasComponent[];
  readonly buildBuyGuidance: string;
  readonly risks: readonly SolutionCanvasRisk[];
  readonly recommendedWorkshops: readonly SolutionCanvasWorkshopRef[];
  readonly recommendedDeliverables: readonly SolutionCanvasDeliverableRef[];
  readonly missingInputs: readonly SolutionCanvasMissingInput[];
}

export interface SolutionCanvasSection {
  readonly key:
    | 'brief'
    | 'currentInputs'
    | 'archetype'
    | 'components'
    | 'buildBuyGuidance'
    | 'risks'
    | 'recommendedWorkshops'
    | 'recommendedDeliverables'
    | 'missingInputs';
  readonly label: string;
}

export interface SolutionCanvasView {
  readonly title: string;
  readonly brief: string;
  readonly currentInputs: readonly string[];
  readonly archetype: string | null;
  readonly components: readonly SolutionCanvasComponent[];
  readonly buildBuyGuidance: string;
  readonly risks: readonly SolutionCanvasRisk[];
  readonly recommendedWorkshops: readonly SolutionCanvasWorkshopRef[];
  readonly recommendedDeliverables: readonly SolutionCanvasDeliverableRef[];
  readonly missingInputs: readonly SolutionCanvasMissingInput[];
  readonly sections: readonly SolutionCanvasSection[];
  readonly createdFrom: 'deterministic_solution_canvas_seed';
}

const SECTIONS: readonly SolutionCanvasSection[] = [
  { key: 'brief', label: 'Brief' },
  { key: 'currentInputs', label: 'Current Inputs' },
  { key: 'archetype', label: 'Archetype' },
  { key: 'components', label: 'Components' },
  { key: 'buildBuyGuidance', label: 'Build / Buy Guidance' },
  { key: 'risks', label: 'Risks' },
  { key: 'recommendedWorkshops', label: 'Recommended Workshops' },
  { key: 'recommendedDeliverables', label: 'Recommended Deliverables' },
  { key: 'missingInputs', label: 'Missing Inputs' },
];

export function buildSolutionCanvasView(
  input: SolutionCanvasInput,
): SolutionCanvasView {
  const archetype =
    input.archetypeLabel ?? input.archetypeKey ?? null;

  return {
    title: input.title,
    brief: input.brief,
    currentInputs: [...input.currentInputs],
    archetype,
    components: input.components.map((c) => ({
      key: c.key,
      name: c.name,
      role: c.role,
    })),
    buildBuyGuidance: input.buildBuyGuidance,
    risks: input.risks.map((r) => ({
      key: r.key,
      label: r.label,
      level: r.level,
    })),
    recommendedWorkshops: input.recommendedWorkshops.map((w) => ({
      key: w.key,
      name: w.name,
      why: w.why,
    })),
    recommendedDeliverables: input.recommendedDeliverables.map((d) => ({
      key: d.key,
      name: d.name,
    })),
    missingInputs: input.missingInputs.map((m) => ({
      key: m.key,
      label: m.label,
    })),
    sections: SECTIONS,
    createdFrom: 'deterministic_solution_canvas_seed',
  };
}
