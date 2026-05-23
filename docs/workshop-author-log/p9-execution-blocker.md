# P9 Workshop Authoring Blocker

Date: 2026-05-23 10:56 CDT

Packet: P9 - Workshop authoring

Branch: `feat/p9-workshop-authoring`

## Blocker

P9 cannot author or publish workshop records because the target Azure Postgres
runtime database does not have the P5 workshop schema applied.

## Live Evidence

Runtime execution path:

- Azure Container App: `ca-abarva-web-lab-eastus`
- Revision: `ca-abarva-web-lab-eastus--0000047`
- Connection: runtime `DATABASE_URL` projected inside the Container App
- Probe method: Node `pg` query from inside the Container App; no local DB secret
  was read or printed.

`to_regclass(...)` result:

```json
{
  "clients": "clients",
  "workshop_templates": null,
  "workshop_template_assets": null,
  "workshop_template_versions": null,
  "workshop_template_review_state": null,
  "workshop_pack_renders": null
}
```

Required missing migration:

- `supabase/migrations/20260523104500_workshops_data_layer.sql`

## Action Taken

I stopped before applying schema changes, per the P9 guardrail:

> If the target Azure runtime DB lacks the P5 workshop schema or app/runtime
> path is too old, write exact ESCALATION evidence in EXECUTION_STATUS.md and
> stop the blocked action.

No workshop templates were inserted. No render-pack smoke was run, because the
P5 tables required for authoring and render audit records are absent.

## Ready-to-Resume Criteria

Resume P9 after the target Azure runtime DB has:

- `public.workshop_templates`
- `public.workshop_template_assets`
- `public.workshop_template_versions`
- `public.workshop_template_review_state`
- `public.workshop_pack_renders`

Once present, P9 can load the 15 published workshop templates, verify Rubric W
depth evidence, and run three client-context render-pack smokes.

## 2026-05-23 11:00 CDT Resume Evidence

Coordinator unblocked the runtime DB by applying the already-merged dependency
migrations from inside `ca-abarva-web-lab-eastus`, including the P5 workshop
migration `supabase/migrations/20260523104500_workshops_data_layer.sql`.

After the unblock, P9 stayed content-only and loaded the workshop templates
through the P5 workshop schema. No schema or runtime code was changed.

Live authoring summary:

```json
{
  "loaded": 15,
  "published": 15,
  "min_depth": 10,
  "depth_pass": 15,
  "min_asset_rows": 8,
  "max_asset_rows": 8,
  "rubric_field_pass": 15
}
```

Rubric W representation:

- P5 asset rows: `pre_read`, `facilitator_brief`, `agenda`, `worksheet`,
  `decision_capture`, `pre_mortem`, `stakeholder_map`, `post_read`
- P5 first-class fields: `hypothesis_to_test`,
  `facilitator_tactics_jsonb`

Render-pack smoke evidence with Apex Retail client-context substitution:

| Workshop | Byte length | SHA-256 |
|---|---:|---|
| `wave-0-alignment-it-productivity` | 2923 | `256aa35cdc62cbb90e6f398638f71009be3ef8ba864d282e32920dc4a3e84cfe` |
| `time-wardley-team-topologies-portfolio-diagnostic` | 3135 | `9722a49c13b34de27ee4927f959974315a5046e492c744df20205ecf3bd177bd` |
| `quarterly-value-verification-ceremony` | 2630 | `67f21d4d14b95dfa2a33c2f7e56e86776b716ff2cf61f230a46fcc8f5448094e` |

Final live state: P9 acceptance is complete in the target Azure runtime DB.
