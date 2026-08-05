const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('https://founder-os--founder-os-78cfc.us-east4.hosted.app/');
    
    console.log('Clicking Demo Founder...');
    // We assume the button has "Demo Founder" text or similar
    await page.click('text=Demo Founder');
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Navigated to:', page.url());
    
    // Wait a bit to see if there are any client-side errors
    await new Promise(r => setTimeout(r, 5000));
    console.log('Final URL:', page.url());
  } catch (e) {
    console.error('PLAYWRIGHT ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
