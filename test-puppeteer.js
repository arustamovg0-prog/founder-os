const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Go to home page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'step1.png' });
  console.log('Step 1: Loaded login page');

  // Click Founder Demo
  const buttons = await page.$$('button');
  let founderButton;
  for (let btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Founder Demo')) {
      founderButton = btn;
      break;
    }
  }

  if (founderButton) {
    console.log('Clicking Founder Demo button...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => console.log('Navigation timeout or already handled')),
      founderButton.click(),
    ]);
    
    // Wait a bit just in case
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'step2.png' });
    console.log('Step 2: Logged in and navigated. Current URL:', page.url());
  } else {
    console.log('Founder Demo button not found');
  }

  await browser.close();
})();
