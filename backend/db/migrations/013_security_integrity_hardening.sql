-- Make member-directory reads match the permission model without weakening the
-- tenant boundary, and prevent administrators from granting roles at or above
-- their own rank.
CREATE OR REPLACE FUNCTION platform.can_manage_membership(target_role_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = platform, pg_temp
AS $$
  SELECT platform.has_permission('member.manage')
    AND EXISTS (
      SELECT 1
      FROM organization_memberships actor_membership
      JOIN role_definitions actor_role ON actor_role.code = actor_membership.role_code
      JOIN role_definitions target_role ON target_role.code = target_role_code
      WHERE actor_membership.organization_id = platform.current_organization_id()
        AND actor_membership.user_id = platform.current_user_id()
        AND actor_membership.status = 'active'
        AND actor_role.rank > target_role.rank
    )
$$;

DROP POLICY memberships_insert ON platform.organization_memberships;
DROP POLICY memberships_update ON platform.organization_memberships;
DROP POLICY memberships_delete ON platform.organization_memberships;

CREATE POLICY memberships_directory_select ON platform.organization_memberships FOR SELECT USING (
  organization_id = platform.current_organization_id()
  AND platform.has_permission('member.read')
);
CREATE POLICY memberships_insert ON platform.organization_memberships FOR INSERT WITH CHECK (
  organization_id = platform.current_organization_id()
  AND invited_by = platform.current_user_id()
  AND platform.can_manage_membership(role_code)
);
CREATE POLICY memberships_update ON platform.organization_memberships FOR UPDATE USING (
  organization_id = platform.current_organization_id()
  AND platform.can_manage_membership(role_code)
) WITH CHECK (
  organization_id = platform.current_organization_id()
  AND platform.can_manage_membership(role_code)
);
CREATE POLICY memberships_delete ON platform.organization_memberships FOR DELETE USING (
  organization_id = platform.current_organization_id()
  AND platform.can_manage_membership(role_code)
);

CREATE POLICY app_users_member_directory_select ON platform.app_users FOR SELECT USING (
  id = platform.current_user_id()
  OR (
    platform.has_permission('member.read')
    AND EXISTS (
      SELECT 1
      FROM platform.organization_memberships membership
      WHERE membership.organization_id = platform.current_organization_id()
        AND membership.user_id = platform.app_users.id
    )
  )
);

-- Billing workers bypass tenant RLS by design, so tenant consistency must also
-- be enforced structurally by composite foreign keys.
ALTER TABLE platform.subscriptions
  ADD CONSTRAINT subscriptions_organization_id_id_key UNIQUE (organization_id, id);

ALTER TABLE platform.billing_invoices
  DROP CONSTRAINT billing_invoices_subscription_id_fkey,
  ADD CONSTRAINT billing_invoices_subscription_tenant_fk
    FOREIGN KEY (organization_id, subscription_id)
    REFERENCES platform.subscriptions(organization_id, id) ON DELETE RESTRICT;

ALTER TABLE platform.billing_payments
  DROP CONSTRAINT billing_payments_invoice_id_fkey,
  ADD CONSTRAINT billing_payments_invoice_tenant_fk
    FOREIGN KEY (organization_id, invoice_id)
    REFERENCES platform.billing_invoices(organization_id, id) ON DELETE RESTRICT;

ALTER TABLE platform.billing_subscription_history
  DROP CONSTRAINT billing_subscription_history_subscription_id_fkey,
  ADD CONSTRAINT billing_subscription_history_subscription_tenant_fk
    FOREIGN KEY (organization_id, subscription_id)
    REFERENCES platform.subscriptions(organization_id, id) ON DELETE RESTRICT;
