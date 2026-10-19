// UI smoke test in jsdom for the whole site: every route of both processors, one start of every game,
// the sandbox flows of both, link rewriting, legacy URLs and the one-time progress migration.
// usage: NODE_PATH=<dir with node_modules/jsdom> node tests/ui-smoke.js
'use strict';
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const errors = [];
const mkConsole = () => { const vc = new VirtualConsole(); vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.detail && e.detail.stack || e.message))); vc.on('error', (...a) => errors.push('console.error: ' + a.join(' '))); return vc; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0; const fail = (m) => { bad++; console.log('FAIL', m); };

async function open(storage) {
  const store = new Map(Object.entries(storage || {}));
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', 'index.html'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: mkConsole(),
    beforeParse(w) { Object.defineProperty(w, 'localStorage', { value: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } }); w.scrollTo = () => {}; w.TextEncoder = require('util').TextEncoder; w.confirm = () => true; w.prompt = () => 'test project'; },
  });
  const w = dom.window;
  await new Promise((r) => (w.document.readyState === 'complete' ? r() : w.addEventListener('load', r)));
  await sleep(200);
  return { dom, w, d: w.document, store };
}

(async () => {
  /* ---- migration from the old single-processor sites ---- */
  const old68 = { xp: 120, cards: { 'regs:abc': { box: 3, due: 0, seen: 3, miss: 0 } }, stats: { right: 10, wrong: 2, games: { tracer: 5 } }, bestRun: 4, days: ['2026-10-14'], badges: { first: '2026-10-14' }, daily: { '2026-10-14': 120 } };
  const oldZ = { xp: 30, cards: {}, stats: { right: 3, wrong: 1, games: { flags: 2 } }, bestRun: 2, days: ['2026-10-15'], badges: {}, daily: {} };
  const m = await open({ 'q68k.v1': JSON.stringify(old68), 'qz80.v1': JSON.stringify(oldZ), 'q68k.projects.v1': JSON.stringify({ prog1: { src: ' NOP', updated: 1 } }) });
  const st = m.w.Store.state;
  if (st.xp !== 150 || st.stats.right !== 13 || st.stats.games.tracer !== 5 || st.stats.games.flags !== 2 || st.bestRun !== 4 || st.days.length !== 2 || !st.cards['regs:abc']) fail('progress migration: ' + JSON.stringify(st).slice(0, 200));
  if (!m.store.has('qbee425.v1')) fail('migrated progress not saved under the new key');
  if (m.w.PACKS.list.m68k.Projects.list().length !== 1) fail('68K projects not visible after the merge');
  m.w.close();

  const { w, d } = await open();
  const go = async (h) => { w.location.hash = h; await sleep(40); const app = d.getElementById('app'); if (/Something broke/.test(app.textContent)) fail(`route ${h}: ${app.querySelector('pre') && app.querySelector('pre').textContent.slice(0, 300)}`); return app; };
  const click = (id) => d.getElementById(id).click();

  // course pages
  let app = await go('#/'); if (app.querySelectorAll('.machine').length !== 2) fail('course home should show two machines');
  { const z = app.querySelector('.machine[data-pack="z80"]'); const before = z.querySelector('.mregs').textContent; z.querySelector('.mstep').click(); z.querySelector('.mstep').click(); if (z.querySelector('.mregs').textContent === before) fail('home machine did not advance when stepped'); if (!z.querySelector('.ml.on')) fail('home machine shows no current line'); const m = app.querySelector('.machine[data-pack="m68k"]'); m.querySelector('.mstep').click(); if (m.querySelector('.mcount').textContent === '0 instructions') fail('68k home machine did not advance'); }
  await go('#/progress'); if (!d.getElementById('bk') || !/68000/.test(d.getElementById('app').textContent) || !/Zilog Z80/.test(d.getElementById('app').textContent)) fail('progress page should list both processors');
  // legacy URL from the old 68K site
  w.location.hash = '#/cards'; await sleep(60); if (w.location.hash !== '#/68k/cards') fail('legacy #/cards did not redirect: ' + w.location.hash);
  w.location.hash = '#/sandbox?c=abc'; await sleep(60); if (!/^#\/68k\/sandbox/.test(w.location.hash)) fail('legacy sandbox link');

  const routes = ['', 'cards', 'arcade', 'read', 'guides', 'glossary', 'tests', 'sandbox', 'study/all', 'study/weak'];
  for (const id of w.PACKS.order) {
    const pk = w.PACKS.list[id], slug = pk.PACK_UI.slug, base = `#/${slug}/`;
    const rs = [...routes, ...pk.QUEST_GUIDES.GUIDES.map((g) => 'guide/' + g.id), ...pk.QUEST.WORLDS.map((x) => 'world/' + x.id), ...pk.QUEST.WORLDS.map((x) => 'study/' + x.id), ...(pk.PACK_UI.navExtra.length ? ['homework'] : [])];
    for (const r of rs) {
      app = await go(base + r);
      if (app.textContent.trim().length < 40) fail(`${slug}/${r} is empty`);
      const bare = [...app.querySelectorAll('a[href^="#/"]')].filter((a) => { const h = a.getAttribute('href'); return h !== '#/' && !/^#\/(68k|z80|progress)(\/|$)/.test(h); });
      if (bare.length) fail(`${slug}/${r}: ${bare.length} link(s) not prefixed, e.g. ${bare[0].getAttribute('href')}`);
      if (w.PACKS.cur !== id) fail(`${slug}/${r}: wrong processor active`);
      const em = app.textContent.match(/(?![\u2190-\u21FF\u25A0-\u25FF])\p{Extended_Pictographic}/u); if (em) fail(`${slug}/${r}: emoji in page text: ${em[0]}`);
    }
    for (const g of ['tracer', 'flags', 'branch', 'modes', 'bugs', 'numbers', 'hardware', 'blitz']) {
      for (const lv of (g === 'blitz' ? ['', pk.QUEST.WORLDS[0].id] : ['easy', 'medium', 'hard'])) {
        app = await go(`${base}game/${g}${lv ? '/' + lv : ''}`);
        if (!app.querySelector('.q')) fail(`game ${slug}/${g}/${lv} shows no question: ${app.textContent.slice(0, 100)}`);
      }
    }
    await go(base + 'game/sorter'); if (!d.querySelector('.line')) fail(slug + ' sorter shows no lines');
    // tests page shows this processor's audit
    await go(base + 'tests'); await sleep(80); if (!/Content audit summary/.test(d.getElementById('app').textContent)) fail(slug + ' tests page has no audit table');
    // Read Code
    await go(base + 'read'); const inp = d.getElementById('rdline'); inp.dispatchEvent(new w.Event('input')); if (d.getElementById('rdout').textContent.length < 20) fail(slug + ' Read Code explains nothing');
  }
  // 68K homework pages (only the 68000 has them)
  app = await go('#/68k/homework/hw2/1'); if (!/Problem 1/.test(app.textContent)) fail('68k homework problem page'); if (![...app.querySelectorAll('a')].every((a) => !/^#\/homework/.test(a.getAttribute('href') || ''))) fail('homework links not prefixed');
  app = await go('#/z80/homework'); if (/Homework 2/.test(app.textContent)) fail('Z80 should not show 68K homework');
  // a topic is a lesson plan; a long guide has contents; the nav names the four activities
  app = await go('#/68k/world/inst'); if (app.querySelectorAll('.step').length < 4 || !/Previous|Next/.test(app.textContent)) fail('topic page should be a numbered lesson plan with previous/next');
  app = await go('#/z80/guide/instructions'); if (!app.querySelector('.toc a')) fail('long guide should show a contents list');
  app = await go('#/68k/'); if (!/How to study/.test(app.textContent) || !/Start with topic 1/.test(app.textContent)) fail('first visit should say where to start');
  { const names = [...d.querySelectorAll('.nav a')].map((a) => a.textContent); if (!['Topics', 'Guides', 'Flashcards', 'Practice', 'Explain code', 'Sandbox'].every((n) => names.includes(n))) fail('nav labels: ' + names.join(',')); }
  // header switches with the processor
  await go('#/z80/'); if (!/Z80/.test(d.title) || !d.querySelector('#cpusw a.on') || d.querySelector('#cpusw a.on').textContent !== 'Z80') fail('processor switcher state');
  if (![...d.querySelectorAll('.nav a')].some((a) => a.getAttribute('href') === '#/z80/sandbox')) fail('nav links not prefixed for Z80');
  await go('#/68k/'); if (![...d.querySelectorAll('.nav a')].some((a) => a.getAttribute('href') === '#/68k/homework')) fail('68K nav has no Homework');

  // Z80 sandbox: hello, step/back, IN prompt, interrupts, errors
  await go('#/z80/sandbox'); let sel = d.getElementById('ex');
  click('asm'); await sleep(60); if (d.getElementById('listing').hidden) fail('z80 sandbox: listing not shown');
  click('run'); await sleep(300); if (!/Hello, Z80!/.test(d.getElementById('out').textContent)) fail('z80 hello output: ' + JSON.stringify(d.getElementById('out').textContent));
  sel.value = '1'; sel.dispatchEvent(new w.Event('change')); click('asm'); await sleep(50);
  click('step'); click('step'); click('step'); click('back'); click('back'); click('back');
  if (!/0100H/.test(d.getElementById('status').textContent)) fail('z80 step back: ' + d.getElementById('status').textContent);
  click('rst'); click('run'); await sleep(300); if (!/HALT executed/.test(d.getElementById('status').textContent)) fail('z80 sum did not halt: ' + d.getElementById('status').textContent);
  sel.value = '5'; sel.dispatchEvent(new w.Event('change')); click('asm'); await sleep(50); click('run'); await sleep(200);
  if (!/waiting for a value/.test(d.getElementById('status').textContent)) fail('z80 echo did not wait: ' + d.getElementById('status').textContent);
  d.getElementById('txt').value = 'Z80'; d.getElementById('textform').dispatchEvent(new w.Event('submit', { cancelable: true })); await sleep(400);
  if (!/Z80\n/.test(d.getElementById('out').textContent)) fail('z80 echo output: ' + JSON.stringify(d.getElementById('out').textContent));
  sel.value = '11'; sel.dispatchEvent(new w.Event('change')); click('asm'); await sleep(50); click('run'); await sleep(100); click('int'); await sleep(100); click('int'); await sleep(100); click('pause');
  if (!/\*\*/.test(d.getElementById('out').textContent)) fail('z80 interrupt output');
  d.getElementById('src').value = '        LD A,FFH\n        JP NOWHERE\n'; click('asm'); await sleep(30); if (d.getElementById('problems').hidden) fail('z80 errors not shown');
  // share link carries the processor
  click('share'); await sleep(50); if (!/^#\/z80\/sandbox\?c=/.test(w.location.hash) && !/sandbox/.test(d.getElementById('status').textContent)) fail('z80 share link: ' + w.location.hash);

  // 68K sandbox: assemble and run the first example
  await go('#/68k/sandbox'); sel = d.getElementById('ex'); click('asm'); await sleep(80);
  if (d.getElementById('listing').hidden) fail('68k sandbox: listing not shown: ' + d.getElementById('status').textContent);
  click('run'); await sleep(400); if (!/SIMHALT|halted|HALT/i.test(d.getElementById('status').textContent) && d.getElementById('out').textContent.length === 0) fail('68k sandbox did not finish: ' + d.getElementById('status').textContent);
  click('step'); click('back');
  // projects are separate per processor
  w.PACKS.list.m68k.Projects.save('only68', ' NOP'); w.PACKS.list.z80.Projects.save('onlyz80', ' NOP');
  if (w.PACKS.list.m68k.Projects.list().some((p) => p.name === 'onlyz80') || w.PACKS.list.z80.Projects.list().some((p) => p.name === 'only68')) fail('projects leaked between processors');
  const back = JSON.parse(w.ProjectsAll.backup(null, { progress: null })); if (!back.projects.m68k.only68 || !back.projects.z80.onlyz80 || back.version !== 2) fail('combined backup');
  const res = w.ProjectsAll.restore(JSON.stringify({ app: '68K Quest', type: 'backup', version: 1, projects: { legacy: { src: ' NOP', updated: 1 } } })); if (res.added !== 1 || !w.PACKS.list.m68k.Projects.get('legacy')) fail('restore of an old 68K Quest backup');
  const zip = w.ProjectsAll.zipEverything(); if (!zip || zip.length < 100) fail('zipEverything');
  // progress is shared
  await go('#/z80/game/tracer/easy'); const xp0 = w.Store.state.xp; w.Store.addXp(5); if (w.Store.state.xp !== xp0 + 5) fail('xp'); w.Store.record('tracer', true);
  await go('#/68k/game/tracer/easy'); w.Store.record('tracer', true); if (!(w.Store.state.packs.z80 && w.Store.state.packs.m68k)) fail('both-processor tracking');

  console.log(errors.length ? 'page errors:\n' + errors.join('\n') : 'no page errors');
  console.log(bad || errors.length ? `${bad} UI check(s) failed` : 'UI smoke test passed');
  w.close(); process.exit(bad || errors.length ? 1 : 0);
})();
