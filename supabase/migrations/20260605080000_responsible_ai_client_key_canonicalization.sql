-- T216 · Responsible AI ledger client_key canonicalization
--
-- The Responsible AI ledgers are tenant-scoped by client_id, but their
-- denormalized client_key column can carry legacy app aliases such as
-- `apexretail`, `meridian`, or `lakeshore`. Tenant-isolation regression checks
-- inspect client_key directly, so keep these append-only evidence tables
-- canonical with clients.tenant_key on both existing and future rows.

BEGIN;

CREATE OR REPLACE FUNCTION public.canonicalize_responsible_ai_client_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  canonical_key TEXT;
BEGIN
  SELECT tenant_key
    INTO canonical_key
    FROM public.clients
   WHERE id = NEW.client_id;

  IF canonical_key IS NOT NULL THEN
    NEW.client_key := canonical_key;
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.responsible_ai_acknowledgments ack
   SET client_key = clients.tenant_key
  FROM public.clients
 WHERE clients.id = ack.client_id
   AND clients.tenant_key IS NOT NULL
   AND ack.client_key IS DISTINCT FROM clients.tenant_key;

UPDATE public.responsible_ai_training_completions training
   SET client_key = clients.tenant_key
  FROM public.clients
 WHERE clients.id = training.client_id
   AND clients.tenant_key IS NOT NULL
   AND training.client_key IS DISTINCT FROM clients.tenant_key;

DROP TRIGGER IF EXISTS responsible_ai_acknowledgments_canonical_client_key
  ON public.responsible_ai_acknowledgments;
CREATE TRIGGER responsible_ai_acknowledgments_canonical_client_key
  BEFORE INSERT OR UPDATE OF client_id, client_key
  ON public.responsible_ai_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION public.canonicalize_responsible_ai_client_key();

DROP TRIGGER IF EXISTS responsible_ai_training_completions_canonical_client_key
  ON public.responsible_ai_training_completions;
CREATE TRIGGER responsible_ai_training_completions_canonical_client_key
  BEFORE INSERT OR UPDATE OF client_id, client_key
  ON public.responsible_ai_training_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.canonicalize_responsible_ai_client_key();

COMMENT ON FUNCTION public.canonicalize_responsible_ai_client_key() IS
  'Keeps Responsible AI ledger client_key values aligned to clients.tenant_key for tenant-isolation auditability.';

NOTIFY pgrst, 'reload schema';

COMMIT;
