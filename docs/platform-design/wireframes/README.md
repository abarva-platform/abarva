# Page Wireframe Specification Library

This library holds implementation-grade page wireframes for AbarVa surfaces that are ready to guide future UI work.

## Authority model

- Markdown is the source of truth for implementation.
- DOCX is the founder-review artifact and reference copy.
- UI agents must read the relevant wireframe before coding a page, route shell, or workflow surface.
- If a wireframe is missing, create the wireframe before implementing the page.
- Wireframes must be used together with page blueprints, the visual/design canon, and the agent-centric enforcement standards.

## What belongs here

- Page-level layout authority
- Zone composition
- Element-level expectations
- Workflow-state rendering rules
- Agent editorial and suggestion contracts
- Failure modes and acceptance criteria
- Persona walkthroughs that explain what a page must communicate in the first three seconds

## What does not belong here

- Runtime code
- Route implementation
- Data model logic
- API or model-call behavior
- Final production-readiness claims

## Usage rule for Codex and UI agents

Before coding any page listed here:

1. Read the matching wireframe markdown file.
2. Read the related page blueprint and design canon docs.
3. Read agent-centric enforcement guidance for the primary agent on that page.
4. Build only what the wireframe and blueprint authorize.
5. If the implementation must diverge, update the wireframe first.

## File structure

- `WIREFRAME_INDEX.md` is the top-level registry.
- Each surface folder contains the markdown implementation spec and, when available, the founder-authored DOCX artifact.

