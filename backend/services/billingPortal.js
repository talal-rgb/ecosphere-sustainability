import { withPlatformContext } from './database.js';
import { requirePermission } from './platformService.js';
import { getUsageSnapshot } from './usageMetering.js';

export async function getBillingOverview(databasePool, context) {
  const core = await withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'billing.read');
    const subscription = await client.query('SELECT * FROM platform.subscriptions WHERE organization_id = $1', [context.organizationId]);
    const account = await client.query('SELECT * FROM platform.billing_accounts WHERE organization_id = $1', [context.organizationId]);
    const discounts = await client.query("SELECT name, percent_off, amount_off_minor, currency, status, starts_at, ends_at FROM platform.billing_discounts WHERE organization_id = $1 AND status = 'active' ORDER BY created_at DESC", [context.organizationId]);
    const history = await client.query('SELECT change_type, previous_state, new_state, effective_at, recorded_at FROM platform.billing_subscription_history WHERE organization_id = $1 ORDER BY effective_at DESC, id DESC LIMIT 20', [context.organizationId]);
    const row = subscription.rows[0];
    const billingAccount = account.rows[0];
    return {
      subscription: row ? { planCode: row.plan_code, provider: row.provider, status: row.status,
        billingInterval: row.billing_interval, trialEndsAt: row.trial_ends_at,
        currentPeriodStartsAt: row.current_period_starts_at, currentPeriodEndsAt: row.current_period_ends_at,
        cancelAtPeriodEnd: row.cancel_at_period_end } : null,
      account: billingAccount ? { legalName: billingAccount.legal_name, billingEmail: billingAccount.billing_email,
        billingAddress: billingAccount.billing_address, taxIds: billingAccount.tax_ids,
        taxExempt: billingAccount.tax_exempt, currency: billingAccount.currency,
        preferredProvider: billingAccount.preferred_provider, purchaseOrderRequired: billingAccount.purchase_order_required } : null,
      discounts: discounts.rows.map((item) => ({ name: item.name, percentOff: item.percent_off === null ? null : Number(item.percent_off),
        amountOffMinor: item.amount_off_minor === null ? null : Number(item.amount_off_minor), currency: item.currency,
        status: item.status, startsAt: item.starts_at, endsAt: item.ends_at })),
      history: history.rows.map((item) => ({ changeType: item.change_type, previousState: item.previous_state,
        newState: item.new_state, effectiveAt: item.effective_at, recordedAt: item.recorded_at }))
    };
  });
  return { ...core, usage: await getUsageSnapshot(databasePool, context) };
}

export async function listBillingInvoices(databasePool, context, options = {}) {
  const page = Number(options.page ?? 1); const pageSize = Number(options.pageSize ?? 25);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw validationError('Invalid pagination.');
  return withPlatformContext(databasePool, context, async (client) => {
    await requirePermission(client, 'billing.read');
    const count = await client.query('SELECT count(*)::integer AS total FROM platform.billing_invoices WHERE organization_id = $1', [context.organizationId]);
    const rows = await client.query(
      `SELECT id, invoice_number, status, currency, subtotal_minor, discount_minor, tax_minor,
              total_minor, amount_paid_minor, amount_due_minor, period_starts_at, period_ends_at,
              due_at, paid_at, hosted_invoice_url, invoice_pdf_url, created_at
       FROM platform.billing_invoices WHERE organization_id = $1
       ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
      [context.organizationId, pageSize, (page - 1) * pageSize]
    );
    return { items: rows.rows.map(invoiceResource), pagination: { page, pageSize, total: count.rows[0].total, totalPages: Math.ceil(count.rows[0].total / pageSize) } };
  });
}
function invoiceResource(row) { return { id: row.id, number: row.invoice_number, status: row.status, currency: row.currency,
  subtotalMinor: Number(row.subtotal_minor), discountMinor: Number(row.discount_minor), taxMinor: Number(row.tax_minor),
  totalMinor: Number(row.total_minor), amountPaidMinor: Number(row.amount_paid_minor), amountDueMinor: Number(row.amount_due_minor),
  periodStartsAt: row.period_starts_at, periodEndsAt: row.period_ends_at, dueAt: row.due_at, paidAt: row.paid_at,
  hostedInvoiceUrl: row.hosted_invoice_url, invoicePdfUrl: row.invoice_pdf_url, createdAt: row.created_at }; }
function validationError(message) { const error = new Error(message); error.code = 'validation_error'; error.status = 400; return error; }
