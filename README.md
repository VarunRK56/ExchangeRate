# AED to INR Rate Indicator

A lightweight, automated **AED → INR exchange-rate email notifier**. GitHub Actions checks the rate every three hours and Resend emails the latest indicative rate. No web dashboard, Vercel hosting, or browser automation is required.

## How it works

1. GitHub Actions runs `node scripts/check-rate.mjs` every three hours (UTC schedule), or on demand.
2. The script requests the AED/INR rate from **ExchangeRate.fun** (no API key required).
3. If the primary API fails, it automatically retries using **ExchangeRate-API** at `open.er-api.com`.
4. The script validates the response, records the provider and source-data update time in the email, and sends an update via **Resend**.
5. The workflow finishes; no dashboard files or rate history are committed.

The primary provider advertises hourly updates, but actual data freshness depends on its service. GitHub's scheduled workflows can be delayed.

## Project files

- `scripts/check-rate.mjs` — primary/fallback API requests, validation, Resend email
- `.github/workflows/rate-monitor.yml` — scheduled and manual workflow
- `.env.example` — example configuration

## Setup

Add these secrets under **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Your Resend API key |
| `ALERT_TO_EMAIL` | Recipient address; comma-separated recipients supported |
| `ALERT_FROM_EMAIL` | Resend-authorized sender address |

For sending to people beyond the account's test recipient, verify a domain with Resend. Never commit API keys.

## Run

In GitHub, open **Actions → AED INR Rate Monitor → Run workflow**.

Or use **Node.js 22+** locally after setting the three environment variables:

```bash
node scripts/check-rate.mjs
```

The script sends a real email each time it runs successfully, even if the rate is unchanged. It includes the rate, provider, check timestamp and source update timestamp.

## Failure behavior

- Primary API fails or returns invalid data → fallback API is called.
- Both APIs fail → workflow fails; no email is sent.
- Resend rejects the email → workflow fails.

Rates are indicative; banks and remittance services may offer different conversion rates and fees.

## Security

Keep secrets in GitHub Actions secrets or a local secret manager. If credentials were previously committed to this repository, **rotate them**: deleting a file does not remove it from Git history.
