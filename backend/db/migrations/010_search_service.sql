INSERT INTO platform.permissions (code, resource, action, description) VALUES
  ('search.read', 'search', 'read', 'Search resources already visible to the current user.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform.role_permissions (role_code, permission_code)
SELECT code, 'search.read' FROM platform.role_definitions
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION platform.can_search_entity(entity_kind text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT CASE entity_kind
    WHEN 'organization' THEN platform.has_permission('organization.read')
    WHEN 'project' THEN platform.has_permission('project.read')
    WHEN 'evidence' THEN platform.has_permission('evidence.read')
    WHEN 'calculation' THEN platform.has_permission('calculation.read')
    WHEN 'report' THEN platform.has_permission('report.read')
    WHEN 'training' THEN platform.has_permission('training.read')
    WHEN 'regulation' THEN platform.has_permission('organization.read')
    WHEN 'recommendation' THEN platform.has_permission('project.read')
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION platform.can_index_entity(entity_kind text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT CASE entity_kind
    WHEN 'organization' THEN platform.has_permission('organization.update')
    WHEN 'project' THEN platform.has_permission('project.create') OR platform.has_permission('project.update')
    WHEN 'evidence' THEN platform.has_permission('evidence.upload') OR platform.has_permission('evidence.update')
    WHEN 'calculation' THEN platform.has_permission('calculation.create')
    WHEN 'report' THEN platform.has_permission('report.create')
    WHEN 'training' THEN platform.has_permission('training.manage')
    WHEN 'regulation' THEN platform.has_permission('organization.update')
    WHEN 'recommendation' THEN platform.has_permission('project.update')
    ELSE false
  END
$$;

-- PostgreSQL marks array_to_string as stable rather than immutable, which prevents
-- its direct use in a stored generated column. Text-array rendering with a fixed
-- delimiter is deterministic, so keep that narrow guarantee in a schema-owned
-- helper instead of maintaining the search vector through application triggers.
CREATE OR REPLACE FUNCTION platform.search_keywords_text(keywords text[])
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT array_to_string(coalesce(keywords, '{}'::text[]), ' ')
$$;

CREATE TABLE platform.search_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform.organizations(id) ON DELETE CASCADE,
  project_id uuid,
  entity_type text NOT NULL CHECK (entity_type IN (
    'organization','project','evidence','calculation','report','training','regulation','recommendation'
  )),
  entity_id uuid NOT NULL,
  source_version text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  action_url text,
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', platform.search_keywords_text(keywords)), 'B') ||
    setweight(to_tsvector('simple', coalesce(body, '')), 'C')
  ) STORED,
  indexed_at timestamptz NOT NULL DEFAULT now(),
  stale_at timestamptz,
  deleted_at timestamptz,
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, entity_type, entity_id),
  FOREIGN KEY (organization_id, project_id) REFERENCES platform.projects(organization_id, id),
  CHECK (char_length(source_version) BETWEEN 1 AND 120),
  CHECK (char_length(title) BETWEEN 1 AND 300),
  CHECK (char_length(body) <= 100000),
  CHECK (action_url IS NULL OR (action_url LIKE '/%' AND action_url NOT LIKE '//%'))
);
CREATE INDEX search_documents_vector_idx ON platform.search_documents USING gin (search_vector);
CREATE INDEX search_documents_scope_idx ON platform.search_documents
  (organization_id, entity_type, project_id, indexed_at DESC) WHERE deleted_at IS NULL;

ALTER TABLE platform.search_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.search_documents FORCE ROW LEVEL SECURITY;
CREATE POLICY search_documents_select ON platform.search_documents FOR SELECT USING (
  organization_id = platform.current_organization_id()
  AND platform.has_permission('search.read')
  AND platform.can_search_entity(entity_type)
);
CREATE POLICY search_documents_insert ON platform.search_documents FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id() AND platform.can_index_entity(entity_type)
);
CREATE POLICY search_documents_update ON platform.search_documents FOR UPDATE USING (
  organization_id = platform.current_organization_id() AND platform.can_index_entity(entity_type)
) WITH CHECK (
  organization_id = platform.current_organization_id() AND platform.can_index_entity(entity_type)
);
