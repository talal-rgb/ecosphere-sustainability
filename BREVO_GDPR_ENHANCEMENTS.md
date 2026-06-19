# Brevo GDPR Enhancements — Backlog Item

**Status:** 📋 Backlog  
**Priority:** Medium  
**Created:** 2026-06-19  
**Depends on:** PR #30 deployed and verified  

---

## Context

PR #30 implements basic Brevo newsletter integration with `updateEnabled: true`. This silently handles duplicate emails by updating existing contacts. The current behavior is **acceptable for launch** but lacks GDPR compliance features.

---

## Required Enhancements

### 1. Unsubscribed Contact Handling

**Problem:** If a contact unsubscribed and later re-submits their email, Brevo's `updateEnabled: true` may update their attributes but not re-add them to the list if they have an `unsubscribed` status.

**Solution:**
- Before `POST /v3/contacts`, check contact status via `GET /v3/contacts/{email}`
- If status is `unsubscribed`, require explicit re-consent (e.g., checkbox: "I want to resubscribe")
- Log re-subscription attempts for audit trail

**API Call:**
```
GET https://api.brevo.com/v3/contacts/{email}
```

**Fields to check:**
- `emailBlacklisted`
- `smsBlacklisted`
- `listUnsubscribed`

---

### 2. Re-submission Tracking

**Problem:** We cannot distinguish between a new signup and an existing contact update.

**Solution:**
- Add `RESUBMISSION_COUNT` attribute that increments on each signup
- Add `FIRST_SIGNUP_DATE` attribute (immutable)
- Add `LAST_SIGNUP_DATE` attribute (updated each time)
- Log in leadStore whether contact was new or updated

**Attributes to add:**
```javascript
attributes: {
  SOURCE: 'terrnix-website',
  SIGNUP_DATE: new Date().toISOString(),
  FIRST_SIGNUP_DATE: existing ? null : new Date().toISOString(),
  LAST_SIGNUP_DATE: new Date().toISOString(),
  RESUBMISSION_COUNT: (existing?.attributes?.RESUBMISSION_COUNT || 0) + 1
}
```

---

### 3. smtpBlacklistStatus Check

**Problem:** Contacts with `smtpBlacklistStatus = true` should not receive emails. Sending to them damages sender reputation.

**Solution:**
- Check `smtpBlacklistStatus` before adding to list
- If blacklisted, save lead but skip Brevo sync
- Alert admin of blacklisted submission attempt
- Consider adding to suppression list

**Field:**
- `smtpBlacklistStatus` (boolean) — returned by Brevo contact API

---

### 4. Consent Timestamp

**Problem:** GDPR requires proof of when and how consent was obtained.

**Solution:**
- Add `CONSENT_TIMESTAMP` attribute with ISO 8601 timestamp
- Add `CONSENT_SOURCE` attribute (e.g., "terrnix-homepage-footer")
- Add `CONSENT_IP` attribute (hashed/anonymized)
- Store consent record in leadStore as audit trail

**Attributes:**
```javascript
attributes: {
  CONSENT_TIMESTAMP: new Date().toISOString(),
  CONSENT_SOURCE: source || 'terrnix-website',
  CONSENT_IP_HASH: hashIp(req.ip) // SHA-256 truncated
}
```

---

### 5. Double Opt-In Review

**Problem:** Current flow is single opt-in (subscribe immediately). GDPR recommends double opt-in for EU subscribers.

**Solution options:**

**Option A: Brevo-native double opt-in**
- Configure double opt-in template in Brevo dashboard
- Use Brevo's `DOUBLE_OPT_IN` flow instead of direct list add
- Requires Brevo template setup

**Option B: Custom double opt-in**
- On signup, save as `PENDING` status in leadStore
- Send confirmation email with unique token
- On confirmation click, update Brevo and mark `CONFIRMED`
- Auto-expire pending subscriptions after 7 days

**Decision needed:**
- [ ] Use Brevo-native double opt-in
- [ ] Build custom double opt-in
- [ ] Keep single opt-in (document risk)

---

## Implementation Notes

### Files to modify
- `backend/services/brevo.js` — Add status checks, enhanced attributes
- `backend/services/leadStore.js` — Add consent tracking fields
- `backend/server.js` — Pass consent source/IP to Brevo service
- `contact/index.html` — Add consent checkbox if required
- `index.html` — Add consent checkbox if required

### New env vars needed
```
BREVO_DOUBLE_OPT_IN_TEMPLATE_ID=  # Optional, for native flow
CONSENT_REQUIRED=true             # Feature flag
```

### Compliance checklist
- [ ] Unsubscribed contacts cannot be re-added without explicit consent
- [ ] Blacklisted contacts are flagged, not emailed
- [ ] Every signup has a consent timestamp and source
- [ ] Re-submissions are tracked separately from new signups
- [ ] Double opt-in is implemented or risk is documented
- [ ] GDPR Article 7 (conditions for consent) is met
- [ ] GDPR Article 17 (right to erasure) process exists

---

## Acceptance Criteria

1. Contact with `unsubscribed` status who re-submits gets a clear message: "You were previously unsubscribed. Please check your email to confirm re-subscription."
2. Blacklisted contact submissions are saved to leadStore but not synced to Brevo
3. Every Brevo contact has `CONSENT_TIMESTAMP`, `CONSENT_SOURCE`, `FIRST_SIGNUP_DATE`, `LAST_SIGNUP_DATE`, `RESUBMISSION_COUNT`
4. Admin can see consent audit trail via `/api/admin/lead-stats` or new endpoint
5. Double opt-in decision is documented and implemented or risk-accepted

---

## Related
- PR #30 — Brevo basic integration
- `backend/services/brevo.js`
- `backend/services/leadStore.js`
- Brevo API docs: https://developers.brevo.com/
