import fs from 'node:fs/promises';

const endpoint = 'https://open.er-api.com/v6/latest/AED';
const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Exchange API returned ${response.status}`);
const data = await response.json();
const rate = data?.rates?.INR;
if (data?.result !== 'success' || !Number.isFinite(rate) || rate <= 0) {
  throw new Error('Invalid AED/INR rate from API');
}
const checkedAt = new Date().toISOString();
const sourceUpdatedAt = data.time_last_update_utc ?? null;
const file = 'public/history.json';
let history = [];
try {
  const previous = JSON.parse(await fs.readFile(file, 'utf8'));
  if (Array.isArray(previous)) history = previous;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
history.push({ checkedAt, sourceUpdatedAt, rate });
history = history.slice(-240);
await fs.mkdir('public', { recursive: true });
await fs.writeFile(file, JSON.stringify(history, null, 2) + '\n');
console.log(`AED/INR: ${rate}; checked at ${checkedAt}; source updated ${sourceUpdatedAt}`);

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
    text: `AED/INR rate: ₹${rate.toFixed(4)} per AED\nChange: ${delta}\nChecked: ${checkedAt}\nSource last updated: ${sourceUpdatedAt ?? 'Unknown'}\n\nThis email is sent on every scheduled check, even when the rate is unchanged.\n`
  })
});
if (!email.ok) throw new Error(`Email delivery request failed (${email.status}): ${await email.text()}`);
console.log('Email accepted by Resend');
