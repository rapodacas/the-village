# The Village — Legal Review Brief

**For:** California attorney (employment + education / public-agency conflicts; healthcare
referral law helpful)
**Re:** Independent-contractor classification, referral-agency status, and founder
conflict-of-interest for a special-education-adjacent referral registry
**Prepared:** July 2026 · San Diego County · *Working name: The Village*

*Goal: a written opinion that (a) providers are properly independent contractors, (b) our
referral/fee model is lawful for these non-clinical services, and (c) the founder's
public-school employment can be firewalled — plus a punch list of any changes needed
before launch.*

---

## 1. What The Village is

A private-pay **referral registry** matching San Diego / California families of children
with special needs to independent, **non-clinical** special-education-adjacent providers:
IEP/504 advocates (non-attorney), parent/behavior coaches (non-medical), special-needs
tutors, executive-function coaches, social-skills facilitators, transition/life-skills
coaches, and — phase 2 — respite providers. It does **not** employ providers or deliver the
services itself. It **excludes** all licensed clinical/insurance-billed services (ABA,
speech, OT, PT, mental-health therapy) and operates **private-pay only**.

## 2. How it operates (facts for your analysis)

- **Vetting:** DOJ/FBI Live Scan + **TrustLine** registration required of every provider;
  credential + reference checks; mandated-reporter training.
- **Matching:** we actively match based on the child's needs; families choose and may
  decline.
- **Rate:** the **family and provider set the rate directly**; The Village publishes a
  suggested range and does not dictate wages.
- **Payment:** via **Stripe Connect destination charges** — the provider is paid their full
  agreed rate directly; funds are not held by The Village; Stripe issues the provider's
  1099-K.
- **Our compensation:** one-time placement fee; family and provider subscriptions; and a
  ~5% service fee collected automatically as a Stripe application fee.
- **No control:** we do not direct how providers perform their work; providers run their own
  practices, set rates, and keep their own clients.
- **Founder:** an actively employed **public-school special-education teacher**.

## 3. Questions for counsel

a. **Classification (core).** Does operating as a **Labor Code §2777 referral agency** keep
   these providers independent contractors (under *Borello*) rather than employees? §2777
   enumerates "tutoring" and "consulting" — does the exemption extend to **non-enumerated**
   categories here (advocates, parent/behavior coaches, social-skills facilitators,
   life-skills coaches) if the §2777 factors are met, or do any need to be W-2?

b. **Respite (the big one).** §2777 excludes "in-home care." Is **in-home respite for
   special-needs children** excluded "in-home care"? If so, what covers it — another AB5
   exemption, W-2 employment, or should we omit respite? *We plan to hold respite for
   phase 2 pending your answer.*

c. **Percentage fee / fee-splitting.** Is a **percentage-based connection fee lawful** for
   these **non-healthcare** services? We understand Bus. & Prof. Code **§650** fee-splitting
   targets **healthcare** referrals and should not reach tutoring/advocacy/coaching —
   please confirm, and confirm nothing else (e.g., Talent Agencies Act, employment-agency
   licensing) reaches this model.

d. **Public-funding / anti-kickback.** We intend to stay **strictly private-pay**. Confirm
   that avoids Lanterman Act (Regional Center) and school-district anti-kickback exposure,
   and flag any accidental touchpoints to avoid.

e. **Founder conflict of interest (must-solve).** The founder is an employed public-school
   special-ed teacher whose business may refer families to advocates who oppose districts.
   Does a firewall — **no referrals involving the founder's own (and neighboring) district,
   recusal from any district decision touching a connected family/provider, personal
   time/resources only** — satisfy **Gov. Code §1126** (incompatible activities), the
   **Political Reform Act (§87100)**, the district's **statement of incompatible
   activities**, and **Ed. Code §56046**? What specific safeguards or disclosures do you
   recommend, and should the founder seek written clearance from the district?

f. **Child-safety compliance.** Confirm our vetting (Live Scan DOJ/FBI + **required**
   TrustLine, even though TrustLine is only *mandatory* for subsidy-funded care) is
   appropriate and sufficient, and confirm mandated-reporter obligations for providers and
   the founder.

## 4. Documents to review

Working policy set (provider vetting & scope-of-practice), the planned family/provider
disclosures and agreements, and the site (to be built by forking our Poly's Compass
registry stack).

## 5. What we've already built toward compliance

Providers as ICs with the §2777 factors baked into the listing agreement; family/provider
set the rate (we only suggest a range); Stripe Connect direct-to-provider payments;
required Live Scan + TrustLine screening; scope-of-practice disclaimers (advocates ≠
attorneys, coaches ≠ clinicians); private-pay only; respite deliberately deferred; and a
founder firewall from her district.

## 6. The ask

A written opinion on (a)–(f) and a punch list of any changes required before we enable
matches and payments.
