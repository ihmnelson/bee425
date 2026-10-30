/* The live machine on the home page: a few lines of real code running on the real simulator core of a processor,
   one instruction at a time, with the registers beside it. The pack supplies { src, make() } in PACK_UI.demo;
   make() returns { step(), done(), line() -> source line being executed, regs() -> [[name, value, hexWidth]], flags() -> text, count() -> text }.
   It starts by itself unless the visitor prefers reduced motion, stops when the page is left or hidden, and always has Step and Pause. */
(function (root) {
  'use strict';
  const timers = new Set();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hex = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');

  function mount(el, pack) {
    const cfg = pack.PACK_UI.demo, lines = cfg.src.replace(/\n$/, '').split('\n');
    el.innerHTML = `<pre class="code mcode" aria-label="Program">${lines.map((l, i) => `<span class="ml" data-n="${i + 1}">${esc(l) || ' '}</span>`).join('')}</pre>
      <div class="mside"><table class="regs mregs" aria-label="Registers"><tbody></tbody></table><p class="stat mflags"></p><p class="stat mcount"></p>
      <div class="row"><button class="btn mstep" type="button">Step</button><button class="btn ghost mplay" type="button"></button></div></div>`;
    const $ = (s) => el.querySelector(s);
    const tbody = $('.mregs tbody'), rows = {}; let m, prev = {}, playing = !(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches), timer = null, holdUntil = 0;
    const reset = () => { m = cfg.make(); prev = {}; draw(); };
    function draw() {
      const regs = m.regs(), now = {};
      regs.forEach(([n, v, w]) => {
        if (!rows[n]) { const tr = document.createElement('tr'); tr.innerHTML = `<td>${n}</td><td class="v"></td>`; tbody.appendChild(tr); rows[n] = tr; }
        const td = rows[n].lastChild, text = hex(v, w); td.textContent = text; td.classList.toggle('chg', prev[n] !== undefined && prev[n] !== text); now[n] = text;
      });
      prev = now; $('.mflags').textContent = m.flags(); $('.mcount').textContent = m.count();
      const cur = m.line(); el.querySelectorAll('.ml').forEach((s) => s.classList.toggle('on', +s.dataset.n === cur));
      $('.mplay').textContent = playing ? 'Pause' : 'Run';
    }
    function tick() {
      timers.delete(timer); timer = null; if (!playing) return;
      if (m.done()) { if (!holdUntil) holdUntil = Date.now() + 1800; if (Date.now() >= holdUntil) { holdUntil = 0; reset(); } }
      else { m.step(); draw(); }
      schedule();
    }
    function schedule() { if (timer || !playing || document.hidden) return; timer = setTimeout(tick, m.done() ? 400 : 800); timers.add(timer); }
    $('.mstep').onclick = () => { if (m.done()) reset(); else { m.step(); draw(); } };
    $('.mplay').onclick = () => { playing = !playing; draw(); if (playing) schedule(); else if (timer) { clearTimeout(timer); timers.delete(timer); timer = null; } };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    reset(); schedule();
  }
  root.Demo = { mount, stopAll() { timers.forEach((t) => clearTimeout(t)); timers.clear(); } };
})(window);
