# Notification and Customer-Success Service

Terrnix products publish domain events into one tenant-aware notification service. The service turns approved events into personal in-app notifications and, where the user has opted in, durable delivery jobs. Product modules must not send email or push messages directly.

## Current contract

- Nine reusable categories cover evidence, deadlines, regulation, training, recommendations, risk, billing, system, and support.
- Event idempotency prevents retries from creating duplicate notifications.
- Recipients must be active organization members. Cross-user publishing requires `notification.manage`.
- In-app messages are enabled by default; email and push are opt-in and default off.
- Preferences include digest cadence, timezone, and optional quiet hours.
- Feed reads, read state, archival, and preferences are restricted to the current user by row-level security.
- External channel work is written transactionally to a delivery outbox. No request handler sends external messages.

## Product integration

Call `publishNotificationEvent` after the product transaction has reached a durable state. Supply a stable idempotency key derived from the domain event, not from a request timestamp. Examples include `evidence:<document>:missing:<period>`, `deadline:<report>:seven-days`, and `subscription:<id>:renewal-warning`.

## Activation boundary

Email, push, webhook workers, templates, unsubscribe links, and escalation policies remain inactive until channel credentials, privacy/consent rules, deliverability configuration, and production deployment are approved. Workers must lease outbox records, retry with bounded backoff, record safe error codes, and never persist provider credentials or message bodies in logs.
