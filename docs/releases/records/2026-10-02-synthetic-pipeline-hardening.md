# 2026-10-02-synthetic-pipeline-hardening — Declared Source Identity and a Content Readback

## Release ID

`2026-10-02-synthetic-pipeline-hardening`

## Status

`candidate`

## Plain-English Summary

The synthetic enterprise pipeline made several decisions from names, or from values its caller supplied, and its post-load readback compared row counts only. This change makes each of those decisions from a declared field and makes the readback compare content. It loads, projects and serves nothing.

- The generator refused any source definition that produced fewer than 300 logical applications. A generator must not be sized to a serving check, so that refusal is removed. The two committed definitions still generate byte-identical output.
- The loader's serving flag was a bare count of application rows. It now reports application depth by the grain each row declares: applications the definition names, application rows the generator multiplied out by formula, and modules. Only named applications count toward the depth check of 300. When that number is reached only by adding generated rows, the blocker says exactly that. Whether generated rows may count is a product-owner decision; this change does not make it and no longer asserts either answer.
- Rows the generator multiplied out by formula (modules and logical services) load with basis `calculated`, the existing value for something the deterministic pipeline computed, instead of `source_recorded`. Applications the definition names stay `source_recorded`.
- Each source version's identity is declared once, in `datasets/synthetic/source-versions.json`: its definition file, dataset id, assessment id, id namespace, adapter labels, base version, and how each application grain came to exist. The generator, validator, adapter and loader resolve a version from that file and refuse one it does not list. Before, the id namespace and the adapter labels were read off the end of the dataset id, the definition was found by building a folder name, and the validator checked a pack against whatever definition its caller passed. The validator again refuses a pack whose dataset or assessment is not the registered one, refuses a pack built from any other definition, and pins the total number of application rows.
- The readback job compares content: every source file, source record, object and relationship a load writes, column by column over the columns the loader writes, and the bytes of each source blob against the pack. A blob it cannot open is a failure. It is told whether a Home projection is expected instead of assuming there is none, so it can be re-run after one exists. Its proof records the image digest, build version, operator identity, release record, run id and tenant scope. A failed comparison writes a proof with status `failed` and exits non-zero. It stays read-only: one `repeatable read read only` transaction, one count select, one select per loaded table.
- The projection job accepts only a readback proof that carries that content comparison and was taken while no projection existed.
- A load of the second source version records its own job name instead of the first version's.

## Layer Impact

- Release lane: `client-data-lane` for the synthetic lab source set, its jobs and tests (operator job code only), and `internal-admin` for the read-only readback job.
- Layer 1: No source definition changes. The generator no longer refuses a definition for its application count. Generated source bytes for both registered versions are unchanged and are now pinned by a test.
- Layer 2: The adapter takes its labels from the registry instead of from the dataset id. Its output for both registered versions is byte-identical and pinned.
- Layer 3: A load writes `calculated` as the basis of the application rows the generator multiplied out. Every row id is unchanged and pinned. This change writes no rows.
- Layer 4: No product read path changes. No projection and no serving selection changes.

## Client Applicability

- All clients: No change.
- Specific clients: None.
- Internal only: Operator job code for the synthetic lab source set, its tests and their CI wiring.
- Public/demo only: Synthetic lab data only, and only through a later, separately approved job execution.
- Feature flag: None.

## Changes Included

- `datasets/synthetic/source-versions.json` (new): the declared registry of source versions.
- `scripts/ecl/synthetic_source_versions.py` and `scripts/ecl/synthetic_source_versions.ts` (new): the two readers of that registry. Both refuse an unlisted version and a malformed, ambiguous or circular registry.
- `scripts/ecl/generate_synthetic_enterprise_v1.py`: takes a registered `--source-version` instead of a definition path; the 300-application refusal is removed; its self-check pins total application rows.
- `scripts/ecl/validate_synthetic_enterprise_v1.py`: resolves the dataset, assessment and definition from the registry by the dataset id the pack declares; pins total application rows.
- `scripts/ecl/normalize_synthetic_enterprise_v1.py`: adapter labels come from the registry.
- `scripts/ecl/load_synthetic_enterprise_v1.ts`: id namespace and identity from the registry; `buildLoadRows` (the rows a load writes, shared with the readback); `applicationDepth`, `qualityGate`, `loadProof`, `progressRecord` and `loadJobName` as tested functions; basis `calculated` for generated application rows; a generator process that cannot be started now reports why.
- `scripts/ecl/readback_synthetic_enterprise_v2.ts`: content comparison, blob comparison, stated projection state, recorded job bindings, one exit path.
- `scripts/ecl/project_synthetic_enterprise_home.ts`: the readback-proof check is a tested function and requires the content comparison.
- Tests: `scripts/ecl/__tests__/test_synthetic_enterprise_published_pins.ts` (new), `test_synthetic_enterprise_source_identity.ts` (new), `test_synthetic_enterprise_v2_readback.ts` (new), `test_synthetic_source_versions.py` (new), `readback-synthetic-enterprise-v2.test.ts`, `test_synthetic_enterprise_home_gates.ts`, `test_synthetic_enterprise_v1_load.ts`, `test_synthetic_enterprise_v2_load.ts`, `test_synthetic_enterprise_v1_load_gate.ts`, `synthetic_enterprise_gate_fixtures.ts`, `run-synthetic-enterprise-v2-tests.mjs`, `test_normalize_synthetic_enterprise_v1.py`, `test_synthetic_ecl_physical_admission.py`.
- `.github/workflows/ecl-physical-admission.yml`: runs the pins, identity, registry and readback tests, the readback against the disposable database after the versioned load, and again after the projection exists. A change to either definition triggers it.

## QA / Validation

- PASS: both registered versions generate the same bytes before and after this change: 50 of 50 files (22 source files, both manifests and the adapter output, per version) have the same sha256 as files generated from the parent commit.
- PASS: the same bytes are generated on macOS with Python 3.14 and, with no network, in Linux containers with Python 3.11, 3.12 and 3.13 (arm64).
- PASS: every row id is unchanged. Loading both versions into a disposable local Postgres before and after gives identical ids for all 68,488 rows across the four loaded tables, and identical content except the `basis` of the 726 modules (both versions) and the 320 generated services (second version).
- PASS: `node --import tsx --test scripts/ecl/__tests__/test_synthetic_enterprise_published_pins.ts` - both source-set hashes, the manifest and adapter-output hashes, a digest of every row id, and named object, relationship, source-record and source-file ids for both versions. The pinned values were read from a load made by the parent commit.
- PASS: `node --import tsx --test scripts/ecl/__tests__/test_synthetic_enterprise_source_identity.ts` - 10 tests.
- PASS: `python3 -m unittest discover -s scripts/ecl/__tests__ -p 'test_synthetic_source_versions.py'` - 8 tests.
- PASS: `node --import tsx --test scripts/ecl/__tests__/readback-synthetic-enterprise-v2.test.ts` - 6 tests.
- PASS: `node --import tsx --test scripts/ecl/__tests__/test_synthetic_enterprise_v2_readback.ts` on the disposable database - 13 tests before a projection exists, including renamed applications with emptied attributes, supplier edges pointed at one vendor, emptied source payloads, blob bytes that do not match, a blob that cannot be opened, a retyped module, a changed recorded file hash and an assessment that was never loaded, each of which fails the readback; and the stated-projection-state test again after the projection exists.
- PASS: the full `ecl-physical-admission.yml` step sequence, every step exit 0, on a disposable local Postgres 18 and again on a disposable Postgres 16 container, the version the workflow uses.
- PASS: `npm run test:ecl-synthetic-enterprise-v1`, `npm run test:ecl-synthetic-enterprise-v2`, `npm run test:ecl-synthetic-enterprise-adapter-v1`.
- PASS: mutation check - 95 of 95 single-edit mutants of the registry readers, the generator, validator and adapter changes, the loader's identity, depth, basis and job-name code, the readback comparison, bindings and exit path, and the projection job's readback-proof check were each failed by a named test. Two of them survived a first pass and each was closed by an added assertion. The table is in the PR description.
- PASS: `tsc --noEmit` (exit 0, fresh build info), ESLint on touched files (0 errors), `python3 -m py_compile` on touched scripts, `npm run release:check`.
- NOT RUN: the storage and database calls of the executing paths of the loader and the readback job beyond what the disposable-database tests drive. The readback's Blob client is exercised only through an injected stand-in.
- NOT RUN: any shared lab operator execution, load, readback, projection or promotion.
- NOT RUN: the new workflow steps on a hosted runner; they were run locally only.

## Rollout Plan

Merge through a PR; the ACA main workflow builds and deploys the image. No migration, data operation or flag change. From that image on, a readback run must also bind `ECL_SYNTHETIC_OPERATOR_IDENTITY`, `ECL_SYNTHETIC_BUILD_VERSION`, `ECL_SYNTHETIC_INPUT_SOURCE_VERSION` (the source-set hash), `ECL_SYNTHETIC_IMAGE_DIGEST` (pinned, and the image the job runs), `ECL_SYNTHETIC_RELEASE_RECORD` and `ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION` (`absent` or `present`), and a projection run needs a readback proof written by this readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for the image.
- Shared runtime mutators: None in this change.
- Approved image digest: Resolve from the successful main deploy.
- ACA runtime invariant: Required after image deployment.
- Worker image invariant: Required after image deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. This change is not browser-visible and loads, projects and promotes nothing.

## Rollback Plan

Revert this PR through a new reviewed PR. Nothing is written by this change, so there is no data to roll back. Reverting restores identity read from names, the generator's application-count refusal and a count-only readback, so do not revert it to make a readback pass.

## Audit Evidence

- PR diff and CI checks, including the physical-admission workflow's pin, identity, registry and readback steps.
- The byte-identity and id-identity comparison and the mutation table in the PR description.

## Known Gaps

- Nothing already loaded, projected or served is changed by this.
- The rows already in the shared database were written by the earlier loader and keep its states. That loader recorded every row as `confirmed` and `source_recorded`, so a readback of them with this job is expected to report review state, and the basis of generated application rows, as differing from what a load now writes. It would report that and correct nothing. That readback has not been run.
- Whether generated services may count toward application depth is an open product-owner decision. Until it is made the loader reports the facts and does not report the target as met.
- The synthetic definition is still a third description of one tenant, outside that tenant's registered input root, with different revenue and application counts than the registered packet. That is not resolved here.
- The readback's expectation comes from the loader's own row builder. It proves the database and storage hold what a load of the pack writes; it is not a second derivation of the pack.
- Only application rows are classified by how they came to exist, because only they declare a grain. Every other family, and every relationship, still loads as `source_recorded`, although most of those rows are also multiplied out by formula.
- Identifiers are recorded as already published and none was renamed, because each feeds a published hash or a persisted id: the dataset and assessment ids, the id namespaces and the adapter labels. For the same reason the unused seed and the role list that multiplies services stay outside the definition hash.
- Source files still load with quality state `accepted` and a lab-accepted marker; this change does not alter those.
- The pinned hashes were checked on arm64 only (macOS and Linux). The first hosted run of the pin test is the x86-64 check.
