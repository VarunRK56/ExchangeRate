# Jenkins Automation with Playwright and Exchange Rate API

This project automates the process of retrieving real-time **AED to INR** exchange rates, triggering a Jenkins job to send an email notification when the exchange rate crosses a specific threshold, and monitoring the Jenkins build status. The integration leverages **Playwright**, **Jenkins**, **Axios**, and an **Exchange Rate API**.

## Project Overview

- **Playwright**: Used for UI automation to trigger the Jenkins job.
- **Jenkins**: Handles the build process to send the email with exchange rate updates.
- **Exchange Rate API**: Provides real-time currency data (AED to INR).
- **Axios**: Makes HTTP requests to fetch exchange rates and trigger Jenkins job via API.
- **dotenv**: Loads environment variables from a `.env` file for sensitive information like Jenkins credentials and API tokens.

## Features

- Fetches real-time **AED to INR** exchange rate from the **Exchange Rate API**.
- Triggers a Jenkins build with the fetched exchange rate and a custom email subject.
- Sends email notifications to a specified recipient when the rate exceeds a defined threshold.
- Monitors the Jenkins job’s build status and waits for completion before proceeding.

## Tools & Technologies

- **Node.js** (for scripting)
- **Playwright** (for Jenkins UI automation)
- **Axios** (for API requests)
- **Jenkins** (for CI/CD job automation)
- **Exchange Rate API** (for real-time currency data)
- **dotenv** (for loading environment variables)

## Prerequisites

To get started, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **Jenkins** (with API token access)
- **Playwright** installed via npm (for UI automation)
- **Axios** and **dotenv** for HTTP requests and environment variables

## Installation

### 1. Clone the repository:

```bash
git clone https://github.com/yourusername/jenkins-playwright-exchange-rate.git
cd jenkins-playwright-exchange-rate

**2. Install dependencies:**
npm install

**3. Create a .env file**
# Jenkins Configuration
JENKINS_URL=http://your-jenkins-instance.com
JENKINS_JOB_NAME=your-jenkins-job-name
JENKINS_API_TOKEN=your-jenkins-api-token
JENKINS_USERNAME=your-jenkins-username

# Email Configuration
RECIPIENT_EMAIL=user@example.com

# Exchange Rate API Configuration
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/AED
THRESHOLD_RATE=23.5


Usage
1. Fetch Exchange Rate & Trigger Jenkins Build
Once you’ve set up the environment, run the script using:

bash
Copy
Edit
node index.js
This will:

Fetch the current AED to INR exchange rate.

Trigger the Jenkins job to send an email with the rate details.

Wait for the Jenkins build to complete, checking its status periodically.

Print out the build status and success/failure message.

2. Customization
You can customize the following:

Exchange Rate Threshold: Change the threshold rate for triggering the alert in the .env file.

Jenkins Job: Modify the job name and parameters in the .env file to match your Jenkins setup.

Email: Set the recipient’s email address in the .env file to receive notifications.

Troubleshooting
If you get a "403 Forbidden" error while interacting with Jenkins, double-check your Jenkins API Token and username.

If the Jenkins build fails to trigger, ensure that your Jenkins job configuration allows remote triggering with parameters.


**Acknowledgments**
Playwright for powerful browser automation.

Jenkins for CI/CD automation.

Exchange Rate API for real-time currency exchange data.
