# AED to INR Exchange Rate Monitor

Automated **AED → INR exchange-rate monitoring** with scheduled email updates, rate-history tracking, and a responsive web dashboard designed for deployment on **Vercel**.

The project started as a Playwright + Jenkins automation proof of concept and now also includes a lightweight **GitHub Actions + Resend** notification workflow.

## Features

- **Scheduled checks:** GitHub Actions checks the AED/INR rate every **3 hours**.
- **Email on every check:** Sends a rate update using **Resend**, even when the rate has not changed.
- **Rate history:** Saves up to **240 observations** in `public/history.json`.
- **Dashboard:** Responsive web interface showing the latest observed rate, previous changes, source update time, a history chart, and recent checks.
- **Manual execution:** Run the workflow on demand through GitHub Actions.
- **Legacy Jenkins demo:** Retains the original Playwright-based Jenkins automation for reference.

> **Status:** The scheduled email workflow has been tested successfully by the project owner. The dashboard source is included; a public Vercel deployment URL has not been documented.

## Tech stack

| Component | Technology |
| --- | --- |
| Scheduler / CI | GitHub Actions |
| Rate retrieval | Node.js Fetch API |
| Exchange-rate data | [ExchangeRate-API](https://www.exchangerate-api.com/) via `open.er-api.com` |
| Email delivery | [Resend](https://resend.com/) |
| Dashboard | HTML, CSS, JavaScript, SVG |
| Dashboard hosting | [Vercel](https://vercel.com/) |
| Original automation | TypeScript, Playwright, Axios, Jenkins |

## Architecture

```text
GitHub Actions (every 3 hours / manual dispatch)
                  |
                  v
       scripts/check-rate.mjs
                  |
                  v
    Exchange Rate API (AED → INR)
                  |
          +-------+-------+
          |               |
          v               v
   Resend email     public/history.json
   (every check)          |
                          v
                 Git commit to master
                          |
                          v
                Vercel redeployment
                          |
                          v
                   Web dashboard
```

The rate API may refresh less often than every three hours. A scheduled check is not necessarily a new market-data update.

## Repository structure

```text
ExchangeRate/
├── .github/
│   └── workflows/
│       └── rate-monitor.yml       # Scheduled and manual GitHub Actions workflow
├── scripts/
│   └── check-rate.mjs            # Fetches rates, updates history, sends email
├── public/
│   ├── index.html                # Dashboard
│   ├── styles.css                # Dashboard styling
│   ├── app.js                    # Chart and history rendering
│   └── history.json              # Recorded rate checks
├── exchange-rate-automation.ts   # Original Jenkins / Playwright POC
├── .env.example                  # Example configuration (no real secrets)
├── vercel.json                   # Static dashboard deployment settings
├── README-dashboard.md          # Additional setup notes
└── README.md
```

## Configure email notifications

1. Create a [Resend](https://resend.com/) account and generate an API key.
2. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**.
3. Add the following secrets:

| Secret | Description |
| --- | --- |
| `RESEND_API_KEY` | Your private Resend API key |
| `ALERT_TO_EMAIL` | Email address receiving the notifications |
| `ALERT_FROM_EMAIL` | Resend-authorized sender address |

For a limited test, Resend supports `onboarding@resend.dev`, subject to its test-recipient restrictions. For production sending, verify a domain in Resend and use an address from that domain.

**Never commit actual API keys, tokens, or credentials.** If a secret has previously been committed or shared, revoke it and replace it.

## Run a rate check

### Option A: GitHub Actions (recommended)

1. Open the repository's **Actions** tab.
2. Select **AED INR Rate Monitor**.
3. Click **Run workflow**.
4. Inspect the job logs for the fetched rate and email API result.
5. Check your inbox and [Resend email logs](https://resend.com/emails).

The workflow uses the cron expression:

```yaml
schedule:
  - cron: '0 */3 * * *'
```

GitHub Actions cron schedules use **UTC** and can be delayed. The workflow is designed to run every three hours, but exact execution times are not guaranteed.

### Option B: Run locally

Requires **Node.js 22+**. The scheduled checker uses Node's built-in `fetch` and does not require installing Playwright.

Configure the environment variables in your terminal or a secure local environment manager, then run:

```bash
node scripts/check-rate.mjs
```

This command makes a real Resend API request and sends an email when correctly configured.

## Deploy the dashboard on Vercel

1. Sign in to [Vercel](https://vercel.com/new).
2. Import `VarunRK56/ExchangeRate` from GitHub.
3. Select the **Other** framework preset and use the repository root.
4. Deploy. The repository's `vercel.json` configures `public` as the output directory.
5. Run the GitHub Actions workflow to populate `public/history.json`.
6. After GitHub Actions commits the updated history and Vercel redeploys, refresh the dashboard.

The dashboard displays the latest saved observations, not a continuously streaming live rate. GitHub Actions needs permission to push history updates to the default branch; branch protection rules may require an alternative persistence approach.

## Email behavior

Each successful check sends a message containing:

- Latest AED/INR exchange rate
- Change compared with the previous recorded check
- Check timestamp
- Source-data update timestamp

**Emails are sent on every successful check, even when the exchange rate is unchanged.** If email delivery is rejected by Resend, the workflow fails instead of silently reporting success.

## Important limitations

- The public exchange-rate API provides **indicative rates**; banks and remittance services may use different rates and fees.
- Scheduled runs may be delayed or skipped by GitHub Actions.
- The dashboard is based on committed historical snapshots and updates after deployment.
- The dashboard history is public if deployed publicly; no email address or API key is written into `history.json`.
- Email delivery is subject to Resend's account restrictions and usage limits.
- The original Jenkins example is separate from the new scheduled workflow.

## Legacy Playwright + Jenkins automation

The original `exchange-rate-automation.ts` demonstrates fetching an exchange rate using Axios and triggering a parameterized Jenkins job via Playwright, with a Jenkins REST API fallback.

It remains in the repository as an earlier automation POC. **It is not required for the GitHub Actions / Resend monitoring flow.** Its configuration, browser setup, and Jenkins job are separate.

## Security

- Store credentials only in GitHub Actions secrets or a secure local secret manager.
- Keep `.env` and `node_modules/` out of version control.
- If credentials were previously committed, removing the current file is insufficient: rotate them and clean the affected Git history.
- Avoid logging tokens or including private email addresses in public dashboards.

## Future enhancements

- Configurable target-rate alerts
- Multiple currency pairs
- Telegram or web-push notifications
- Persistent database storage for long-term rate history
- Dashboard filters and custom date ranges

---

Built as a practical automation project to reduce repetitive manual exchange-rate checks.
