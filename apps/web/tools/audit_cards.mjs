// Automated clipping/overflow audit for every card and intel file.
// Drives the dev-only /audit page (real PlayScreen geometry) with the
// window.__audit hook and measures the DOM for:
//   - vclip: content taller than a non-scrollable clipping box (text cut)
//   - hclip: content wider than its box with no ellipsis (text cut sideways)
//   - topclip: scrollable box whose content starts above the reachable top
//     (the flex justify-center/justify-end + overflow bug)
// Runs each card at a tall phone (402x874) and a short phone (402x700),
// plus a reveal pass (tells highlighted + feedback overlay) at 874.
//
// Usage: node tools/audit_cards.mjs [--shots]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
const BASE = (process.env.AUDIT_BASE || 'http://localhost:5173').replace(/\/$/, '');
const SHOTS = process.argv.includes('--shots');
const OUT_DIR = path.join(__dirname, '..', '.audit');
fs.mkdirSync(OUT_DIR, { recursive: true });

const MEASURE = () => {
  const issues = [];
  const root = document.querySelector('main') || document.body;
  if (!root) return { error: 'no root' };
  const desc = (el) => {
    const cls = (typeof el.className === 'string' ? el.className : '')
      .split(/\s+/).filter(Boolean).slice(0, 6).join('.');
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return { tag: el.tagName.toLowerCase(), cls, text };
  };
  const els = [root, ...root.querySelectorAll('*')];
  for (const el of els) {
    if (el.closest('[data-audit-ignore]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const scrollableY = /(auto|scroll)/.test(cs.overflowY);
    const clipX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
    const clipY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
    // horizontal cut with no ellipsis affordance
    if (clipX && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis') {
      // ignore boxes whose only overflow comes from an ellipsized descendant
      const hasEllipsisChild = [...el.querySelectorAll('*')].some(
        (c) => getComputedStyle(c).textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth + 2,
      );
      if (!hasEllipsisChild) {
        issues.push({ type: 'hclip', over: el.scrollWidth - el.clientWidth, ...desc(el) });
      }
    }
    // vertical cut in a non-scrollable clipping box
    if (clipY && !scrollableY && el.scrollHeight > el.clientHeight + 2) {
      // flex rows clip decorative bleed on purpose only when marked
      issues.push({ type: 'vclip', over: el.scrollHeight - el.clientHeight, ...desc(el) });
    }
    // scrollable but the top of the content is unreachable
    if (scrollableY && el.scrollHeight > el.clientHeight + 2) {
      el.scrollTop = 0;
      const cr = el.getBoundingClientRect();
      let minTop = Infinity;
      for (const ch of el.children) {
        const chr = ch.getBoundingClientRect();
        if (chr.height > 0) minTop = Math.min(minTop, chr.top);
      }
      if (minTop < cr.top - 3) {
        issues.push({ type: 'topclip', over: Math.round(cr.top - minTop), ...desc(el) });
      }
    }
  }
  return { issues };
};

async function settle(page, ms = 120) {
  await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))));
  await page.waitForTimeout(ms);
}

async function auditPass(page, mode, i, reveal) {
  const meta = await page.evaluate(
    ([i, mode, reveal]) => window.__audit(i, mode, reveal),
    [i, mode, reveal],
  );
  if (!meta.id) return null;
  if (mode === 'intel') {
    // wait for the dossier to auto-open (800ms) and the continue button
    await page.waitForSelector('text=Filed. Next case', { timeout: 5000 }).catch(() => {});
  }
  await settle(page, mode === 'intel' ? 250 : 150);
  const res = await page.evaluate(MEASURE);
  return { id: meta.id, issues: res.issues || [], total: meta.total };
}

const run = async () => {
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-prefers-reduced-motion'],
  });
  const findings = [];
  let cardTotal = 0;
  let intelTotal = 0;

  const ALL_VPS = [{ w: 402, h: 874 }, { w: 402, h: 700 }, { w: 360, h: 740 }];
  const only = process.env.AUDIT_VPS; // e.g. "402x874" to run one viewport
  const vps = only ? ALL_VPS.filter((v) => only.split(',').includes(`${v.w}x${v.h}`)) : ALL_VPS;
  for (const vp of vps) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    let ready = false;
    for (let attempt = 0; attempt < 3 && !ready; attempt++) {
      await page.goto(`${BASE}/audit?i=0`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      ready = await page
        .waitForFunction(() => typeof window.__audit === 'function', { timeout: 20000 })
        .then(() => true)
        .catch(() => false);
    }
    if (!ready) throw new Error(`audit hook never appeared at ${vp.w}x${vp.h}`);
    const totals = await page.evaluate(() => window.__auditTotals);
    cardTotal = totals.cards;
    intelTotal = totals.intel;

    const passes = vp.h === 874 ? [false, true, 'wrong'] : [false, 'wrong'];
    for (let i = 0; i < totals.cards; i++) {
      for (const reveal of passes) {
        const r = await auditPass(page, 'card', i, reveal);
        if (r && r.issues.length) {
          findings.push({ vp: `${vp.w}x${vp.h}`, mode: 'card', reveal, i, id: r.id, issues: r.issues });
          fs.writeFileSync(path.join(OUT_DIR, 'findings.json'), JSON.stringify(findings, null, 2));
          if (SHOTS) {
            const tag = reveal === 'wrong' ? '-wrong' : reveal ? '-reveal' : '';
            await page.screenshot({ path: path.join(OUT_DIR, `card-${r.id}-${vp.w}x${vp.h}${tag}.png`) });
          }
        }
      }
      if (i % 40 === 0) process.stdout.write(`  cards ${i}/${totals.cards} @${vp.h}\n`);
    }
    for (let i = 0; i < totals.intel; i++) {
      const r = await auditPass(page, 'intel', i, false);
      if (r && r.issues.length) {
        findings.push({ vp: `${vp.w}x${vp.h}`, mode: 'intel', i, id: r.id, issues: r.issues });
        fs.writeFileSync(path.join(OUT_DIR, 'findings.json'), JSON.stringify(findings, null, 2));
        if (SHOTS) {
          await page.screenshot({ path: path.join(OUT_DIR, `intel-${r.id}-${vp.h}.png`) });
        }
      }
    }
    await ctx.close();
  }

  await browser.close();
  const suffix = process.env.AUDIT_VPS ? `-${process.env.AUDIT_VPS.replace(/[^0-9x]/g, '_')}` : '';
  fs.writeFileSync(path.join(OUT_DIR, `findings${suffix}.json`), JSON.stringify(findings, null, 2));
  console.log(`\nAudited ${cardTotal} cards and ${intelTotal} intel files.`);
  console.log(`Flagged ${findings.length} render passes. Full detail: .audit/findings.json`);
  const byId = new Map();
  for (const f of findings) {
    const key = `${f.mode}:${f.id}`;
    const entry = byId.get(key) || { types: new Set(), passes: 0 };
    entry.passes++;
    f.issues.forEach((x) => entry.types.add(`${x.type}(${x.tag}.${x.cls.split('.')[0]}+${x.over}px)`));
    byId.set(key, entry);
  }
  for (const [k, v] of byId) console.log(`${k} [${v.passes} passes] ${[...v.types].join(' ')}`);
};

run().catch((e) => { console.error(e); process.exit(1); });
