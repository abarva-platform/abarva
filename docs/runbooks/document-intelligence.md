# Azure AI Document Intelligence PDF Parser Runbook

This runbook covers T184: Azure AI Document Intelligence Layout model as the
primary PDF parser for supported upload surfaces.

## Policy

Use Azure AI Document Intelligence `prebuilt-layout` as the primary parser for
PDF uploads when the private data-plane environment is configured. Request
Markdown output so tables, headings, and layout cues survive into downstream
evidence extraction and agent context.

If Azure AI Document Intelligence is not configured or the service returns an
error, fall back to the local `pdf-parse` parser and record a warning on program
evidence outputs. Do not block upload on a parser-provider outage.

## Required Configuration

Set these environment variables in the target environment:

- `DOCUMENT_INTELLIGENCE_ENDPOINT`: Azure AI Document Intelligence endpoint.
- `DOCUMENT_INTELLIGENCE_API_KEY`: API key for the resource.

Alternative names are also accepted for compatibility:

- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
- `AZURE_DOCUMENT_INTELLIGENCE_API_KEY`

AAD mode is supported when the runtime identity has access to the resource:

- `DOCUMENT_INTELLIGENCE_ENDPOINT`
- `DOCUMENT_INTELLIGENCE_USE_AAD=true`

Optional:

- `DOCUMENT_INTELLIGENCE_LOCALE`: locale hint passed to the Layout model.

## Runtime Behavior

PDF parsing follows this order:

1. If Document Intelligence is configured, call `prebuilt-layout` with
   `outputContentFormat=markdown`.
2. Use the returned Markdown content as extracted text.
3. Record `azure-document-intelligence-layout` as the parse method.
4. If Azure parsing fails, call `pdf-parse`, record `pdf-parse` as the parse
   method, and include a fallback warning.
5. If Document Intelligence is not configured, use `pdf-parse` directly.

The content-hash parse cache still scopes results by client/cache scope, MIME
type, parser identity, parser version, and SHA-256 hash.

## Validation

Repository validation:

```bash
npx jest src/lib/ingestion/__tests__/document-intelligence-layout.test.ts \
  src/lib/programs/__tests__/evidence-ingestion.test.ts \
  src/lib/agent/__tests__/attachments.test.ts --runInBand
npx tsc --noEmit --pretty false
npm run release:check -- --base origin/main --head HEAD
```

Live Azure validation, once credentials exist:

1. Upload a known PDF with tables/headings through a client-scoped upload
   surface.
2. Confirm parse method is `azure-document-intelligence-layout`.
3. Confirm extracted text preserves useful Markdown structure.
4. Temporarily point the endpoint or key to an invalid value in a non-production
   environment.
5. Re-upload the same PDF and confirm the fallback parse method is `pdf-parse`
   with a warning.

## Completion Boundary

The repository integration is complete when the PR merges with mocked SDK tests,
fallback tests, TypeScript, release gate, and CI green. Live client/private
data-plane validation requires real Azure credentials and should be tracked
separately if those credentials are not available during the repository PR.
