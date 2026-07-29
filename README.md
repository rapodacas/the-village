# The Village

A private-pay **special-needs support registry** for San Diego County — connecting families
of children with special needs to vetted, independent, **non-clinical** special-education-
adjacent providers (IEP/504 advocates, tutors, EF/parent coaches, social-skills facilitators,
life-skills coaches; respite in phase 2). Founder: Roxy Apodaca (special-education teacher,
mother of five).

Forked from the Poly's Compass registry stack and reskinned for the special-needs model.

## Structure

- `index.html` — landing page
- `join.html` — families + providers
- `disclosure.html` — registry & independent-contractor disclosure
- `model-*.html` — internal revenue-model exploration (hybrid recommended)
- `admin.html` — internal ops dashboard (AI tool builder)
- `docs/` — `PROVIDER-VETTING-AND-SCOPE-POLICY.md`, `ATTORNEY-BRIEF.md`
- `api/` — Express backend: economics model (`fees.js`), Stripe Connect onboarding +
  destination charges (`server.js`). Payment routes are **gated** behind `LEGAL_CLEARED`.

## Before launch

Payments stay locked until a California attorney confirms: the **Labor Code §2777**
referral-agency exemption (including whether **respite** is excluded "in-home care"), the
founder's **teacher conflict-of-interest** firewall, and that a **% fee** is lawful for these
non-clinical services. See `docs/ATTORNEY-BRIEF.md` and `api/LAUNCH_CHECKLIST.md`.

## Model

Non-clinical, **private-pay only** (no ABA/speech/OT/PT/therapy; no insurance / Regional
Center billing). Family and provider set the rate directly; The Village suggests a range.
Providers are independent contractors paid directly via Stripe Connect; The Village collects
a one-time matching fee, memberships, and a 5% service fee.
