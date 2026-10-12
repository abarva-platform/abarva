# Home narrative projection version

Home narrative generation and readback must select the same canonical projection version.
The builder does not discover a version from an assessment name or silently pick the newest rows.

## Selection

Both `scripts/ecl/build_home_ecl_narrative_layer.ts` and
`scripts/ecl/readback_home_ecl_narrative_layer.ts` accept `--projection-version 1` or
`--projection-version 2`. The corresponding operator-job environment variable is
`HOME_ECL_NARRATIVE_PROJECTION_VERSION`. An explicit CLI value takes precedence.
Omission retains legacy version 1; unsupported values fail closed.

Declare the tenant from the intake registry and the assessment from the exact approved build.
Supply the selected version explicitly for a version 2 assessment. The query, generated plan,
approved-plan application and independent readback all use that same version. Version 2 plans
must declare `projectionVersion: 2`; an older plan that omits the field is valid only for version 1.

## Gates Remain Separate

A version selection is not approval, source review, indexing, citation verification or promotion.
Projection rows and derived signals still require their independent current governance proof.
The source catalog and approved narrative packet must agree with the selected factual basis.
An approved write still requires the exact plan byte hash and unchanged packet/publication gates.
The builder remains plan-only by default.

Run mutating builds only through the approved private ACA operator job contract. Before execution,
bind the exact tenant, assessment, source versions, selected projection version, pinned image,
approval and run ID. Retain Blob proof and independent readback. Do not run this through a web
request, infer cross-assessment identities or turn on a product selector merely because rows exist.

This code release itself performs no generation, write, review or selector change.
