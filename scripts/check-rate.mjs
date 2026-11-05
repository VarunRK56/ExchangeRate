async function getRate() {
  // Primary: no-key community-operated feed. Validate response and timestamp.
  try {
    const response = await fetch('https://api.exchangerate.fun/latest?base=AED', {
      headers: { Accept: 'application/json', 'User-Agent': 'ExchangeRateMonitor/1.0' },
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`ExchangeRate.fun returned ${response.status}`);
    const data = await response.json();
    const rate = data?.rates?.INR;
    if (data?.base !== 'AED' || !Number.isFinite(rate) || rate <= 0 ||
        !Number.isFinite(data?.timestamp) || data.timestamp <= 0) {
      throw new Error('Invalid ExchangeRate.fun AED/INR response');
    }
    const sourceUpdatedAt = new Date(data.timestamp * 1000).toISOString();
    if (Number.isNaN(Date.parse(sourceUpdatedAt))) throw new Error('Invalid source timestamp');
    return { rate, provider: 'ExchangeRate.fun', sourceUpdatedAt };
  } catch (error) {
    console.warn(`Primary exchange-rate provider failed; using fallback: ${error.message}`);
  }

  // Fallback preserves scheduled notifications if the primary API is blocked or down.
  const response = await fetch('https://open.er-api.com/v6/latest/AED', {
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`ExchangeRate-API returned ${response.status}`);
  const data = await response.json();
  const rate = data?.rates?.INR;
  if (data?.result !== 'success' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid ExchangeRate-API response');
  }
  const parsed = data.time_last_update_utc ? new Date(data.time_last_update_utc) : null;
  return {
    rate,
    provider: 'ExchangeRate-API (daily fallback)',
    sourceUpdatedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null
  };
}

const { rate, provider, sourceUpdatedAt } = await getRate();
const checkedAt = new Date().toISOString();
console.log(`AED/INR: ${rate}; provider: ${provider}; checked at ${checkedAt}; source updated ${sourceUpdatedAt}`);

const apiKey = process.env.RESEND_API_KEY;
const recipient = process.env.ALERT_TO_EMAIL;
const sender = process.env.ALERT_FROM_EMAIL;
if (!apiKey || !recipient || !sender) {
  throw new Error('Missing RESEND_API_KEY, ALERT_TO_EMAIL, or ALERT_FROM_EMAIL');
}
const email = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: sender,
    to: recipient.split(',').map(value => value.trim()).filter(Boolean),
    subject: `AED/INR update: 1 AED = ₹${rate.toFixed(4)}`,
    text: `AED/INR rate: ₹${rate.toFixed(4)} per AED\nProvider: ${provider}\nChecked: ${checkedAt}\nSource last updated: ${sourceUpdatedAt ?? 'Unknown'}\n\nThis email is sent on every scheduled check, even when the rate is unchanged.\n`
  })
});
if (!email.ok) throw new Error(`Email delivery request failed (${email.status}): ${await email.text()}`);
console.log('Email accepted by Resend');
