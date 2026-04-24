# 23 CHAT EXPERIENCE AND INPUT MODEL

## Purpose

The Source chat/input experience must not be a blank generic prompt box. It should be a guided enterprise input surface embedded in the sourcing workflow.

Nexus should feel like the sourcing lead for the current event, with structured responses, context disclosure, suggested actions, attachment grounding, typo tolerance, and continuation paths.

This file is a product specification only. Do not build the chat UI, wire file upload, wire spell-check, or wire model calls until a future implementation slice is explicitly approved.

## Response Requirements

Each Nexus response should support:

- direct answer
- evidence/citation chips
- context used
- recommended next action
- three suggested actions
- one custom free-text option
- optional file attachment
- spell-check and typo tolerance
- prompt correction or intent clarification
- ability to continue workflow

## Future Conceptual Types

```ts
type SourceChatMessage = {
  id: string;
  eventId?: string;
  stageId?: string;
  role: 'user' | 'nexus' | 'sentinel' | 'atlas' | 'steward' | 'system';
  content: string;
  intent?: SourceUserIntent;
  attachments: SourceAttachment[];
  contextUsed?: SourceContextUsed;
  confidence?: 'low' | 'medium' | 'high';
  citations: SourceEvidenceCitation[];
  suggestedActions: SourceSuggestedAction[];
  createdAt: string;
};

type SourceSuggestedAction = {
  id: string;
  label: string;
  intent: SourceUserIntent;
  targetSurface?: SourceSurfaceId;
  requiresGateCheck: boolean;
  requiresEvidenceCheck: boolean;
  disabledReason?: string;
};

type SourceAgentResponse = {
  answer: string;
  contextUsed: SourceContextUsed;
  confidence: 'low' | 'medium' | 'high';
  citations: SourceEvidenceCitation[];
  recommendedNextAction: string;
  suggestedActions: SourceSuggestedAction[];
  customInputEnabled: boolean;
  handoff?: SourceAgentHandoff;
  artifactActions: SourceArtifactAction[];
  validation: SourceAgentValidationResult;
};
```

## The "3 Choices + Custom" Model

After each Nexus response, where appropriate, show three contextual suggested actions plus one custom input option.

Rules:

- suggestions must be based on current event, stage, state, and pattern pack
- suggestions must avoid actions blocked by gates unless the label clearly explains the blocker
- suggestions should move workflow forward, reveal missing context, or deepen evidence
- custom input must remain available for user questions
- suggestions should not feel like generic chatbot starter prompts

### Scope Stage Example

Suggested actions:

1. Show missing inputs
2. Generate minimum data request
3. Explain scope readiness
4. Ask something else...

### Scorecard Governance Example

Suggested actions:

1. Show default weights
2. Explain why these weights matter
3. Add override rationale
4. Ask something else...

### Vendor Responses Example

Suggested actions:

1. Show vendors missing pricing
2. Draft reminder
3. Flag event as at risk
4. Ask something else...

### Value Ledger Example

Suggested actions:

1. Explain projected value
2. Show assumptions
3. Assign measurement owner
4. Ask something else...

## Chat Input Capabilities

The chat input should eventually allow the user to:

- type a custom prompt
- attach files or documents
- select one of the suggested actions
- ask follow-up questions
- ask Nexus to generate or revise artifacts
- ask Nexus to explain risks or readiness
- ask Nexus what is missing
- ask Nexus to summarize uploaded files
- ask Nexus to prepare executive language

Each capability must be grounded by the Context Bundle before response generation.

## File Attachment Behavior

### Supported Attachment Types Conceptually

- PDF
- DOCX
- XLSX
- CSV
- PPTX
- TXT/MD
- images later if needed

### Attachment Use Cases

- upload application inventory
- upload ticket volume extract
- upload vendor response
- upload pricing template
- upload existing RFP
- upload contract excerpt
- upload architecture deck
- upload business case
- upload procurement notes
- upload legal redlines

### SourceAttachment

```ts
type SourceAttachment = {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'pptx' | 'txt' | 'md' | 'image' | 'unknown';
  uploadedBy: string;
  uploadTime: string;
  eventId?: string;
  stageId?: string;
  artifactId?: string;
  parsedStatus: 'not-started' | 'parsing' | 'parsed' | 'failed' | 'needs-classification';
  summary?: SourceAttachmentSummary;
  extractedEntities: SourceExtractedEntity[];
  relatedArtifacts: string[];
  evidenceReferences: SourceEvidenceCitation[];
  confidence: 'low' | 'medium' | 'high';
  parsingErrors: string[];
};

type SourceAttachmentSummary = {
  attachmentId: string;
  purpose?: string;
  summary: string;
  keyFields: Record<string, string | number | boolean | string[]>;
  missingSections: string[];
  extractionConfidence: 'low' | 'medium' | 'high';
  citations: SourceEvidenceCitation[];
};
```

### Attachment Workflow

| Step | Behavior |
|---|---|
| 1 | User attaches file |
| 2 | System classifies file type |
| 3 | System asks what the file is for if ambiguous |
| 4 | System associates file with event, stage, or artifact |
| 5 | System extracts summary and key fields |
| 6 | System makes file available to Nexus context |
| 7 | Sentinel can validate evidence and citations |
| 8 | Nexus can reference the file in responses |
| 9 | User can see which files were used in a response |

### Attachment Grounding Rules

- Nexus must not answer a file-specific question without referencing the file name or parsed summary.
- Nexus must disclose parse failures and low-confidence extraction.
- Nexus must not invent missing sections or vendor claims from attachments.
- File-derived claims should include citation or section references when available.
- Ambiguous files should trigger classification questions before use.

## Spell-Check And Typo Tolerance

The chat input should support:

- tolerant interpretation of typos
- spell-check suggestions where feasible
- no blind correction of domain acronyms
- preservation of vendor names, system names, and client-specific terms
- clarification when correction changes meaning

Examples:

| User Input | Expected Interpretation |
|---|---|
| socrecard | scorecard |
| vender | vendor |
| RFP pakage | RFP package |
| SNow | may mean ServiceNow; do not blindly change |
| AMS | preserve AMS |
| BAFO | preserve BAFO |

## Intent Clarification

Nexus should ask a clarifying question when:

- the prompt could target multiple events
- a file is attached without a purpose
- an acronym is ambiguous
- requested action is blocked by a gate
- response would require missing evidence
- user asks for a high-impact action without enough context

## Chat UX States

| State | Description | Required Behavior |
|---|---|---|
| empty state | no prompt yet | show stage-aware suggested actions, not generic examples |
| suggested action state | Nexus has provided next action options | show three contextual actions plus custom input |
| file attached state | file is attached but not parsed | show file metadata and ask purpose if ambiguous |
| file parsing state | attachment extraction is running | show parsing state and prevent file-grounded claims |
| file parse failed state | extraction failed | show error, retry path, and manual classification option |
| context missing state | event, stage, or required data is missing | ask for missing context and label any response as pattern guidance |
| low-confidence response state | evidence or context is weak | show confidence, missing context, and validation actions |
| evidence-backed response state | citations and event data are sufficient | show evidence chips and context used |
| blocked by gate state | Steward gate blocks action | show gate, blocker, owner, and unblock action |
| waiting state | event waits on owner/vendor/data | show owner, aging, due date, and escalation threshold |
| at-risk state | event risk is material | show risk reason, impact, and next action |
| custom prompt state | user types custom question | normalize intent and assemble Context Bundle |

## Response UI Contract

Each Nexus response should include:

- answer
- context used
- confidence
- citations/evidence if applicable
- recommended next action
- three suggested actions
- custom input option
- escalation or handoff if needed
- artifact/action buttons where appropriate

## Workflow Continuation

The chat experience should continue the workflow, not create a parallel conversation. Suggested actions should connect to:

- required input collection
- artifact readiness
- scorecard rationale
- gate unblock
- owner assignment
- file upload or classification
- executive summary generation later
- value owner assignment
- risk escalation

## Anti-Patterns

- blank generic prompt with no event context
- suggested prompts that could apply to any SaaS assistant
- file upload that does not feed the Context Bundle
- spell-check that corrupts vendor names or acronyms
- chat responses with no next action
- chat as a substitute for deterministic gates
- artifact generation from an empty prompt

## Acceptance Standard

The chat/input model is acceptable only when:

- every response includes context used and confidence
- every eligible response offers three contextual actions plus custom input
- file attachments have event/stage/artifact association and parse status
- typo handling preserves domain acronyms and client terms
- generic chat behavior is rejected by the validation harness
