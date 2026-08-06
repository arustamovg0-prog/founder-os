const fs = require('fs');
const https = require('https');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = process.env;

if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) {
  console.log('⚠️ Sentry monitoring daemon: Missing SENTRY_AUTH_TOKEN, SENTRY_ORG, or SENTRY_PROJECT in .env.local.');
  console.log('The daemon is running but will mock the monitoring. Please set up the tokens to enable real monitoring.');
}

const CHECK_INTERVAL = 30000; // 30 seconds
const STATE_FILE = path.join(__dirname, '.sentry-last-seen.json');

// Helper to save last seen issue ID
function saveState(lastId) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastId }));
}

// Helper to get last seen issue ID
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE)).lastId;
  }
  return null;
}

let lastSeenId = loadState();

function checkSentry() {
  if (!SENTRY_AUTH_TOKEN) {
    // Mock mode for local dev without tokens
    return;
  }

  const options = {
    hostname: 'sentry.io',
    port: 443,
    path: `/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?query=is:unresolved`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        if (res.statusCode !== 200) {
          console.error(`Sentry API Error: ${res.statusCode} - ${data}`);
          return;
        }

        const issues = JSON.parse(data);
        if (issues.length > 0) {
          const latestIssue = issues[0];
          if (latestIssue.id !== lastSeenId) {
            console.log(`\n======================================================`);
            console.log(`🚨 SENTRY ALERT: NEW ISSUE DETECTED 🚨`);
            console.log(`======================================================`);
            console.log(`Title: ${latestIssue.title}`);
            console.log(`Type: ${latestIssue.type}`);
            console.log(`Culprit: ${latestIssue.culprit}`);
            console.log(`URL: ${latestIssue.permalink}`);
            console.log(`\nHey Agent! Please analyze the above error and fix the code in ${latestIssue.culprit}!`);
            console.log(`======================================================\n`);
            
            lastSeenId = latestIssue.id;
            saveState(lastSeenId);
          }
        }
      } catch (e) {
        console.error('Failed to parse Sentry response:', e);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Network Error checking Sentry:', error);
  });

  req.end();
}

console.log(`🚀 Sentry Monitor Daemon started! Polling every ${CHECK_INTERVAL/1000}s...`);
setInterval(checkSentry, CHECK_INTERVAL);

// Initial check
checkSentry();
