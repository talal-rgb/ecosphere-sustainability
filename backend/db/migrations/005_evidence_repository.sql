ALTER TABLE platform.evidence_documents
  ADD COLUMN deleted_by uuid REFERENCES platform.app_users(id),
  ADD COLUMN deletion_reason text,
  ADD COLUMN restored_at timestamptz,
  ADD COLUMN restored_by uuid REFERENCES platform.app_users(id),
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(display_name, '') || ' ' || replace(document_type, '_', ' '))
  ) STORED,
  ADD CONSTRAINT evidence_documents_deletion_metadata_check CHECK (
    (deleted_at IS NULL AND deleted_by IS NULL AND deletion_reason IS NULL)
    OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL AND deletion_reason IS NOT NULL)
  );

CREATE INDEX evidence_documents_full_text_idx ON platform.evidence_documents USING gin (search_vector);
CREATE INDEX evidence_tags_tag_idx ON platform.evidence_tags (organization_id, tag, evidence_document_id);
