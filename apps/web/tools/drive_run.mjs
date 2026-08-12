import { chromium } from 'playwright-core';

const APP = 'http://localhost/hackonomics/';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN,
  args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--disable-dev-shm-usage', '--disable-gpu'],
});
const ctx = await browser.newContext({
  viewport: { width: 432, height: 860 },
  deviceScaleFactor: 2,
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE_ERROR', e.message));

const AUDIT = () => {
  const acc = (el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g,' ').trim();
  const out = { unnamedButtons: [], imgsNoAlt: 0, inputsNoLabel: 0, headings: [], landmarks: {}, tabbableDivs: 0, clickableDivs: 0 };
  document.querySelectorAll('button').forEach(b => { if (!acc(b)) out.unnamedButtons.push((b.className||'').slice(0,70)); });
  out.imgsNoAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;
  out.inputsNoLabel = [...document.querySelectorAll('input')].filter(i => !i.getAttribute('aria-label') && !(i.labels && i.labels.length)).length;
  out.headings = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => h.tagName + ' ' + acc(h).slice(0,34));
  out.landmarks = { main: document.querySelectorAll('main').length, nav: document.querySelectorAll('nav').length, header: document.querySelectorAll('header').length, footer: document.querySelectorAll('footer').length };
  out.clickableDivs = [...document.querySelectorAll('div[onclick], div[role="button"]')].length;
  return out;
};
const vis = async (loc) => await loc.isVisible().catch(() => false);

try {
await page.goto(APP, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
console.log('HOME_A11Y', JSON.stringify(await page.evaluate(AUDIT)));
const daily = page.getByRole('button', { name: /Daily Gauntlet/i }).first();
if (await vis(daily)) await daily.click(); else await page.getByRole('button', { name: /^play/i }).first().click();
await page.waitForTimeout(2000);

// State machine: answer when the verdict buttons are up, otherwise dismiss whatever
// interstitial is on screen (explainer, intel file, boss gate).
let answers = 0, ticks = 0, done = false;
while (ticks++ < 140 && !done) {
  if (await vis(page.getByText(/Final score/i).first())) { done = true; break; }
  // interstitials first: while one is open the verdict buttons stay mounted but disabled
  const cont = page.getByRole('button', { name: /next case|got it|filed|begin|continue|face the boss|final case/i }).first();
  if (await vis(cont)) {
    await cont.click({ timeout: 3000 }).catch((e) => console.log('cont click failed:', e.message.split('\n')[0]));
    await page.waitForTimeout(700);
    continue;
  }
  const scam = page.getByRole('button', { name: /scam/i }).first();
  const legit = page.getByRole('button', { name: /legit/i }).first();
  const live = (await vis(scam)) && (await scam.isEnabled().catch(() => false));
  if (live) {
    const target = answers < 2 ? legit : scam;
    await target.click({ timeout: 3000 }).catch((e) => console.log('answer click failed:', e.message.split('\n')[0]));
    answers++;
    console.log('answered', answers);
    await page.waitForTimeout(900);
    continue;
  }
  await page.waitForTimeout(700);
}
console.log('answers given:', answers, 'results screen:', done);
if (!done) {
  await page.screenshot({ path: '/tmp/recorder/shot_stuck.png' });
  await browser.close(); process.exit(1);
}

await page.waitForTimeout(3500);
const card = page.getByText(/The price of being wrong/i).first();
const found = await vis(card);
console.log('ECONOMICS_CARD:', found);
if (found) {
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await card.locator('xpath=..').screenshot({ path: '/tmp/recorder/shot_econ_card.png' });
}
const share = page.getByRole('button', { name: /share today/i }).first();
if (await vis(share)) {
  await share.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await share.click();
  await page.waitForTimeout(900);
  const text = await page.evaluate(() => navigator.clipboard.readText().catch(() => 'BLOCKED'));
  console.log('--- SHARE TEXT ---\n' + text + '\n--- END ---');
  await page.screenshot({ path: '/tmp/recorder/shot_share.png' });
} else console.log('NO_SHARE_BUTTON');
console.log('RESULTS_A11Y', JSON.stringify(await page.evaluate(AUDIT)));
await page.screenshot({ path: '/tmp/recorder/shot_full.png', fullPage: true });
await browser.close();
console.log('DONE');
} catch (e) { console.log('DRIVER_ERROR', e.message); try { await page.screenshot({ path: '/tmp/recorder/shot_err.png' }); } catch {} try { await browser.close(); } catch {} process.exit(2); }
