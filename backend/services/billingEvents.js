const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function ingestBillingEvent(databasePool, event, payloadSha256) {
  validateEvent(event, payloadSha256);
  const registration = await withTransaction(databasePool, async (client) => {
    const inserted = await client.query(
      `INSERT INTO platform.billing_event_inbox (
         provider, provider_event_ref, event_type, api_version, livemode, organization_id,
         payload_sha256, canonical_payload, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'received')
       ON CONFLICT (provider, provider_event_ref) DO NOTHING RETURNING id`,
      [event.provider, event.providerEventRef, event.eventType, event.apiVersion, event.livemode,
        validOrganizationId(event.organizationId), payloadSha256, event]
    );
    if (inserted.rows[0]) return { id: inserted.rows[0].id, duplicate: false };
    const existing = await client.query(
      'SELECT id, payload_sha256, status FROM platform.billing_event_inbox WHERE provider = $1 AND provider_event_ref = $2 FOR UPDATE',
      [event.provider, event.providerEventRef]
    );
    if (existing.rows[0].payload_sha256 !== payloadSha256) throw domainError('billing_event_digest_mismatch', 409, 'Provider event identity was reused with different content.');
    return { id: existing.rows[0].id, duplicate: existing.rows[0].status === 'processed' || existing.rows[0].status === 'ignored' };
  });
  if (registration.duplicate) return { eventId: registration.id, status: 'duplicate' };

  try {
    return await withTransaction(databasePool, async (client) => {
      const inbox = await client.query('SELECT * FROM platform.billing_event_inbox WHERE id = $1 FOR UPDATE', [registration.id]);
      if (['processed', 'ignored'].includes(inbox.rows[0].status)) return { eventId: registration.id, status: 'duplicate' };
      await client.query("UPDATE platform.billing_event_inbox SET status = 'processing', attempt_count = attempt_count + 1, error_code = NULL WHERE id = $1", [registration.id]);
      const organizationId = await resolveOrganization(client, event);
      if (event.kind === 'ignored' || !organizationId) {
        await client.query("UPDATE platform.billing_event_inbox SET status = 'ignored', organization_id = $1, processed_at = now() WHERE id = $2", [organizationId, registration.id]);
        return { eventId: registration.id, status: 'ignored' };
      }
      if (event.kind === 'subscription') await syncSubscription(client, organizationId, event);
      if (event.kind === 'invoice') await syncInvoice(client, organizationId, event);
      if (event.kind === 'payment') await syncPayment(client, organizationId, event);
      await client.query("UPDATE platform.billing_event_inbox SET status = 'processed', organization_id = $1, processed_at = now() WHERE id = $2", [organizationId, registration.id]);
      return { eventId: registration.id, organizationId, status: 'processed' };
    });
  } catch (error) {
    await withTransaction(databasePool, (client) => client.query(
      "UPDATE platform.billing_event_inbox SET status = 'failed', error_code = $1 WHERE id = $2",
      [safeErrorCode(error), registration.id]
    )).catch(() => {});
    throw error;
  }
}

async function resolveOrganization(client, event) {
  const explicit = validOrganizationId(event.organizationId);
  if (explicit) {
    const exists = await client.query('SELECT id FROM platform.organizations WHERE id = $1', [explicit]);
    if (exists.rows[0]) return explicit;
  }
  const result = await client.query(
    `SELECT organization_id FROM platform.subscriptions
     WHERE provider = $1 AND (
       ($2::text IS NOT NULL AND provider_subscription_ref = $2)
       OR ($3::text IS NOT NULL AND provider_customer_ref = $3)
     ) LIMIT 1`,
    [event.provider, event.subscriptionRef || null, event.customerRef || null]
  );
  return result.rows[0]?.organization_id || null;
}

async function syncSubscription(client, organizationId, event) {
  const currentResult = await client.query('SELECT * FROM platform.subscriptions WHERE organization_id = $1 FOR UPDATE', [organizationId]);
  const current = currentResult.rows[0];
  if (!current) throw domainError('subscription_not_found', 422, 'Organization subscription was not found.');
  let planCode = current.plan_code;
  if (event.priceRef) {
    const price = await client.query(
      'SELECT plan_code FROM platform.billing_prices WHERE provider = $1 AND provider_price_ref = $2 AND is_active = true',
      [event.provider, event.priceRef]
    );
    if (!price.rows[0]) throw domainError('billing_price_unmapped', 422, 'Provider price is not mapped to a Terrnix plan.');
    planCode = price.rows[0].plan_code;
  }
  const status = subscriptionStatus(event.status);
  const interval = event.billingInterval === 'year' ? 'annual' : event.billingInterval === 'month' ? 'monthly' : current.billing_interval;
  const updated = await client.query(
    `UPDATE platform.subscriptions SET
       plan_code = $1, provider = $2, provider_customer_ref = $3,
       provider_subscription_ref = $4, status = $5, billing_interval = $6,
       trial_ends_at = $7, current_period_starts_at = $8, current_period_ends_at = $9,
       cancel_at_period_end = $10
     WHERE organization_id = $11 RETURNING *`,
    [planCode, event.provider, event.customerRef, event.subscriptionRef, status, interval,
      event.trialEndsAt, event.currentPeriodStartsAt, event.currentPeriodEndsAt,
      event.cancelAtPeriodEnd, organizationId]
  );
  const next = updated.rows[0];
  await client.query(
    `INSERT INTO platform.billing_subscription_history (
       organization_id, subscription_id, provider, provider_event_ref, change_type,
       previous_state, new_state, effective_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (provider, provider_event_ref, change_type) DO NOTHING`,
    [organizationId, next.id, event.provider, event.providerEventRef,
      subscriptionChange(current, next, event.eventType), subscriptionSnapshot(current), subscriptionSnapshot(next), event.occurredAt || new Date()]
  );
}

async function syncInvoice(client, organizationId, event) {
  const subscription = await client.query('SELECT id FROM platform.subscriptions WHERE organization_id = $1', [organizationId]);
  await client.query(
    `INSERT INTO platform.billing_invoices (
       organization_id, subscription_id, provider, provider_invoice_ref, invoice_number, status,
       currency, subtotal_minor, discount_minor, tax_minor, total_minor, amount_paid_minor,
       amount_due_minor, period_starts_at, period_ends_at, due_at, paid_at,
       hosted_invoice_url, invoice_pdf_url
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     ON CONFLICT (provider, provider_invoice_ref) DO UPDATE SET
       status = EXCLUDED.status, invoice_number = EXCLUDED.invoice_number,
       subtotal_minor = EXCLUDED.subtotal_minor, discount_minor = EXCLUDED.discount_minor,
       tax_minor = EXCLUDED.tax_minor, total_minor = EXCLUDED.total_minor,
       amount_paid_minor = EXCLUDED.amount_paid_minor, amount_due_minor = EXCLUDED.amount_due_minor,
       due_at = EXCLUDED.due_at, paid_at = EXCLUDED.paid_at,
       hosted_invoice_url = EXCLUDED.hosted_invoice_url, invoice_pdf_url = EXCLUDED.invoice_pdf_url`,
    [organizationId, subscription.rows[0]?.id || null, event.provider, event.invoiceRef, event.invoiceNumber,
      invoiceStatus(event.status), event.currency, event.subtotalMinor, event.discountMinor, event.taxMinor,
      event.totalMinor, event.amountPaidMinor, event.amountDueMinor, event.periodStartsAt,
      event.periodEndsAt, event.dueAt, event.paidAt, event.hostedInvoiceUrl, event.invoicePdfUrl]
  );
}

async function syncPayment(client, organizationId, event) {
  const invoice = event.invoiceRef
    ? await client.query('SELECT id FROM platform.billing_invoices WHERE provider = $1 AND provider_invoice_ref = $2', [event.provider, event.invoiceRef])
    : { rows: [] };
  await client.query(
    `INSERT INTO platform.billing_payments (
       organization_id, invoice_id, provider, provider_payment_ref, status,
       amount_minor, currency, failure_code, paid_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (provider, provider_payment_ref) DO UPDATE SET
       invoice_id = EXCLUDED.invoice_id, status = EXCLUDED.status,
       amount_minor = EXCLUDED.amount_minor, failure_code = EXCLUDED.failure_code, paid_at = EXCLUDED.paid_at`,
    [organizationId, invoice.rows[0]?.id || null, event.provider, event.paymentRef, event.status,
      event.amountMinor, event.currency, event.failureCode, event.paidAt]
  );
}

function subscriptionStatus(status) {
  return ({ trialing: 'trialing', active: 'active', past_due: 'past_due', paused: 'paused', canceled: 'cancelled', incomplete: 'incomplete', incomplete_expired: 'cancelled', unpaid: 'past_due' })[status] || 'incomplete';
}
function invoiceStatus(status) { return ['draft', 'open', 'paid', 'void', 'uncollectible'].includes(status) ? status : 'draft'; }
function subscriptionChange(previous, next, eventType) {
  if (eventType.endsWith('.deleted')) return 'cancelled';
  if (next.cancel_at_period_end && !previous.cancel_at_period_end) return 'scheduled_cancel';
  if (previous.status !== next.status) return ({ trialing: 'trial_started', active: previous.status === 'past_due' ? 'payment_recovered' : 'activated', past_due: 'past_due', paused: 'paused', cancelled: 'cancelled' })[next.status] || 'created';
  if (previous.plan_code !== next.plan_code) return planRank(next.plan_code) > planRank(previous.plan_code) ? 'upgraded' : 'downgraded';
  return 'renewed';
}
function planRank(code) { return ({ free: 0, starter: 1, professional: 2, business: 3, enterprise: 4 })[code] ?? -1; }
function subscriptionSnapshot(row) { return { planCode: row.plan_code, status: row.status, billingInterval: row.billing_interval, currentPeriodEndsAt: row.current_period_ends_at, cancelAtPeriodEnd: row.cancel_at_period_end }; }
function validOrganizationId(value) { return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null; }
function validateEvent(event, digest) {
  if (!event || typeof event !== 'object' || !event.provider || !event.providerEventRef || !event.eventType) throw domainError('invalid_billing_event', 400, 'Billing event is invalid.');
  if (!/^[a-f0-9]{64}$/.test(digest || '')) throw domainError('invalid_billing_event_digest', 400, 'Billing event digest is invalid.');
}
function safeErrorCode(error) { const code = String(error?.code || 'billing_processing_failed').toLowerCase(); return /^[a-z0-9._-]{1,100}$/.test(code) ? code : 'billing_processing_failed'; }
async function withTransaction(pool, operation) { const client = await pool.connect(); try { await client.query('BEGIN'); const result = await operation(client); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; } finally { client.release(); } }
function domainError(code, status, message) { const error = new Error(message); error.code = code; error.status = status; return error; }
