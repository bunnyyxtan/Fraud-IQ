// Eyeball-sample screenshots: the 2 longest-content cards of every kind,
// plus every popup (no body scroll container historically) and a spread of
// intel files, at two viewports, normal + wrong-call reveal.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
const BASE = (process.env.AUDIT_BASE || 'http://localhost:5173').replace(/\/$/, '');
const OUT_DIR = path.join(__dirname, '..', '.audit', 'shots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-prefers-reduced-motion'],
  });
  for (const vp of [{ w: 402, h: 874 }, { w: 360, h: 700 }]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/audit?i=0`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => typeof window.__audit === 'function', { timeout: 30000 });
    const cards = await page.evaluate(() => window.__auditCards);

    const picks = new Map();
    const kinds = [...new Set(cards.map((c) => c.kind))];
    for (const kind of kinds) {
      const byLen = cards
        .map((c, i) => ({ ...c, i }))
        .filter((c) => c.kind === kind)
        .sort((a, b) => b.len - a.len);
      byLen.slice(0, 2).forEach((c) => picks.set(c.i, c));
      // also the longest boss of this kind, bosses have the beefiest bodies
      const boss = byLen.find((c) => c.boss);
      if (boss) picks.set(boss.i, boss);
    }

    for (const [i, c] of picks) {
      for (const reveal of [false, 'wrong']) {
        await page.evaluate(([i, reveal]) => window.__audit(i, 'card', reveal), [i, reveal]);
        await page.waitForTimeout(250);
        const tag = reveal === 'wrong' ? '-wrong' : '';
        await page.screenshot({ path: path.join(OUT_DIR, `${vp.w}x${vp.h}-${c.kind}-${c.id}${tag}.png`) });
      }
    }
    // intel sample: longest stat/headline entries only make sense visually;
    // take every 5th plus the last 16 (the new ones)
    const totals = await page.evaluate(() => window.__auditTotals);
    const intelIdx = new Set();
    for (let i = 0; i < totals.intel; i += 5) intelIdx.add(i);
    for (let i = Math.max(0, totals.intel - 16); i < totals.intel; i++) intelIdx.add(i);
    for (const i of intelIdx) {
      const meta = await page.evaluate(([i]) => window.__audit(i, 'intel', false), [i]);
      await page.waitForSelector('text=Filed. Next case', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.w}x${vp.h}-intel-${meta.id}.png`) });
    }
    await ctx.close();
  }
  await browser.close();
  console.log('shots:', fs.readdirSync(OUT_DIR).length);
};

run().catch((e) => { console.error(e); process.exit(1); });
