# ADR 0005: Keep billing state provider-neutral and event-driven

- **Status:** Accepted
- **Date:** 2026-08-11

## Context

Terrnix needs subscriptions, trials, invoices, VAT, discounts, proration, usage limits, upgrades, cancellation, and enterprise invoicing. Making Stripe objects canonical would couple authorization and customer history to one payment provider and complicate bank transfer or negotiated enterprise contracts. Provider webhooks are duplicated, delayed, and may arrive out of order.

## Decision

Terrnix stores canonical commercial state and maps external products/prices explicitly. Signed provider events enter an idempotent inbox as minimized canonical payloads. Subscription, invoice, payment, discount, and lifecycle records use Terrnix identifiers plus unique provider references.

Only a dedicated narrowly granted billing role can write provider-synchronized state. Tenant sessions can read billing records according to RBAC but cannot self-upgrade by changing subscription rows. Product consumption enters an immutable idempotent usage ledger governed by the same feature catalog used for authorization.

Raw provider payloads are not retained in the platform database. Their SHA-256 digest proves event identity while reducing unnecessary payment/customer data storage.

## Consequences

- Stripe, PayPal, bank transfer, and enterprise invoices can share product rules and history.
- Webhook retries are safe and conflicting event identities are detectable.
- Price mapping must exist before a provider can grant a plan.
- Operational reconciliation and event-version compatibility become explicit responsibilities.
- Payment activation remains blocked on commercial, tax, legal, credential, and deployment approvals.

## Rollback

Disable provider webhook routes and stop billing synchronization. Existing subscription and entitlement state remains readable. Never delete invoice, payment, usage, or lifecycle history as a rollback; corrections use compensating provider events or reviewed forward migrations.
