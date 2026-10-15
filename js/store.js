/* Persistent progress (localStorage, with in-memory fallback). */
(function () {
  'use strict';
  const KEY = 'q68k.v1';
  const BOX_DAYS = [0, 0, 1, 2, 4, 8]; // index = box, value = days until due again
  const DAY = 86400000;

  const fresh = () => ({ xp: 0, cards: {}, stats: { right: 0, wrong: 0, games: {} }, bestRun: 0, days: [], badges: {}, daily: {} });
  let state = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* private window or blocked storage: run in memory */ }

  const today = () => new Date().toISOString().slice(0, 10);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  const level = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
  const levelStart = (lv) => 40 * (lv - 1) * (lv - 1);
  const TITLES = ['Bit', 'Nibble', 'Byte', 'Word', 'Long Word', 'Address Register', 'Stack Pointer', 'Supervisor', 'Op-code Wizard', 'Assembler Sage'];
  const title = (lv) => TITLES[Math.min(lv - 1, TITLES.length - 1)];

  function streakDays() {
    const set = new Set(state.days);
    let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  const BADGES = [
    { id: 'first', icon: '🥇', name: 'First Blood', desc: 'Answer your first question right', test: (s) => s.stats.right >= 1 },
    { id: 'run10', icon: '🔥', name: 'Hot Streak', desc: '10 correct in a row', test: (s) => s.bestRun >= 10 },
    { id: 'cards50', icon: '🃏', name: 'Card Shark', desc: 'Review 50 flashcards', test: (s) => (s.stats.games.cards || 0) >= 50 },
    { id: 'tracer20', icon: '🧮', name: 'Human CPU', desc: '20 Register Tracer answers right', test: (s) => (s.stats.games.tracer || 0) >= 20 },
    { id: 'flags20', icon: '🚩', name: 'Flag Waver', desc: '20 Flag Flipper answers right', test: (s) => (s.stats.games.flags || 0) >= 20 },
    { id: 'branch15', icon: '🔀', name: 'Branch Manager', desc: '15 Branch Oracle answers right', test: (s) => (s.stats.games.branch || 0) >= 15 },
    { id: 'bugs10', icon: '🐛', name: 'Bug Squasher', desc: '10 Bug Hunt answers right', test: (s) => (s.stats.games.bugs || 0) >= 10 },
    { id: 'sort3', icon: '🧩', name: 'Program Builder', desc: 'Assemble 3 programs', test: (s) => (s.stats.games.sorter || 0) >= 3 },
    { id: 'days3', icon: '📅', name: 'Three-Day Streak', desc: 'Study on 3 days in a row', test: () => streakDays() >= 3 },
    { id: 'lv5', icon: '⭐', name: 'Level 5', desc: 'Reach level 5', test: (s) => level(s.xp) >= 5 },
    { id: 'master', icon: '🏆', name: 'Deck Master', desc: 'Master every card in one world', test: (s, api) => api.worldsMastered().length > 0 },
  ];

  const api = {
    get state() { return state; },
    save, hash, level, levelStart, title, streakDays, BADGES,
    cardId: (c) => c.deck + ':' + hash(c.q),
    touchDay() { const t = today(); if (!state.days.includes(t)) { state.days.push(t); state.days = state.days.slice(-120); } },
    addXp(n) { state.xp += n; state.daily[today()] = (state.daily[today()] || 0) + n; api.touchDay(); },
    record(game, ok) {
      if (ok) { state.stats.right++; state.stats.games[game] = (state.stats.games[game] || 0) + 1; }
      else state.stats.wrong++;
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
    worldsMastered() {
      return QUEST.WORLDS.filter((w) => { const cs = QUEST.CARDS.filter((c) => c.deck === w.id); return cs.length && cs.every(api.isMastered); }).map((w) => w.id);
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
