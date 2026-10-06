# Synthetic supplier panel v2

This public-safe lab fixture has five fictional candidate identities for each of the ten category-routed Source archetypes. The five additional negative controls must never become supplier rows. It is a test pool, not a researched or approved vendor panel and not permission to contact anyone.

The first 28 CSV rows are unchanged from v1 so existing canonical IDs remain stable. The 27 appended rows exercise a wider candidate panel without changing the four accepted suppliers on the current synthetic event. No email addresses, named signers, contract terms, scores, or prices are in this file.

## Lab use

1. Validate `candidate_supplier_registry.csv` with the existing package validator.
2. Run the existing registry operator in `dry_run` with the explicit lab tenant, dataset ID `source-candidate-supplier-registry-synthetic-v2`, input source version `v2`, and the exact CSV SHA-256.
3. Do not run `apply` from this document. A separate named-person, hash-bound load approval and the repo-owned ACA data job are required. After any apply, read back canonical `source.vendor` rows and the signed-in Source panel separately.
4. A candidate selection is not a contact approval. Stage 05 needs independently governed contacts, NDA template publication, and executed-NDA evidence. Demo e-sign recipients must remain routed to the configured test inbox.

## Client configuration boundary

A real client supplies its vendor-management export privately, with the vendor-management owner, source system, source row, and identity reference declared. An adapter maps that extract into canonical vendor IDs and eligibility observations; the client does not fill this synthetic CSV or choose internal archetype IDs. Source reads the resulting tenant-scoped canonical records. Contact authority, recipient address, NDA status, and event acceptance remain separately governed. No real-client extract or contact address belongs in this public repository or shared image.

The current package validator deliberately requires `Fictional ` names. It is not a client import adapter; a client-configurable onboarding surface and its identity-resolution review remain separate product work.
