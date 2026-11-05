import fs from 'node:fs/promises';

async function getRate() {
  // Established provider: free plan refreshes hourly, with USD as its base currency.
  // AED/INR is computed as INR-per-USD divided by AED-per-USD.
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID?.trim();
  if (appId) {
    const response = await fetch('https://openexchangerates.org/api/latest.json', {
      headers: { Authorization: `Token ${appId}` },
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`Open Exchange Rates returned ${response.status}`);
    const data = await response.json();
    const aed = data?.rates?.AED, inr = data?.rates?.INR;
    const rate = inr / aed;
    if (data?.base !== 'USD' || !Number.isFinite(rate) || rate <= 0 ||
        !Number.isFinite(data?.timestamp) || data.timestamp <= 0) {
      throw new Error('Invalid Open Exchange Rates response');
    }
    return { rate, provider: 'Open Exchange Rates', sourceUpdatedAt: new Date(data.timestamp * 1000).toISOString() };
  }
  // Compatibility fallback: retain working notifications until the new API key is configured.
  const response = await fetch('https://open.er-api.com/v6/latest/AED', {
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`ExchangeRate-API returned ${response.status}`);
  const data = await response.json();
  const rate = data?.rates?.INR;
  if (data?.result !== 'success' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid ExchangeRate-API response');
  }
  const rawTime = data.time_last_update_utc;
  const parsed = rawTime ? new Date(rawTime) : null;
  return { rate, provider: 'ExchangeRate-API (daily fallback)',
    sourceUpdatedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null };
}

const { rate, provider, sourceUpdatedAt } = await getRate();
const checkedAt = new Date().toISOString();
const file = 'public/history.json';
let history = [];
try {
  const previous = JSON.parse(await fs.readFile(file, 'utf8'));
  if (Array.isArray(previous)) history = previous;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
history.push({ checkedAt, sourceUpdatedAt, provider, rate });
history = history.slice(-240);
await fs.mkdir('public', { recursive: true });
await fs.writeFile(file, JSON.stringify(history, null, 2) + '\n');
console.log(`AED/INR: ${rate}; provider: ${provider}; checked at ${checkedAt}; source updated ${sourceUpdatedAt}`);

const apiKey = process.env.RESEND_API_KEY;
const recipient = process.env.ALERT_TO_EMAIL;
const sender = process.env.ALERT_FROM_EMAIL;
if (!apiKey || !recipient || !sender) {
  throw new Error('Missing RESEND_API_KEY, ALERT_TO_EMAIL, or ALERT_FROM_EMAIL');
}
const previousRate = history.length > 1 ? history.at(-2).rate : null;
const delta = previousRate === null ? 'First check' : `${rate >= previousRate ? '+' : ''}${(rate - previousRate).toFixed(4)} INR since previous check`;
const email = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: sender,
    to: recipient.split(',').map(value => value.trim()).filter(Boolean),
    subject: `AED/INR update: 1 AED = ₹${rate.toFixed(4)}`,
    text: `AED/INR rate: ₹${rate.toFixed(4)} per AED\nChange: ${delta}\nProvider: ${provider}\nChecked: ${checkedAt}\nSource last updated: ${sourceUpdatedAt ?? 'Unknown'}\n\nThis email is sent on every scheduled check, even when the rate is unchanged.\n`
  })
});
if (!email.ok) throw new Error(`Email delivery request failed (${email.status}): ${await email.text()}`);
console.log('Email accepted by Resend');
