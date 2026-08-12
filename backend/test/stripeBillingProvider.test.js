import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';

import { createStripeBillingProvider, mapStripeEvent } from '../services/stripeBillingProvider.js';

test('Stripe adapter maps subscription and invoice events without retaining raw provider payloads', () => {
  const subscription = mapStripeEvent({
    id: 'evt_1', type: 'customer.subscription.updated', created: 1786400000,
    livemode: false, api_version: '2026-08-01',
    data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: false,
      metadata: { terrnix_organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
      items: { data: [{ price: { id: 'price_1', recurring: { interval: 'month' } }, current_period_start: 1786400000, current_period_end: 1789000000 }] } } }
  });
  assert.equal(subscription.kind, 'subscription');
  assert.equal(subscription.priceRef, 'price_1');
  assert.equal(subscription.billingInterval, 'month');

  const invoice = mapStripeEvent({
    id: 'evt_2', type: 'invoice.paid', created: 1786400000, livemode: true,
    data: { object: { id: 'in_1', customer: 'cus_1', status: 'paid', currency: 'eur',
      subtotal: 1000, total: 1200, amount_paid: 1200, amount_due: 0,
      total_taxes: [{ amount: 200 }], total_discount_amounts: [] } }
  });
  assert.equal(invoice.currency, 'EUR');
  assert.equal(invoice.taxMinor, 200);
});

test('Stripe adapter remains disabled without both secret and webhook credentials', () => {
  assert.throws(() => createStripeBillingProvider({}), (error) => error.code === 'stripe_not_configured');
});

test('Stripe adapter verifies the raw signed body before mapping', () => {
  const payload = JSON.stringify({
    id: 'evt_signed', type: 'payment_intent.succeeded', created: 1786400000, livemode: false,
    data: { object: { id: 'pi_1', customer: 'cus_1', status: 'succeeded', amount: 1200, amount_received: 1200, currency: 'eur' } }
  });
  const secret = 'whsec_test_secret';
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  const provider = createStripeBillingProvider({ STRIPE_SECRET_KEY: 'sk_test_placeholder', STRIPE_WEBHOOK_SECRET: secret });
  const event = provider.verifyAndMapWebhook(Buffer.from(payload), signature);
  assert.equal(event.kind, 'payment');
  assert.equal(event.status, 'succeeded');
  assert.throws(() => provider.verifyAndMapWebhook(Buffer.from(`${payload} `), signature), (error) => error.code === 'stripe_signature_invalid');
});
