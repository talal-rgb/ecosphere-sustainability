import pg from 'pg';

const { Pool } = pg;
const migrationUrl = requiredStagingUrl(process.env.MIGRATION_DATABASE_URL);
const kind = process.env.TARGET_ROLE_KIND;
const roles = {
  application: 'terrnix_app_staging',
  documentWorker: 'terrnix_document_worker_staging',
  billing: 'terrnix_billing_staging',
  reportWorker: 'terrnix_report_worker_staging'
};
if (!(kind in roles)) {
  throw new Error(`TARGET_ROLE_KIND must be one of: ${Object.keys(roles).join(', ')}.`);
}
const roleName = process.env.TARGET_DATABASE_ROLE || roles[kind];
if (roleName !== roles[kind]) {
  throw new Error(`TARGET_DATABASE_ROLE must be ${roles[kind]} for ${kind}.`);
}
const role = quoteIdentifier(roleName);
const pool = new Pool({
  connectionString: migrationUrl.toString(),
  max: 1,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 30_000,
  ssl: process.env.STAGING_DATABASE_SSL === 'disable' ? undefined : { rejectUnauthorized: true },
  application_name: 'terrnix-staging-role-grant'
});

try {
  const identity = await pool.query(
    `SELECT current_database() AS database, current_user AS migration_role,
            target.rolsuper, target.rolbypassrls,
            database.datdba = target.oid AS target_owns_database
       FROM pg_database database
       JOIN pg_roles target ON target.rolname = $1
      WHERE database.datname = current_database()`,
    [roleName]
  );
  const target = identity.rows[0];
  if (!target) throw new Error(`Render-managed role does not exist: ${roleName}.`);
  if (target.rolsuper || target.target_owns_database) throw new Error('Runtime roles must not be superusers or database owners.');
  const shouldBypassRls = kind !== 'application';

  await pool.query('BEGIN');
  try {
    await pool.query(
      `ALTER ROLE ${role} NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT ${shouldBypassRls ? 'BYPASSRLS' : 'NOBYPASSRLS'}`
    );
    const memberships = await pool.query(
      `SELECT parent.rolname
         FROM pg_auth_members membership
         JOIN pg_roles member ON member.oid = membership.member
         JOIN pg_roles parent ON parent.oid = membership.roleid
        WHERE member.rolname = $1`,
      [roleName]
    );
    if (memberships.rows.length) throw new Error(`${roleName} must not inherit membership in another database role.`);
    for (const statement of revokeStatements(role)) await pool.query(statement);
    for (const statement of grantStatements(kind, role)) await pool.query(statement);
    await pool.query('COMMIT');
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    throw error;
  }
  console.log(JSON.stringify({
    ok: true,
    database: target.database,
    migrationRole: target.migration_role,
    targetRole: roleName,
    roleKind: kind,
    bypassRls: shouldBypassRls
  }, null, 2));
} finally {
  await pool.end().catch(() => {});
}

function revokeStatements(target) {
  return [
    `REVOKE ALL PRIVILEGES ON SCHEMA platform, auth FROM ${target}`,
    `REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA platform, auth FROM ${target}`,
    `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA platform, auth FROM ${target}`,
    `REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA platform, auth FROM ${target}`,
    `REVOKE CREATE ON SCHEMA public FROM ${target}`
  ];
}

function grantStatements(roleKind, target) {
  if (roleKind === 'application') {
    return [
      `GRANT USAGE ON SCHEMA platform, auth TO ${target}`,
      `GRANT SELECT ON ALL TABLES IN SCHEMA platform TO ${target}`,
      `GRANT INSERT, UPDATE, DELETE ON
        platform.app_users, platform.organizations, platform.organization_memberships,
        platform.business_units, platform.sites, platform.facilities, platform.projects,
        platform.evidence_documents, platform.evidence_versions, platform.evidence_tags,
        platform.calculations, platform.calculation_evidence, platform.reports,
        platform.report_calculations, platform.notifications, platform.ai_usage,
        platform.audit_events, platform.evidence_upload_sessions,
        platform.document_processing_jobs, platform.usage_events,
        platform.notification_preferences, platform.notification_events,
        platform.notification_delivery_outbox, platform.report_content_versions,
        platform.report_generation_jobs, platform.report_evidence,
        platform.search_documents, platform.document_field_reviews,
        platform.document_classification_reviews, platform.calculation_lineage,
        platform.carbon_inventories, platform.carbon_reporting_periods,
        platform.carbon_boundary_members, platform.carbon_activity_data,
        platform.carbon_activity_evidence, platform.carbon_emission_factors,
        platform.carbon_calculation_details,
        platform.carbon_factor_mapping_proposals,
        platform.carbon_factor_mapping_reviews,
        platform.carbon_calculation_runs,
        platform.carbon_calculation_run_activities,
        platform.report_version_calculation_runs,
        platform.report_version_calculation_details,
        platform.report_version_evidence_versions
       TO ${target}`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO ${target}`,
      `GRANT EXECUTE ON FUNCTION platform.current_organization_id() TO ${target}`,
      `GRANT EXECUTE ON FUNCTION platform.current_user_id() TO ${target}`,
      `GRANT EXECUTE ON FUNCTION platform.list_current_user_organizations() TO ${target}`,
      `GRANT EXECUTE ON FUNCTION platform.has_permission(text) TO ${target}`,
      `GRANT EXECUTE ON FUNCTION platform.can_manage_membership(text) TO ${target}`,
      `GRANT EXECUTE ON FUNCTION platform.bootstrap_organization(
        uuid, uuid, text, text, text, text, text, text, text
       ) TO ${target}`
    ];
  }
  if (roleKind === 'documentWorker') {
    return [
      `GRANT USAGE ON SCHEMA platform TO ${target}`,
      `GRANT SELECT, INSERT, UPDATE ON platform.document_processing_jobs TO ${target}`,
      `GRANT SELECT, UPDATE ON platform.evidence_versions, platform.evidence_documents TO ${target}`,
      `GRANT SELECT, INSERT ON platform.document_extraction_runs,
        platform.document_extracted_fields, platform.document_classification_proposals,
        platform.audit_events TO ${target}`
    ];
  }
  if (roleKind === 'billing') {
    return [
      `GRANT USAGE ON SCHEMA platform TO ${target}`,
      `GRANT SELECT ON platform.organizations, platform.billing_prices TO ${target}`,
      `GRANT SELECT, UPDATE ON platform.subscriptions TO ${target}`,
      `GRANT SELECT, INSERT, UPDATE ON platform.billing_event_inbox,
        platform.billing_invoices, platform.billing_payments TO ${target}`,
      `GRANT SELECT, INSERT ON platform.billing_subscription_history TO ${target}`
    ];
  }
  return [
    `GRANT USAGE ON SCHEMA platform TO ${target}`,
    `GRANT SELECT ON platform.reports, platform.report_content_versions,
      platform.report_template_definitions, platform.report_version_calculation_runs,
      platform.report_version_calculation_details, platform.report_version_evidence_versions TO ${target}`,
    `GRANT SELECT, UPDATE ON platform.report_generation_jobs TO ${target}`,
    `GRANT SELECT, INSERT ON platform.report_artifacts, platform.audit_events TO ${target}`,
    `GRANT UPDATE ON platform.reports TO ${target}`
  ];
}

function quoteIdentifier(value) {
  if (!/^[a-z][a-z0-9_]{2,62}$/.test(value || '')) throw new Error('Invalid database role name.');
  return `"${value}"`;
}

function requiredStagingUrl(value) {
  if (!value) throw new Error('MIGRATION_DATABASE_URL must be configured in a secure local or Render environment.');
  const parsed = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('MIGRATION_DATABASE_URL must be a PostgreSQL URL.');
  const database = parsed.pathname.slice(1);
  if (!database.endsWith('_staging') && database !== 'terrnix_staging') {
    throw new Error('MIGRATION_DATABASE_URL must target a staging-named database.');
  }
  return parsed;
}
