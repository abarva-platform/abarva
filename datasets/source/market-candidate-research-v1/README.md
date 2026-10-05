# Source market candidate research v1

This is a public-source research **longlist**, not an approved supplier list, a
recommendation, a legal-entity register, or authority to contact anyone. Company
names are provider-facing labels, not verified legal names. The `company_key`
identifies a research subject across archetypes; it is **not** a `source.vendor`
ID and must not be used to create duplicate canonical vendor identities.

Each row records one possible company/archetype fit based on a provider-owned
webpage. That evidence establishes a described capability only. It does not
establish current availability, geography, pricing, suitability, security,
procurement approval, or a client relationship. A buyer must review identity,
fit, conflicts, and contact authority before any promotion to canonical
supplier data. No loader or product route consumes this CSV.

The current Source event registry has 11 archetypes. Ten category-routed
archetypes have five initial research candidates each. `CONTRACT_RENEWAL` is
incumbent-specific; a generic market longlist would be misleading. Changes to
the code registry make the validator fail until coverage is re-assessed.

There are no contact names or addresses here. The existing fictional NDA lab
contacts and demo-provider test-inbox rewrite are the correct test path; a
test-inbox alias must not be written as a real company's contact. No supplier
email or e-signature request is authorized by this pack.

Validate with:

```sh
node --import tsx scripts/source/validate-market-candidate-research.mjs
node --import tsx --test scripts/source/__tests__/market-candidate-research.test.mjs
```

The validator prints the exact CSV SHA-256 and fails on unsupported archetype
coverage, duplicate fits, inconsistent company identity, missing/off-domain
source URLs, email addresses, or any claimed approval/contact authority.
Domain matching proves only that the URL is on the declared domain; it is not
a substitute for human source review. Before any data-plane load, create a
canonical dataset manifest and obtain a version/hash-bound load approval,
then use a separate, reviewed operator job with private readback. A merge of
this file alone performs no load, index, client display, or contact action.
