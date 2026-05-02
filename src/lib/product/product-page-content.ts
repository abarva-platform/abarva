export type ProductTabKey =
  | "architecture"
  | "knowledge-layer"
  | "data-plane-security"
  | "lifecycle-discipline"
  | "scalability-vision";

export interface ProductProofPoint {
  label: string;
  value: string;
  explanation: string;
}

export interface ProductTabContent {
  key: ProductTabKey;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  operatorQuestion: string;
  proofPoints: ProductProofPoint[];
  applicationSteps: string[];
  valueTranslation: string[];
  diagramTitle: string;
  diagramCaption: string;
}

export const PRODUCT_TABS: ProductTabContent[] = [
  {
    key: "architecture",
    label: "Architecture",
    eyebrow: "Operating model, not another chat surface",
    title: "AbarVa sits above foundation models as the enterprise AI cockpit.",
    summary:
      "The product organizes strategy, programs, sourcing, intelligence, setup, and tower observation into one disciplined operating layer. Foundation models can reason and write; AbarVa gives them client context, lifecycle discipline, governance, evidence, and work surfaces that executives can actually run.",
    operatorQuestion:
      "How do we move from scattered AI experiments to one governed operating system for enterprise change?",
    proofPoints: [
      {
        label: "Atrium chrome",
        value: "One top nav, one active agent, one workspace",
        explanation:
          "Every module keeps the same mental model: a surface-aware agent on the left, a disciplined workspace on the right, and module-specific subnav only inside the workspace.",
      },
      {
        label: "Agent lanes",
        value: "Atlas, Steward, Sentinel, Nexus",
        explanation:
          "Each agent has a named job: observe the portfolio, govern setup, challenge strategy with intelligence, and execute programs or sourcing events through gates.",
      },
      {
        label: "Foundation models",
        value: "Anthropic Claude and OpenAI GPT-class reasoning",
        explanation:
          "Models power the language layer once; AbarVa supplies the durable context, workflow, provenance, and operating discipline above the model layer.",
      },
    ],
    applicationSteps: [
      "Bind each executive question to a product surface before asking an agent to answer it.",
      "Use Setup to establish tenant facts, metric baselines, policies, and data confidence before launching work.",
      "Run Programs and Source as governed workflows with stage evidence instead of loose workstreams.",
      "Use Tower to observe commitments, handoffs, risks, and value realization across the whole portfolio.",
    ],
    valueTranslation: [
      "Reduces strategy drift by forcing every recommendation into an operating surface.",
      "Improves executive confidence because the answer carries context, provenance, and a next action.",
      "Prevents duplicated AI spend by turning scattered ideas into an accountable portfolio.",
    ],
    diagramTitle: "Architecture stack",
    diagramCaption:
      "Foundation reasoning sits at the base; AbarVa adds context, agent lanes, lifecycle gates, and executive workspaces above it.",
  },
  {
    key: "knowledge-layer",
    label: "Knowledge layer",
    eyebrow: "The corpus is the product moat",
    title:
      "AbarVa answers with patterns, metrics, industry context, and client evidence.",
    summary:
      "The knowledge layer combines three substrates: client context, practitioner-authored pattern intelligence, and external market or regulatory context. Sentinel challenges strategy with this substrate; Nexus and Atlas reuse it when programs, sourcing events, and portfolio decisions need grounded guidance.",
    operatorQuestion:
      "What does the agent know that a generic model would not know, and how does that change the quality of advice?",
    proofPoints: [
      {
        label: "Pattern corpus",
        value: "Failure modes, decisions, architectures, templates",
        explanation:
          "Records explain what happens, why it matters, how to apply it, which stakeholders care, and what evidence proves progress.",
      },
      {
        label: "Metric gap engine",
        value: "Current state vs target state",
        explanation:
          "Tenant metrics and reference patterns let the platform show where a client stands today and which programs should move the needle.",
      },
      {
        label: "Industry transfer",
        value: "Healthcare, retail, financial services",
        explanation:
          "The same operating question is translated through the business systems, risks, measures, and stakeholder language of each industry.",
      },
    ],
    applicationSteps: [
      "Upload current-state artifacts and metrics through Setup so the corpus can compare ambition to reality.",
      "Use Intelligence to test strategy against known failure modes, peer patterns, and industry-specific operating constraints.",
      "Attach the relevant pattern IDs to Program charters and Source events so retrieval is not lost after kickoff.",
      "Use response provenance to show which corpus records and client facts shaped the recommendation.",
    ],
    valueTranslation: [
      "Turns agent answers from plausible prose into reusable institutional judgment.",
      "Helps domain leaders see their own systems and metrics reflected in recommendations.",
      "Creates a learning loop: every program outcome improves the next strategy or sourcing event.",
    ],
    diagramTitle: "Knowledge and corpus flow",
    diagramCaption:
      "Client facts, practitioner patterns, and market context converge into retrieval-ready substrate for every agent lane.",
  },
  {
    key: "data-plane-security",
    label: "Data plane & security",
    eyebrow: "Private by design, portable by architecture",
    title:
      "Client context is isolated today and ready for a private data-plane migration.",
    summary:
      "AbarVa separates common knowledge from client-specific context. Client artifacts, metrics, initiatives, programs, sourcing evidence, and user assignments belong in tenant-private boundaries, while the shared corpus remains non-client-specific operating intelligence.",
    operatorQuestion:
      "How do we prove that two clients never share private context while still letting the product learn from generalized patterns?",
    proofPoints: [
      {
        label: "Tenant boundary",
        value: "No client-specific records in shared tables",
        explanation:
          "Client-owned artifacts are modeled as private-plane records so retrieval, reporting, and cleanup can be reasoned about per tenant.",
      },
      {
        label: "Compatibility layer",
        value: "Current stack now, private deployment next",
        explanation:
          "The operating contract keeps index names, namespaces, embedding dimensions, and handoff maps explicit so migration is procedural rather than conceptual.",
      },
      {
        label: "Governed retrieval",
        value: "Namespace and policy aware",
        explanation:
          "Agent requests should assemble context from the tenant plane, shared corpus, and worldview only when policy and app wiring allow it.",
      },
    ],
    applicationSteps: [
      "Keep client-specific artifacts in client-private schemas, folders, and namespaces, never in shared tenant-data objects.",
      "Require every seed wave to include an app-integration handoff and validation query pack.",
      "Smoke-test retrieval by client, module, role, and financial visibility before claiming a dataset is app-wired.",
      "Maintain rollback plans for published indexes and client context loads before live publication.",
    ],
    valueTranslation: [
      "Builds trust with clients who need separation, auditability, and future portability.",
      "Makes security review concrete because boundaries are visible in schemas, indexes, and agent behavior.",
      "Avoids expensive rewrites when moving to a dedicated private deployment footprint.",
    ],
    diagramTitle: "Private data-plane boundary",
    diagramCaption:
      "The shared product plane orchestrates work; client context remains isolated behind tenant-specific data and retrieval boundaries.",
  },
  {
    key: "lifecycle-discipline",
    label: "Lifecycle & discipline",
    eyebrow: "Strategy only matters when it changes execution",
    title:
      "AbarVa forces strategy, programs, and sourcing through evidence-backed stages.",
    summary:
      "The lifecycle model turns ambition into operating cadence. P0 through P6 governs programs; sourcing stages govern vendor decisions; every phase asks for evidence, decision clarity, stakeholder alignment, and value measurement before the work advances.",
    operatorQuestion:
      "How do we make every AI strategy recommendation executable, funded, sourced, measured, and observed?",
    proofPoints: [
      {
        label: "P0-P6 program phases",
        value: "Originate to Tower handoff",
        explanation:
          "Programs move from idea clarity to design, delivery, adoption, and portfolio observation instead of stopping at roadmap language.",
      },
      {
        label: "Source lifecycle",
        value: "Strategy to value",
        explanation:
          "Sourcing events connect business need, scope, vendors, commercial evaluation, selection, transition, and value monitoring.",
      },
      {
        label: "Gate evidence",
        value: "Artifacts, decisions, risks, metrics",
        explanation:
          "The agent can challenge advancement when success criteria, stakeholder commitments, or proof artifacts are missing.",
      },
    ],
    applicationSteps: [
      "Start with a problem statement and target outcome, not a vendor or model selection.",
      "Convert strategic moves into Programs when internal execution is the critical path.",
      "Convert buying or partnership questions into Source events when external capability is the critical path.",
      "Send completed programs and sourcing transitions into Tower so realized value is observed after launch.",
    ],
    valueTranslation: [
      "Raises the odds that AI work lands in operations rather than remaining a presentation.",
      "Improves savings capture because sourcing events stay linked to value monitoring.",
      "Gives leaders a common language for stopping, reshaping, or scaling work.",
    ],
    diagramTitle: "Lifecycle with agent overlay",
    diagramCaption:
      "Sentinel challenges the thesis, Nexus drives execution, Steward guards readiness, and Atlas observes outcomes.",
  },
  {
    key: "scalability-vision",
    label: "Scalability & vision",
    eyebrow: "The platform gets sharper as the corpus matures",
    title:
      "AbarVa can scale from one client workshop to a durable industry operating memory.",
    summary:
      "The long-term advantage is not only workflow software; it is the disciplined production of verified knowledge. Codex-assisted authoring, practitioner review, schema validation, and retrieval telemetry create a corpus that can mature from draft to verified to locked records.",
    operatorQuestion:
      "How does the knowledge layer keep improving without becoming a pile of disconnected documents?",
    proofPoints: [
      {
        label: "Authoring pipeline",
        value: "Rubric, corpus, parsing, publication",
        explanation:
          "Every record follows a content contract before it reaches retrieval, which keeps pattern quality consistent across industries.",
      },
      {
        label: "Version discipline",
        value: "Draft to verified to locked",
        explanation:
          "Records mature through validation and stable retrieval rather than informal approval alone.",
      },
      {
        label: "Agent training loop",
        value: "Telemetry back to corpus gaps",
        explanation:
          "Questions the agents cannot answer become corpus backlog, metric gaps, or new client-context seed waves.",
      },
    ],
    applicationSteps: [
      "Use every client artifact and workshop as a candidate source for structured context, not as a passive file upload.",
      "Author missing patterns when agent answers are thin, generic, or not credible to domain experts.",
      "Promote records only after validation, retrieval smoke tests, and human spot checks prove they behave correctly.",
      "Feed Tower outcomes back into the corpus so recommendations learn from realized value and delivery friction.",
    ],
    valueTranslation: [
      "Compounds the quality of future strategy work instead of starting from zero each engagement.",
      "Makes agent training operational: records, validation queries, and telemetry replace ad hoc prompt tweaking.",
      "Creates a defensible knowledge layer around program success and savings realization.",
    ],
    diagramTitle: "Codex authoring pipeline",
    diagramCaption:
      "Authoring, validation, practitioner review, publication, retrieval, telemetry, and outcome feedback form the product learning loop.",
  },
];

export const PRODUCT_TAB_BY_KEY = new Map(
  PRODUCT_TABS.map((tab) => [tab.key, tab]),
);
