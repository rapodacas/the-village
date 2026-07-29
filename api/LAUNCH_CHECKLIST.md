# The Village — Pre-Launch Checklist (payments)

**Do not enable live payments until every ⛔ blocker is cleared.**

## ⛔ Blockers (hard gates)

- [ ] **Legal: confirm the referral-agency safe harbor.** Have a **California employment
  attorney** confirm The Village qualifies for the referral-agency exemption under
  **Bus. & Prof. Code §22300 et seq.** (the AB 5 / AB 2257 carve-out) so providers stay
  independent contractors and The Village is not the employer.
  - Key detail to confirm: the **percentage-of-wage application fee** (5%) is compatible
    with the exemption, or switch to a flat platform fee.
  - Confirm the family/provider **set their own rate** (we only suggest a range).
  - Confirm required **registry consumer disclosures** are met (see `disclosure.html`).
  - **Until sign-off:** the payment routes are locked in code behind `LEGAL_CLEARED`.
    Only set `LEGAL_CLEARED=true` in `.env` after the attorney confirms in writing.

- [ ] **Business/registry status** — confirm whether a CA Home Care Organization license
  is required for the model as operated, or the registry exemption applies.

## Setup (after legal clears)

- [ ] `npm install stripe`
- [ ] Stripe dashboard: enable **Connect** and **ACH / `us_bank_account`** payments
- [ ] Add `STRIPE_SECRET_KEY=...` to `.env`
- [ ] Set `LEGAL_CLEARED=true` in `.env` (only after written attorney sign-off)
- [ ] Restart; verify `GET /health` returns `"stripe": true`
- [ ] Test `POST /api/connect/onboard` (provider Express onboarding)
- [ ] Test `POST /api/payments/charge` with a real $1 ACH run before going live

## Notes

- Default the payment rail to **ACH** (0.8%, capped $5/charge). Cards (2.9% + 30¢) eat
  most of the 5% service fee — see `/api/economics` and the Hybrid model page.
- Stripe (not The Village) issues the provider's 1099-K, reinforcing IC status.
- Funds route directly to the provider via destination charges; the platform only ever
  receives its application fee. Keep it that way.
