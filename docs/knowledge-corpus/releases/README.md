# Knowledge Corpus Release Manifest

Status: generated
Release ID: `corpus-release-2026-06-02`
Version: `v1.0`
Manifest date: `2026-06-02`
Aggregate SHA-256: `c74ca49c5aece369dda41be99430f4268a49aebbaf112ae9760612999e183eaf`

This manifest versions the committed AbarVa industry corpus inputs so a client
or pilot environment can pin to a concrete corpus release. Re-run
`npm run corpus:release-manifest` after corpus source files, pattern-library
docs, or corpus generation scripts change.

## Scope

Version and checksum the committed industry corpus release inputs so client/pilot corpus pins can be audited.

Excluded: docs/knowledge-corpus/releases is excluded so generated manifests do not hash themselves.

## Roots

| Label | Path | Files | Description |
| --- | --- | ---: | --- |
| knowledge-corpus-docs | `docs/knowledge-corpus` | 30 | Schema, provenance, curation, validation, and generated corpus evidence. |
| pattern-library-docs | `docs/pattern-library` | 2 | Pattern-library source documents used by corpus authorship and retrieval. |
| knowledge-data-sources | `scripts/knowledge-data` | 80 | Industry corpus source text packs for genome, healthcare, retail, and finserv. |
| corpus-generation-scripts | `scripts/corpus` | 8 | Corpus generation and reporting scripts. |
| corpus-overlay-scripts | `scripts/corpus-generation` | 4 | Overlay generation scripts for industry-specific corpus waves. |

## Totals

| Metric | Value |
| --- | ---: |
| Files | 124 |
| Bytes | 6539157 |
| Roots | 5 |

## File Checksums

| Path | Root | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `docs/knowledge-corpus/AGENT_INTEGRATION_PROMPT.md` | knowledge-corpus-docs | 9032 | `423685ed69b6d586d660df3557fc7d5c2ac1078281bab6f82d6e56ac2b63db8d` |
| `docs/knowledge-corpus/AGENT_QUERY_CONTRACTS.md` | knowledge-corpus-docs | 11813 | `9dedcad1c2112d15b29dd9053ed8b2e1b8235ca931f622f9256b2dea89854c29` |
| `docs/knowledge-corpus/CANONICAL_CORPUS_BACKFILL_EXECUTION_REPORT_2026-05-09.md` | knowledge-corpus-docs | 18612 | `aaa2d7aeb8e9765d9f01d29e483b05e2e3f436c32cd7b9cbf7fd58eeb77c3500` |
| `docs/knowledge-corpus/CANONICAL_CORPUS_BACKFILL_PREVIEW_2026-05-09.md` | knowledge-corpus-docs | 21407 | `49013af4324f8e2c0d002b15cc4a5106737d7efd689aa20494f1195322824a92` |
| `docs/knowledge-corpus/CANONICAL_CORPUS_PERSISTENCE_READ_CONTRACT_2026-05-09.md` | knowledge-corpus-docs | 3628 | `9827b51699b6380b30fd921c497c76c34bdc856a676475c9120dcb85729ae1aa` |
| `docs/knowledge-corpus/CANONICAL_CORPUS_VALIDATION_REPORT_2026-05-09.md` | knowledge-corpus-docs | 1228 | `24e4e135195cec7c1ba8f1508926e14f7200cf58b50d5af23c57334003024fe2` |
| `docs/knowledge-corpus/CANONICAL_ENUM_ALIAS_RULES_2026-05-09.md` | knowledge-corpus-docs | 3689 | `596e33b0b52ab922cbadbeb3c507b5acd42dcef928b661403c025fc53921440e` |
| `docs/knowledge-corpus/CANONICAL_INDUSTRY_AI_PATTERN_CONTRACT_2026-05-09.md` | knowledge-corpus-docs | 8811 | `f5d23ee17e7b4e1cadb0b48e8f915ccefe2d40d2310418ac93669f49cdcbb32e` |
| `docs/knowledge-corpus/CANONICAL_PATTERN_VIEW_MODEL_NOTES_2026-05-09.md` | knowledge-corpus-docs | 4707 | `1f2f2e442fab77d8aa52c8dc0ada2138a1285c49fdb87d70e157429f650fb08f` |
| `docs/knowledge-corpus/claude-code-runbook.md` | knowledge-corpus-docs | 5108 | `56b55be7c4da5c95d1885b9bb10cb77475dd258a5d00ec29f49b9a2eae12c15e` |
| `docs/knowledge-corpus/CROSS_REFERENCE_GRAPH.md` | knowledge-corpus-docs | 9195 | `002755e5ea9b5ddbbba457b7f6c5fb21c76dc9ddf1ac323bf54d6464c840d821` |
| `docs/knowledge-corpus/CURATION_PIPELINE.md` | knowledge-corpus-docs | 9423 | `ff78cbe4a3f7681057758020eea1651ed1953a60f440fa2bfb3e25b5529df246` |
| `docs/knowledge-corpus/CURATION_PROMPT_FINSERV.md` | knowledge-corpus-docs | 23259 | `bb0acbfd2c1bfa6bbd66703c95d234fb8d3d1ece808029f2bc900be41ba13463` |
| `docs/knowledge-corpus/CURATION_PROMPT_HEALTHCARE.md` | knowledge-corpus-docs | 18949 | `113f1b53b8f219fb02f1976f952802c917ce64e95c20c0830bd25be8e7494276` |
| `docs/knowledge-corpus/CURATION_PROMPT_RETAIL.md` | knowledge-corpus-docs | 19547 | `cb7a393bb4ea00a943928df899e73129b3857e20bb4d133e1980974112599ed4` |
| `docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json` | knowledge-corpus-docs | 4871698 | `68e8d076ce5e988a6a30da58ec09560b0660cb50fdace214acebdb89946318c6` |
| `docs/knowledge-corpus/generated/pattern-crosswalk-inventory.json` | knowledge-corpus-docs | 689981 | `a09407d5963a004f0b0d08452646de4e9dd23151d616a92dccf6eb12f37ff0cb` |
| `docs/knowledge-corpus/KNOWLEDGE_CORPUS_REMEDIATION_TRACKER_2026-05-09.md` | knowledge-corpus-docs | 44087 | `e18d78fe74750f0a9a8d05f217d23597608ef7275ef563942b26987d15034ef8` |
| `docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md` | knowledge-corpus-docs | 16757 | `7e4b839fecb40d3b1558167466d8a1b4e6fbc46bcf4cf5d874efbc93f4d5c081` |
| `docs/knowledge-corpus/master-prompt.md` | knowledge-corpus-docs | 5884 | `5e8b40866e91a98effe1d7dd11593e950f8c256efe4e13ed311eb54892ed6954` |
| `docs/knowledge-corpus/PATTERN_CROSSWALK_INVENTORY_2026-05-09.md` | knowledge-corpus-docs | 86384 | `48cc3ef09c9f7a4d4539c76e137b59b9ef0d9882047e2b27fa7dd47e453a752d` |
| `docs/knowledge-corpus/PATTERN_DUPLICATE_RISK_REPORT_2026-05-09.md` | knowledge-corpus-docs | 62217 | `d2d80071f29ffcd80e99f91c716a549447048ba93ff229ad0ef6bff19a37343d` |
| `docs/knowledge-corpus/PATTERN_FIRST_AGENT_RETRIEVAL_DESIGN_2026-05-09.md` | knowledge-corpus-docs | 14362 | `5b7aa85784a07ab5d81d5071ab32f1cfc70464da771574cb40829c831eef85fb` |
| `docs/knowledge-corpus/PATTERN_SOURCE_TO_TARGET_MAPPING_2026-05-09.md` | knowledge-corpus-docs | 14666 | `a3a81adbd037e9eae4ce0a58cb4483215aae6d197bcfc4ec61bf5213fd9649f2` |
| `docs/knowledge-corpus/PROVENANCE_AND_VERSIONING.md` | knowledge-corpus-docs | 9213 | `17d566d83b73b662d4926c525b258bf0e3cbc1226433202927f2581ba467b50a` |
| `docs/knowledge-corpus/README.md` | knowledge-corpus-docs | 9350 | `114576363bf21ed1fde31bc89d2b7a52d0402ca7a89cd6f4e8cc7e2528c8850f` |
| `docs/knowledge-corpus/SAMPLE_RETRIEVAL_QA_REPORT_2026-05-09.md` | knowledge-corpus-docs | 3341 | `013718d69b18ad1922c9d6372014d128dbafdfb6c6205e6500bcfb1ec2f61207` |
| `docs/knowledge-corpus/SCHEMA_EXTENSIONS_V1_1.md` | knowledge-corpus-docs | 28296 | `194268e7cc6fdd706fd78cb6caadf3187b4e88ca55581a2e98d579c0f4cdb8c4` |
| `docs/knowledge-corpus/TENANT_OVERLAY_LOGIC.md` | knowledge-corpus-docs | 9973 | `0f728399eba635408dab5a33ad0176dacf1fcf26bde2041b9793ab0c73d8d332` |
| `docs/knowledge-corpus/WAVE_1_EXECUTION_SUMMARY_2026-05-09.md` | knowledge-corpus-docs | 11843 | `664607be919c7b0beb82eaf1b621d217bb497adb3cca2193117ca5fda1c323bf` |
| `docs/pattern-library/00-vision-catalog-template-first-pattern.md` | pattern-library-docs | 54929 | `405962c860bc4aa869de7abfa3ecc56d7060d72dc94549b15864a3910c336a7f` |
| `docs/pattern-library/01-meta-patterns-m2-m6.md` | pattern-library-docs | 68253 | `94c7d7f1394f01401e16b46f1d2e0f498a239b4577f330ec7987a4e0557a1400` |
| `scripts/corpus-generation/consolidate-retail-overlay.mjs` | corpus-overlay-scripts | 6787 | `103d44fb0f482fb0ab4ad11e568a7bb95aa39a0a6ac6a630c145996eeb751701` |
| `scripts/corpus-generation/generate-retail-wave.mjs` | corpus-overlay-scripts | 13833 | `3c4999a13efd14ab7b0f5e26ed4b5bc8f6adc0d2dfe9ec11fb9a31599493776f` |
| `scripts/corpus-generation/generate-retail-wave1.mjs` | corpus-overlay-scripts | 13635 | `7309ed60e8b94f834bcf1076e649caee1206173466287f4a6ecf408e98525cd9` |
| `scripts/corpus-generation/load-retail-overlay-to-enterprise-context.mjs` | corpus-overlay-scripts | 15342 | `6e480eff5a6e394924f1aeb3ac0749052a9b22e66367591b804ef02ae29fd0f7` |
| `scripts/corpus/generate-airline-ai-corpus.mjs` | corpus-generation-scripts | 25280 | `96a521db9a1a5e2ff3a292c99e579b811c6fe6060be6652f17bc7a760ec7c3e3` |
| `scripts/corpus/generate-healthcare-ai-corpus.mjs` | corpus-generation-scripts | 20468 | `edeb999d4131d3e293c5f82d27fe1e906791eb497f7770854be85546710807d2` |
| `scripts/corpus/generate-retail-ai-corpus.mjs` | corpus-generation-scripts | 26009 | `ab2c5e244c0b07b5f19ff8ef668491057674de47e1a1de513aa48b15120cb0b8` |
| `scripts/corpus/load-authored-genome-seeds.ts` | corpus-generation-scripts | 12535 | `dc4866413da34a2ad97b5a742be175517c7b88ff3cb16b0d6c57513275800957` |
| `scripts/corpus/release-manifest.mjs` | corpus-generation-scripts | 7728 | `037b30a11083d4de73a71451abbc6918bd8aceb55ae72ba89a10182eae488227` |
| `scripts/corpus/report-airline-ai-corpus.mjs` | corpus-generation-scripts | 9486 | `69b9309d580a77fa7a30a9a9559c849ae52b3b458fa641238c265542ad222a19` |
| `scripts/corpus/report-retail-ai-corpus.mjs` | corpus-generation-scripts | 8994 | `297bcc4368303fc9c44e6f42d4983ecc4d2e14c76bdd925ff5cd16e32daa343a` |
| `scripts/corpus/strip-genome-seed-boilerplate.ts` | corpus-generation-scripts | 5019 | `0dedd38cea0602a41086381376b42d180d83c33e440adcbd2e1d616a6fafe800` |
| `scripts/knowledge-data/finserv/01-asset-management-ci-benchmarks.txt` | knowledge-data-sources | 1946 | `1897efa2801d91c3c98d7c6d51494ebe71d9b2cc8dc8118a3fca0de0042403c0` |
| `scripts/knowledge-data/finserv/02-finserv-ai-portfolio-benchmarks.txt` | knowledge-data-sources | 2088 | `2819442a7fb43bf9f88f687de3ce2c17c74333b9f333ffd15a6c0b8249d636ba` |
| `scripts/knowledge-data/finserv/03-finserv-data-infrastructure.txt` | knowledge-data-sources | 2241 | `0ce2f4b3e5e7779cd9edc100844e81b89a4058b39949bca3681d80115deaea9c` |
| `scripts/knowledge-data/finserv/04-finserv-regulatory-tech.txt` | knowledge-data-sources | 2602 | `d2582d12785d1bcf0edb7c03e7b89782d2184795474f876c4d50d236a75ee84c` |
| `scripts/knowledge-data/finserv/05-finserv-salesforce-crm.txt` | knowledge-data-sources | 2328 | `3de826f788400fdebd58999debf285b34c0b12df850a90fe619e3615084824ba` |
| `scripts/knowledge-data/finserv/06-finserv-esg-data-benchmarks.txt` | knowledge-data-sources | 2322 | `5047b4d4e6ced9d0516127fac2e015d1813b9901025baf905bc7719e1473cc56` |
| `scripts/knowledge-data/finserv/07-finserv-operations-automation.txt` | knowledge-data-sources | 2113 | `b7cef2c9b4d7dbd823db7156b9f0a4672a2b5b6a559cdea463ff8944def93cef` |
| `scripts/knowledge-data/finserv/08-banking-cost-to-income.txt` | knowledge-data-sources | 2353 | `bd8fc489847fdd2fa437417d65403d1526bce43d31cd97ed38d7d546235a3692` |
| `scripts/knowledge-data/finserv/09-banking-core-modernisation.txt` | knowledge-data-sources | 2544 | `5a1f43972fccd0f636690e51814a5dc7b1074408325370f8c8c5d0cc76ae6d15` |
| `scripts/knowledge-data/finserv/10-banking-digital-lending-ai.txt` | knowledge-data-sources | 2298 | `fab2a2b71ad7f4f42c9f829535277cb942f1e07f4c3379d4ba9d71c46997a1d6` |
| `scripts/knowledge-data/finserv/11-finserv-cloud-adoption.txt` | knowledge-data-sources | 2237 | `145b5abcd1befecaa8c593166d081efadb46c3a4905227d101b95cbdaa792df3` |
| `scripts/knowledge-data/finserv/12-finserv-wealth-management-ai.txt` | knowledge-data-sources | 2252 | `95b4f14f5fc171a28f50a2536b437ce88d53466286911cd5547317f50dc40797` |
| `scripts/knowledge-data/finserv/13-finserv-it-spend-benchmarks.txt` | knowledge-data-sources | 2195 | `fdf5f51ae071ab7a7bf7ded77024728a9d956084c23e815b14e87ae0b9d2fb3d` |
| `scripts/knowledge-data/finserv/14-finserv-data-governance.txt` | knowledge-data-sources | 2278 | `e8c33500af3484a4003f01b856838418c2609460aa58dd693bd0feeb6af46dde` |
| `scripts/knowledge-data/finserv/15-finserv-ai-talent-leadership.txt` | knowledge-data-sources | 2228 | `02d418156f8f9ad9c0fadeaa10f24f505647eefa4fc1a18f746f0f8cc1c5143d` |
| `scripts/knowledge-data/finserv/16-finserv-genai-adoption.txt` | knowledge-data-sources | 2223 | `df16e4162b730535f34998756df16df034f735dd1e05341d0e220931c945a601` |
| `scripts/knowledge-data/finserv/17-finserv-mlops-model-management.txt` | knowledge-data-sources | 2400 | `b5ec97d28760e24dbd786571cee668c731e175b326c52854ab51209b228a81b3` |
| `scripts/knowledge-data/finserv/18-finserv-open-banking.txt` | knowledge-data-sources | 2204 | `8b5aaefa48c6b54cf543aaafd942d060bb8f72ceed25d49eb5c637e20145b839` |
| `scripts/knowledge-data/finserv/19-finserv-peer-outcomes.txt` | knowledge-data-sources | 2662 | `322a6593153b15b6613c6c6089052cd1770abf672ba3a597ea7c56f15ec53707` |
| `scripts/knowledge-data/finserv/20-finserv-vendor-landscape.txt` | knowledge-data-sources | 2465 | `6bf359b64b864c8a593ec0df7ce2e74994334d99d123f1a0a6bc1cc1927b9382` |
| `scripts/knowledge-data/genome/01-ai-programme-failure-patterns.txt` | knowledge-data-sources | 3718 | `cad88d4687a433fc465bb4c0672bff287fc693c839f9a42fa44009da4c925dc5` |
| `scripts/knowledge-data/genome/02-ai-roi-benchmarks-all-industries.txt` | knowledge-data-sources | 2815 | `342d0822fa42605b64ee5d5a5f62652c3d58fcf0b502bc56ebea01117a7e6d59` |
| `scripts/knowledge-data/genome/03-data-readiness-and-ai-outcomes.txt` | knowledge-data-sources | 2656 | `c7a8e0439bf36414ed7ec0ce235d855d70e161ebf88cd825bafafce4aad9636c` |
| `scripts/knowledge-data/genome/04-executive-mandate-patterns.txt` | knowledge-data-sources | 2860 | `efa42488d766b825256f5d18839dca12788e37ec210f7e596457b3c2c1f880ee` |
| `scripts/knowledge-data/genome/05-vendor-sla-and-performance.txt` | knowledge-data-sources | 2962 | `fc4a0c2099eeebf05b4954f86dca3f8910c37375553e19f42769de5f6d926f28` |
| `scripts/knowledge-data/genome/06-change-management-benchmarks.txt` | knowledge-data-sources | 2869 | `5c9e4f7c3a6ef998e2933bfa8691e6415be102df32b5625c1e4900cce880f216` |
| `scripts/knowledge-data/genome/07-ai-governance-models.txt` | knowledge-data-sources | 3014 | `161aeedc6f4afdb5306294629944d6b170a718dd836b791a2089c0fbf79a111e` |
| `scripts/knowledge-data/genome/08-cloud-migration-benchmarks.txt` | knowledge-data-sources | 3040 | `50a5aee851e6e6559620d44e1361f1450aa5b4e3e59745f6b851e45c5d7331f5` |
| `scripts/knowledge-data/genome/09-data-platform-roi-benchmarks.txt` | knowledge-data-sources | 2861 | `2d120808ff126140160caefcb2b8f760b16a0545c87b27c158b6cb544d6334fc` |
| `scripts/knowledge-data/genome/10-ai-talent-and-capability.txt` | knowledge-data-sources | 2800 | `39d92ed692f31d29de006ecf2a82db05131fe02e5f9d5ae3f4ea6ce932ed04c3` |
| `scripts/knowledge-data/genome/11-baseline-measurement-methodology.txt` | knowledge-data-sources | 3263 | `0d7ff0a40ea88e34a1bb7b2886f96205125ace36aaa2fdb1e347108f1827d1d0` |
| `scripts/knowledge-data/genome/12-90-day-sprint-methodology.txt` | knowledge-data-sources | 3202 | `266afdc36664374ed21d3118b1f1b25c1cd18c275ed46832e3468281617af9d4` |
| `scripts/knowledge-data/genome/13-ai-programme-phases-timeline.txt` | knowledge-data-sources | 3221 | `4d012f90f1eca268ab833959e5cd7cd9ae5c69a6e290226d39ca40090f132684` |
| `scripts/knowledge-data/genome/14-cdo-role-and-impact.txt` | knowledge-data-sources | 2498 | `aed640e82765777fee9b0733520875a5ed5664ccec2ba218b55e2a13185e631c` |
| `scripts/knowledge-data/genome/15-technology-debt-patterns.txt` | knowledge-data-sources | 3459 | `8e1770cff24d4a412762afcd45a0ca7c7196b5d93bcd3b92fceddcc754eafb38` |
| `scripts/knowledge-data/genome/16-ai-peer-outcomes-cross-industry.txt` | knowledge-data-sources | 2747 | `6d9fa2904db7a9a52f6d627b41924e55617c3ca127718e92d198eae2ff48eb8b` |
| `scripts/knowledge-data/genome/17-leadership-failure-patterns.txt` | knowledge-data-sources | 3257 | `85a8ae2383b0c4021a42c9903695bcaa4bea04afee4878eb43b4efa37a3aa763` |
| `scripts/knowledge-data/genome/18-data-failure-patterns.txt` | knowledge-data-sources | 3770 | `ac8549e056f4f411e6924457aa30f337f6157dafb440c87fac5697aa239ae678` |
| `scripts/knowledge-data/genome/19-technology-stack-patterns.txt` | knowledge-data-sources | 3289 | `254e6fca037dcca1b9441501ee01042df0502946d129324d5da75af7d85fd084` |
| `scripts/knowledge-data/genome/20-abarva-solution-framework.txt` | knowledge-data-sources | 3774 | `3b50c1d932866f0b0cc0fa7ab81d9c493c04a995cebee69800a9005db7fd1ab5` |
| `scripts/knowledge-data/healthcare/01-rcm-denial-benchmarks.txt` | knowledge-data-sources | 2442 | `eb4bee399e6939c43d93692b646c64a1c7e1b358ac44fed22e0289c02c86f3cd` |
| `scripts/knowledge-data/healthcare/02-epic-ehr-market-benchmarks.txt` | knowledge-data-sources | 2643 | `12a6c2d833b0b8568268ef324ded73ffe89cb1c67ab18c7c900445aa344f55ea` |
| `scripts/knowledge-data/healthcare/03-healthcare-ai-roi-benchmarks.txt` | knowledge-data-sources | 2797 | `aef186d52cd8a1fea2462be121a9699fbff6b43f53f03e52ce9928f61829ab63` |
| `scripts/knowledge-data/healthcare/04-healthcare-data-platform-benchmarks.txt` | knowledge-data-sources | 2532 | `836d1b610ec2960d038234af4e08490b8dff166745740fcc15a359d522e38548` |
| `scripts/knowledge-data/healthcare/05-healthcare-vendor-landscape.txt` | knowledge-data-sources | 2309 | `e1898c3d5289012653ca007060810cdc1903796114a05e7e5b9ce84e99ffaed6` |
| `scripts/knowledge-data/healthcare/06-healthcare-workforce-analytics.txt` | knowledge-data-sources | 2398 | `221c39b05888b01ea037d6a4c09245af13780044d57e15096eea14c151e8b2c7` |
| `scripts/knowledge-data/healthcare/07-healthcare-supply-chain-benchmarks.txt` | knowledge-data-sources | 2143 | `0adf00443bcfc9c11f22edf532ec60fb18282db5d11ba4120e774581193b9aa5` |
| `scripts/knowledge-data/healthcare/08-healthcare-prior-auth-automation.txt` | knowledge-data-sources | 2273 | `e46467eed74812f76b43013934bbd9d8146442c4f6aa5c302320266fe8dfe069` |
| `scripts/knowledge-data/healthcare/09-healthcare-clinical-ai-benchmarks.txt` | knowledge-data-sources | 2499 | `2f129019412ccb14d9cb2d7bb7ab969cef29333eda765cae83306dca18235a3a` |
| `scripts/knowledge-data/healthcare/10-healthcare-value-based-care.txt` | knowledge-data-sources | 2389 | `728f35cc37ef824a92f6bf50e00f8a243e35616552df3a7b9a144ae1340e1312` |
| `scripts/knowledge-data/healthcare/11-healthcare-it-spend-benchmarks.txt` | knowledge-data-sources | 2200 | `daca3b5af6323adca2e623b77c7667beb7e08148842bf3fbe3126522d3488c7a` |
| `scripts/knowledge-data/healthcare/12-healthcare-regulatory-compliance.txt` | knowledge-data-sources | 2426 | `ee35a1d4f470c9dee624e3c554519153984d43417689dc57f1ed6e3f698f2693` |
| `scripts/knowledge-data/healthcare/13-healthcare-patient-access-ai.txt` | knowledge-data-sources | 2332 | `9bfedd3bbb16a6376b9206ff25550a1e379fd510b59ace5dc6e9afa59e790dba` |
| `scripts/knowledge-data/healthcare/14-healthcare-interoperability-fhir.txt` | knowledge-data-sources | 2083 | `260b83c246fea5b8bb7feeca8312d7d1cdefb763bd720b20c486e8283f6e410d` |
| `scripts/knowledge-data/healthcare/15-healthcare-cdo-governance.txt` | knowledge-data-sources | 2311 | `bc7413a2f0df9d304740fe1a6bd492a5d2899e0f29067ede11a369b9f0b241e3` |
| `scripts/knowledge-data/healthcare/16-healthcare-revenue-integrity.txt` | knowledge-data-sources | 2317 | `5cb206b39e749685f3b14847ad4c93c52e9ca7cd016c2f649d02eec789fe649c` |
| `scripts/knowledge-data/healthcare/17-healthcare-cloud-adoption.txt` | knowledge-data-sources | 2398 | `5aff5eadfa68022f8c722ddb957374a0db5e8fc3eaa1eac17fe8d5274560eaab` |
| `scripts/knowledge-data/healthcare/18-healthcare-ambient-documentation.txt` | knowledge-data-sources | 2357 | `b0ab151137991c76ad4063d20dd269d645d4f514991a466159aaacef3512fefb` |
| `scripts/knowledge-data/healthcare/19-healthcare-ma-and-payer-ai.txt` | knowledge-data-sources | 1958 | `f4d6e952d980096a14d62f40705cc421f828b704234a7e653ee8cf061f8e981c` |
| `scripts/knowledge-data/healthcare/20-healthcare-tech-stack-patterns.txt` | knowledge-data-sources | 2572 | `12ebd1ceff0c8c3cc1e3d0d53ec99a627c76022663d499c092caf39d9d2af25c` |
| `scripts/knowledge-data/retail/01-retail-cloud-infrastructure-benchmarks.txt` | knowledge-data-sources | 1786 | `08b419343ac1caec68520aaa2b9c7adac65d69d58212cd270fa93d606194daab` |
| `scripts/knowledge-data/retail/02-retail-ai-use-cases-roi.txt` | knowledge-data-sources | 2256 | `8ab80ca1f9d598e90ff053e43ca90574deadca94e0d711749b95c5f2069dc9ea` |
| `scripts/knowledge-data/retail/03-retail-sap-migration.txt` | knowledge-data-sources | 2488 | `7e9ff9ff912ace1fefffe1d0cad58a01f5ca663c66a904153aee64a08ada30ef` |
| `scripts/knowledge-data/retail/04-retail-ecommerce-benchmarks.txt` | knowledge-data-sources | 2740 | `72e8df3f30d583b2897488a575652c0b4db7a5fcb93bb4ee2fd813c659d8832f` |
| `scripts/knowledge-data/retail/05-retail-demand-forecasting.txt` | knowledge-data-sources | 2725 | `186242fc76d8b17b9e87fbd2f45f00ab5befc5a73d950cecda2b75b8bc22b5e6` |
| `scripts/knowledge-data/retail/06-retail-customer-data-platform.txt` | knowledge-data-sources | 2365 | `ba6ab900e14b2a5749da76a2b8d4d8c767e9f788480d2c623d760808cf49c707` |
| `scripts/knowledge-data/retail/07-retail-supply-chain-ai.txt` | knowledge-data-sources | 2375 | `90da8b657919e8b4e01fd65e9d229c8d373756a43f909071b0054c57b124db77` |
| `scripts/knowledge-data/retail/08-retail-pricing-ai.txt` | knowledge-data-sources | 2597 | `ebaa534e893a3fbfb2569212d60147787cbc6627c2904cb1c914800eaa4073e8` |
| `scripts/knowledge-data/retail/09-retail-loss-prevention-ai.txt` | knowledge-data-sources | 2607 | `eafd4c51e6386da178dd19c0ed85799ec92bb4310563e242f04ed9161b3658d2` |
| `scripts/knowledge-data/retail/10-retail-omnichannel-operations.txt` | knowledge-data-sources | 2553 | `312ebc0670ac979cd35907cb3563177009b5fc7065c72e509913d7050c3d367a` |
| `scripts/knowledge-data/retail/11-retail-data-platform-benchmarks.txt` | knowledge-data-sources | 2573 | `2f730fc9244c6fe38b3038d3143867f79c1c8e71d99975a2b4536f38a9e2e2d1` |
| `scripts/knowledge-data/retail/12-retail-genai-content-ai.txt` | knowledge-data-sources | 2160 | `c19e9cc0ee29873c2f8f09f9fc0d4454c3e2ff61351f8120ee916875f931493b` |
| `scripts/knowledge-data/retail/13-cpg-and-trade-ai.txt` | knowledge-data-sources | 2312 | `7ba9a4ed3404537bd8804aca874b3402701890f6827f80c9f980490d11f04d79` |
| `scripts/knowledge-data/retail/14-retail-vendor-landscape.txt` | knowledge-data-sources | 2448 | `1954050261132e477bccd2e9d3d41775528146a004f438fad54e2c9da66f60d9` |
| `scripts/knowledge-data/retail/15-retail-it-spend-benchmarks.txt` | knowledge-data-sources | 2190 | `3c3cbf7cf8e5b8b68f684fcf7214a708187062bfd76e7c880f6b148f1f1d9868` |
| `scripts/knowledge-data/retail/16-retail-workforce-scheduling-ai.txt` | knowledge-data-sources | 2111 | `a02fb231c6098a948d2693f234486657594b60160c86727f75e16830f5dad8a2` |
| `scripts/knowledge-data/retail/17-retail-peer-outcomes.txt` | knowledge-data-sources | 2476 | `1bac63602efe09beaded9870a0d57bf11feeed19d045f1f433750c17b9783c01` |
| `scripts/knowledge-data/retail/18-retail-digital-transformation-patterns.txt` | knowledge-data-sources | 3254 | `d87c65c1bba5f8c533ffea3bc31202bc3aa7a82beee2c538fccdefa8a151c1ba` |
| `scripts/knowledge-data/retail/19-retail-marketing-analytics-ai.txt` | knowledge-data-sources | 2462 | `b1b5e057ca6533b9cbf3ea1a13dd9e52c32e682f657433092955972ea05b1cdd` |
| `scripts/knowledge-data/retail/20-retail-sustainability-ai.txt` | knowledge-data-sources | 2488 | `39bac5ee4b8abf2ffad556dfab0e9cc9d53221f1b97463a3545e6124f8e0c6b6` |
