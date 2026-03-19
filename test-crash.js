const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
      if (response.status() >= 400) console.log('Network Error:', response.status(), response.url());
  });
  await page.goto('http://127.0.0.1:3001', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  if (content.length < 500) {
      console.log('Very short content:', content);
  }
  
  await browser.close();
})();
