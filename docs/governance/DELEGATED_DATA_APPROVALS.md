# Explicit delegated data approvals

This is an optional attribution path, not a waiver of release, source, quality or review gates.
Existing named-human approvals keep their schema and behavior. An agent name without the explicit
delegated branch remains invalid. Dataset declaration is not load or serving approval.

## Trust and scope

`approved_by` records the actual delegated actor. `delegated_decision` separately identifies the
named human authorizer, exact authorization message reference, manager session, and approved
operation. It always denies independent human and Finance attestation. Delegation does not earn
`agent_ready`, approve financial benefits or resolve source conflicts.

Two release-controlled registries anchor the runtime check:

- `src/lib/governance/delegation-authority-roots.json`: authority ID, exact private authority-byte
  hash, authorizer, actor/session, authorization-message hash, allowed operations and surfaces.
- `src/lib/governance/delegation-trusted-decisions.json`: independently certified decision ID,
  authority ID, exact private decision-byte hash and current status.

An arbitrary private Blob receipt cannot approve itself. Both byte hashes must match these trust
anchors before parsing. Trust changes require a controlled release. Revoked/completed anchors
reject new approvals even if a previous proof object remains cached. This initial trust scope is
declared synthetic tenants in the canonical registry, not real-client attestation or broad corpus
and Move-registry authorization.

## Consumer contract

1. Validate the strict manifest and independently inspect the intended data/selector under its
   tenant fence. Parsing a declaration alone grants no execution authority.
2. Use `loadDelegationEvidence` with an authenticated, bounded private Blob reader restricted to
   the declared operator proof account/container/path. There is no public URL fetch fallback.
3. Pass the returned evidence context to `resolveLoadApproval` or `resolveServingApproval`.
   The resolver requires exact dataset, tenant, assessment, hash, count, method, release record,
   operation and surface. `binding.extra_bindings` comes from independently inspected candidate,
   receipt, source and selector observations, never from the approval's own declaration.
   Delegated execution also requires `binding.release_record` from the native run, independently
   of the approval declaration.
4. For serving with a delegated load, pass load observations separately in `load_extra_bindings`
   and its independently supplied native record in `load_release_record` when it differs.
   Serving observations cannot silently substitute for load observations.
5. Satisfy the decision's execution conditions through the native operator's existing preflight,
   guarded compare-and-set, independent readback and product proof. Conditional authorization
   does not make a blocked preflight ready. Run only the released digest-pinned ACA job.

The evidence decoder is asynchronous and portable WebCrypto-based; schema/manifest validation is
DB-free and does not import server-only credentials. Decoded evidence is deeply immutable and
branded by the decoder. A copied or manually constructed evidence object is not verified.

## Time and retained proof

`expires_at: null` is valid for continuing task-scoped authority. Do not invent a calendar expiry.
Explicit expiry, revocation or task completion ends new decisions/execution. An expired but
originally valid decision can be inspected as historical proof; execution resolvers always enforce
current execution time, regardless of a caller's historical-read flag. Release/demo cutoffs remain
separate constraints. Retained history must not reactivate withdrawn authority.

Proofs are SHA-bound exact UTF-8 bytes before JSON parsing; never hash a reserialized substitute.
Private source/message text stays in the private proof store, not this repository. Upload and native
consumer owners remain separate from this shared schema release. No dataset is automatically
loaded, served, reviewed, indexed or made agent-ready by merging the contract.
