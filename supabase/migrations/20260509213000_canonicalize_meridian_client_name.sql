-- Canonicalize the Meridian demo client identity.
-- Keeps the stable tenant key while aligning display, legal, and slug fields.

update public.clients
set
  name = 'Meridian Health',
  legal_name = 'Meridian Health',
  slug = 'meridian-health',
  updated_at = now()
where tenant_key in ('meridian', 'meridian-health')
   or slug in ('meridian', 'meridian-health')
   or name = 'Meridian Health System'
   or legal_name = 'Meridian Health System';
