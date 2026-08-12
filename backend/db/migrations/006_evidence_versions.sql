DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT item.conname INTO constraint_name
  FROM pg_constraint item
  WHERE item.conrelid = 'platform.evidence_upload_sessions'::regclass
    AND item.contype = 'u'
    AND pg_get_constraintdef(item.oid) LIKE '%planned_evidence_document_id%'
    AND pg_get_constraintdef(item.oid) NOT LIKE '%version_number%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE platform.evidence_upload_sessions DROP CONSTRAINT %I', constraint_name);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION platform.protect_evidence_upload_version_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.version_number IS DISTINCT FROM OLD.version_number THEN
    RAISE EXCEPTION 'Evidence upload version identity is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER evidence_upload_sessions_protect_version_number
BEFORE UPDATE ON platform.evidence_upload_sessions
FOR EACH ROW EXECUTE FUNCTION platform.protect_evidence_upload_version_number();
