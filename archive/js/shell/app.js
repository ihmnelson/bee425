(function () {
  'use strict';
  const S = Store;
  const G = new Proxy({}, { get: (_, k) => window.Games[k] });          // always the open processor's games
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $app = document.getElementById('app');
  const P = () => PACKS.cur;                                            // id of the open processor, or null on course pages
  const UI = () => PACKS.ui;
  const slugOf = (id) => PACKS.list[id].PACK_UI.slug;
  const packBySlug = (slug) => PACKS.order.find((id) => PACKS.list[id].PACK_UI.slug === slug);
  const here = () => '#/' + slugOf(P()) + '/';
  // go to a route of the open processor (or an absolute route when it already names one)
  const go = (h) => { location.hash = /^#\/(68k|z80|sys|progress|compare)/.test(h) || !P() ? h : h.replace(/^#\//, here()); };
  const worldById = (id) => QUEST.WORLDS.find((w) => w.id === id);

  /* ---------- helpers ---------- */
  function toast(msg, cls) {
    const t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.textContent = msg;
    document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 2600);
  }
  // XP is counted quietly; only a new level or a milestone is announced
  function award(n) {
    const before = S.level(S.state.xp);
    S.addXp(n);
    const after = S.level(S.state.xp);
    if (after > before) toast(`Level ${after} reached`, 'badge-t');
    S.newBadges().forEach((b) => toast(`Milestone: ${b.name}`, 'badge-t'));
    S.save(); renderHud();
    return n;
  }
  function renderHud() {
    const due = (P() ? [PACKS.list[P()]] : PACKS.order.map((id) => PACKS.list[id])).reduce((n, pk) => n + pk.QUEST.CARDS.filter((c) => S.cardState(c).due <= Date.now()).length, 0);
    const days = S.streakDays();
    document.getElementById('hud').innerHTML = `<a href="${P() ? here() + 'study/all' : '#/'}" title="Review the cards that are due"><b>${due}</b> cards due</a>${days ? `<span><b>${days}</b> day streak</span>` : ''}`;
  }
  const colorize = (src) => esc(src).split('\n').map((l) => UI().colorize(l)).join('\n');

  function setNav(name) { document.querySelectorAll('.nav a[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === name)); }
  // one bit per card, drawn as a logic-analyser trace: high where the card is mastered
  function trace(bits, label) {
    const n = bits.length; if (!n) return '';
    const hi = 3, lo = 11, cw = 100 / n; let d = '', prev = null;
    bits.forEach((b, i) => { const y = b ? hi : lo; d += (i === 0 ? `M0 ${y}` : b !== prev ? `L${i * cw} ${y}` : '') + `L${(i + 1) * cw} ${y}`; prev = b; });
    let ticks = ''; if (n <= 48) for (let i = 1; i < n; i++) ticks += `M${i * cw} ${lo - 1}L${i * cw} 14`;      // one tick per card boundary
    return `<svg class="trace" viewBox="0 0 100 14" preserveAspectRatio="none" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><path class="tick" d="${ticks}" stroke-width="1" vector-effect="non-scaling-stroke"/><path class="sig" d="${d}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  }
  const traceOf = (cards, noun) => trace(cards.map((c) => S.isMastered(c)), `${cards.filter(S.isMastered).length} of ${cards.length} ${noun || 'cards'} mastered`);
  const mastery = (deck) => { const cs = QUEST.CARDS.filter((c) => c.deck === deck); return { n: cs.length, m: cs.filter(S.isMastered).length, cs }; };
  const dueCards = (deck) => QUEST.CARDS.filter((c) => (!deck || c.deck === deck) && S.cardState(c).due <= Date.now());

  // a list row: icon, name and description, optional trace, and a short note on the right
  const item = (href, icon, name, sub, mid, end) => `<a class="item" href="${href}"><span class="ico">${icon ? ico(icon) : ''}</span><span class="main"><span class="nm">${esc(name)}</span><span class="sub">${esc(sub || '')}</span></span><span class="mid">${mid || ''}</span><span class="end">${end || ''}</span></a>`;

  const lessonText = (l) => (/^L\d+, slides? /.test(l) ? l.replace(/^L/, 'Lesson ') : /^L\d/.test(l) ? (/-/.test(l) ? 'Lessons ' : 'Lesson ') + l.slice(1) : l);
  const gameById = (id) => UI().arcade.find((g) => g[0] === id);
  const topicsFor = (gid) => Object.entries(UI().topicGames).filter(([, gs]) => gs.includes(gid)).map(([t]) => worldById(t)).filter(Boolean);
  // the four things you do with a processor's pages, in the order that works
  const HOW = () => { const b = (UI().how && UI().how.build) || ['Build', 'Write a program, run it, step through it.']; return `<ol class="how">
    <li><a href="#/guides"><b>Learn</b><span>Read the guide for a topic.</span></a></li>
    <li><a href="#/cards"><b>Remember</b><span>Review flashcards. A card you miss comes back sooner.</span></a></li>
    <li><a href="#/arcade"><b>Practice</b><span>Drills with a new question every time.</span></a></li>
    <li><a href="#/sandbox"><b>${b[0]}</b><span>${b[1]}</span></a></li>
  </ol>`; };

  /* ---------- views ---------- */
  function viewMap() {
    setNav('home');
    const due = dueCards().length, fresh = QUEST.CARDS.every((c) => S.cardState(c).seen === 0), first = QUEST.WORLDS[0];
    const rows = QUEST.WORLDS.map((w, i) => { const m = mastery(w.id); return item('#/world/' + w.id, w.icon, `${i + 1}. ${w.name}`, w.blurb, traceOf(m.cs), `${m.m} of ${m.n} mastered<br>${esc(lessonText(w.lesson))}`); }).join('');
    $app.innerHTML = `
      <h1>${UI().hero.title}</h1>
      <p class="lede">${UI().hero.lede}</p>
      <h2 class="h-s">How to study</h2>${HOW()}
      <div class="row" style="margin-top:var(--s4)">${fresh ? `<a class="btn go" href="#/world/${first.id}">Start with topic 1: ${esc(first.name)}</a>` : `<a class="btn go" href="#/study/all">Review due cards (${due})</a>`}${UI().hero.buttons.map((b) => `<a class="btn ${b[2]}" href="${b[0]}">${b[1]}</a>`).join('')}</div>
      <div class="sec"><h2>Topics</h2><small>in lecture order; in each trace, one bit per flashcard, high when mastered</small></div>
      <div class="items">${rows}</div>`;
  }

  /* Mock exam: one sitting, one countdown, answers shown at the end with a score by topic */
  const MOCK_LESSON = { regs: 'registers', num: 'numbers', dirs: 'running', inst: 'registers', modes: 'modes', flow: 'branches', hw: 'decoding', io: 'io' };
  function viewMock() {
    setNav('mock');
    const bank = QUEST.QUIZ.filter((q) => q.correct != null), worlds = QUEST.WORLDS.filter((w) => bank.some((q) => q.world === w.id));
    const hist = () => (S.state.mock = S.state.mock || []);
    const setup = () => {
      const last = hist().slice(-5).reverse();
      $app.innerHTML = `<h1>Mock exam</h1><p class="lede">A timed practice test on this processor's topics: ${bank.length} questions in the bank. Answer everything, then submit; you see the answers and a score for each topic. Nothing is revealed while you work, as in the real exam. Exams are a quarter of your grade each, and they ask about the homework and labs, so use the <a href="#/homework">homework pages</a> too.</p>
        <div class="panel"><h3>Topics to include</h3><div class="row" style="flex-wrap:wrap;gap:12px">${worlds.map((w) => `<label><input type="checkbox" name="w" value="${w.id}" checked> ${esc(w.name)} <span class="stat">(${bank.filter((q) => q.world === w.id).length})</span></label>`).join('')}</div>
        <p style="margin-top:12px"><label>Questions <select id="mn">${[10, 20, 30, bank.length].filter((v, k, arr) => v <= bank.length && arr.indexOf(v) === k).map((v) => `<option value="${v}" ${v === 20 || (bank.length < 20 && v === bank.length) ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        &nbsp; <label>Minutes <select id="mt"><option value="0">no limit</option><option value="15">15</option><option value="30" selected>30</option><option value="45">45</option></select></label></p>
        <button class="btn go" id="begin">Begin</button></div>
        ${last.length ? `<h2 class="h-s">Recent attempts</h2><ul class="plain">${last.map((h) => `<li>${new Date(h.t).toLocaleDateString()}: <b>${h.right} of ${h.n}</b> (${Math.round(100 * h.right / h.n)}%)</li>`).join('')}</ul>` : ''}`;
      $app.querySelector('#begin').onclick = () => {
        const on = [...$app.querySelectorAll('input[name=w]:checked')].map((x) => x.value), pool = bank.filter((q) => on.includes(q.world));
        if (!pool.length) return;
        run(G.shuffle(pool).slice(0, Math.min(+$app.querySelector('#mn').value, pool.length)), +$app.querySelector('#mt').value);
      };
    };
    function run(qs, mins) {
      const items = qs.map((q) => ({ q, opts: G.shuffle([q.correct, ...q.wrong]) })); let timerId = null, ended = false;
      $app.innerHTML = `<h1>Mock exam</h1><div class="row" style="position:sticky;top:0;background:var(--paper,#fff);padding:8px 0;z-index:2;justify-content:space-between"><span class="stat"><b id="mans">0</b> of ${items.length} answered</span><span class="stat" id="mclock">${mins ? mins + ':00' : 'no time limit'}</span><button class="btn go" id="msubmit">Submit</button></div>
        <ol class="mock">${items.map((it, k) => `<li class="panel" style="margin:12px 0;list-style-position:inside"><p class="q" style="display:inline">${esc(it.q.q)}</p><div class="opts" style="margin-top:8px">${it.opts.map((o, j) => `<label class="opt" style="display:flex;gap:8px;cursor:pointer"><input type="radio" name="q${k}" value="${j}"> <span>${esc(o)}</span></label>`).join('')}</div></li>`).join('')}</ol>`;
      const answered = () => items.filter((_, k) => $app.querySelector(`input[name=q${k}]:checked`)).length;
      $app.onchange = () => { const e = document.getElementById('mans'); if (e) e.textContent = answered(); };
      const t0 = Date.now(), tick = () => { if (!mins) return; const left = Math.max(0, mins * 60 - Math.floor((Date.now() - t0) / 1000)), el = document.getElementById('mclock'); if (el) el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left`; if (!left) finish(true); };
      if (mins) timerId = setInterval(tick, 500);
      const finish = (timeUp) => {
        if (ended) return; ended = true; clearInterval(timerId); leaveHook = null;
        const picked = items.map((it, k) => { const c = $app.querySelector(`input[name=q${k}]:checked`); return c ? it.opts[+c.value] : null; });
        const right = picked.filter((p, k) => p === items[k].q.correct).length, by = {};
        items.forEach((it, k) => { const b = (by[it.q.world] = by[it.q.world] || { n: 0, r: 0 }); b.n++; if (picked[k] === it.q.correct) b.r++; });
        hist().push({ t: Date.now(), n: items.length, right }); if (hist().length > 20) S.state.mock = hist().slice(-20); award(Math.round(30 * right / items.length)); S.save();
        const pct = Math.round(100 * right / items.length), lessonLink = (w) => (MOCK_LESSON[w] ? `<a href="#/start/${MOCK_LESSON[w]}">review the Start here lesson</a> or ` : '');
        $app.innerHTML = `<h1>Mock exam result</h1>${timeUp ? '<p class="stat">Time ran out; unanswered questions count as wrong.</p>' : ''}<div class="panel"><p class="q"><b>${right} of ${items.length}</b> correct (${pct}%)</p></div>
          <h2 class="h-s">By topic</h2><div class="tablewrap"><table class="gt"><thead><tr><th>Topic</th><th>Score</th><th>What to do</th></tr></thead><tbody>${Object.entries(by).map(([w, b]) => `<tr><td>${esc((worldById(w) || { name: w }).name)}</td><td>${b.r} / ${b.n}</td><td>${b.r === b.n ? 'solid' : `${lessonLink(w)}<a href="#/world/${w}">open the topic</a>`}</td></tr>`).join('')}</tbody></table></div>
          <h2 class="h-s">Every question</h2>${items.map((it, k) => { const ok = picked[k] === it.q.correct; return `<div class="panel" style="margin:10px 0"><p class="q">${ok ? 'Correct. ' : picked[k] === null ? 'Not answered. ' : 'Wrong. '}${esc(it.q.q)}</p><p>Answer: <b>${esc(it.q.correct)}</b>${!ok && picked[k] ? `<br>You chose: ${esc(picked[k])}` : ''}</p>${it.q.why ? `<p class="stat">${esc(it.q.why)}</p>` : ''}</div>`; }).join('')}
          <div class="row"><button class="btn go" id="again">Another attempt</button></div>`;
        $app.querySelector('#again').onclick = setup; renderHud();
      };
      $app.querySelector('#msubmit').onclick = () => { const n = answered(); if (n < items.length && !confirm(`${items.length - n} question(s) unanswered. Submit anyway?`)) return; finish(false); };
      leaveHook = () => clearInterval(timerId);
    }
    setup();
  }

  /* Start here (js/shell/start.js) and Labs (js/shell/labs.js): short lessons shared by both processors */
  function viewStart(id, kind) {
    const labs = kind === 'labs', base = labs ? 'labs' : 'start', title = labs ? 'Labs' : 'Start here';
    setNav(base);
    const L = labs ? START.LABS : START.LESSONS, st = () => (S.state[base] = S.state[base] || {}), enc = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const i = L.findIndex((l) => l.id === id), l = L[i];
    if (!l) {
      const n = L.filter((x) => st()[x.id]).length;
      $app.innerHTML = `<h1>${title}</h1><p class="lede">${labs ? 'The lectures say the exams ask lab questions. These pages cover what each lab taught: how the instruments and circuits work, the numbers you measured or calculated, and exam-style questions. They use only what the lab handouts say. Lab 3 is not here yet (no handout in the folder).' : 'New to this material? Work through these in order <b>before</b> you use flashcards. Each lesson explains one idea in plain words, works an example, and ends with a few questions to check you understood it.'} About ${L.reduce((a, x) => a + x.mins, 0)} minutes in all.</p>
        <p class="stat">${n} of ${L.length} marked understood.${labs ? '' : ' They follow Lectures 3 to 8; data conversion (Lesson 10) has its own <a href="#/sys/">section</a>.'}</p>
        <div class="items">${L.map((x, k) => item('#/' + base + '/' + x.id, '', `${k + 1}. ${x.title}`, x.goal, '', `${st()[x.id] ? 'understood' : x.mins + ' min'}`)).join('')}</div>
        <p class="stat" style="margin-top:var(--s4)">After a lesson, the guides go deeper, the flashcards help you remember it, and the homework pages let you practise solving problems yourself, which is what the exams test.</p>`;
      return;
    }
    const prev = L[i - 1], next = L[i + 1], nx = l.next || {};
    $app.innerHTML = `<p class="crumb"><a href="#/${base}">${title}</a> / ${i + 1} of ${L.length}</p><h1>${esc(l.title)}</h1>
      <p class="stat">${esc(/^L\d/.test(l.lecture) ? l.lecture.replace(/^L/, 'Lecture ') : l.lecture)} &middot; about ${l.mins} minutes &middot; you need: ${esc(l.needs)}</p>
      <div class="panel"><b>After this lesson you can:</b> ${esc(l.goal)}</div>
      <div class="guide">${FIGURES.place(START.render(l.md))}</div>
      ${(l.examples || []).map((e, k) => `<div class="panel" style="margin:12px 0"><h3>${esc(e.title)}</h3><pre class="code">${esc(e.src)}</pre><div class="row"><a class="btn" href="#/68k/sandbox?c=${enc(e.src)}">Open in the 68000 sandbox and step through it</a></div></div>`).join('')}
      <div class="sec"><h2>Check yourself</h2><small>try to answer before you open each one</small></div>
      ${l.check.map((c) => `<details class="wk" style="margin:6px 0"><summary class="btn">${esc(c[0])}</summary><p style="margin:8px 0 0">${esc(c[1])}</p></details>`).join('')}
      <div class="row" style="margin-top:16px"><button class="btn go" id="understood">${st()[l.id] ? 'Marked understood' : 'Mark understood'}</button></div>
      ${labs && !nx.z80 ? '' : '<div class="sec"><h2>Then</h2></div>'}
      <div class="row">${nx.guide ? `<a class="btn" href="#/68k/guide/${nx.guide}">Read the full guide</a>` : ''}${nx.topic ? `<a class="btn" href="#/68k/world/${nx.topic}">Open the topic: review the cards</a>` : ''}${nx.z80 ? `<a class="btn" href="#/z80/world/${nx.z80}">Open the Z80 topic: Bus Cycles and the Logic Analyzer</a>` : ''}${(nx.extra || []).map((x) => `<a class="btn" href="${x[0]}">${esc(x[1])}</a>`).join('')}</div>
      <div class="row" style="justify-content:space-between;margin-top:18px">${prev ? `<a class="btn" href="#/${base}/${prev.id}">Previous: ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/${base}/${next.id}">Next: ${esc(next.title)}</a>` : labs ? '<a class="btn" href="#/z80/">On to the Z80 pages</a>' : '<a class="btn" href="#/68k/world/regs">On to the topics</a>'}</div>`;
    const b = $app.querySelector('#understood');
    b.onclick = () => { if (!st()[l.id]) { st()[l.id] = true; S.save(); award(10); } b.textContent = 'Marked understood'; };
  }

  function viewCourse() {
    setNav('');
    const machine = (id) => {
      const pk = PACKS.list[id], ui = pk.PACK_UI, Q = pk.QUEST;
      const n = Q.CARDS.length, m = Q.CARDS.filter(S.isMastered).length, due = Q.CARDS.filter((c) => S.cardState(c).due <= Date.now()).length;
      return `<section class="machine" data-pack="${id}" style="--accent:var(--${ui.accent || (id === 'm68k' ? 'blue' : 'amber')})"><h2>${esc(ui.fullName)}</h2><p class="sub">${esc(ui.tagline)}</p>
        <div class="mbody"></div>
        <div class="mfoot">${traceOf(Q.CARDS)}<span class="stat">${m} of ${n} cards mastered, ${due} due</span><a class="btn go" href="#/${ui.slug}/">Open ${esc(ui.name)}</a></div></section>`;
    };
    const procs = PACKS.order.filter((id) => PACKS.list[id].PACK_UI.kind !== 'topic'), topics = PACKS.order.filter((id) => PACKS.list[id].PACK_UI.kind === 'topic');
    $app.innerHTML = `<h1>BEE 425 Quest</h1>
      <p class="lede">Study tools for Microprocessor System Design. Each processor has the same set of pages: topics that follow the lectures, written guides, flashcards, practice drills, and an assembler and simulator that run in the browser. Topics that belong to both processors, such as data conversion, have their own section.</p>
      <div class="panel"><b>Never seen any of this before?</b> <a href="#/start">Start here</a>: ten short lessons from bits and hex up to memory decoding and transistors, with questions to check yourself, before you touch flashcards or drills.</div>
      <h2 class="h-s">Which processor first?</h2>
      <ul class="plain"><li>If your lab or homework uses <b>EASy68K</b>, open the 68000.</li><li>If it uses the <b>Oshonsoft Z80 Simulator IDE</b>, open the Z80.</li><li>Not sure? Start with the 68000, which the lectures introduce first. The Z80 pages cover the same ideas on an 8-bit machine, so they work well for comparison.</li>${topics.length ? '<li>Studying A/D and D/A converters (Lesson 10)? That is not processor-specific: open <b>Data conversion</b> below.</li>' : ''}</ul>
      <h2 class="h-s">The two machines</h2>
      <p class="stat" style="margin:0 0 var(--s2)">Both are running real code now, on the same simulators the sandboxes use. Press Step to advance one instruction.</p>
      <div class="machines">${procs.map(machine).join('')}</div>
      ${topics.length ? `<h2 class="h-s">Shared topics</h2><p class="stat" style="margin:0 0 var(--s2)">The same for either processor. The machine shown is a successive-approximation converter finding a 4-bit code.</p><div class="machines">${topics.map(machine).join('')}</div>` : ''}
      <p class="stat" style="margin-top:var(--s4)">Your progress is shared across all of them. <a href="#/progress">See progress and back it up</a>.</p>`;
    $app.querySelectorAll('.machine').forEach((el) => Demo.mount(el.querySelector('.mbody'), PACKS.list[el.dataset.pack]));
  }

  function viewWorld(id) {
    setNav('home');
    const w = worldById(id); if (!w) return go('#/');
    const idx = QUEST.WORLDS.indexOf(w), prev = QUEST.WORLDS[idx - 1], nextW = QUEST.WORLDS[idx + 1];
    const m = mastery(id), due = dueCards(id).length, nq = QUEST.QUIZ.filter((q) => q.world === id).length;
    const gid = QUEST_GUIDES.DECK_GUIDE[id], guide = gid && QUEST_GUIDES.GUIDES.find((g) => g.id === gid);
    const games = (UI().topicGames[id] || []).map(gameById).filter(Boolean);
    const step = (title, text, extra, act) => `<li class="step"><div class="stepmain"><h3>${title}</h3><p>${text}</p>${extra || ''}</div><div class="stepact">${act}</div></li>`;
    const steps = [];
    if (guide) steps.push(step('Read the guide', `<b>${esc(guide.title)}.</b> ${esc(guide.summary)}`, '', `<a class="btn go" href="#/guide/${guide.id}">Open guide</a>`));
    steps.push(step('Review the flashcards', `${m.n} cards, ${due} due. ${m.m} mastered so far.`, traceOf(m.cs), `<a class="btn ${guide ? '' : 'go'}" href="#/study/${id}">Study cards</a>`));
    if (games.length) steps.push(step('Practice', games.map((g) => `<b>${esc(g[2])}.</b> ${esc(g[3])}`).join('<br>'), '', games.map((g) => `<a class="btn" href="#/game/${g[0]}">${esc(g[2])}</a>`).join('')));
    if (nq) steps.push(step('Check yourself', `A quiz of up to ${nq} multiple-choice questions on this topic.`, '', `<a class="btn" href="#/game/blitz/${id}">Start the quiz</a>`));
    if (UI().topicSandbox.includes(id)) steps.push(step('Try it yourself', UI().topicSandboxText || 'Run a program in the sandbox, or paste any line into Explain code to see what it does.', '', `<a class="btn" href="#/sandbox">${UI().sandboxLabel ? 'Open the ' + UI().sandboxLabel.toLowerCase() : 'Open sandbox'}</a>${UI().hasRead === false ? '' : '<a class="btn" href="#/read">Explain code</a>'}`));
    const cp = UI().compareTopics && UI().compareTopics[id];
    if (cp) steps.push(step('Compare with the ' + UI().twin.name, 'See the same job on both processors, run both versions, and read what differs and why.', '', `<a class="btn" href="#/compare/${cp}">Compare both</a>`));
    $app.innerHTML = `<p class="crumb"><a href="#/">Topics</a></p>
      <h1>${ico(w.icon)} ${idx + 1}. ${esc(w.name)}</h1><p class="lede">${esc(w.blurb)}. Covers ${esc(lessonText(w.lesson).toLowerCase())}.</p>
      <ol class="steps">${steps.join('')}</ol>
      <div class="row" style="justify-content:space-between;margin-top:var(--s5)">${prev ? `<a class="btn" href="#/world/${prev.id}">Previous: ${esc(prev.name)}</a>` : '<span></span>'}${nextW ? `<a class="btn" href="#/world/${nextW.id}">Next: ${esc(nextW.name)}</a>` : ''}</div>`;
  }

  function viewCards() {
    setNav('cards');
    const weak = QUEST.CARDS.filter((c) => { const s = S.cardState(c); return s.miss > 0 && s.box < 4; }).length;
    const rows = QUEST.WORLDS.map((w) => { const m = mastery(w.id), d = dueCards(w.id).length; return item('#/study/' + w.id, w.icon, w.name, '', traceOf(m.cs), `${m.n} cards<br>${d} due`); }).join('');
    $app.innerHTML = `<h1>Flashcards</h1><p class="lede">Each session shows up to 14 cards, hardest first. Answer from memory, flip the card, then say whether you knew it. A card you miss comes back sooner; one you know moves up one of five boxes and returns after 1, 2, 4 or 8 days. Box 4 and above counts as mastered.</p>
      <div class="row"><a class="btn go" href="#/study/all">Review all due cards (${dueCards().length})</a><a class="btn" href="#/study/weak">Weak spots (${weak})</a></div><div class="sec"><h2>Decks</h2></div><div class="items">${rows}</div>`;
  }

  function viewArcade() {
    setNav('arcade');
    const games = UI().arcade;
    $app.innerHTML = `<h1>Practice</h1><p class="lede">Drills with a new question every time. Most have easy, medium and hard levels. Each run is eight questions; correct answers earn XP. Not sure where to begin? Try Register Tracer on easy.</p><div class="items">${games.map((g) => { const ts = topicsFor(g[0]); return item('#/game/' + g[0], g[1], g[2], g[3], '', ts.length ? 'Topics: ' + ts.map((t) => esc(t.name)).join(', ') : (g[4] === 'all' ? 'All topics' : esc(g[4]))); }).join('')}</div>`;
  }

  function viewProgress() {
    setNav('progress');
    const s = S.state, lv = S.level(s.xp), tot = s.stats.right + s.stats.wrong;
    const worlds = PACKS.order.map((id) => { const pk = PACKS.list[id], Q = pk.QUEST; return `<tr><td colspan="3" style="padding-top:var(--s3)"><b>${esc(pk.PACK_UI.fullName)}</b></td></tr>` + Q.WORLDS.map((w) => { const cs = Q.CARDS.filter((c) => c.deck === w.id), m = cs.filter(S.isMastered).length; return `<tr><td style="white-space:nowrap">${ico(w.icon)} ${esc(w.name)}</td><td style="width:50%;padding:0 var(--s3)">${traceOf(cs)}</td><td class="mono">${m} of ${cs.length}</td></tr>`; }).join(''); }).join('');
    const badges = S.BADGES.map((b) => `<li class="${s.badges[b.id] ? 'done' : ''}"><span>${esc(b.name)}</span><span class="dim">${s.badges[b.id] ? 'reached ' + esc(String(s.badges[b.id]).slice(0, 10)) : 'not yet'}</span></li>`).join('');
    $app.innerHTML = `<h1>Progress</h1><div class="statgrid">
      <div class="panel"><b>${lv}</b>level</div><div class="panel"><b>${s.xp}</b>XP</div>
      <div class="panel"><b>${tot ? Math.round((s.stats.right / tot) * 100) : 0}%</b>accuracy (${tot})</div><div class="panel"><b>${s.bestRun}</b>best run</div><div class="panel"><b>${S.streakDays()}</b>day streak</div></div>
      <div class="sec"><h2>Mastery</h2></div><div class="panel"><table style="width:100%;border-collapse:collapse">${worlds}</table></div>
      <div class="sec"><h2>Milestones</h2></div><ul class="miles">${badges}</ul>
      <div class="sec"><h2>Back up your work</h2></div>
      <div class="panel"><p class="lede" style="margin-top:0">Everything is stored in this browser only. Export a backup before clearing site data or switching computers; it includes your saved sandbox projects for both processors and your study progress. Backups from the older 68K Quest and Z80 Quest sites can be restored here too.</p>
        <div class="row"><button class="btn go" id="bk">Export backup (.json)</button><button class="btn" id="bkzip">Export all projects (.zip)</button><label class="btn ghost" for="bkrest">Restore from backup…</label><input type="file" id="bkrest" accept=".json,application/json" hidden></div><p class="stat" id="bkmsg"></p></div>
      <div class="sec"><h2>Reset</h2></div><button class="btn bad" id="reset">Erase all progress</button>`;
    document.getElementById('bk').onclick = () => { ProjectsAll.download(`bee425-quest-backup-${ProjectsAll.stamp()}.json`, ProjectsAll.backup(null, { progress: S.state }), 'application/json'); document.getElementById('bkmsg').textContent = 'Backup downloaded.'; };
    document.getElementById('bkzip').onclick = () => { const z = ProjectsAll.zipEverything(); document.getElementById('bkmsg').textContent = z ? (ProjectsAll.download(`bee425-quest-projects-${ProjectsAll.stamp()}.zip`, z, 'application/zip'), 'ZIP downloaded (one folder per processor).') : 'You have no saved projects yet. Save one in a Sandbox first.'; };
    document.getElementById('bkrest').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const res = ProjectsAll.restore(String(r.result)); let msg = `Restored ${res.added} new and ${res.replaced} updated project(s).`; if (res.progress && confirm('Replace your current study progress with the progress in this backup?')) { Object.assign(S.state, res.progress); S.save(); renderHud(); msg += ' Progress restored.'; } document.getElementById('bkmsg').textContent = msg; if (res.progress) viewProgress(); } catch (err) { document.getElementById('bkmsg').textContent = err.message; } }; r.readAsText(f); e.target.value = ''; };
    document.getElementById('reset').onclick = () => { if (confirm('Erase all XP, cards and badges in this browser?')) { S.reset(); renderHud(); viewProgress(); } };
  }

  /* ---------- flashcard session ---------- */
  function viewStudy(which) {
    setNav('cards');
    let pool, label;
    if (which === 'weak') { pool = QUEST.CARDS.filter((c) => { const s = S.cardState(c); return s.miss > 0 && s.box < 4; }); label = 'Weak spots'; }
    else if (which === 'all') { pool = dueCards(); label = 'Daily review'; }
    else { const w = worldById(which); if (!w) return go('#/cards'); pool = dueCards(which); label = w.name; }
    const practice = location.hash.includes('practice');
    if (!pool.length || practice) {
      const base = which === 'all' || which === 'weak' ? QUEST.CARDS : QUEST.CARDS.filter((c) => c.deck === which);
      if (!pool.length && !practice) {
        $app.innerHTML = `<p class="crumb"><a href="#/cards">Flashcards</a></p><div class="panel"><h2>Nothing due</h2><p class="lede">${esc(label)} has no cards due right now. You can still practice the lowest-box cards.</p><a class="btn go" href="#/study/${which}?practice">Practice anyway</a></div>`; return;
      }
      pool = base.slice().sort((a, b) => S.cardState(a).box - S.cardState(b).box);
    }
    const deck = G.shuffle(pool.slice().sort((a, b) => S.cardState(a).box - S.cardState(b).box).slice(0, 14));
    let i = 0, known = 0, back = false;
    function draw() {
      if (i >= deck.length) {
        const xp = known * 4 + 10; award(xp, 'session done');
        $app.innerHTML = `<div class="panel"><h2>Session complete</h2><p class="lede">${known} of ${deck.length} remembered. Missed cards will return soon.</p><div class="row"><a class="btn go" href="#/study/${which}">Another round</a><a class="btn" href="${worldById(which) ? '#/world/' + which : '#/cards'}">${worldById(which) ? 'Back to the topic' : 'All decks'}</a><a class="btn" href="#/arcade">Practice drills</a></div></div>`; return;
      }
      const c = deck[i], w = worldById(c.deck);
      $app.innerHTML = `<p class="crumb"><a href="#/cards">Flashcards</a></p><div class="gamehead"><h1>${esc(label)}</h1><div class="progress bar"><i style="width:${(i / deck.length) * 100}%"></i></div><span class="stat"><b>${i + 1}</b>/${deck.length}</span></div>
        <div class="fc"><button class="fcard ${back ? 'back' : ''}" id="flip" aria-label="Flip card"><div class="tag">${ico(w.icon)} ${esc(w.name)}, ${esc(c.src)}</div>
        <div>${back ? esc(c.a) : esc(c.q)}</div>${back ? '' : '<div class="hint">Think of the answer, then flip (Space)</div>'}</button></div>
        ${back && QUEST_GUIDES.DECK_GUIDE[c.deck] ? `<p class="stat" style="text-align:center"><a href="#/guide/${QUEST_GUIDES.DECK_GUIDE[c.deck]}">${ico('book')} Read the guide for this topic</a></p>` : ''}
        ${back ? '<div class="row"><button class="btn bad" id="miss">Missed it (1)</button><button class="btn go" id="got">Got it (2)</button></div>' : '<div class="row"><button class="btn" id="flip2">Show answer</button></div>'}`;
      const flip = () => { back = true; draw(); };
      document.getElementById('flip').onclick = back ? null : flip;
      const f2 = document.getElementById('flip2'); if (f2) f2.onclick = flip;
      const grade = (k) => { S.grade(c, k); S.record('cards', k); if (k) known++; i++; back = false; S.save(); draw(); };
      if (back) { document.getElementById('miss').onclick = () => grade(false); document.getElementById('got').onclick = () => grade(true); }
      cleanup = (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!back) flip(); }
        else if (back && e.key === '1') grade(false); else if (back && e.key === '2') grade(true);
      };
    }
    draw();
  }

  /* ---------- generic round engine ---------- */
  const GAMES = {
    tracer:   { title: 'Register Tracer', icon: '🧮', levels: true, make: (l) => G.tracerQ(l) },
    flags:    { title: 'Flag Flipper', icon: '🚩', levels: true, make: (l) => G.flagQ(l) },
    branch:   { title: 'Branch Oracle', icon: '🔀', levels: true, make: (l) => G.branchQ(l) },
    modes:    { title: 'Mode Match', icon: '🎯', make: () => G.modeQ() },
    bugs:     { title: 'Bug Hunt', icon: '🐛', make: () => G.bugQ() },
    numbers:  { title: 'Number Ninja', icon: '🥷', levels: true, make: (l) => G.numberQ(l) },
    hardware: { title: 'Hardware Lab', icon: '🧱', levels: true, make: (l) => G.hardwareQ(l) },
    convert:  { title: 'Converter Drills', icon: '🧮', levels: true, make: (l) => G.convertQ(l) },
    design:   { title: 'Design Drills', icon: '🧱', levels: true, make: (l) => G.designQ(l) },
    blitz:    { title: 'Quiz Blitz', icon: '⚡', timer: 20, make: (l, world) => G.quizQ(world) },
  };
  const ROUNDS = 8;
  let cleanup = null, leaveHook = null;

  function viewGame(id, arg) {
    setNav('arcade');
    if (id === 'sorter') return viewSorter();
    const def = GAMES[id]; if (!def) return go('#/arcade');
    if (def.levels && !arg) {
      $app.innerHTML = `<p class="crumb"><a href="#/arcade">Practice</a></p><div class="panel"><h1>${ico(def.icon)} ${def.title}</h1><p class="lede">Choose a difficulty.</p><div class="row">
        <a class="btn go" href="#/game/${id}/easy">Easy</a><a class="btn" href="#/game/${id}/medium">Medium</a><a class="btn" href="#/game/${id}/hard">Hard</a></div></div>`; return;
    }
    const level = def.levels ? arg : null, world = id === 'blitz' ? arg : null;
    let i = 0, right = 0, streak = 0, locked = false, timerId = null, roundXp = 0; const missed = [];
    const total = world ? Math.min(ROUNDS, QUEST.QUIZ.filter((q) => q.world === world).length) : ROUNDS;
    let q;

    function next() {
      if (i >= total) return finish();
      locked = false; q = def.make(level, world);
      const code = q.codeHtml ? `<pre class="code">${q.codeHtml}</pre>` : q.code ? `<pre class="code">${colorize(q.code)}</pre>` : '';
      let body = '';
      if (q.kind === 'choice') body = `<div class="opts">${q.options.map((o, k) => `<button class="opt ${q.mono ? 'mono' : ''}" data-k="${k}"><span class="k">${k + 1}</span>${q.mono ? `<span style="white-space:pre">${esc(o)}</span>` : esc(o)}</button>`).join('')}</div>`;
      if (q.kind === 'fields') body = `<div class="fields">${q.fields.map((f, k) => `<label>${esc(f.label)}<input data-f="${k}" placeholder="${esc(f.ph || '')}" autocomplete="off" spellcheck="false" autocapitalize="off"></label>`).join('')}</div><button class="btn go" id="check">Check (Enter)</button>`;
      if (q.kind === 'flags') body = `<div class="flags">${q.flags.map((f) => `<button class="flag" data-flag="${f}" aria-pressed="false">${f} <span>0</span></button>`).join('')}</div><button class="btn go" id="check">Check (Enter)</button>`;
      if (q.kind === 'multi') body = `<div class="flags">${q.options.map((o) => `<button class="flag" data-flag="${o}" aria-pressed="false">${o}</button>`).join('')}</div><button class="btn go" id="check">Check (Enter)</button>`;
      $app.innerHTML = `<p class="crumb"><a href="#/arcade">Practice</a></p><div class="gamehead"><h1>${ico(def.icon)} ${def.title}${level ? ` <span class="pill">${level}</span>` : ''}</h1>
        <div class="progress bar"><i style="width:${(i / total) * 100}%"></i></div><span class="stat">Question <b>${i + 1}</b> of ${total}, <b>${right}</b> correct, streak <b>${streak}</b></span></div>
        ${def.timer ? '<div class="timer"><i id="tbar"></i></div>' : ''}
        <div class="panel"><p class="q">${esc(q.prompt)}</p>${code}${q.info || ''}${body}<div id="fb"></div></div>`;
      wire();
      if (def.timer) startTimer();
      const first = $app.querySelector('input'); if (first) first.focus();
    }

    function startTimer() {
      const bar = document.getElementById('tbar'); const t0 = Date.now(); const ms = def.timer * 1000;
      clearInterval(timerId);
      timerId = setInterval(() => {
        const f = Math.max(0, 1 - (Date.now() - t0) / ms); if (bar) bar.style.transform = `scaleX(${f})`;
        if (f <= 0) { clearInterval(timerId); if (!locked) resolve(false, '⏱ Time is up.'); }
      }, 100);
    }

    function wire() {
      if (q.kind === 'choice') {
        $app.querySelectorAll('.opt').forEach((b) => (b.onclick = () => submitChoice(+b.dataset.k)));
        cleanup = (e) => { const n = +e.key; if (n >= 1 && n <= q.options.length && !locked) submitChoice(n - 1); else if (locked && e.key === 'Enter') advance(); };
      } else {
        $app.querySelectorAll('[data-flag]').forEach((b) => (b.onclick = () => { if (locked) return; const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); const sp = b.querySelector('span'); if (sp) sp.textContent = on ? '1' : '0'; }));
        const chk = document.getElementById('check'); if (chk) chk.onclick = submitOther;
        cleanup = (e) => { if (e.key === 'Enter') { e.preventDefault(); locked ? advance() : submitOther(); } };
      }
    }

    function submitChoice(k) {
      if (locked) return; locked = true;
      $app.querySelectorAll('.opt').forEach((b, n) => { b.disabled = true; if (n === q.answer) b.classList.add('right'); else if (n === k) b.classList.add('wrong'); });
      resolve(k === q.answer, '', q.detail);
    }
    function submitOther() {
      if (locked) return;
      let res;
      if (q.kind === 'fields') {
        const vals = [...$app.querySelectorAll('input[data-f]')].map((x) => x.value);
        if (vals.some((v) => !v.trim())) { toast('Fill in every field'); return; }
        res = q.grade(vals);
        $app.querySelectorAll('input[data-f]').forEach((x, k) => { x.disabled = true; x.classList.add(res.bad && res.bad.includes(k) ? 'wrong' : 'right'); });
        if (res.ok) $app.querySelectorAll('input[data-f]').forEach((x) => x.classList.replace('wrong', 'right'));
      } else if (q.kind === 'flags') {
        const ans = {}; $app.querySelectorAll('[data-flag]').forEach((b) => (ans[b.dataset.flag] = b.classList.contains('on')));
        res = q.grade(ans);
        $app.querySelectorAll('[data-flag]').forEach((b) => { b.classList.add(res.bad.includes(b.dataset.flag) ? 'wrong' : 'right'); b.disabled = true; });
        $app.querySelectorAll('[data-flag] span').forEach((sp) => { sp.textContent = q.expected[sp.parentNode.dataset.flag]; });
      } else if (q.kind === 'multi') {
        const sel = new Set(); $app.querySelectorAll('[data-flag].on').forEach((b) => sel.add(b.dataset.flag));
        res = q.grade(sel);
        $app.querySelectorAll('[data-flag]').forEach((b) => { b.classList.add(res.bad.includes(b.dataset.flag) ? 'wrong' : 'right'); b.disabled = true; });
      }
      locked = true; resolve(res.ok, '', res.detail);
    }

    function resolve(ok, lead, detail) {
      locked = true; clearInterval(timerId);
      S.record(id === 'blitz' ? 'blitz' : id, ok);
      const run = S.run(ok);
      if (ok) { right++; streak++; roundXp += award(10 + Math.min(run - 1, 10)); } else { streak = 0; missed.push(q.prompt); S.save(); }
      document.getElementById('fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><h3>${ok ? 'Correct' : 'Incorrect'}</h3><div>${lead ? lead + '<br>' : ''}${detail || ''}</div>
        <div class="row" style="margin-top:10px"><button class="btn go" id="next">${i + 1 >= total ? 'Finish' : 'Next'} (Enter)</button></div></div>`;
      document.getElementById('next').onclick = advance; document.getElementById('next').focus();
      cleanup = (e) => { if (e.key === 'Enter') { e.preventDefault(); advance(); } };
    }
    function advance() { i++; next(); }
    function finish() {
      const bonus = right === total ? 40 : right / total >= 0.75 ? 20 : 5;
      roundXp += award(bonus);
      if (right === total && !S.state.badges.perfect) { S.state.badges.perfect = 'x'; }
      $app.innerHTML = `<div class="panel"><h1>${ico(def.icon)} ${right} of ${total} correct</h1><p class="lede">${roundXp} XP earned this round.${missed.length ? ' Questions you missed:' : ''}</p>${missed.length ? `<ol class="missed">${missed.map((m) => `<li>${esc(m)}</li>`).join('')}</ol>` : ''}
        <div class="row"><a class="btn go" href="#/game/${id}${arg ? '/' + arg : ''}" id="again">Play again</a><a class="btn" href="#/arcade">More practice drills</a><a class="btn" href="#/cards">Review flashcards</a><a class="btn" href="#/sandbox">Open sandbox</a></div></div>`;
      cleanup = null;
    }
    next();
  }

  /* ---------- Program Sorter ---------- */
  function viewSorter() {
    const progs = G.shuffle(QUEST.PROGRAMS); let pi = 0, done = 0;
    function load() {
      const P = progs[pi % progs.length];
      const items = P.lines.map((t, idx) => ({ t, idx }));
      let pool = G.shuffle(items), built = [], checked = false, hints = false;
      const draw = () => {
        const ln = (it, where, extra) => {
          const m = /^(\S*\s+)?(.*)$/.exec(it.t);
          const hint = hints && P.hints[it.idx] ? `<span class="cm">; ${esc(P.hints[it.idx])}</span>` : '';
          return `<button class="line ${extra || ''}" data-w="${where}" data-i="${it.idx}">${esc(it.t)}${hint}</button>`;
        };
        $app.innerHTML = `<p class="crumb"><a href="#/arcade">Practice</a></p><div class="gamehead"><h1>${ico('sort--ascending')} Program Sorter</h1><span class="stat">${esc(P.title)} · ${P.src}</span></div>
          <div class="panel"><p class="q">${esc(P.goal)}</p><p class="lede">Click lines to add them to your program, in order. Click a placed line to send it back.</p>
          <div class="sort"><div class="col"><h3>Available lines</h3>${pool.map((it) => ln(it, 'pool')).join('') || '<span class="lede">(all placed)</span>'}</div>
          <div class="col"><h3>Your program</h3>${built.map((it, k) => ln(it, 'built', checked ? (okPos(k) ? 'right' : 'wrong') : '')).join('')}</div></div>
          <div class="row" style="margin-top:12px"><button class="btn go" id="check" ${pool.length ? 'disabled' : ''}>Check</button><button class="btn" id="hint">${hints ? 'Hide' : 'Show'} hints</button><button class="btn ghost" id="skip">Skip</button></div>
          <div id="fb"></div></div>`;
        $app.querySelectorAll('.line').forEach((b) => (b.onclick = () => {
          if (checked) return; const idx = +b.dataset.i;
          if (b.dataset.w === 'pool') { const k = pool.findIndex((x) => x.idx === idx); built.push(pool.splice(k, 1)[0]); }
          else { const k = built.findIndex((x) => x.idx === idx); pool.push(built.splice(k, 1)[0]); }
          draw();
        }));
        document.getElementById('hint').onclick = () => { hints = !hints; draw(); };
        document.getElementById('skip').onclick = () => { pi++; load(); };
        document.getElementById('check').onclick = check;
      };
      function okPos(k) { return sameAt(built.map((b) => b.idx), k); }
      function sameAt(ids, k) { // line k is right if it matches, or sits in a free group with the same member set
        if (ids[k] === k) return true;
        return P.free.some((g) => g.includes(k) && g.includes(ids[k]));
      }
      function check() {
        const ids = built.map((b) => b.idx);
        const ok = ids.every((_, k) => sameAt(ids, k)) && P.free.every((g) => [...g].sort().join() === g.map((k) => ids[k]).sort().join());
        checked = true; draw();
        const fb = document.getElementById('fb');
        S.record('sorter', ok); S.run(ok);
        if (ok) { done++; award(30, 'program assembled'); }
        fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><h3>${ok ? 'Assembled!' : 'Not quite'}</h3><pre class="code">${colorize(P.lines.map((t, k) => t + (P.hints[k] ? '   ; ' + P.hints[k] : '')).join('\n'))}</pre>
          <div class="row"><button class="btn go" id="nxt">Next program</button><a class="btn" href="#/arcade">Arcade</a></div></div>`;
        document.getElementById('nxt').onclick = () => { pi++; load(); };
      }
      draw();
    }
    cleanup = null; load();
  }


  /* ---------- Read Code: what each line does ---------- */
  function explainHtml(e, open) {
    const flags = e.flags ? `<p><b>Flags:</b> ${esc(e.flags)}</p>` : '';
    const notes = e.notes && e.notes.length ? `<ul>${e.notes.map((n) => `<li>${esc(n).replace(/`([^`]+)`/g, '<code>$1</code>')}</li>`).join('')}</ul>` : '';
    return `<p><b>${esc(e.title)}</b></p><p>${e.lines.map(esc).join(' ')}</p>${flags}${notes}`;
  }
  function viewRead() {
    setNav('read');
    const ex = UI().examples();
    $app.innerHTML = `<h1>Explain code</h1><p class="lede">${UI().readIntro}</p>
      <div class="panel"><h3>Anatomy of a line</h3>
        ${UI().readAnatomy}</div>
      <div class="panel" style="margin-top:12px"><h3>Explain a line</h3>
        <input id="rdline" class="addr" style="width:100%;font-size:1rem" value="${esc(UI().readDefault)}" aria-label="Assembly line to explain" spellcheck="false" autocomplete="off">
        <div id="rdout" style="margin-top:10px"></div></div>
      <div class="sec"><h2>Annotated programs</h2><small>click a line to open its explanation</small></div>
      <div class="row" style="margin-bottom:10px"><select id="rdsel" class="btn" aria-label="Choose a program">${ex.map((e, i) => `<option value="${i}">${esc(e.name)}</option>`).join('')}</select></div>
      <div id="rdprog"></div>
      <div class="row" style="margin-top:14px">${UI().readButtons.map((b) => `<a class="btn" href="${b[0]}">${b[1]}</a>`).join('')}<a class="btn" href="#/sandbox">Try it in the sandbox</a></div>`;
    const out = document.getElementById('rdout'), inp = document.getElementById('rdline');
    const run = () => { out.innerHTML = explainHtml(Explain.explain(inp.value)); };
    inp.oninput = run; run();
    const show = () => {
      const src = ex[+document.getElementById('rdsel').value].src.split('\n');
      document.getElementById('rdprog').innerHTML = `<div class="listing" style="height:auto;max-height:70vh">${src.filter((l, i) => !(i === src.length - 1 && !l.trim())).map((l) => {
        if (!l.trim()) return '<div class="ln">&nbsp;</div>';
        return `<details class="rl"><summary class="ln"><span class="tx">${esc(l)}</span></summary><div class="rx">${explainHtml(Explain.explain(l))}</div></details>`;
      }).join('')}</div>`;
    };
    document.getElementById('rdsel').onchange = show; show();
  }


  /* ---------- Guides & glossary ---------- */
  function viewGuides() {
    setNav('guides');
    const byId = Object.fromEntries(QUEST_GUIDES.GUIDES.map((g) => [g.id, g]));
    const used = new Set(UI().guideGroups.flatMap(([, ids]) => ids));
    const groups = [...UI().guideGroups, ...(QUEST_GUIDES.GUIDES.some((g) => !used.has(g.id)) ? [['More', QUEST_GUIDES.GUIDES.filter((g) => !used.has(g.id)).map((g) => g.id)]] : [])];
    const sections = groups.map(([name, ids]) => `<div class="sec"><h2>${esc(name)}</h2></div><div class="items">${ids.map((id) => byId[id]).filter(Boolean).map((g) => item('#/guide/' + g.id, g.icon, g.title, g.summary, '', esc(lessonText(g.lesson)))).join('')}</div>`).join('');
    $app.innerHTML = `<h1>Guides</h1><p class="lede">Written explanations, grouped from the fundamentals to reference material. Read them top to bottom, or open the one a topic points you to. Each guide ends with links to practise what it covered.</p>
      <div class="row"><a class="btn" href="#/glossary">${ico('book')} Glossary (${QUEST_GUIDES.GLOSSARY.length} terms)</a>${UI().hasRead === false ? '' : '<a class="btn" href="#/read">Explain code</a>'}${UI().guidesButtons.map((b) => `<a class="btn" href="${b[0]}">${b[1]}</a>`).join('')}</div>
      ${sections}
      <div class="sec"><h2>References and further reading</h2><small>open in a new tab</small></div>
      <div class="panel"><ul class="reflist">${QUEST_GUIDES.REFS.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.title)}</a><br><span class="dim">${esc(r.note)}</span></li>`).join('')}</ul></div>`;
  }
  // the same idea on the other processor: its guide, and the Compare page
  function twinPanel(gid) {
    const t = UI().twin; if (!t || !PACKS.list[t.pack]) return '';
    const map = t.guides || {}, other = PACKS.list[t.pack], tid = gid in map ? map[gid] : gid, tg = tid && other.QUEST_GUIDES.GUIDES.find((x) => x.id === tid);
    return `<div class="panel"><h3>On the ${esc(t.name)}</h3><div class="row">${tg ? `<a class="btn" href="#/${other.PACK_UI.slug}/guide/${tg.id}">${ico(tg.icon)} ${esc(tg.title)}</a>` : '<span class="stat">No matching guide on the ' + esc(t.name) + ' yet.</span>'}<a class="btn" href="#/compare">Compare both</a></div></div>`;
  }
  function viewGuide(id) {
    setNav('guides');
    const list = QUEST_GUIDES.GUIDES, k = list.findIndex((g) => g.id === id); if (k < 0) return go('#/guides');
    const g = list[k], prev = list[k - 1], next = list[k + 1];
    const world = QUEST.WORLDS.find((w) => w.id === g.practice[0]);
    let n = 0; const heads = [...g.md.matchAll(/^## (.+)$/gm)].map((m) => m[1].replace(/`/g, ''));
    const body = QUEST_GUIDES.render(g.md).replace(/<h2>/g, () => `<h2 id="sec-${n++}">`);
    const toc = heads.length >= 4 ? `<nav class="toc" aria-label="On this page"><b>On this page</b><ol>${heads.map((h, i) => `<li><a href="#sec-${i}" data-sec="${i}">${esc(h)}</a></li>`).join('')}</ol></nav>` : '';
    const tocSide = toc.replace('class="toc"', 'class="toc side"'), tocInline = toc.replace('class="toc"', 'class="toc inline"');
    $app.innerHTML = `<p class="crumb"><a href="#/guides">Guides</a></p>
      <div class="guidepage"><article class="guide"><h1>${ico(g.icon)} ${esc(g.title)}</h1><p class="stat">Source: ${esc(lessonText(g.lesson))}</p>${tocInline}${body}</article>
      <aside class="guideside">${tocSide}
      <div class="panel"><h3>Practise this</h3><div class="row">${world ? `<a class="btn go" href="#/study/${world.id}">Flashcards: ${esc(world.name)}</a>` : ''}<a class="btn" href="#/arcade">Practice drills</a><a class="btn" href="#/sandbox">${esc(UI().sandboxLabel || 'Sandbox')}</a></div></div>
      ${twinPanel(g.id)}
      ${(QUEST_GUIDES.SEE[g.id] || []).length ? `<div class="panel"><h3>See also</h3><div class="row">${QUEST_GUIDES.SEE[g.id].map((x) => { const t = list.find((y) => y.id === x); return t ? `<a class="btn" href="#/guide/${t.id}">${ico(t.icon)} ${esc(t.title)}</a>` : ''; }).join('')}<a class="btn" href="#/glossary">${ico('book')} Glossary</a>${g.id !== 'errata' && list.some((y) => y.id === 'errata') ? `<a class="btn" href="#/guide/errata">${ico('warning--alt')} Slide errata</a>` : ''}</div></div>` : ''}</aside></div>
      <div class="row" style="justify-content:space-between;margin-top:14px">${prev ? `<a class="btn" href="#/guide/${prev.id}">Previous: ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/guide/${next.id}">Next: ${esc(next.title)}</a>` : ''}</div>`;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('.toc a[data-sec]'); if (!a) return;
    e.preventDefault(); const el = document.getElementById('sec-' + a.dataset.sec); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  function viewGlossary() {
    setNav('guides');
    const all = QUEST_GUIDES.GLOSSARY;
    $app.innerHTML = `<p class="crumb"><a href="#/guides">Guides</a></p><h1>Glossary</h1><input id="gq" class="addr" style="width:100%;font-size:1rem" placeholder="Search terms and definitions…" aria-label="Search the glossary" autocomplete="off"><p class="stat" id="gcount"></p><dl id="gl" class="gloss"></dl>`;
    const draw = () => {
      const q = document.getElementById('gq').value.trim().toLowerCase();
      const hit = all.filter((t) => !q || t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q));
      document.getElementById('gcount').textContent = `${hit.length} of ${all.length} terms`;
      document.getElementById('gl').innerHTML = hit.map((t) => `<dt>${esc(t.term)} <span class="pill">${t.cat} · ${t.lesson}</span></dt><dd>${esc(t.def)}${QUEST_GUIDES.CAT_GUIDE[t.cat] ? ` <a href="#/guide/${QUEST_GUIDES.CAT_GUIDE[t.cat]}">Read the guide</a>` : ''}</dd>`).join('');
    };
    document.getElementById('gq').oninput = draw; draw();
  }


  /* ---------- Compare: the same jobs on both processors ---------- */
  const SIDES = [['m68k', '68000', 'EASy68K'], ['z80', 'Z80', 'Oshonsoft']];
  const b64enc = (t) => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const ROSETTA = [
    ['Operand order', '`MOVE source,destination`', '`LD destination,source`'],
    ['Copy a value', '`MOVE.B D1,D0` (any register to any register)', '`LD A,B` (not every pair is allowed)'],
    ['Add', '`ADD.L D0,D2` (any D register)', '`ADD A,B` (only into A); `ADD HL,DE` for 16 bits'],
    ['Compare', '`CMP.B D0,D1` computes D1 − D0, sets flags', '`CP B` computes A − B, sets flags'],
    ['Branch if equal', '`BEQ label`', '`JR Z,label` (or `JP Z,label`)'],
    ['Unsigned greater/less', '`BHI` `BLS` `BCC` `BCS`', '`JR NC` `JR C` with `JR Z` / `JR NZ`'],
    ['Signed greater/less', '`BGT` `BLT` `BGE` `BLE`', 'No single condition; test S and V (see Jumps guide)'],
    ['Counted loop', '`DBRA D0,loop` (stops at −1: load N − 1)', '`DJNZ loop` (stops at 0: load N, B only)'],
    ['Call / return', '`JSR sub` / `RTS`', '`CALL sub` / `RET`'],
    ['Push / pop', '`MOVE.L D0,-(A7)` / `MOVE.L (A7)+,D0`', '`PUSH BC` / `POP BC` (16-bit pairs only)'],
    ['Pointer and next item', '`MOVE.B (A0)+,D0` (post-increment)', '`LD A,[HL]` then `INC HL`'],
    ['Indexed access', '`3(A0)`, `0(A0,D1)`', '`[IX+3]`, `[IY+3]` (8-bit signed displacement)'],
    ['Byte order of a word', 'Big-endian: high byte at the lower address', 'Little-endian: low byte at the lower address'],
    ['Sizes', '`.B` `.W` `.L` on most instructions', 'Size is fixed by the register (8-bit or 16-bit pair)'],
    ['Flags', 'X N Z V C in the CCR', 'S Z H P/V N C in F'],
    ['I/O devices', 'Memory-mapped only (ordinary addresses)', '`IN` / `OUT` ports as well as memory-mapped'],
    ['End of the program', '`SIMHALT` (EASy68K) or `STOP #$2700`', '`HALT`'],
  ];
  const mdInline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const rosettaRows = () => ROSETTA.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${mdInline(b)}</td><td>${mdInline(c)}</td></tr>`).join('');
  function viewCompare(which) {
    setNav('');
    const CD = window.CompareData, pairs = CD.PAIRS, topics = [...new Set(pairs.map((p) => p.topic))];
    const sec = (p) => `<details class="pair" id="pair-${p.id}" ${p.id === which ? 'open' : ''}><summary><b>${esc(p.title)}</b> <span class="dim">${esc(p.lesson)}</span></summary>
      <p>${mdInline(p.idea)}</p>
      <div class="twocol">${SIDES.map(([id, name, tool]) => `<div><h4>${name} <span class="dim">(${tool})</span></h4><pre class="code">${PACKS.list[id].PACK_UI.colorize ? esc(p[id].src).split('\n').map((l) => PACKS.list[id].PACK_UI.colorize(l)).join('\n') : esc(p[id].src)}</pre></div>`).join('')}</div>
      <div class="row"><button class="btn go" data-run="${p.id}">Run both</button>${SIDES.map(([id, name]) => `<a class="btn" href="#/${PACKS.list[id].PACK_UI.slug}/sandbox?c=${b64enc(p[id].src)}">Open in the ${name} sandbox</a>`).join('')}${SIDES.map(([id, name]) => `<a class="btn ghost" href="#/${PACKS.list[id].PACK_UI.slug}/guide/${p[id].guide}">${name} guide</a>`).join('')}</div>
      <div class="runout" id="out-${p.id}"></div>
      <h4>What differs, and why</h4><ul>${p.differences.map((d) => `<li>${mdInline(d)}</li>`).join('')}</ul></details>`;
    $app.innerHTML = `<h1>Compare the 68000 and the Z80</h1>
      <p class="lede">The two processors solve the same problems with different tools. Each pair below does one job twice, once per processor, and both versions have been run to the same answer. Read the two programs side by side, press <b>Run both</b>, then read what differs and why. Every topic page links here, and every guide links to its twin on the other processor.</p>
      <div class="sec"><h2>Quick map</h2><small>the same idea in each instruction set</small></div>
      <div class="tablewrap"><table class="gt"><thead><tr><th>Idea</th><th>68000</th><th>Z80</th></tr></thead><tbody>${rosettaRows()}</tbody></table></div>
      ${topics.map((t) => `<div class="sec"><h2>${esc(t)}</h2></div>${pairs.filter((p) => p.topic === t).map(sec).join('')}`).join('')}
      <p class="stat" style="margin-top:var(--s4)">Code size counts the program and its data. The Z80 counts T-states (clock cycles); the 68000 simulator here does not model cycle counts, so only instructions executed are compared.</p>`;
        $app.querySelectorAll('[data-run]').forEach((b) => (b.onclick = () => {
      const p = pairs.find((x) => x.id === b.dataset.run), r = CD.runPair(p);
      const cell = (k) => { const x = r[k]; if (!x.ok) return `<td colspan="1" class="bad">${esc(x.error)}</td>`; return `<td><b>${x.value}</b> <span class="dim">(${CD.hex(x.value, 2)}H in ${x.where})</span></td>`; };
      const row = (label, f) => `<tr><td>${label}</td>${['m68k', 'z80'].map((k) => `<td>${r[k].ok ? f(r[k]) : ''}</td>`).join('')}</tr>`;
      document.getElementById('out-' + p.id).innerHTML = `<div class="tablewrap"><table class="gt"><thead><tr><th></th><th>68000</th><th>Z80</th></tr></thead><tbody>
        <tr><td>Answer</td>${cell('m68k')}${cell('z80')}</tr>${row('Program bytes', (x) => x.bytes)}${row('Instructions executed', (x) => x.steps)}${row('Cycles', (x) => x.extra || 'not modelled')}</tbody></table></div>
        <p class="stat">${r.m68k.ok && r.z80.ok && r.m68k.value === r.z80.value ? 'Same answer on both.' : 'The answers differ here on purpose: see below.'}</p>`;
      S.record('compare', true); award(2);
    }));
    if (which) { const el = document.getElementById('pair-' + which); if (el) el.scrollIntoView(); }
  }
  /* ---------- Tests & audit report ---------- */
  function viewTests() {
    setNav('guides');
    const id = P();
    $app.innerHTML = `<p class="crumb"><a href="#/guides">Guides</a></p><h1>How accurate is this site? <span class="pill">${esc(UI().fullName)}</span></h1>
      ${UI().testsIntro}
      <div id="auditbox"><p class="stat">Loading audit results…</p></div>`;
    const draw = () => {
      const A = window.AUDIT && window.AUDIT[id], rows = A ? A.rows : []; const box = document.getElementById('auditbox'); if (!box) return;
      if (!rows.length) { box.innerHTML = UI().auditFile ? '<div class="panel" style="margin-top:12px"><h3>Content audit</h3><p class="stat">No audit results available.</p></div>' : ''; return; }
      const kinds = ['card', 'quiz', 'guide', 'glossary'], verdicts = ['CONFIRMED', 'CORRECTED', 'UNVERIFIED'];
      const tbl = kinds.map((k) => `<tr><td>${k}</td>${verdicts.map((v) => `<td class="mono">${rows.filter((r) => r.kind === k && r.verdict === v).length}</td>`).join('')}<td class="mono">${rows.filter((r) => r.kind === k).length}</td></tr>`).join('');
      box.innerHTML = `<div class="panel" style="margin-top:12px"><h3>Content audit summary</h3><div class="tablewrap"><table class="gt"><thead><tr><th>Content</th><th>Confirmed</th><th>Corrected</th><th>Unverified</th><th>Total</th></tr></thead><tbody>${tbl}</tbody></table></div>
        <p class="stat">${esc(A.note || '')}</p></div>
        <details class="more" style="margin-top:var(--s3)"><summary>Show every audited item (${rows.length})</summary>
        <div class="row" style="margin:12px 0"><select id="avk" class="btn" aria-label="Filter by content"><option value="">All content</option>${kinds.map((k) => `<option>${k}</option>`).join('')}</select>
        <select id="avv" class="btn" aria-label="Filter by verdict"><option value="">All verdicts</option>${verdicts.map((v) => `<option>${v}</option>`).join('')}</select><input id="avq" class="addr" style="flex:1;min-width:160px" placeholder="Search…" aria-label="Search audit results"></div>
        <div id="avlist"></div></details>`;
      const list = () => {
        const k = document.getElementById('avk').value, v = document.getElementById('avv').value, q = document.getElementById('avq').value.toLowerCase();
        const hit = rows.filter((r) => (!k || r.kind === k) && (!v || r.verdict === v) && (!q || ((r.title || '') + (r.evidence || '')).toLowerCase().includes(q)));
        document.getElementById('avlist').innerHTML = `<p class="stat">${hit.length} of ${rows.length} items</p>` + hit.slice(0, 250).map((r) => `<details class="rl"><summary class="ln"><span class="pill v-${r.verdict}">${r.verdict}</span><span class="tx" style="white-space:normal">${esc((r.title || '').slice(0, 140))}</span></summary><div class="rx"><p><b>${esc(r.kind)}</b></p><p>${esc(r.evidence || '')}</p></div></details>`).join('');
      };
      ['avk', 'avv', 'avq'].forEach((x) => (document.getElementById(x).oninput = list)); list();
    };
    if (!UI().auditFile || (window.AUDIT && window.AUDIT[id])) draw(); else { const sc = document.createElement('script'); sc.src = UI().auditFile + '?v=' + (window.BUILD || ''); sc.onload = draw; sc.onerror = draw; document.head.appendChild(sc); }
  }

  /* ---------- shell: header, links, router ---------- */
  const BASE_NAV = [['home', 'Topics', '#/'], ['guides', 'Guides', '#/guides'], ['cards', 'Flashcards', '#/cards'], ['arcade', 'Practice', '#/arcade'], ['read', 'Explain code', '#/read'], ['sandbox', 'Sandbox', '#/sandbox']];
  function renderHeader() {
    const nav = document.querySelector('.nav'), sw = document.getElementById('cpusw');
    sw.innerHTML = PACKS.order.map((id) => { const u = PACKS.list[id].PACK_UI; return `<a href="#/${u.slug}/" class="${id === P() ? 'on' : ''}" aria-label="${esc(u.fullName)}">${u.chip}</a>`; }).join('');
    const CMP = ['compare', 'Compare', '#/compare'], STR = ['start', 'Start here', '#/start'], LAB = ['labs', 'Labs', '#/labs'];
    const items = P() ? [STR, LAB, ...BASE_NAV.filter(([k]) => !(k === 'read' && UI().hasRead === false)).map(([k, l, h]) => [k, k === 'sandbox' && UI().sandboxLabel ? UI().sandboxLabel : l, h.replace(/^#\//, here())]), ...UI().navExtra.map((x) => [x.name, x.label, x.href.replace(/^#\//, here())]), ['mock', 'Mock exam', here() + 'mock'], CMP, ['progress', 'Progress', '#/progress']] : [STR, LAB, CMP, ['progress', 'Progress', '#/progress']];
    const ft = document.getElementById('foot'); if (ft) ft.innerHTML = `Built from BEE 425 F26 Lessons 3&ndash;8, 10 and 11. Progress is saved in this browser only. ${P() ? `<a href="${here()}tests">How accurate is this site?</a> &middot; ` : ''}<a href="https://github.com/ihmnelson/bee425" target="_blank" rel="noopener">Source code on GitHub</a>`;
    nav.innerHTML = items.map(([k, l, h]) => `<a href="${h}" data-nav="${k}">${l}</a>`).join('');
  }
  // links written as "#/guide/x" inside a processor's pages point at that processor's page: rewrite them once rendered
  function fixLinks(root) {
    if (!P()) return;
    root.querySelectorAll('a[href^="#/"]').forEach((a) => { const h = a.getAttribute('href'); if (!/^#\/(68k|z80|sys|progress|compare)(\/|$)/.test(h) && h !== '#/') a.setAttribute('href', h.replace(/^#\//, here())); else if (h === '#/') a.setAttribute('href', here()); });
  }
  new MutationObserver(() => fixLinks($app)).observe($app, { childList: true, subtree: true });
  const LEGACY = new Set(['world', 'cards', 'study', 'arcade', 'game', 'read', 'guides', 'guide', 'glossary', 'tests', 'homework', 'sandbox', 'mock']);

  function route() {
    if (window.Demo) Demo.stopAll();
    cleanup = null; if (leaveHook) { try { leaveHook(); } catch (e) { /* ignore */ } leaveHook = null; }
    const raw = location.hash.replace(/^#\/?/, ''), [pathq] = raw.split('?'), all = pathq.split('/').filter(Boolean);
    // links from the single-processor 68K Quest site (#/cards, #/sandbox?c=...) keep working: they mean the 68000
    if (all.length && LEGACY.has(all[0])) { location.replace('#/68k/' + raw); return; }
    const pid = all.length ? packBySlug(all[0]) : null;
    const parts = pid ? all.slice(1) : all;
    PACKS.cur = null; if (pid) PACKS.activate(pid);
    renderHeader();
    if (pid) document.documentElement.dataset.cpu = pid; else delete document.documentElement.dataset.cpu;
    window.scrollTo(0, 0);
    try {
      if (!pid) { if (parts[0] === 'progress') viewProgress(); else if (parts[0] === 'start') viewStart(parts[1]); else if (parts[0] === 'labs') viewStart(parts[1], 'labs'); else if (parts[0] === 'compare') viewCompare(parts[1]); else viewCourse(); }
      else switch (parts[0]) {
        case undefined: viewMap(); break;
        case 'world': viewWorld(parts[1]); break;
        case 'cards': viewCards(); break;
        case 'study': viewStudy(parts[1] || 'all'); break;
        case 'arcade': viewArcade(); break;
        case 'game': viewGame(parts[1], parts[2]); break;
        case 'read': if (UI().hasRead === false) viewMap(); else viewRead(); break;
        case 'guides': viewGuides(); break;
        case 'guide': viewGuide(parts[1]); break;
        case 'glossary': viewGlossary(); break;
        case 'mock': viewMock(); break;
        case 'tests': viewTests(); break;
        case 'homework': if (window.HomeworkUI) { setNav('homework'); if (parts[2]) HomeworkUI.viewProblem($app, +parts[2], { Store: S, award }, parts[1]); else if (parts[1]) HomeworkUI.viewList($app, { Store: S, award }, parts[1]); else HomeworkUI.viewIndex($app, { Store: S, award }); } else viewMap(); break;
        case 'sandbox': if (window.Sandbox && window.Sandbox.view) { setNav('sandbox'); window.Sandbox.view($app, { award, afterRestore: renderHud, query: new URLSearchParams(raw.split('?')[1] || ''), onLeave: (f) => (leaveHook = f) }); } else viewMap(); break;
        default: viewMap();
      }
    } catch (err) {
      $app.innerHTML = `<div class="panel"><h2>Something broke</h2><pre class="code">${esc(err.stack || err)}</pre><a class="btn" href="#/">Home</a></div>`;
    }
    fixLinks($app);
    document.title = pid ? (UI().kind === 'topic' ? `${UI().name} · BEE 425` : `${UI().chip} Quest · BEE 425`) : 'BEE 425 Quest';
    renderHud();
  }
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('textarea')) return;
    if (e.target.matches('input') && e.key !== 'Enter') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (cleanup) cleanup(e);
  });
  window.addEventListener('hashchange', route);
  route();
})();
