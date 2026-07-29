// Stripe Connect fee model for The Village.
// Pure calculation — no Stripe key needed. Used by /api/economics and the charge
// endpoint so the numbers families/providers see match what actually settles.
//
// Key finding this model surfaces: on CARDS (2.9% + $0.30) the processing fee eats
// almost the entire 5% service fee. On ACH bank debit (0.8%, capped at $5) it barely
// dents it. For recurring care payments, ACH is the right rail.

const STRIPE = {
  // US standard pricing
  card: { pct: 0.029, fixed: 0.30, cap: null },       // 2.9% + $0.30 per charge
  ach:  { pct: 0.008, fixed: 0.00, cap: 5.00 },       // 0.8% capped at $5.00 per charge
  // Connect (Express) — platform-side estimate; confirm against your Stripe agreement
  connectPct: 0.0025,      // ~0.25% of payout volume
  connectMonthly: 2.00,    // ~$2/mo per active connected account
};

const round = (n) => Math.round(n * 100) / 100;

// Stripe processing fee on an `amount`, for a given method, split across `charges`
// (e.g. 4 weekly charges/month means the fixed/cap applies per charge).
function stripeProcessingFee(amount, method = 'ach', charges = 1) {
  const m = STRIPE[method] || STRIPE.card;
  const perCharge = amount / charges;
  let fee = perCharge * m.pct + m.fixed;
  if (m.cap != null) fee = Math.min(fee, m.cap);
  return round(fee * charges);
}

// Full economics for one match over a billing period.
//  feeMode 'absorb' — family pays rate + service fee; platform eats the Stripe fee.
//  feeMode 'pass'   — family also covers the Stripe processing fee (platform keeps full 5%).
function computeEconomics({
  rate = 30, hours = 160, feePct = 0.05,
  method = 'ach', charges = 4, feeMode = 'pass',
} = {}) {
  const providerPayout = round(rate * hours);
  const serviceFee = round(providerPayout * feePct); // the platform application fee
  let familyCharge = round(providerPayout + serviceFee);

  let stripeFee = stripeProcessingFee(familyCharge, method, charges);
  if (feeMode === 'pass') {
    familyCharge = round(familyCharge + stripeFee);           // gross up so family covers it
    stripeFee = stripeProcessingFee(familyCharge, method, charges);
  }
  const connectFee = round(providerPayout * STRIPE.connectPct + STRIPE.connectMonthly);
  const platformNet = round(serviceFee - connectFee - (feeMode === 'absorb' ? stripeFee : 0));

  return {
    inputs: { rate, hours, feePct, method, feeMode, charges },
    providerPayout,                 // paid directly to the provider
    serviceFee,                      // The Village application fee (before costs)
    familyCharge,                    // what the family is billed
    familyHourly: round(familyCharge / hours),
    stripeFee,                       // Stripe processing fee
    connectFee,                      // est. Connect account/payout fee
    platformNet,                     // what The Village actually keeps from the service fee
  };
}

module.exports = { computeEconomics, stripeProcessingFee, STRIPE };
