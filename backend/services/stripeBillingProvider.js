import Stripe from 'stripe';

export function createStripeBillingProvider(environment = process.env) {
  const secretKey = requiredSecret(environment.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
  const webhookSecret = requiredSecret(environment.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');
  const stripe = new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 10_000, telemetry: false });
  return {
    name: 'stripe',
    verifyAndMapWebhook(rawBody, signature) {
      if (!signature) throw providerError('stripe_signature_missing', 400, 'Stripe signature is required.');
      let event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch {
        throw providerError('stripe_signature_invalid', 400, 'Stripe webhook signature is invalid.');
      }
      return mapStripeEvent(event);
    }
  };
}

export function mapStripeEvent(event) {
  const object = event.data?.object || {};
  const base = {
    provider: 'stripe', providerEventRef: event.id, eventType: event.type,
    apiVersion: event.api_version || null, livemode: event.livemode === true,
    occurredAt: fromUnix(event.created), organizationId: object.metadata?.terrnix_organization_id || null
  };
  if (event.type.startsWith('customer.subscription.')) {
    const item = object.items?.data?.[0];
    return { ...base, kind: 'subscription', customerRef: ref(object.customer), subscriptionRef: object.id,
      priceRef: item?.price?.id || null, status: object.status, billingInterval: item?.price?.recurring?.interval || null,
      cancelAtPeriodEnd: object.cancel_at_period_end === true, trialEndsAt: fromUnix(object.trial_end),
      currentPeriodStartsAt: fromUnix(item?.current_period_start || object.current_period_start),
      currentPeriodEndsAt: fromUnix(item?.current_period_end || object.current_period_end) };
  }
  if (event.type.startsWith('invoice.')) {
    return { ...base, kind: 'invoice', customerRef: ref(object.customer), subscriptionRef: ref(object.subscription),
      invoiceRef: object.id, invoiceNumber: object.number || null, status: object.status,
      currency: upperCurrency(object.currency), subtotalMinor: object.subtotal || 0,
      discountMinor: object.total_discount_amounts?.reduce((total, item) => total + Number(item.amount || 0), 0) || 0,
      taxMinor: object.total_taxes?.reduce((total, item) => total + Number(item.amount || 0), 0) || 0,
      totalMinor: object.total || 0, amountPaidMinor: object.amount_paid || 0, amountDueMinor: object.amount_due || 0,
      periodStartsAt: fromUnix(object.period_start), periodEndsAt: fromUnix(object.period_end),
      dueAt: fromUnix(object.due_date), paidAt: fromUnix(object.status_transitions?.paid_at),
      hostedInvoiceUrl: object.hosted_invoice_url || null, invoicePdfUrl: object.invoice_pdf || null };
  }
  if (event.type.startsWith('payment_intent.')) {
    return { ...base, kind: 'payment', customerRef: ref(object.customer), paymentRef: object.id,
      invoiceRef: ref(object.invoice), status: mapPaymentStatus(object.status), amountMinor: object.amount_received || object.amount || 0,
      currency: upperCurrency(object.currency), failureCode: object.last_payment_error?.code || null,
      paidAt: object.status === 'succeeded' ? fromUnix(event.created) : null };
  }
  return { ...base, kind: 'ignored' };
}

function ref(value) { return typeof value === 'string' ? value : value?.id || null; }
function fromUnix(value) { return Number.isFinite(Number(value)) && Number(value) > 0 ? new Date(Number(value) * 1000) : null; }
function upperCurrency(value) { return String(value || 'eur').toUpperCase(); }
function mapPaymentStatus(status) {
  if (status === 'succeeded') return 'succeeded';
  if (status === 'canceled') return 'cancelled';
  if (status === 'requires_payment_method') return 'failed';
  return 'pending';
}
function requiredSecret(value, name) {
  if (!value || String(value).includes('REPLACE_WITH')) throw providerError('stripe_not_configured', 503, `${name} is not configured.`);
  return value;
}
function providerError(code, status, message) {
  const error = new Error(message); error.code = code; error.status = status; return error;
}
