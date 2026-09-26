# Moves Artifact Content Audit

The artifact-content audit checks generated Move deliverables against a versioned acceptance contract. It measures two separate properties:

- Corpus coverage: every required signal appears in at least one current generated artifact.
- Phase coverage: every signal required for a decision stage appears in an artifact from that phase.

The contract also requires a minimum generated-artifact count for each decision phase and checks for technical disclosure such as raw UUIDs, digests, tenant-key references, internal table names, and model-provider names. Client- or engagement-specific prohibited terms belong in a private operator contract supplied with `--contract`; they are not committed to this public repository.

Run the pure contract tests with:

```bash
npm run test:moves:artifact-content-contract
```

Run a live read-only audit with a signed-in operator identity:

```bash
E2E_DEMO_EMAIL='operator@example.test' \
npm run audit:moves:artifact-content -- \
  --base-url='https://app.abarva.ai' \
  --client='<canonical-client-key>' \
  --move-id='<move-id>' \
  --email='operator@example.test'
```

The command downloads only current generated deliverables, extracts HTML and DOCX text, writes a local JSON report and text corpus, and exits non-zero when any contract requirement is missing. It does not upload, approve, mutate, or delete data.
