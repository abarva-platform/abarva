-- Canonicalize the legacy Heliara demo client display name.
-- Additive/reversible data correction: keeps tenant_key/slug/id stable and
-- only updates visible display names that are known Meridian aliases.

update public.clients
set
  name = 'Meridian Health',
  updated_at = now()
where tenant_key in ('meridian', 'meridian-health')
  and name in ('Heliara Health Alliance', 'Heliara Health', 'Meridian Health System');

update public.clients
set
  name = 'Meridian Health',
  updated_at = now()
where slug in ('meridian', 'meridian-health', 'heliara-health')
  and name in ('Heliara Health Alliance', 'Heliara Health', 'Meridian Health System');
