const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('octokit');

// Load .env
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (val && !process.env[key]) process.env[key] = val;
  }
} catch (_e) {}

let query;
try {
  ({ query } = require('@anthropic-ai/claude-agent-sdk'));
} catch (_e) {
  console.error('Claude Agent SDK not available. Run: npm install @anthropic-ai/claude-agent-sdk');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const REPO_OWNER = 'rapodacas';
const REPO_NAME = 'the-village';

// --- Stripe Connect (payments) ---
// Optional: server runs fine without it. Set STRIPE_SECRET_KEY and `npm install stripe`
// to enable the /api/connect and /api/payments endpoints.
const { computeEconomics } = require('./fees');
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (_e) {
    console.warn('STRIPE_SECRET_KEY set but stripe package missing. Run: npm install stripe');
  }
}
function requireStripe(req, res, next) {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY and run: npm install stripe' });
  }
  next();
}

// LEGAL GATE — do NOT remove without sign-off.
// Money-movement routes stay locked until a California employment attorney confirms
// the Labor Code §2777 referral-agency exemption applies (esp. whether respite is excluded
// "in-home care"), the founder's teacher conflict-of-interest is firewalled, and a % fee is
// lawful for these non-clinical services. See docs/ATTORNEY-BRIEF.md. Only then set
// LEGAL_CLEARED=true in .env. See LAUNCH_CHECKLIST.md.
function requireCleared(req, res, next) {
  if (process.env.LEGAL_CLEARED !== 'true') {
    return res.status(423).json({
      error: 'Locked: legal review pending. A CA employment attorney must confirm the ' +
             'Labor Code §2777 referral-agency exemption + founder conflict-of-interest firewall before enabling payments. ' +
             'Set LEGAL_CLEARED=true only after sign-off. See LAUNCH_CHECKLIST.md.',
    });
  }
  next();
}
const SITE = 'https://rapodacas.github.io/the-village';

// Session tracking: toolId -> { sessionId, lastActivity }
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

function getSession(toolId) {
  const entry = sessions.get(toolId);
  if (!entry) return null;
  if (Date.now() - entry.lastActivity > SESSION_TTL) {
    sessions.delete(toolId);
    return null;
  }
  entry.lastActivity = Date.now();
  return entry.sessionId;
}

function setSession(toolId, sessionId) {
  sessions.set(toolId, { sessionId, lastActivity: Date.now() });
}

const SYSTEM_PROMPT = `You are helping build operational tools for The Village, a special-needs support registry in San Diego County founded by Roxy Apodaca.

Business context:
- Family and provider agree the rate directly (we suggest a range); providers are independent contractors, paid directly via Stripe Connect
- $299 one-time placement fee, $99/mo family subscription, $49/mo provider subscription (waived first 90 days)
- Named after Roxy's mom Paulette "Roxy" — compass lives inside compassion

You are talking to Roxy, the founder — a special-education teacher for children with autism and a mother of five, not a developer. Be warm, direct, and practical.

Your job: help Roxy define what this tool needs, then generate it as a complete, standalone HTML file.

Rules:
- Ask 2-3 focused questions to understand what Roxy needs. Don't overwhelm him.
- When you have enough info, generate the COMPLETE HTML file
- The HTML must be fully self-contained: inline CSS, inline JS, no external dependencies
- Match the brand: primary green #2f7d7a, accent gold #ef8354, light bg #eef6f5
- Use font-family: 'Segoe UI', system-ui, sans-serif
- Must work on mobile (responsive)
- This is a TOOL — it should DO something (forms, checklists, trackers, generators), not just display info
- For tools that need data persistence, use localStorage
- Include a small "The Village" header/nav bar with a link back to the admin dashboard

When you generate the final HTML, wrap it in exactly these markers:
---HTML_START---
(complete HTML here)
---HTML_END---

After the markers, briefly explain what you built and how to use it.`;

function getToolContext(toolId, toolName, toolDesc) {
  return `\n\nYou are building: ${toolName}\nPurpose: ${toolDesc}\nTool ID: ${toolId}\n\nStart by greeting Roxy and asking what he needs from this tool. Keep it conversational.`;
}

app.post('/api/chat', async (req, res) => {
  const { toolId, toolName, toolDesc, messages } = req.body;

  if (!toolId || !messages || !messages.length) {
    return res.status(400).json({ error: 'toolId and messages required' });
  }

  const userMessage = messages[messages.length - 1].content;
  const existingSession = getSession(toolId);

  const opts = {
    maxTurns: 1,
    allowedTools: [],
    permissionMode: 'plan',
  };

  if (existingSession) {
    opts.resume = existingSession;
  } else {
    opts.systemPrompt = SYSTEM_PROMPT + getToolContext(toolId, toolName, toolDesc);
  }

  try {
    let sessionId = existingSession;
    let resultText = '';

    for await (const msg of query({ prompt: userMessage, options: opts })) {
      if (msg.type === 'system' && msg.subtype === 'init' && msg.session_id) {
        sessionId = msg.session_id;
      }
      if (msg.type === 'result') {
        sessionId = msg.session_id || sessionId;
        resultText = msg.result || '';
      }
    }

    if (sessionId) setSession(toolId, sessionId);

    const hasHtml = resultText.includes('---HTML_START---') && resultText.includes('---HTML_END---');
    let html = null;
    if (hasHtml) {
      html = resultText.split('---HTML_START---')[1].split('---HTML_END---')[0].trim();
    }

    res.json({ response: resultText, html, done: hasHtml });
  } catch (err) {
    console.error('Agent error:', err.message);
    if (existingSession) {
      sessions.delete(toolId);
    }
    res.status(500).json({ error: 'Failed to get response from Claude' });
  }
});

app.post('/api/deploy', async (req, res) => {
  const { toolId, html, filename } = req.body;

  if (!toolId || !html || !filename) {
    return res.status(400).json({ error: 'toolId, html, and filename required' });
  }

  const filePath = `tools/${filename}`;

  try {
    let statusJson;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: REPO_OWNER, repo: REPO_NAME, path: 'tools/status.json'
      });
      statusJson = JSON.parse(Buffer.from(data.content, 'base64').toString());
      var statusSha = data.sha;
    } catch {
      statusJson = {};
      var statusSha = null;
    }

    const toolContent = Buffer.from(html).toString('base64');
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER, repo: REPO_NAME, path: filePath,
      message: `Add tool: ${toolId} (${filename})`,
      content: toolContent
    });

    statusJson[toolId] = { status: 'ready', file: filePath, deployedAt: new Date().toISOString() };

    const statusContent = Buffer.from(JSON.stringify(statusJson, null, 2)).toString('base64');
    const statusOpts = {
      owner: REPO_OWNER, repo: REPO_NAME, path: 'tools/status.json',
      message: `Update status: ${toolId} ready`,
      content: statusContent
    };
    if (statusSha) statusOpts.sha = statusSha;
    await octokit.rest.repos.createOrUpdateFileContents(statusOpts);

    res.json({ success: true, url: filePath });
  } catch (err) {
    console.error('Deploy error:', err.message);
    res.status(500).json({ error: 'Failed to deploy: ' + err.message });
  }
});

// --- Economics: model the real numbers incl. Stripe fees (no Stripe key needed) ---
// GET /api/economics?rate=30&hours=160&method=ach&feeMode=pass&charges=4
app.get('/api/economics', (req, res) => {
  const { rate, hours, feePct, method, feeMode, charges } = req.query;
  const econ = computeEconomics({
    rate: rate != null ? Number(rate) : undefined,
    hours: hours != null ? Number(hours) : undefined,
    feePct: feePct != null ? Number(feePct) : undefined,
    method, feeMode,
    charges: charges != null ? Number(charges) : undefined,
  });
  res.json(econ);
});

// --- Provider onboarding: create an Express connected account + hosted onboarding link ---
// POST { providerId?, email?, accountId? }  ->  { accountId, onboardingUrl }
app.post('/api/connect/onboard', requireStripe, requireCleared, async (req, res) => {
  try {
    const { providerId, email, accountId } = req.body || {};
    let acct = accountId;
    if (!acct) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email || undefined,
        business_type: 'individual',
        capabilities: { transfers: { requested: true }, us_bank_account_ach_payments: { requested: true } },
        metadata: { providerId: providerId || '' },
      });
      acct = account.id;
    }
    const link = await stripe.accountLinks.create({
      account: acct,
      refresh_url: `${SITE}/join.html`,
      return_url: `${SITE}/join.html`,
      type: 'account_onboarding',
    });
    res.json({ accountId: acct, onboardingUrl: link.url });
  } catch (err) {
    console.error('Connect onboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Payment: destination charge. Family pays; provider is paid their full agreed
// rate directly; The Village keeps only the 5% application fee. Funds never sit
// in the platform balance beyond the fee.
// POST { rate, hours, providerAccountId, method?, feeMode?, customerId? }
app.post('/api/payments/charge', requireStripe, requireCleared, async (req, res) => {
  try {
    const { rate, hours, providerAccountId, method = 'ach', feeMode = 'pass', customerId } = req.body || {};
    if (!providerAccountId) return res.status(400).json({ error: 'providerAccountId required' });
    const econ = computeEconomics({ rate: Number(rate), hours: Number(hours), method, feeMode });
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(econ.familyCharge * 100),          // cents family pays
      currency: 'usd',
      customer: customerId || undefined,
      payment_method_types: method === 'ach' ? ['us_bank_account'] : ['card'],
      application_fee_amount: Math.round(econ.serviceFee * 100), // platform's 5%
      transfer_data: { destination: providerAccountId },        // provider paid directly
      description: `The Village — ${hours} hrs @ $${rate}/hr`,
      metadata: { rate: String(rate), hours: String(hours), method, feeMode },
    });
    res.json({ paymentIntentId: pi.id, clientSecret: pi.client_secret, economics: econ });
  } catch (err) {
    console.error('Charge error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', auth: 'max-subscription', stripe: !!stripe }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`The Village API running on port ${PORT}`);
  console.log(`Auth: Claude Max subscription (via Agent SDK)`);
  console.log(`No API key required`);
  if (stripe && process.env.LEGAL_CLEARED !== 'true') {
    console.warn('\n  ⚠  PAYMENTS LOCKED: Stripe is configured but LEGAL_CLEARED is not set.');
    console.warn('     Payment routes are gated until a CA attorney confirms the §22300');
    console.warn('     referral-agency safe harbor. See LAUNCH_CHECKLIST.md.\n');
  }
});
