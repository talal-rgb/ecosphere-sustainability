# Terrnix Commercial Billing Architecture

## Boundary

Terrnix owns the canonical plan, entitlement, subscription, usage, invoice, payment, discount, and lifecycle records. Payment providers execute payment operations and send signed events; provider product IDs never become Terrnix plan IDs.

The architecture supports Stripe first and preserves provider values for PayPal, bank transfer, and enterprise invoicing. Live checkout, payment-method collection, upgrades, downgrades, cancellation, and refunds are intentionally not exposed until prices, VAT/tax behavior, legal terms, privacy processing, support commitments, and production deployment are approved.

## Commercial catalog

`feature_definitions` is the canonical vocabulary for boolean capabilities, limits, tiers, units, aggregation, and reset periods. `plan_features` assigns the Free, Starter, Professional, Business, and Enterprise values. `billing_prices` maps a provider price and interval to a Terrnix plan with currency and tax behavior.

Initial storage, API, organization, document, and support-tier values are architecture defaults and require commercial approval before publication or billing activation.

## Trusted synchronization

Stripe posts the raw body to `POST /api/billing/stripe/webhook`. Terrnix verifies the `Stripe-Signature` before mapping the event to a minimized canonical payload. The inbox stores the raw-body SHA-256 and canonical fields, not the full provider payload.

The `(provider, provider_event_ref)` key makes delivery idempotent. Reusing an event ID with a different digest is rejected. Failed processing retains a sanitized error code and can be retried; processed and intentionally ignored events return success without duplicating state.

Subscription events resolve the organization from Terrnix-controlled metadata or an existing customer/subscription reference, then require an active provider-price mapping before changing the plan. Every accepted transition records previous/new canonical state. Invoice and payment updates are provider-ref idempotent.

## Usage ledger

Product modules record immutable usage events with an organization, feature, positive quantity, occurrence time, source, and idempotency key. A transaction-scoped feature lock prevents concurrent limit overspend. Reset periods are defined centrally.

Evidence finalization currently records:

- one `document_uploads.monthly` event per finalized version;
- retained bytes against `storage.bytes`.

The customer portal can read subscription status, discounts, recent lifecycle events, invoice amounts/tax, external provider invoice links, and metered usage. It cannot change provider state.

## Tax, discounts, and enterprise payment

Billing accounts support legal entity, billing email/address, tax IDs, tax-exempt/reverse-charge status, preferred provider, currency, and purchase-order requirements. Invoices preserve subtotal, discount, tax, total, paid, and due amounts. Discounts support provider coupon/promotion references and either percentage or fixed-amount benefits.

Enterprise invoicing and bank transfer use the same canonical subscription/invoice/payment tables but require an approved internal operations workflow, payment reconciliation, dunning rules, and accounting integration.

## Activation gates

- approved plan prices, included usage, overage policy, trials, coupons, refunds, proration, and cancellation terms;
- VAT registration/tax-engine decision and invoice legal requirements;
- Stripe account, restricted keys, webhook secret, event allowlist, and live-mode test plan;
- privacy/DPA review for provider data;
- billing support, dunning, reconciliation, incident, and rollback runbooks;
- explicit database migration and production deployment approval.
