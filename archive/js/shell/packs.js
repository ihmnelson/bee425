/* Processor "packs". BEE 425 Quest teaches more than one processor (68000, Z80). Each pack is a set of scripts that,
   when loaded, define the same global names (QUEST, QUEST_GUIDES, Games, Explain, Sandbox, ...). After a pack's scripts
   have run, PACKS.capture(id) moves those globals into a registry entry; PACKS.activate(id) puts one pack's set back
   on `window`, so pack code that looks the globals up at call time (games, store, sandbox) sees the pack that is open. */
(function (root) {
  'use strict';
  const NAMES = ['QUEST', 'QUEST_GUIDES', 'Games', 'Explain', 'Sandbox', 'HomeworkUI', 'Homework', 'PACK_UI'];
  const PACKS = {
    list: {}, order: [], cur: null, NAMES,
    capture(id) {
      const pk = { id };
      NAMES.forEach((n) => { if (n in root) { pk[n] = root[n]; delete root[n]; } });
      pk.Projects = root.Projects.make(id, pk.PACK_UI.projects);
      PACKS.list[id] = pk; PACKS.order.push(id);
    },
    activate(id) {
      const pk = PACKS.list[id]; if (!pk) return false;
      NAMES.forEach((n) => { if (pk[n] !== undefined) root[n] = pk[n]; else delete root[n]; });
      root.Projects = pk.Projects; PACKS.cur = id; return true;
    },
    get ui() { return PACKS.list[PACKS.cur] && PACKS.list[PACKS.cur].PACK_UI; },
  };
  root.PACKS = PACKS;
})(typeof window !== 'undefined' ? window : globalThis);
