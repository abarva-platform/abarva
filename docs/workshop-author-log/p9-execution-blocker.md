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
