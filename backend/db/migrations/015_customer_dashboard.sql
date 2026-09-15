CREATE FUNCTION platform.list_current_user_organizations()
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_slug text,
  role_code text,
  plan_code text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, platform
AS $$
  SELECT organization.id, organization.name, organization.slug,
         membership.role_code, subscription.plan_code
    FROM platform.organization_memberships membership
    JOIN platform.organizations organization ON organization.id = membership.organization_id
    LEFT JOIN platform.subscriptions subscription ON subscription.organization_id = organization.id
   WHERE membership.user_id = platform.current_user_id()
     AND membership.status = 'active'
     AND organization.status = 'active'
   ORDER BY organization.name, organization.id
$$;

REVOKE ALL ON FUNCTION platform.list_current_user_organizations() FROM PUBLIC;
