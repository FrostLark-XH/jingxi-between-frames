const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Scene 1: First visit — clear localStorage, full entrance animation
  await page.goto('http://localhost:3005');
  await page.evaluate(() => localStorage.removeItem('jingxi_first_visit_complete'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'tests/first-visit-hint.png', fullPage: true });
  console.log('[1/3] first-visit-hint.png');

  // Scene 2: Start typing
  const textarea = page.locator('textarea');
  await textarea.click();
  await page.waitForTimeout(100);
  await textarea.fill('今天下午在老城区的巷子里');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'tests/first-visit-typing.png', fullPage: true });
  console.log('[2/3] first-visit-typing.png');

  // Scene 3: Return visit
  await page.evaluate(() => localStorage.setItem('jingxi_first_visit_complete', '1'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/return-visit.png', fullPage: true });
  console.log('[3/3] return-visit.png');

  await browser.close();
  console.log('Done.');
})();
