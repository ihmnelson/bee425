(function () {
  'use strict';
  const S = Store, G = Games, esc = G.esc;
  const $app = document.getElementById('app');
  const worldById = (id) => QUEST.WORLDS.find((w) => w.id === id);

  /* ---------- helpers ---------- */
  function toast(msg, cls) {
    const t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.textContent = msg;
    document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 2600);
  }
  function award(n, why) {
    const before = S.level(S.state.xp);
    S.addXp(n);
    const after = S.level(S.state.xp);
    toast(`+${n} XP${why ? ' · ' + why : ''}`);
    if (after > before) toast(`Level ${after}: ${S.title(after)}!`, 'badge-t');
    S.newBadges().forEach((b) => toast(`${b.icon} Badge: ${b.name}`, 'badge-t'));
    S.save(); renderHud();
  }
  function renderHud() {
    const xp = S.state.xp, lv = S.level(xp), lo = S.levelStart(lv), hi = S.levelStart(lv + 1);
    const pct = Math.round(((xp - lo) / (hi - lo)) * 100);
    document.getElementById('hud').innerHTML =
      `<span>Lv <b>${lv}</b> ${esc(S.title(lv))}</span><span class="xpbar" title="${xp} XP"><i style="width:${pct}%"></i></span><span>🔥 <b>${S.streakDays()}</b>d</span>`;
  }
  const colorize = (src) => esc(src).split('\n').map((l) => l
    .replace(/(\*.*|;.*)$/, '<span class="cm">$1</span>')
    .replace(/(#?[$%]?\b[0-9A-F]+\b)(?![^<]*>)/g, (m) => (/^#?[$%]/.test(m) ? `<span class="num">${m}</span>` : m))).join('\n');

  function setNav(name) { document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === name)); }
  const mastery = (deck) => { const cs = QUEST.CARDS.filter((c) => c.deck === deck); return { n: cs.length, m: cs.filter(S.isMastered).length }; };
  const dueCards = (deck) => QUEST.CARDS.filter((c) => (!deck || c.deck === deck) && S.cardState(c).due <= Date.now());

  /* ---------- views ---------- */
  function viewHome() {
    setNav('home');
    const due = dueCards().length;
    const tiles = QUEST.WORLDS.map((w) => {
      const m = mastery(w.id);
      return `<a class="tile" href="#/world/${w.id}"><span class="ico">${w.icon}</span><span class="nm">${esc(w.name)}</span><span class="sub">${esc(w.blurb)}</span>
        <div class="bar"><i style="width:${Math.round((m.m / m.n) * 100)}%"></i></div><span class="meta"><span>${m.m}/${m.n} mastered</span><span>${w.lesson}</span></span></a>`;
    }).join('');
    $app.innerHTML = `
      <div class="hero">
        <div class="panel"><h1>Learn 68000 assembly by playing.</h1>
          <p class="lede">Flashcards with spaced repetition, a built-in 68K simulator that makes endless practice problems, and quick arcade drills, all drawn from your Lesson 3&ndash;8 slides.</p>
          <div class="row"><a class="btn go" href="#/study/all">Daily review (${due} due)</a><a class="btn" href="#/game/tracer">Trace some code</a><a class="btn" href="#/guides">Guides</a><a class="btn" href="#/sandbox">Open sandbox</a></div></div>
        <div class="panel"><h3>Your run</h3><div class="statgrid" style="grid-template-columns:1fr 1fr">
          <div class="panel"><b>${S.state.stats.right}</b>correct</div><div class="panel"><b>${S.streakDays()}</b>day streak</div></div></div>
      </div>
      <div class="sec"><h2>World map</h2><small>one world per topic; master its cards to fill the bar</small></div>
      <div class="grid">${tiles}</div>`;
  }

  function viewWorld(id) {
    setNav('home');
    const w = worldById(id); if (!w) return (location.hash = '#/');
    const m = mastery(id), due = dueCards(id).length, nq = QUEST.QUIZ.filter((q) => q.world === id).length;
    $app.innerHTML = `<p><a href="#/">← Map</a></p><div class="panel"><h1>${w.icon} ${esc(w.name)}</h1><p class="lede">${esc(w.blurb)} · from ${w.lesson}</p>
      <div class="bar" style="margin:10px 0"><i style="width:${Math.round((m.m / m.n) * 100)}%"></i></div>
      <p class="stat"><b>${m.m}</b> of ${m.n} cards mastered · <b>${due}</b> due now</p>
      <div class="row"><a class="btn go" href="#/study/${id}">Study cards</a><a class="btn" href="#/game/blitz/${id}">Boss quiz (${nq} questions)</a>${QUEST_GUIDES.DECK_GUIDE[id] ? `<a class="btn" href="#/guide/${QUEST_GUIDES.DECK_GUIDE[id]}">📖 Read the guide</a>` : ''}</div></div>`;
  }

  function viewCards() {
    setNav('cards');
    const weak = QUEST.CARDS.filter((c) => { const s = S.cardState(c); return s.miss > 0 && s.box < 4; }).length;
    const tiles = QUEST.WORLDS.map((w) => { const m = mastery(w.id), d = dueCards(w.id).length;
      return `<a class="tile" href="#/study/${w.id}"><span class="ico">${w.icon}</span><span class="nm">${esc(w.name)}</span><div class="bar"><i style="width:${Math.round((m.m / m.n) * 100)}%"></i></div><span class="meta"><span>${m.n} cards</span><span>${d} due</span></span></a>`; }).join('');
    $app.innerHTML = `<h1>Flashcards</h1><p class="lede">Cards you miss come back sooner; cards you know move up through five boxes (due again after 1, 2, 4, 8 days). Box 4+ counts as mastered.</p>
      <div class="row" style="margin-bottom:14px"><a class="btn go" href="#/study/all">All due (${dueCards().length})</a><a class="btn" href="#/study/weak">Weak spots (${weak})</a></div><div class="grid">${tiles}</div>`;
  }

  function viewArcade() {
    setNav('arcade');
    const games = [
      ['tracer', '🧮', 'Register Tracer', 'Run code in your head. Results come from a real 68K simulator.', 'L4-5'],
      ['flags', '🚩', 'Flag Flipper', 'Set the X N Z V C flags after ADD, SUB, CMP...', 'L3, L5'],
      ['branch', '🔀', 'Branch Oracle', 'After a CMP, which Bcc instructions fire?', 'L5'],
      ['modes', '🎯', 'Mode Match', 'Name the addressing mode of an operand.', 'L5'],
      ['bugs', '🐛', 'Bug Hunt', 'Spot the illegal or mistaken line.', 'L4-5'],
      ['sorter', '🧩', 'Program Sorter', 'Put real lecture programs back in order.', 'L4-5'],
      ['numbers', '🥷', 'Number Ninja', 'Hex, binary, decimal and two\'s complement.', 'L3'],
      ['hardware', '🧱', 'Hardware Lab', 'Address lines, page decoding, base resistors.', 'L6-8'],
      ['blitz', '⚡', 'Quiz Blitz', 'Timed multiple choice across every world.', 'all'],
    ];
    $app.innerHTML = `<h1>Arcade</h1><p class="lede">Eight questions per run. Right answers earn XP; consecutive hits add a bonus.</p><div class="grid">${games.map((g) =>
      `<a class="tile" href="#/game/${g[0]}"><span class="ico">${g[1]}</span><span class="nm">${g[2]}</span><span class="sub">${g[3]}</span><span class="meta"><span>${g[4]}</span></span></a>`).join('')}</div>`;
  }

  function viewProgress() {
    setNav('progress');
    const s = S.state, lv = S.level(s.xp), tot = s.stats.right + s.stats.wrong;
    const worlds = QUEST.WORLDS.map((w) => { const m = mastery(w.id); return `<tr><td>${w.icon} ${esc(w.name)}</td><td style="width:50%"><div class="bar"><i style="width:${Math.round((m.m / m.n) * 100)}%"></i></div></td><td class="mono">${m.m}/${m.n}</td></tr>`; }).join('');
    const badges = S.BADGES.map((b) => `<div class="badge ${s.badges[b.id] ? '' : 'off'}"><span class="ico">${b.icon}</span><div><b>${b.name}</b><small>${b.desc}</small></div></div>`).join('');
    $app.innerHTML = `<h1>Progress</h1><div class="statgrid">
      <div class="panel"><b>${lv}</b>level · ${esc(S.title(lv))}</div><div class="panel"><b>${s.xp}</b>XP</div>
      <div class="panel"><b>${tot ? Math.round((s.stats.right / tot) * 100) : 0}%</b>accuracy (${tot})</div><div class="panel"><b>${s.bestRun}</b>best run</div><div class="panel"><b>${S.streakDays()}</b>day streak</div></div>
      <div class="sec"><h2>Mastery</h2></div><div class="panel"><table style="width:100%;border-collapse:collapse">${worlds}</table></div>
      <div class="sec"><h2>Badges</h2></div><div class="badges">${badges}</div>
      <div class="sec"><h2>Reset</h2></div><button class="btn bad" id="reset">Erase all progress</button>`;
    document.getElementById('reset').onclick = () => { if (confirm('Erase all XP, cards and badges in this browser?')) { S.reset(); renderHud(); viewProgress(); } };
  }

  /* ---------- flashcard session ---------- */
  function viewStudy(which) {
    setNav('cards');
    let pool, label;
    if (which === 'weak') { pool = QUEST.CARDS.filter((c) => { const s = S.cardState(c); return s.miss > 0 && s.box < 4; }); label = 'Weak spots'; }
    else if (which === 'all') { pool = dueCards(); label = 'Daily review'; }
    else { const w = worldById(which); if (!w) return (location.hash = '#/cards'); pool = dueCards(which); label = w.name; }
    const practice = location.hash.includes('practice');
    if (!pool.length || practice) {
      const base = which === 'all' || which === 'weak' ? QUEST.CARDS : QUEST.CARDS.filter((c) => c.deck === which);
      if (!pool.length && !practice) {
        $app.innerHTML = `<p><a href="#/cards">← Cards</a></p><div class="panel"><h2>Nothing due 🎉</h2><p class="lede">${esc(label)} has no cards due right now. You can still practice the lowest-box cards.</p><a class="btn go" href="#/study/${which}?practice">Practice anyway</a></div>`; return;
      }
      pool = base.slice().sort((a, b) => S.cardState(a).box - S.cardState(b).box);
    }
    const deck = G.shuffle(pool.slice().sort((a, b) => S.cardState(a).box - S.cardState(b).box).slice(0, 14));
    let i = 0, known = 0, back = false;
    function draw() {
      if (i >= deck.length) {
        const xp = known * 4 + 10; award(xp, 'session done');
        $app.innerHTML = `<div class="panel"><h2>Session complete</h2><p class="lede">${known} of ${deck.length} remembered. Missed cards will return soon.</p><div class="row"><a class="btn go" href="#/study/${which}">Another round</a><a class="btn" href="#/cards">Decks</a></div></div>`; return;
      }
      const c = deck[i], w = worldById(c.deck);
      $app.innerHTML = `<p><a href="#/cards">← Decks</a></p><div class="gamehead"><h1>${esc(label)}</h1><div class="progress bar"><i style="width:${(i / deck.length) * 100}%"></i></div><span class="stat"><b>${i + 1}</b>/${deck.length}</span></div>
        <div class="fc"><button class="fcard ${back ? 'back' : ''}" id="flip" aria-label="Flip card"><div class="tag">${w.icon} ${esc(w.name)} · ${c.src}</div>
        <div>${back ? esc(c.a) : esc(c.q)}</div>${back ? '' : '<div class="hint">Think of the answer, then flip (Space)</div>'}</button></div>
        ${back && QUEST_GUIDES.DECK_GUIDE[c.deck] ? `<p class="stat" style="text-align:center"><a href="#/guide/${QUEST_GUIDES.DECK_GUIDE[c.deck]}">📖 Read more in the guide</a></p>` : ''}
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
    blitz:    { title: 'Quiz Blitz', icon: '⚡', timer: 20, make: (l, world) => G.quizQ(world) },
  };
  const ROUNDS = 8;
  let cleanup = null, leaveHook = null;

  function viewGame(id, arg) {
    setNav('arcade');
    if (id === 'sorter') return viewSorter();
    const def = GAMES[id]; if (!def) return (location.hash = '#/arcade');
    if (def.levels && !arg) {
      $app.innerHTML = `<p><a href="#/arcade">← Arcade</a></p><div class="panel"><h1>${def.icon} ${def.title}</h1><p class="lede">Choose a difficulty.</p><div class="row">
        <a class="btn go" href="#/game/${id}/easy">Easy</a><a class="btn" href="#/game/${id}/medium">Medium</a><a class="btn" href="#/game/${id}/hard">Hard</a></div></div>`; return;
    }
    const level = def.levels ? arg : null, world = id === 'blitz' ? arg : null;
    let i = 0, right = 0, streak = 0, locked = false, timerId = null;
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
      $app.innerHTML = `<p><a href="#/arcade">← Arcade</a></p><div class="gamehead"><h1>${def.icon} ${def.title}${level ? ` <span class="pill">${level}</span>` : ''}</h1>
        <div class="progress bar"><i style="width:${(i / total) * 100}%"></i></div><span class="stat">Q <b>${i + 1}</b>/${total} · ✔ <b>${right}</b> · 🔥 <b>${streak}</b></span></div>
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
      if (ok) { right++; streak++; award(10 + Math.min(run - 1, 10), run > 2 ? `${run} in a row` : ''); } else { streak = 0; S.save(); }
      document.getElementById('fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><h3>${ok ? 'Correct!' : 'Not quite'}</h3><div>${lead ? lead + '<br>' : ''}${detail || ''}</div>
        <div class="row" style="margin-top:10px"><button class="btn go" id="next">${i + 1 >= total ? 'Finish' : 'Next'} (Enter)</button></div></div>`;
      document.getElementById('next').onclick = advance; document.getElementById('next').focus();
      cleanup = (e) => { if (e.key === 'Enter') { e.preventDefault(); advance(); } };
    }
    function advance() { i++; next(); }
    function finish() {
      const bonus = right === total ? 40 : right / total >= 0.75 ? 20 : 5;
      award(bonus, right === total ? 'perfect round!' : 'round complete');
      if (right === total && !S.state.badges.perfect) { S.state.badges.perfect = 'x'; }
      $app.innerHTML = `<div class="panel"><h1>${def.icon} ${right}/${total} correct</h1><p class="lede">${right === total ? 'Flawless.' : right / total >= 0.75 ? 'Strong run.' : 'Keep drilling; every miss teaches something.'}</p>
        <div class="row"><a class="btn go" href="#/game/${id}${arg ? '/' + arg : ''}" id="again">Play again</a><a class="btn" href="#/arcade">Arcade</a></div></div>`;
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
        $app.innerHTML = `<p><a href="#/arcade">← Arcade</a></p><div class="gamehead"><h1>🧩 Program Sorter</h1><span class="stat">${esc(P.title)} · ${P.src}</span></div>
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
    const ex = window.EXAMPLES_68K;
    $app.innerHTML = `<h1>Read Code</h1><p class="lede">What does each line actually do? Type any 68K line for a plain-English breakdown, or open a lecture program and read it line by line.</p>
      <div class="panel"><h3>Anatomy of a line</h3>
        <pre class="code"><span class="kw">LABEL</span>    <span class="kw">OPCODE</span>.<span class="kw">SIZE</span> <span class="kw">OPERAND1</span>,<span class="kw">OPERAND2</span>  <span class="cm">* COMMENT</span>
loop     ADD.B   (A0)+,D1        <span class="cm">* add a byte, advance the pointer</span></pre>
        <p class="lede" style="margin:0">Label: starts in column 1 (optional). Opcode: what to do. Size: <code>.B</code> byte, <code>.W</code> word, <code>.L</code> long. Operands: comma-separated, no spaces; for two-operand instructions the <b>source comes first and the destination last</b>. Comment: after <code>*</code> or <code>;</code>.</p></div>
      <div class="panel" style="margin-top:12px"><h3>Explain a line</h3>
        <input id="rdline" class="addr" style="width:100%;font-size:1rem" value="        MOVE.B (A0)+,D1" aria-label="Assembly line to explain" spellcheck="false" autocomplete="off">
        <div id="rdout" style="margin-top:10px"></div></div>
      <div class="sec"><h2>Annotated programs</h2><small>click a line to open its explanation</small></div>
      <div class="row" style="margin-bottom:10px"><select id="rdsel" class="btn" aria-label="Choose a program">${ex.map((e, i) => `<option value="${i}">${esc(e.name)}</option>`).join('')}</select></div>
      <div id="rdprog"></div>
      <div class="row" style="margin-top:14px"><a class="btn" href="#/guide/instructions">📖 Instruction reference</a><a class="btn" href="#/guide/modes">📖 Addressing modes</a><a class="btn" href="#/guide/branches">📖 Branches</a><a class="btn" href="#/sandbox">Try it in the sandbox</a></div>`;
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
    const tiles = QUEST_GUIDES.GUIDES.map((g) => `<a class="tile" href="#/guide/${g.id}"><span class="ico">${g.icon}</span><span class="nm">${esc(g.title)}</span><span class="sub">${esc(g.summary)}</span><span class="meta"><span>${g.lesson}</span></span></a>`).join('');
    $app.innerHTML = `<h1>Guides</h1><p class="lede">Readable explanations of how everything works, in the order you'll need it. Each ends with a link to practice the topic.</p>
      <div class="row" style="margin-bottom:14px"><a class="btn" href="#/glossary">📖 Glossary (${QUEST_GUIDES.GLOSSARY.length} terms)</a><a class="btn" href="#/read">Read Code</a><a class="btn" href="#/tests">✔ Tests &amp; audit report</a></div><div class="grid">${tiles}</div>
      <div class="sec"><h2>References &amp; further reading</h2><small>opens in a new tab</small></div>
      <div class="panel"><ul class="reflist">${QUEST_GUIDES.REFS.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.title)}</a><br><span class="dim">${esc(r.note)}</span></li>`).join('')}</ul></div>`;
  }
  function viewGuide(id) {
    setNav('guides');
    const list = QUEST_GUIDES.GUIDES, k = list.findIndex((g) => g.id === id); if (k < 0) return (location.hash = '#/guides');
    const g = list[k], prev = list[k - 1], next = list[k + 1];
    const world = QUEST.WORLDS.find((w) => w.id === g.practice[0]);
    $app.innerHTML = `<p><a href="#/guides">← Guides</a></p><article class="guide"><h1>${g.icon} ${esc(g.title)}</h1><p class="stat">Source: ${g.lesson}</p>${QUEST_GUIDES.render(g.md)}</article>
      <div class="panel" style="margin-top:16px"><h3>Practice this</h3><div class="row">${world ? `<a class="btn go" href="#/study/${world.id}">Flashcards: ${esc(world.name)}</a>` : ''}<a class="btn" href="#/arcade">${esc(g.practice[1])}</a><a class="btn" href="#/sandbox">Sandbox</a></div></div>
      ${(QUEST_GUIDES.SEE[g.id] || []).length ? `<div class="panel" style="margin-top:12px"><h3>See also</h3><div class="row">${QUEST_GUIDES.SEE[g.id].map((x) => { const t = list.find((y) => y.id === x); return t ? `<a class="btn" href="#/guide/${t.id}">${t.icon} ${esc(t.title)}</a>` : ''; }).join('')}<a class="btn" href="#/glossary">📖 Glossary</a>${g.id !== 'errata' ? '<a class="btn" href="#/guide/errata">⚠️ Slide errata</a>' : ''}</div></div>` : ''}
      <div class="row" style="justify-content:space-between;margin-top:14px">${prev ? `<a class="btn" href="#/guide/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/guide/${next.id}">${esc(next.title)} →</a>` : ''}</div>`;
  }
  function viewGlossary() {
    setNav('guides');
    const all = QUEST_GUIDES.GLOSSARY;
    $app.innerHTML = `<p><a href="#/guides">← Guides</a></p><h1>Glossary</h1><input id="gq" class="addr" style="width:100%;font-size:1rem" placeholder="Search terms and definitions…" aria-label="Search the glossary" autocomplete="off"><p class="stat" id="gcount"></p><dl id="gl" class="gloss"></dl>`;
    const draw = () => {
      const q = document.getElementById('gq').value.trim().toLowerCase();
      const hit = all.filter((t) => !q || t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q));
      document.getElementById('gcount').textContent = `${hit.length} of ${all.length} terms`;
      document.getElementById('gl').innerHTML = hit.map((t) => `<dt>${esc(t.term)} <span class="pill">${t.cat} · ${t.lesson}</span></dt><dd>${esc(t.def)}${QUEST_GUIDES.CAT_GUIDE[t.cat] ? ` <a href="#/guide/${QUEST_GUIDES.CAT_GUIDE[t.cat]}">Read more →</a>` : ''}</dd>`).join('');
    };
    document.getElementById('gq').oninput = draw; draw();
  }


  /* ---------- Tests & audit report ---------- */
  function viewTests() {
    setNav('guides');
    $app.innerHTML = `<p><a href="#/guides">← Guides</a></p><h1>Tests &amp; content audit</h1>
      <p class="lede">Every flashcard, quiz question, glossary term and guide section was checked against the lecture slides, Motorola's M68000 Programmer's Reference Manual, the EASy68K documentation, and a real EASy68K assembler/simulator built locally and used as an oracle. Items found wrong were corrected on this site (see <a href="#/guide/errata">Slide errata</a>).</p>
      <div class="panel"><h3>Emulator verification</h3><ul>
        <li>The assembler reproduces the lecture's published list file byte for byte, and all bundled example programs assemble to the same machine code and finish in the same state as the real EASy68K.</li>
        <li>A differential fuzzer (<code>tests/oracle/fuzz.js</code>) generates random instructions, assembles and runs each in both the real EASy68K and this site's assembler and CPU, and compares machine code, registers, flags and memory. Known, intentional differences: MULS/DIVU flag handling, BCD N/V flags, CHK exception frames (see Slide errata).</li>
        <li>This page does not yet re-run those vectors inside your browser; that is on the roadmap.</li></ul></div>
      <div id="auditbox"><p class="stat">Loading audit results…</p></div>`;
    const draw = () => {
      const rows = window.AUDIT_DATA || []; const box = document.getElementById('auditbox'); if (!box) return;
      const kinds = ['card', 'quiz', 'guide', 'glossary'], verdicts = ['CONFIRMED', 'CORRECTED', 'UNVERIFIED'];
      const tbl = kinds.map((k) => `<tr><td>${k}</td>${verdicts.map((v) => `<td class="mono">${rows.filter((r) => r.kind === k && r.verdict === v).length}</td>`).join('')}<td class="mono">${rows.filter((r) => r.kind === k).length}</td></tr>`).join('');
      box.innerHTML = `<div class="panel" style="margin-top:12px"><h3>Audit summary</h3><div class="tablewrap"><table class="gt"><thead><tr><th>Content</th><th>Confirmed</th><th>Corrected</th><th>Unverified</th><th>Total</th></tr></thead><tbody>${tbl}</tbody></table></div>
        <p class="stat">Audited by small-model reviewers using the sources above; every executable claim was run on the real EASy68K. Some checks of Motorola/Zilog manual details rely on the reviewer's recollection and are marked in the evidence.</p></div>
        <div class="row" style="margin:12px 0"><select id="avk" class="btn" aria-label="Filter by content"><option value="">All content</option>${kinds.map((k) => `<option>${k}</option>`).join('')}</select>
        <select id="avv" class="btn" aria-label="Filter by verdict"><option value="">All verdicts</option>${verdicts.map((v) => `<option>${v}</option>`).join('')}</select><input id="avq" class="addr" style="flex:1;min-width:160px" placeholder="Search…" aria-label="Search audit results"></div>
        <div id="avlist"></div>`;
      const list = () => {
        const k = document.getElementById('avk').value, v = document.getElementById('avv').value, q = document.getElementById('avq').value.toLowerCase();
        const hit = rows.filter((r) => (!k || r.kind === k) && (!v || r.verdict === v) && (!q || (r.title + r.evidence).toLowerCase().includes(q)));
        document.getElementById('avlist').innerHTML = `<p class="stat">${hit.length} of ${rows.length} items</p>` + hit.slice(0, 250).map((r) => `<details class="rl"><summary class="ln"><span class="pill v-${r.verdict}">${r.verdict}</span><span class="tx" style="white-space:normal">${esc(r.title.slice(0, 140))}</span></summary><div class="rx"><p>${esc(r.evidence)}</p><p class="dim">Sources: ${esc(r.sources.join(', ') || '-')}${r.fixed ? ' · corrected on this site' : ''}</p></div></details>`).join('') + (hit.length > 250 ? '<p class="stat">Showing the first 250. Narrow the filter to see more.</p>' : '');
      };
      ['avk', 'avv', 'avq'].forEach((id) => (document.getElementById(id).oninput = list)); list();
    };
    if (window.AUDIT_DATA) draw(); else { const sc = document.createElement('script'); sc.src = 'tests/data/audit.js?v=20261015b'; sc.onload = draw; sc.onerror = () => { const b = document.getElementById('auditbox'); if (b) b.textContent = 'Could not load the audit data.'; }; document.head.appendChild(sc); }
  }

  /* ---------- router ---------- */
  function route() {
    cleanup = null; if (leaveHook) { try { leaveHook(); } catch (e) { /* ignore */ } leaveHook = null; }
    const raw = location.hash.replace(/^#\/?/, ''), [pathq] = raw.split('?'), parts = pathq.split('/').filter(Boolean);
    window.scrollTo(0, 0);
    try {
      switch (parts[0]) {
        case undefined: viewHome(); break;
        case 'world': viewWorld(parts[1]); break;
        case 'cards': viewCards(); break;
        case 'study': viewStudy(parts[1] || 'all'); break;
        case 'arcade': viewArcade(); break;
        case 'game': viewGame(parts[1], parts[2]); break;
        case 'progress': viewProgress(); break;
        case 'read': viewRead(); break;
        case 'guides': viewGuides(); break;
        case 'guide': viewGuide(parts[1]); break;
        case 'glossary': viewGlossary(); break;
        case 'tests': viewTests(); break;
        case 'sandbox': if (window.Sandbox && window.Sandbox.view) { setNav('sandbox'); window.Sandbox.view($app, { award, query: new URLSearchParams(raw.split('?')[1] || ''), onLeave: (f) => (leaveHook = f) }); } else viewHome(); break;
        default: viewHome();
      }
    } catch (err) {
      $app.innerHTML = `<div class="panel"><h2>Something broke</h2><pre class="code">${esc(err.stack || err)}</pre><a class="btn" href="#/">Home</a></div>`;
    }
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
