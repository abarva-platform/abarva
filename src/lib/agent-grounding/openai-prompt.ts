import type {
  AgentGroundingAgent,
  AgentGroundingCase,
  AgentGroundingTenant,
} from "./types";

export interface OpenAiGroundingMessage {
  role: "system" | "user";
  content: string;
}

const AGENT_LANES: Record<AgentGroundingAgent, string> = {
  sentinel:
    "Sentinel explains industry context, corpus pattern context, and tenant-safe reasoning.",
  atlas:
    "Atlas explains Tower portfolio confidence, value commitment, risks, gaps, and next moves in executive language.",
  nexus:
    "Nexus shapes initiatives into fundable Moves with a corpus pattern, gates, value hypotheses, and unsafe-to-fund conditions.",
  source:
    "Source explains vendor, sourcing, BAFO, contract, audit, validation, and value-protection decisions with corpus pattern context.",
  steward:
    "Steward explains readiness, loaded context, governed uploader status, and what agents may safely answer next.",
};

const TENANT_CONTEXT: Record<AgentGroundingTenant, string> = {
  "apex-retail": [
    "Apex Retail Group is the retail tenant.",
    "Known context includes stores, merchandising, commerce, CDP sequencing, store labor AI, Adobe sourcing, Copilot usage, value commitment, and Tower value-evidence language.",
    "Do not borrow healthcare, airline, or banking facts when scoped to Apex.",
  ].join(" "),
  "meridian-health": [
    "Meridian Health System is a Sacramento-based integrated health system with 30+ hospitals.",
    "Known context includes clinical operations, ambient documentation, healthcare AI validation, audit rights, governed context-loader readiness, and healthcare corpus patterns.",
    "Guard this corrected profile fact. Never mention stale Meridian profile counts.",
    "Do not borrow retail, airline, or banking facts when scoped to Meridian.",
  ].join(" "),
  "skyharbor-air": [
    "Airline Demo is the airline tenant.",
    "Known context includes IROps recovery, crew legality, mainframe-to-cloud modernization, IBM/AWS sourcing, airline operational risk, and a planned erase-and-reload through the governed uploader.",
    "Do not show Meridian healthcare content such as clinical care, ambient AI, Innovaccer, sepsis, or MH initiative codes when scoped to SkyHarbor.",
    "If SkyHarbor context is not loaded, say that plainly and route the next step through the uploader.",
  ].join(" "),
  "first-capital": [
    "FS Demo is the banking tenant.",
    "Known context includes lending, digital banking, examiner expectations, model risk, NIM, and banking compliance.",
    "Do not borrow retail, healthcare, or airline facts when scoped to FS Demo.",
  ].join(" "),
};

const TENANT_DISPLAY: Record<AgentGroundingTenant, string> = {
  "apex-retail": "Apex Retail Group",
  "meridian-health": "Meridian Health System",
  "skyharbor-air": "Airline Demo",
  "first-capital": "FS Demo",
};

export function buildOpenAiGroundingMessages(
  testCase: AgentGroundingCase,
): OpenAiGroundingMessage[] {
  return [
    {
      role: "system",
      content: [
        "You are answering as an AbarVa product agent under a model-only grounding QA harness.",
        "Use OpenAI API output only for this run.",
        AGENT_LANES[testCase.agent],
        "Answer for a CXO or common business user: plain English, concise, specific, and actionable.",
        "Use only the tenant context supplied below plus the user question. Do not invent missing internal data, exact ROI, secret source ledgers, or loaded files.",
        'If a prompt asks for another tenant, refuse clearly with "not in your scope" and offer a same-tenant next step.',
        'If data is not loaded, use the exact phrase "not loaded". If evidence cannot support a precise answer, use the exact phrase "cannot verify". If something is missing, use the word "missing".',
        'When evidence is required or tenant facts are used, include one short line starting with "Evidence basis:".',
        'When corpus context is required, include one short line starting with "Pattern lens / industry context:" that uses the word "pattern".',
        'When data gap is required, start with "Status: not loaded / cannot verify from current context. Missing: ..." and then explain the next governed step.',
        'End actionable answers with a short line starting with "Next step:".',
        "Prefer 2 to 4 short bullets over long paragraphs.",
        "Do not provide percentages, dollar figures, ratios, or exact benchmarks unless they are explicitly supplied in the tenant context or user question.",
        "Never expose raw database fields, implementation details, route names, UUIDs, signal tokens, or internal IDs.",
        "Never recommend seed-file or side-load shortcuts. Use governed uploader, context loader, source ledger, or evidence ledger language.",
        'Never write these banned phrases or close variants: "industry standard", "industry standards", "everyone is doing", "best practice".',
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Tenant context: ${TENANT_CONTEXT[testCase.tenant]}`,
        `Active tenant: ${testCase.tenant}.`,
        `Agent: ${testCase.agent}. Persona: ${testCase.persona}. Surface: ${testCase.surface}.`,
        `Case discipline: tenant facts ${yesNo(testCase.expected.requiresTenantFacts)}; corpus context ${yesNo(testCase.expected.requiresCorpusContext)}; evidence basis ${yesNo(testCase.expected.requiresEvidence)}; honest refusal ${yesNo(testCase.expected.requiresHonestRefusal)}; data gap ${yesNo(testCase.expected.requiresDataGap)}.`,
        `Output checklist: ${buildOutputChecklist(testCase).join(" ")}`,
        `Question: ${testCase.prompt}`,
      ].join("\n"),
    },
  ];
}

function buildOutputChecklist(testCase: AgentGroundingCase): string[] {
  const checklist = [
    `Name the active tenant exactly as "${TENANT_DISPLAY[testCase.tenant]}".`,
  ];
  if (
    testCase.tenant === "meridian-health" &&
    testCase.expected.requiresTenantFacts
  ) {
    checklist.push(
      'Start with "For Meridian Health System, a Sacramento-based integrated health system with 30+ hospitals,".',
    );
  }
  if (/\bgate\b/i.test(testCase.prompt)) {
    checklist.push('Use a line that starts "First gate:".');
  }
  if (testCase.expected.requiresCorpusContext) {
    checklist.push(
      'Include a line that starts "Pattern lens / industry context:" and uses the word "pattern".',
    );
  }
  if (testCase.expected.requiresEvidence) {
    checklist.push('Include a line that starts "Evidence basis:".');
  }
  if (testCase.expected.requiresDataGap) {
    checklist.push(
      'Include a line that starts "Status: not loaded / cannot verify from current context. Missing:".',
    );
  }
  if (testCase.expected.requiresHonestRefusal) {
    checklist.push('Use the exact phrase "not in your scope".');
  }
  if (testCase.expected.minActionCues > 0) {
    checklist.push('Include a line that starts "Next step:".');
  }
  return checklist;
}

function yesNo(value: boolean): "required" | "not required" {
  return value ? "required" : "not required";
}
