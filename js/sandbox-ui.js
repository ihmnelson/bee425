/* Sandbox page: editor, listing, registers, flags, memory. */
(function () {
  'use strict';
  const SB = window.Sandbox;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hx = (v, w) => '$' + (v >>> 0).toString(16).toUpperCase().padStart(w, '0');
  const KEY = 'q68k.sandbox.src';
  const keep = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } };
  const saved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };

  SB.view = function (root, opts) {
    let prog = null, mach = null, before = null, memBase = 0x1000, awarded = false;
    root.innerHTML = `
      <h1>Sandbox <span class="pill">EASy68K-style</span></h1>
      <p class="lede">Type or load a program, assemble it, then step through and watch registers, flags and memory change. It simulates the instructions from the lectures; it does not produce machine code, so keep using real EASy68K for labs.</p>
      <div class="row" style="margin-bottom:10px">
        <select id="ex" class="btn" aria-label="Example programs"><option value="">Load example…</option>${SB.EXAMPLES.map((e, i) => `<option value="${i}">${esc(e.name)}</option>`).join('')}</select>
        <button class="btn go" id="asm">Assemble</button>
        <button class="btn" id="step" disabled>Step</button>
        <button class="btn" id="step10" disabled>Step ×10</button>
        <button class="btn" id="run" disabled>Run</button>
        <button class="btn ghost" id="rst" disabled>Reset</button>
      </div>
      <div class="sbgrid">
        <div>
          <div id="editorbox"><textarea id="src" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Assembly source"></textarea></div>
          <div id="listing" class="listing" hidden></div>
          <div id="status" class="sbstatus" role="status"></div>
        </div>
        <div>
          <div class="panel"><div id="flags" class="flagrow"></div><table class="regs" id="regs"></table></div>
          <div class="panel" style="margin-top:10px"><div class="row" style="margin-bottom:6px"><b>Memory</b>
            <input id="memaddr" class="addr" value="001000" aria-label="Memory address (hex)"><select id="symsel" class="btn" aria-label="Jump to label"><option value="">label…</option></select></div>
            <div id="mem" class="mem"></div></div>
        </div>
      </div>`;
    const $ = (id) => root.querySelector('#' + id);
    const src = $('src');
    src.value = saved() || SB.EXAMPLES[1].src;
    src.addEventListener('input', () => keep(src.value));
    src.addEventListener('keydown', (e) => { // Tab inserts spaces
      if (e.key === 'Tab') { e.preventDefault(); const s = src.selectionStart; src.setRangeText('        ', s, src.selectionEnd, 'end'); keep(src.value); }
    });

    function status(msg, kind) { const el = $('status'); el.textContent = msg || ''; el.className = 'sbstatus ' + (kind || ''); }
    function setButtons(on) { ['step', 'step10', 'run', 'rst'].forEach((id) => ($(id).disabled = !on || !mach)); if (mach) { ['step', 'step10', 'run'].forEach((id) => ($(id).disabled = !mach.running)); $('rst').disabled = false; } }

    function assemble() {
      keep(src.value);
      prog = SB.assemble(src.value);
      if (prog.errors.length) {
        status(prog.errors.slice(0, 6).map((e) => `Line ${e.line}: ${e.msg}`).join('\n'), 'bad');
        mach = null; $('listing').hidden = true; $('editorbox').hidden = false; draw(); setButtons(false); return;
      }
      mach = new SB.Machine(prog); before = mach.snapshot(); awarded = false;
      const sel = $('symsel'); sel.innerHTML = '<option value="">label…</option>' + Object.entries(prog.syms).filter(([, v]) => typeof v === 'number' && v > 255).sort((a, b) => a[1] - b[1]).map(([k, v]) => `<option value="${v}">${esc(k)} (${hx(v, 4)})</option>`).join('');
      const data = Object.entries(prog.syms).filter(([, v]) => typeof v === 'number' && v > 0xFF && !prog.insts.has(v)).sort((a, b) => a[1] - b[1]);
      memBase = data.length ? data[0][1] & ~0xF : prog.start & ~0xF; $('memaddr').value = memBase.toString(16).toUpperCase().padStart(6, '0');
      $('editorbox').hidden = true; $('listing').hidden = false;
      status(`Assembled ${prog.order.length} instructions. Entry point ${hx(prog.start, 6)}. SP starts at $01000000 unless your code sets it.`, 'ok');
      draw(); setButtons(true);
    }

    function listingHtml() {
      return `<div class="lhead"><button class="btn ghost" id="edit">✎ Edit source</button></div>` + prog.listing.map((l) => {
        const cur = mach && mach.running && l.inst && l.addr === mach.pc ? ' cur' : '';
        const last = mach && mach.line === l.n && !cur && mach.steps ? ' last' : '';
        return `<div class="ln${cur}${last}" data-n="${l.n}"><span class="ad">${l.addr != null ? hx(l.addr, 6) : ''}</span><span class="tx">${esc(l.text) || '&nbsp;'}</span></div>`;
      }).join('');
    }

    function draw() {
      if (prog && mach) {
        const lst = $('listing'); const old = lst.scrollTop; lst.innerHTML = listingHtml(); lst.scrollTop = old;
        const cur = lst.querySelector('.cur'); if (cur) { const t = cur.offsetTop - lst.clientHeight / 2; if (Math.abs(t - old) > lst.clientHeight / 2) lst.scrollTop = Math.max(0, t); }
        const ed = lst.querySelector('#edit'); if (ed) ed.onclick = () => { $('listing').hidden = true; $('editorbox').hidden = false; mach = null; setButtons(false); status(''); draw(); };
      }
      const D = mach ? mach.sim.D : new Array(8).fill(0), A = mach ? mach.sim.A : new Array(8).fill(0), f = mach ? mach.sim.f : { X: 0, N: 0, Z: 0, V: 0, C: 0 };
      const b = before || { D, A, f, pc: 0 };
      const row = (nm, v, old) => `<td class="${v !== old ? 'chg' : ''}">${nm}</td><td class="${v !== old ? 'chg' : ''}">${hx(v, 8)}</td>`;
      let h = '';
      for (let i = 0; i < 8; i++) h += `<tr>${row('D' + i, D[i], b.D[i])}${row(i === 7 ? 'A7/SP' : 'A' + i, A[i], b.A[i])}</tr>`;
      h += `<tr>${row('PC', mach ? mach.pc : 0, b.pc)}<td colspan="2" class="mono dim">steps: ${mach ? mach.steps : 0}</td></tr>`;
      $('regs').innerHTML = h;
      $('flags').innerHTML = ['X', 'N', 'Z', 'V', 'C'].map((k) => `<span class="fl ${f[k] ? 'on' : ''} ${f[k] !== b.f[k] ? 'chg' : ''}">${k}<b>${f[k]}</b></span>`).join('');
      drawMem();
    }

    function drawMem() {
      const base = parseInt($('memaddr').value, 16); if (Number.isNaN(base)) return;
      const a0 = base & ~0xF; let h = '';
      for (let r = 0; r < 8; r++) {
        const a = a0 + r * 16; let bytes = '', asc = '';
        for (let c = 0; c < 16; c++) {
          const v = mach ? mach.sim.rb(a + c) : 0, w = mach && mach.written.has(((a + c) >>> 0));
          bytes += `<span class="${w ? 'chg' : ''}">${v.toString(16).toUpperCase().padStart(2, '0')}</span> `;
          asc += v >= 32 && v < 127 ? esc(String.fromCharCode(v)) : '.';
        }
        h += `<div>${hx(a, 6)}: ${bytes} <span class="dim">${asc}</span></div>`;
      }
      $('mem').innerHTML = h;
    }

    function after() {
      if (mach.error) status(mach.error, 'bad');
      else if (mach.halted) { status(`${mach.halted} after ${mach.steps} steps.`, 'ok'); if (!awarded && opts.award) { awarded = true; opts.award(5, 'program ran'); } }
      else if (mach.note) status(mach.note, '');
      else status('');
      draw(); setButtons(true);
    }

    $('asm').onclick = assemble;
    $('step').onclick = () => { before = mach.snapshot(); mach.step(); after(); };
    $('step10').onclick = () => { before = mach.snapshot(); for (let i = 0; i < 10 && mach.running; i++) mach.step(); after(); };
    $('run').onclick = () => { before = mach.snapshot(); mach.run(); after(); };
    $('rst').onclick = () => { mach.reset(); before = mach.snapshot(); status('Reset.', ''); draw(); setButtons(true); };
    $('ex').onchange = (e) => { if (e.target.value === '') return; src.value = SB.EXAMPLES[+e.target.value].src; keep(src.value); e.target.value = ''; $('listing').hidden = true; $('editorbox').hidden = false; mach = null; setButtons(false); status('Example loaded. Click Assemble.'); draw(); };
    $('memaddr').oninput = drawMem;
    $('symsel').onchange = (e) => { if (e.target.value) { $('memaddr').value = (+e.target.value & ~0xF).toString(16).toUpperCase().padStart(6, '0'); drawMem(); } };
    draw(); setButtons(false);
  };
})();
