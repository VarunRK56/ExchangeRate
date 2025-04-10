import { chromium } from '@playwright/test';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration settings
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/AED';
const JENKINS_URL = process.env.JENKINS_URL || 'http://your-jenkins-instance.com';
const JENKINS_JOB_NAME = process.env.JENKINS_JOB_NAME || 'send-exchange-rate-email';
const JENKINS_API_TOKEN = process.env.JENKINS_API_TOKEN || '';
const JENKINS_USERNAME = process.env.JENKINS_USERNAME || '';
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'user@example.com';
const THRESHOLD_RATE = process.env.THRESHOLD_RATE ? parseFloat(process.env.THRESHOLD_RATE) : 23.5; // Alert if rate crosses this threshold

interface ExchangeRateResponse {
  result: string;
  time_last_update_utc: string;
  rates: {
    INR: number;
    [key: string]: number;
  };
}

async function getExchangeRate(): Promise<{rate: number, lastUpdate: string}> {
  try {
    const response = await axios.get<ExchangeRateResponse>(EXCHANGE_RATE_API_URL);
    
    if (response.data && response.data.rates && response.data.rates.INR) {
      const rate = response.data.rates.INR;
      const lastUpdate = response.data.time_last_update_utc;
      
      console.log(`Current AED to INR exchange rate: ${rate}`);
      console.log(`Last updated: ${lastUpdate}`);
      
      return { rate, lastUpdate };
    } else {
      throw new Error('Failed to parse exchange rate data');
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
}

async function triggerJenkinsJob(rate: number, lastUpdate: string): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log(`Accessing Jenkins at ${JENKINS_URL}...`);
    
    // Navigate to Jenkins
    await page.goto(JENKINS_URL);
    
    // Login to Jenkins if required
    if (await page.locator('input#j_username').isVisible()) {
      console.log('Logging into Jenkins...');
      await page.fill('input#j_username', JENKINS_USERNAME);
      await page.fill('input[name="j_password"]', JENKINS_API_TOKEN);
      await page.click('input[name="Submit"]');
    }
    
    // Navigate to the specific job
    const jobUrl = `${JENKINS_URL}/job/${JENKINS_JOB_NAME}`;
    await page.goto(jobUrl);
    
    // Click "Build with Parameters" option
    await page.click('span:has-text("Build with Parameters")');
    
    // Fill in the parameters
    await page.fill('input[value="0.0"]', rate.toString());
    await page.fill(' input[value="Not Available"]', lastUpdate);
    await page.fill('input[value="user@example.com"]', RECIPIENT_EMAIL);
    
    // Add a subject based on whether rate crosses threshold
    const subject = rate > THRESHOLD_RATE 
      ? `ALERT: AED to INR rate above threshold (${rate})` 
      : `Daily Exchange Rate: AED to INR (${rate})`;
    await page.fill('input[value="Exchange Rate Update: AED to INR"]', subject);
    
    // Build the job
    await page.click('button[class="jenkins-button jenkins-button--primary jenkins-!-build-color"]');
    
    console.log(`Jenkins job "${JENKINS_JOB_NAME}" triggered successfully`);
    
  } catch (error) {
    console.error('Error triggering Jenkins job:', error);
    
    // Try alternative method using Jenkins API if browser method fails
    try {
      console.log('Attempting to use Jenkins REST API instead...');
      
      const params = new URLSearchParams();
      params.append('EXCHANGE_RATE', rate.toString());
      params.append('LAST_UPDATE', lastUpdate);
      params.append('RECIPIENT_EMAIL', RECIPIENT_EMAIL);
      params.append('EMAIL_SUBJECT', rate > THRESHOLD_RATE 
        ? `ALERT: AED to INR rate above threshold (${rate})` 
        : `Daily Exchange Rate: AED to INR (${rate})`);
      
      // Basic auth for Jenkins API
      const auth = Buffer.from(`${JENKINS_USERNAME}:${JENKINS_API_TOKEN}`).toString('base64');
      
      await axios.post(
        `${JENKINS_URL}/job/${JENKINS_JOB_NAME}/buildWithParameters`, 
        params,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('Jenkins job triggered via API successfully');
    } catch (apiError) {
      console.error('Error with Jenkins API method:', apiError);
      throw new Error('Failed to trigger Jenkins job through UI and API');
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    // Get the current exchange rate
    const { rate, lastUpdate } = await getExchangeRate();
    
    // Trigger Jenkins job to send email
    await triggerJenkinsJob(rate, lastUpdate);
    
    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Process failed:', error);
    process.exit(1);
  }
}

// Execute the main function
main();