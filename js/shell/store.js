/* Persistent progress (localStorage, with in-memory fallback). One progress record covers every processor pack.
   Older single-processor versions of the site stored progress under their own keys; those are merged in once. */
(function () {
  'use strict';
  const KEY = 'qbee425.v1', OLD = ['q68k.v1', 'qz80.v1'];
  const BOX_DAYS = [0, 0, 1, 2, 4, 8]; // index = box, value = days until due again
  const DAY = 86400000;

  const fresh = () => ({ xp: 0, cards: {}, stats: { right: 0, wrong: 0, games: {} }, bestRun: 0, days: [], badges: {}, daily: {} });
  const load = (k) => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
  function merge(a, b) {            // combine two progress records (used for the one-time migration)
    const out = Object.assign(fresh(), a);
    out.xp = (a.xp || 0) + (b.xp || 0);
    out.cards = Object.assign({}, b.cards, a.cards);
    out.stats = { right: (a.stats.right || 0) + (b.stats.right || 0), wrong: (a.stats.wrong || 0) + (b.stats.wrong || 0), games: Object.assign({}, a.stats.games) };
    for (const [k, v] of Object.entries(b.stats.games || {})) out.stats.games[k] = (out.stats.games[k] || 0) + v;
    out.bestRun = Math.max(a.bestRun || 0, b.bestRun || 0);
    out.days = Array.from(new Set([...(a.days || []), ...(b.days || [])])).sort().slice(-120);
    out.badges = Object.assign({}, b.badges, a.badges);
    out.daily = Object.assign({}, b.daily); for (const [k, v] of Object.entries(a.daily || {})) out.daily[k] = (out.daily[k] || 0) + v;
    return out;
  }
  let state = fresh();
  const cur = load(KEY);
  if (cur) state = Object.assign(fresh(), cur);
  else {
    const olds = OLD.map(load).filter(Boolean).map((o) => Object.assign(fresh(), o));
    if (olds.length) state = olds.reduce((acc, o) => merge(acc, o), fresh());
    try { if (olds.length) localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const today = () => new Date().toISOString().slice(0, 10);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  const level = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
  const levelStart = (lv) => 40 * (lv - 1) * (lv - 1);
  const title = () => '';          // levels are plain numbers

  function streakDays() {
    const set = new Set(state.days);
    let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  const BADGES = [
    { id: 'first', name: 'First correct answer', desc: 'Answer your first question right', test: (s) => s.stats.right >= 1 },
    { id: 'run10', name: 'Ten correct answers in a row', desc: '10 correct in a row', test: (s) => s.bestRun >= 10 },
    { id: 'cards50', name: 'Fifty flashcards reviewed', desc: 'Review 50 flashcards', test: (s) => (s.stats.games.cards || 0) >= 50 },
    { id: 'tracer20', name: 'Twenty Register Tracer answers correct', desc: '20 Register Tracer answers right', test: (s) => (s.stats.games.tracer || 0) >= 20 },
    { id: 'flags20', name: 'Twenty Flag Flipper answers correct', desc: '20 Flag Flipper answers right', test: (s) => (s.stats.games.flags || 0) >= 20 },
    { id: 'branch15', name: 'Fifteen Branch Oracle answers correct', desc: '15 Branch Oracle answers right', test: (s) => (s.stats.games.branch || 0) >= 15 },
    { id: 'bugs10', name: 'Ten Bug Hunt answers correct', desc: '10 Bug Hunt answers right', test: (s) => (s.stats.games.bugs || 0) >= 10 },
    { id: 'sort3', name: 'Three programs put in order', desc: 'Assemble 3 programs', test: (s) => (s.stats.games.sorter || 0) >= 3 },
    { id: 'days3', name: 'Studied three days in a row', desc: 'Study on 3 days in a row', test: () => streakDays() >= 3 },
    { id: 'lv5', name: 'Level 5 reached', desc: 'Reach level 5', test: (s) => level(s.xp) >= 5 },
    { id: 'master', name: 'Every card in one topic mastered', desc: 'Master every card in one world', test: (s, api) => api.worldsMastered().length > 0 },
    { id: 'both', name: 'A correct answer on both processors', desc: 'Get a card right on both the 68000 and the Z80', test: (s) => !!(s.packs && s.packs.m68k && s.packs.z80) },
  ];

  const api = {
    get state() { return state; },
    save, hash, level, levelStart, title, streakDays, BADGES,
    cardId: (c) => c.deck + ':' + hash(c.q),
    touchDay() { const t = today(); if (!state.days.includes(t)) { state.days.push(t); state.days = state.days.slice(-120); } },
    addXp(n) { state.xp += n; state.daily[today()] = (state.daily[today()] || 0) + n; api.touchDay(); },
    record(game, ok) {
      if (ok) {
        state.stats.right++; state.stats.games[game] = (state.stats.games[game] || 0) + 1;
        if (window.PACKS && PACKS.cur) { state.packs = state.packs || {}; state.packs[PACKS.cur] = (state.packs[PACKS.cur] || 0) + 1; }
      } else state.stats.wrong++;
      api.touchDay();
    },
    run(ok) { // returns the current streak so the UI can award bonus XP
      api._run = ok ? (api._run || 0) + 1 : 0;
      if (api._run > state.bestRun) state.bestRun = api._run;
      return api._run;
    },
    cardState(c) { return state.cards[api.cardId(c)] || { box: 1, due: 0, seen: 0, miss: 0 }; },
    grade(c, known) {
      const id = api.cardId(c);
      const s = state.cards[id] || { box: 1, due: 0, seen: 0, miss: 0 };
      s.seen++;
      if (known) { s.box = Math.min(5, s.box + 1); s.due = Date.now() + BOX_DAYS[s.box] * DAY; }
      else { s.box = 1; s.miss++; s.due = 0; }
      state.cards[id] = s;
    },
    isMastered: (c) => api.cardState(c).box >= 4,
    // world ids (prefixed with the pack id) in which every card is mastered
    worldsMastered() {
      const out = [];
      for (const id of PACKS.order) {
        const Q = PACKS.list[id].QUEST;
        Q.WORLDS.forEach((w) => { const cs = Q.CARDS.filter((c) => c.deck === w.id); if (cs.length && cs.every(api.isMastered)) out.push(id + ':' + w.id); });
      }
      return out;
    },
    newBadges() {
      const out = [];
      BADGES.forEach((b) => { if (!state.badges[b.id] && b.test(state, api)) { state.badges[b.id] = today(); out.push(b); } });
      return out;
    },
    reset() { state = fresh(); api._run = 0; save(); },
  };
  window.Store = api;
})();
