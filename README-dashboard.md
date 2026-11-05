# AED/INR Dashboard + 3-hour Email Alerts

This enhancement retains the legacy Jenkins demo and adds a static Vercel dashboard and a Node.js GitHub Actions scheduler.

## How it works
- Every three hours, GitHub Actions runs `node scripts/check-rate.mjs`.
- It fetches AED/INR from `https://open.er-api.com/v6/latest/AED`.
- It emails the configured recipient **on every successful check**, including unchanged rates, via Resend.
- It records the observation in `public/history.json` (last 240 checks).
- The workflow commits history to `master`; Vercel automatically redeploys when connected to this repository.

## Setup
1. Merge the feature PR into `master`. Scheduled GitHub Actions run from the default branch.
2. Sign up at Resend, verify a sending domain, and create an API key. Resend test domains have recipient restrictions.
3. Under GitHub repository Settings → Secrets and variables → Actions, create:
   - `RESEND_API_KEY`
   - `ALERT_TO_EMAIL` (recipient address)
   - `ALERT_FROM_EMAIL` (verified sender, e.g. `Alerts <alerts@example.com>`)
4. In Vercel, import `VarunRK56/ExchangeRate`, choose **Other** framework preset, use the repository root, and deploy.
5. Under GitHub Actions, run **AED INR Rate Monitor** manually once to verify email and history.
6. Confirm `/history.json` contains observations and the dashboard updates after the Vercel deployment.

## Notes
- GitHub scheduled workflows can run late or be temporarily disabled for inactivity. They are not guaranteed exactly every three hours.
- This design intentionally sends an email on each successful run; if the email service fails, the workflow fails and does not commit history.
- The upstream exchange-rate API may refresh less frequently than the schedule.
- History is public in the deployed dashboard. No recipient email address or API key is written to the history.
- Free Resend tiers and GitHub Actions usage have provider limits.
- Avoid deploying or exposing the legacy committed `.env`; rotate any exposed credentials and remove them from git history.
- The existing Jenkins script is retained for reference; it is not invoked by the scheduled workflow.
