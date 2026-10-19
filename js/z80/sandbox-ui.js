/* Sandbox page: Oshonsoft-style editor, assembler, Z80 simulator, terminal, registers, memory, stack and ports. */
(function () {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const h2 = (v) => (v & 0xFF).toString(16).toUpperCase().padStart(2, '0');
  const h4 = (v) => (v & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  const KEY = 'qz80.sandbox.src', BPKEY = 'qz80.sandbox.bp', CURKEY = 'qz80.sandbox.current', OPTKEY = 'qz80.sandbox.opts';
  const keep = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const saved = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const b64 = { enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))) };

  window.Sandbox = { view(root, opts) {
    opts = opts || {};
    const EX = window.EXAMPLES_Z80;
    let result = null, cpu = null, mach = null, history = [], bps = new Set(JSON.parse(saved(BPKEY) || '[]')), tab = 'mem', memBase = 0x0100;
    let running = false, timer = null, before = null, written = new Set(), awarded = false, note = '', waiting = null, intPending = false, instAddrs = new Set();
    let o = Object.assign({ haltStops: true, promptIn: true, start: 0 }, JSON.parse(saved(OPTKEY) || '{}'));

    root.innerHTML = `
      <h1>Sandbox <span class="pill">Oshonsoft-style Z80</span></h1>
      <p class="lede">Write Z80 assembly, assemble it, then run it or step through it one instruction at a time. The assembler and simulator work on real machine code, with exact T-states, and follow the Oshonsoft Z80 Simulator IDE. Output goes to the terminal on port <code>02H</code>; <code>IN</code> reads port <code>01H</code> and asks you for a value, as the IDE does.</p>
      <ol class="steps-inline"><li>Pick an example, or type your own program.</li><li>Choose <b>Assemble</b> (Ctrl+Enter). Any errors are listed under the editor.</li><li>Choose <b>Step</b> to run one instruction and watch the registers change, or <b>Run</b> to run to the end.</li></ol>
      <div class="toolbar">
        <select id="ex" class="btn" aria-label="Example programs"><option value="">Examples…</option>${EX.map((e, i) => `<option value="${i}">${esc(e.name)}</option>`).join('')}</select>
        <button class="btn go" id="asm" title="Assemble (Ctrl+Enter)">Assemble</button>
        <span class="sep"></span>
        <button class="btn" id="step" disabled title="Execute one instruction">Step</button>
        <button class="btn" id="over" disabled title="Step over a CALL, RST or repeating block instruction">Step over</button>
        <button class="btn" id="back" disabled title="Undo the last manual step">Back</button>
        <button class="btn" id="run" disabled>Run</button>
        <button class="btn" id="pause" disabled>Pause</button>
        <button class="btn ghost" id="rst" disabled>Reset</button>
        <span class="sep"></span>
        <button class="btn" id="int" disabled title="Raise the maskable interrupt (INT) line">INT</button>
        <button class="btn ghost" id="nmi" disabled title="Raise the non-maskable interrupt">NMI</button>
      </div>
      <details class="more"><summary>Files, options and saved projects</summary>
      <div class="toolbar">
        <label class="btn ghost" for="openf">Open…</label><input type="file" id="openf" accept=".asm,.ASM,.z80,.txt,text/plain" hidden>
        <button class="btn ghost" id="dl-asm">Save .asm</button>
        <button class="btn ghost" id="dl-lst" disabled>.lst</button>
        <button class="btn ghost" id="dl-hex" disabled>.hex</button>
        <button class="btn ghost" id="share">Share link</button>
      </div>
      <div class="toolbar optbar">
        <label class="stat"><input type="checkbox" id="o-halt"> HALT stops simulation</label>
        <label class="stat"><input type="checkbox" id="o-prompt"> Prompt for a value before IN</label>
        <span class="optgrp"><label class="stat" for="o-start">Starting address</label><input id="o-start" class="addr" style="width:4.5em" value="0000" maxlength="4" aria-label="Starting address (hex)" title="Where the simulation begins executing. The IDE's default is 0000H.">
        <button class="btn ghost" id="o-origin" title="Set the starting address to the first ORG of the assembled program" disabled>Use program origin</button></span>
        <span class="optgrp"><label class="stat" for="o-rate">Rate</label><select id="o-rate" class="btn" aria-label="Simulation rate"><option value="1500">Slow</option><option value="250">Normal</option><option value="50">Fast</option><option value="0" selected>Extremely Fast</option><option value="-1">Ultimate</option></select></span>
      </div>
      <div class="toolbar projbar">
        <label class="stat" for="proj">Project</label>
        <select id="proj" class="btn" aria-label="Saved projects"></select>
        <button class="btn" id="psave">Save</button><button class="btn" id="psaveas">Save as…</button><button class="btn ghost" id="pdel">Delete</button>
        <span class="sep"></span>
        <button class="btn" id="pzip" title="Download every saved project (and the editor) as .asm files in one ZIP">Export all (.zip)</button>
        <button class="btn" id="pback" title="Download a backup of your projects and study progress">Backup (.json)</button>
        <label class="btn ghost" for="prest">Restore…</label><input type="file" id="prest" accept=".json,application/json" hidden>
      </div>
      <p class="stat" id="projnote"></p>
      </details>
      <div class="sbgrid">
        <div class="col-main">
          <div id="editorbox" class="edwrap"><pre id="gutter" class="gutter" aria-hidden="true">1</pre><textarea id="src" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Assembly source"></textarea></div>
          <div id="listing" class="listing" hidden></div>
          <div id="status" class="sbstatus" role="status"></div>
          <div id="problems" class="problems" hidden></div>
          <div class="panel con-panel"><div class="row" style="justify-content:space-between"><b>Output terminal <span class="dim">(port 02H)</span></b><button class="btn ghost" id="clr">Clear</button></div>
            <pre id="out" class="out" tabindex="0" aria-label="Program output"></pre>
            <form id="inform" class="inrow"><label class="stat" for="inport">Port</label><input id="inport" class="addr" style="width:3.2em" value="01" aria-label="Input port (hex)" maxlength="2">
              <input id="inp" class="addr" style="flex:1" placeholder="Value: 41, 0x41, 65 or 'A'" autocomplete="off" aria-label="Value to send to the input port"><button class="btn">Send byte</button></form>
            <form id="textform" class="inrow"><input id="txt" class="addr" style="flex:1" placeholder="Or text, sent to port 01H" autocomplete="off" aria-label="Text to send to port 01H"><label class="stat"><input type="checkbox" id="crlf" checked> add CR</label><button class="btn">Send text</button></form></div>
        </div>
        <div class="col-side">
          <div class="panel"><div id="flags" class="flagrow"></div><div class="tablewrap"><table class="regs" id="regs"></table></div><p class="stat" id="counters"></p></div>
          <div class="panel" style="margin-top:10px">
            <div class="tabs" role="tablist"><button data-tab="mem" class="tab on">Memory</button><button data-tab="stack" class="tab">Stack</button><button data-tab="sym" class="tab">Symbols</button><button data-tab="ports" class="tab">Ports</button></div>
            <div id="pane"></div></div>
        </div>
      </div>`;
    const $ = (id) => root.querySelector('#' + id);
    const src = $('src');
    const q = opts.query;
    let initial = saved(KEY) || EX[0].src;
    if (q && q.get('c')) { try { initial = b64.dec(q.get('c')); } catch (e) { /* ignore bad link */ } }
    src.value = initial;
    { const ov = JSON.parse(saved(OPTKEY) || '{}'); if (ov.start === undefined) { const m0 = /\.ORG\s+([0-9A-F]+)H/i.exec(initial); o.start = m0 ? parseInt(m0[1], 16) : 0; } }   // first visit: start where the example program begins
    $('o-halt').checked = o.haltStops; $('o-prompt').checked = o.promptIn; $('o-start').value = h4(o.start);
    const saveOpts = () => keep(OPTKEY, JSON.stringify(o));

    /* ---------- editor ---------- */
    function gutter() { const n = src.value.split('\n').length; $('gutter').textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n'); $('gutter').scrollTop = src.scrollTop; }
    src.addEventListener('input', () => { keep(KEY, src.value); gutter(); });
    src.addEventListener('scroll', () => ($('gutter').scrollTop = src.scrollTop));
    root.ownerDocument.addEventListener('keydown', (e) => { if (e.key === 'F2' && cpu && !running && !finished()) { e.preventDefault(); stepOnce(); } });
    src.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); src.setRangeText('        ', src.selectionStart, src.selectionEnd, 'end'); keep(KEY, src.value); gutter(); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); assemble(); }
    });
    gutter();

    const status = (msg, kind) => { const el = $('status'); el.textContent = msg || ''; el.className = 'sbstatus ' + (kind || ''); };
    const finished = () => !!cpu && cpu.halted && o.haltStops;
    function setButtons() {
      const loaded = !!cpu, live = loaded && !finished() && !running;
      $('step').disabled = !live; $('over').disabled = !live; $('run').disabled = !live; $('pause').disabled = !running;
      $('back').disabled = !(loaded && !running && history.length); $('rst').disabled = !loaded;
      $('int').disabled = !loaded; $('nmi').disabled = !loaded;
      $('int').textContent = intPending ? 'INT pending' : 'INT';
      $('dl-lst').disabled = !result; $('dl-hex').disabled = !(result && result.ok); $('o-origin').disabled = !(result && result.ok);
    }

    /* ---------- assemble / load ---------- */
    function assemble() {
      stop(); keep(KEY, src.value);
      const r = AsmZ80.assemble(src.value);
      result = r;
      const pb = $('problems');
      if (!r.ok) {
        pb.hidden = false; pb.innerHTML = r.errors.map((e) => `<button class="perr" data-line="${e.line}">Line ${e.line}: ${esc(e.msg)}</button>`).join('');
        pb.querySelectorAll('.perr').forEach((b) => (b.onclick = () => gotoLine(+b.dataset.line)));
        status(`${r.errors.length} error${r.errors.length > 1 ? 's' : ''}: fix them and assemble again.`, 'bad');
        cpu = null; $('listing').hidden = true; $('editorbox').hidden = false; draw(); setButtons(); return false;
      }
      pb.hidden = true;
      instAddrs = new Set(r.listing.filter((l) => l.inst).map((l) => l.addr));
      load();
      status(`Assembled: ${r.size} byte${r.size === 1 ? '' : 's'} at ${h4(r.origin)}H${r.segments.length > 1 ? ' and elsewhere' : ''}. Start executes at ${h4(o.start)}H.` + (o.start !== r.origin ? ` The program begins at ${h4(r.origin)}H; memory before it holds NOPs, as in the IDE. Use \u201cUse program origin\u201d to skip them.` : ''), 'ok');
      $('editorbox').hidden = true; $('listing').hidden = false;
      const data = Object.entries(r.symbols).filter(([, v]) => !instAddrs.has(v) && v > 0xFF).sort((a, b) => a[1] - b[1]);
      memBase = (data.length ? data[0][1] : r.origin) & ~0xF; awarded = false;
      draw(); setButtons(); return true;
    }
    function load() {
      cpu = new CPUZ80.CPU();
      cpu.mem.set(result.mem);
      cpu.pc = o.start; cpu.sp = 0x0000;
      mach = new IOZ80.Machine(() => renderOut()); mach.promptIn = o.promptIn;
      cpu.io = mach;
      cpu.onWrite = (a) => { written.add(a); };
      history = []; written = new Set(); before = cpu.snapshot(); note = ''; waiting = null; intPending = false;
      renderOut();
    }
    function gotoLine(n) {
      $('listing').hidden = true; $('editorbox').hidden = false;
      const lines = src.value.split('\n'); let pos = 0; for (let i = 0; i < n - 1 && i < lines.length; i++) pos += lines[i].length + 1;
      src.focus(); src.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
      src.scrollTop = Math.max(0, (n - 4) * 21);
    }

    /* ---------- execution ---------- */
    const bpAddrs = () => { const s = new Set(); if (result) result.listing.forEach((l) => { if (l.inst && bps.has(l.line)) s.add(l.addr); }); return s; };
    function snapshotBefore() { before = cpu.snapshot(); written = new Set(); }
    // deliver a pending interrupt if the CPU will accept it
    function pollInterrupt() {
      if (cpu.nmiPending) { cpu.nmiPending = false; cpu.nmi(); return true; }
      if (intPending && cpu.iff1 && !cpu.ei) { intPending = false; cpu.interrupt(cpu.intData); return true; }
      return false;
    }
    // one CPU step; returns false if blocked waiting for input
    function cpuStep() {
      try { pollInterrupt(); cpu.step(); waiting = null; return true; }
      catch (e) { if (e instanceof IOZ80.NeedInput) { waiting = e.port; return false; } throw e; }
    }
    function doStep() {
      snapshotBefore(); cpu.journal = [];
      const entry = { sn: before, io: mach.snapshot(), intPending };
      const ok = cpuStep(); entry.journal = cpu.journal; cpu.journal = null;
      if (ok) { history.push(entry); if (history.length > 5000) history.shift(); }
      return ok;
    }
    function afterAction() {
      if (waiting !== null) { $('inport').value = h2(waiting); status(`IN from port ${h2(waiting)}H is waiting for a value: enter it below the terminal and press Send byte.`, ''); }
      else if (cpu.halted && o.haltStops) { status(`HALT executed after ${cpu.steps.toLocaleString()} instructions (${cpu.cycles.toLocaleString()} T-states).`, 'ok'); if (!awarded && opts.award) { awarded = true; opts.award(5, 'program ran'); } }
      else if (cpu.halted) status(note || 'CPU halted: waiting for an interrupt (press INT).', '');
      else status(note || `PC = ${h4(cpu.pc)}H   ·   ${cpu.steps.toLocaleString()} instructions, ${cpu.cycles.toLocaleString()} T-states`, '');
      draw(); setButtons();
    }
    function stepOnce() { if (!cpu || finished()) return; note = ''; doStep(); afterAction(); }
    function stepOver() {
      if (!cpu || finished()) return;
      const op = cpu.mem[cpu.pc], op2 = cpu.mem[(cpu.pc + 1) & 0xFFFF];
      const isCall = op === 0xCD || (op & 0xC7) === 0xC4 || (op & 0xC7) === 0xC7;
      const isBlock = op === 0xED && (op2 & 0xF4) === 0xB0 && (op2 & 3) < 4 && op2 >= 0xB0;
      if (!isCall && !isBlock) return stepOnce();
      const start = cpu.pc, sp = cpu.sp;
      let ret = null;
      if (isCall) { const line = result.listing.find((l) => l.inst && l.addr === start); ret = (start + (line ? line.bytes.length : (op === 0xCD || (op & 0xC7) === 0xC4 ? 3 : 1))) & 0xFFFF; }
      snapshotBefore(); history = []; note = '';
      if (!cpuStep()) { afterAction(); return; }
      let n = 0; const bp = bpAddrs();
      while (!cpu.halted && n < 5e6) {
        if (isCall ? (cpu.pc === ret && cpu.sp >= sp) : cpu.pc !== start) break;
        if (!cpuStep()) break; n++;
        if (bp.has(cpu.pc) && cpu.pc !== ret) break;
      }
      afterAction();
    }
    function stepBack() {
      const e = history.pop(); if (!e) return;
      const j = e.journal; for (let i = j.length - 2; i >= 0; i -= 2) cpu.mem[j[i]] = j[i + 1];
      cpu.restore(e.sn); mach.restore(e.io); intPending = e.intPending; waiting = null;
      before = history.length ? history[history.length - 1].sn : e.sn; written = new Set(); note = '';
      status(`Stepped back to PC = ${h4(cpu.pc)}H.`, ''); draw(); setButtons();
    }
    function run() {
      if (!cpu || finished() || running) return;
      running = true; history = []; note = ''; snapshotBefore(); setButtons(); status('Running…', '');
      const bp = bpAddrs(); let total = 0;
      const delay = +$('o-rate').value;                  // ms between instructions; 0 = extremely fast; -1 = ultimate
      const batch = delay > 0 ? 1 : delay === 0 ? 200 : 40000;
      const tick = () => {
        if (!running) return;
        let n = 0, blocked = false;
        while (n < batch) {
          if (cpu.halted) { if (o.haltStops) break; if (!(intPending && cpu.iff1) && !cpu.nmiPending) { note = 'CPU halted: waiting for an interrupt (press INT).'; break; } }
          if (!cpuStep()) { blocked = true; break; }
          n++;
          if (bp.has(cpu.pc)) { running = false; note = `Breakpoint at ${h4(cpu.pc)}H.`; break; }
        }
        total += n;
        if (blocked || !running || (cpu.halted && (o.haltStops || note))) { running = false; afterAction(); return; }
        if (total >= 20e6) { running = false; note = `Paused after ${total.toLocaleString()} instructions (possible infinite loop). Press INT, Pause or Reset.`; afterAction(); return; }
        if (delay >= 0) { drawRegs(); renderOut(); if (delay > 0) status(`PC = ${h4(cpu.pc)}H`, ''); } else if (total % 400000 < 40000) { renderOut(); drawRegs(); }
        timer = setTimeout(tick, delay > 0 ? delay : 0);
      };
      // the first instruction ignores a breakpoint at the starting PC
      if (!cpuStep()) { running = false; afterAction(); return; }
      timer = setTimeout(tick, delay > 0 ? delay : 0);
    }
    function stop() { running = false; if (timer) clearTimeout(timer); timer = null; }
    function reset() { stop(); if (!result) return; load(); status('Reset.', ''); draw(); setButtons(); }

    /* ---------- drawing ---------- */
    function renderOut() { const el = $('out'); if (!el) return; el.textContent = mach ? mach.text.replace(/\r\n/g, '\n').replace(/\r/g, '') : ''; el.scrollTop = el.scrollHeight; }
    function drawListing() {
      const lst = $('listing'); const old = lst.scrollTop;
      const curAddr = cpu && !finished() ? cpu.pc : -1;
      lst.innerHTML = '<div class="lhead"><button class="btn ghost" id="edit">Edit source</button><span class="dim" style="margin-left:8px">click the left dot to set a breakpoint</span></div>' + result.listing.map((l) => {
        const cur = l.inst && l.addr === curAddr ? ' cur' : '';
        const code = l.bytes.length ? l.bytes.slice(0, 4).map(h2).join(' ') + (l.bytes.length > 4 ? ' …' : '') : '';
        return `<div class="ln${cur}" data-n="${l.line}"><button class="bp${bps.has(l.line) ? ' on' : ''}" ${l.inst ? '' : 'disabled'} data-n="${l.line}" aria-label="Toggle breakpoint on line ${l.line}"></button><span class="lno">${l.line}</span><span class="ad">${l.addr != null && l.bytes.length ? h4(l.addr) : ''}</span><span class="mc">${code}</span><span class="tx">${esc(l.text) || '&nbsp;'}</span></div>`;
      }).join('');
      lst.scrollTop = old;
      const cur = lst.querySelector('.cur'); if (cur) { const t = cur.offsetTop - lst.clientHeight / 2; if (cur.offsetTop < old + 30 || cur.offsetTop > old + lst.clientHeight - 30) lst.scrollTop = Math.max(0, t); }
      lst.querySelector('#edit').onclick = () => { stop(); lst.hidden = true; $('editorbox').hidden = false; cpu = null; setButtons(); status(''); draw(); };
      lst.querySelectorAll('.bp').forEach((b) => (b.onclick = () => { const n = +b.dataset.n; bps.has(n) ? bps.delete(n) : bps.add(n); keep(BPKEY, JSON.stringify([...bps])); b.classList.toggle('on'); }));
    }
    function drawRegs() {
      const c = cpu, b = before || (c && c.snapshot());
      const cells = c ? [
        ['A', c.a, b.R[7], 2], ['F', c.f, b.f, 2], ['B', c.b, b.R[0], 2], ['C', c.c, b.R[1], 2], ['D', c.d, b.R[2], 2], ['E', c.e, b.R[3], 2], ['H', c.h, b.R[4], 2], ['L', c.l, b.R[5], 2],
        ['BC', c.bc, (b.R[0] << 8) | b.R[1], 4], ['DE', c.de, (b.R[2] << 8) | b.R[3], 4], ['HL', c.hl, (b.R[4] << 8) | b.R[5], 4], ['SP', c.sp, b.sp, 4],
        ['IX', c.ix, b.ix, 4], ['IY', c.iy, b.iy, 4], ['PC', c.pc, b.pc, 4], ['I', c.i, b.i, 2], ["AF'", c.af_, b.af_, 4], ["BC'", c.bc_, b.bc_, 4], ["DE'", c.de_, b.de_, 4], ["HL'", c.hl_, b.hl_, 4], ['R', c.r, b.r, 2],
      ] : ['A', 'F', 'B', 'C', 'D', 'E', 'H', 'L', 'BC', 'DE', 'HL', 'SP', 'IX', 'IY', 'PC', 'I', "AF'", "BC'", "DE'", "HL'", 'R'].map((n) => [n, 0, 0, n.length > 1 && n !== 'AF\'' ? 4 : n === "AF'" ? 4 : 2]);
      const cell = ([nm, v, old, w]) => `<td class="${v !== old ? 'chg' : ''}">${nm}</td><td class="${v !== old ? 'chg' : ''}" title="${v !== old ? 'was ' + old.toString(16).toUpperCase() + 'H · ' : ''}${v} unsigned${w === 2 ? ', ' + ((v << 24) >> 24) + ' signed' : ', ' + ((v << 16) >> 16) + ' signed'}">${v.toString(16).toUpperCase().padStart(w, '0')}</td>`;
      let h = '';
      for (let i = 0; i < cells.length; i += 2) h += `<tr>${cell(cells[i])}${cells[i + 1] ? cell(cells[i + 1]) : '<td></td><td></td>'}</tr>`;
      $('regs').innerHTML = h;
      const f = c ? c.f : 0, bf = b ? b.f : f;
      const bits = [['S', 7], ['Z', 6], ['H', 4], ['P/V', 2], ['N', 1], ['C', 0]];
      $('flags').innerHTML = bits.map(([k, i]) => { const v = (f >> i) & 1, old = (bf >> i) & 1; return `<span class="fl ${v ? 'on' : ''} ${v !== old ? 'chg' : ''}" title="${k}">${k}<b>${v}</b></span>`; }).join('')
        + `<span class="fl" title="Interrupt enable flip-flop">IFF<b>${c ? c.iff1 : 0}</b></span><span class="fl" title="Interrupt mode">IM<b>${c ? c.im : 0}</b></span>${c && c.halted ? '<span class="fl on" title="CPU halted">HALT</span>' : ''}`;
      $('counters').textContent = c ? `${c.steps.toLocaleString()} instructions · ${c.cycles.toLocaleString()} T-states${c.t ? ' (last: ' + c.t + ')' : ''} · ${(c.cycles / 4000).toFixed(3)} ms at 4 MHz` : '';
    }
    function drawPane() {
      const pane = $('pane');
      if (tab === 'mem') {
        pane.innerHTML = `<div class="row" style="margin:6px 0"><input id="memaddr" class="addr" value="${h4(memBase)}" aria-label="Memory address (hex)">
          ${['PC', 'SP', 'HL', 'DE', 'BC', 'IX', 'IY'].map((n) => `<button class="btn ghost" data-jump="${n}">${n}</button>`).join('')}</div><div id="mem" class="mem"></div>`;
        pane.querySelector('#memaddr').oninput = drawMem;
        pane.querySelectorAll('[data-jump]').forEach((b) => (b.onclick = () => { if (!cpu) return; const k = b.dataset.jump; const v = { PC: cpu.pc, SP: cpu.sp, HL: cpu.hl, DE: cpu.de, BC: cpu.bc, IX: cpu.ix, IY: cpu.iy }[k]; memBase = v & ~0xF; pane.querySelector('#memaddr').value = h4(memBase); drawMem(); }));
        drawMem();
      } else if (tab === 'stack') {
        if (!cpu) { pane.innerHTML = '<p class="dim">Assemble a program to see the stack.</p>'; return; }
        const sp = cpu.sp; const rev = {}; if (result) Object.entries(result.symbols).forEach(([k, v]) => { if (!(v in rev)) rev[v] = k; });
        let h = `<p class="dim" style="margin:6px 0">The stack grows down. SP = ${h4(sp)}H. Each row is a 16-bit word (low byte first in memory) from SP upward.</p><div class="tablewrap"><table class="gt"><thead><tr><th>Address</th><th>Offset</th><th>Word</th><th>Note</th></tr></thead><tbody>`;
        for (let i = 0; i < 8; i++) {
          const a = (sp + 2 * i) & 0xFFFF; const v = cpu.rd16(a); const into = instAddrs.has(v) || instAddrs.has((v - 1) & 0xFFFF);
          const nm = rev[v]; const note2 = into ? `→ code${nm ? ' (' + esc(nm) + ')' : ''}: likely a return address` : '';
          h += `<tr class="${i === 0 ? 'cur' : ''}"><td class="mono">${h4(a)}</td><td class="mono">SP+${2 * i}</td><td class="mono">${h4(v)}</td><td>${note2}</td></tr>`;
        }
        pane.innerHTML = h + '</tbody></table></div>';
      } else if (tab === 'sym') {
        if (!result || !result.ok) { pane.innerHTML = '<p class="dim">Assemble a program to see its symbols.</p>'; return; }
        const rows = Object.entries(result.symbols).sort((a, b) => a[1] - b[1]);
        pane.innerHTML = `<div class="tablewrap"><table class="gt"><thead><tr><th>Symbol</th><th>Value</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td class="mono"><button class="linkbtn" data-sym="${v}">${esc(k)}</button></td><td class="mono">${h4(v)}</td></tr>`).join('')}</tbody></table></div>`;
        pane.querySelectorAll('[data-sym]').forEach((b) => (b.onclick = () => { memBase = +b.dataset.sym & ~0xF; tab = 'mem'; syncTabs(); drawPane(); }));
      } else {
        if (!mach) { pane.innerHTML = '<p class="dim">Assemble a program to see port activity.</p>'; return; }
        const outs = Object.entries(mach.outVals).sort((a, b) => a[0] - b[0]);
        const ins = mach.inLog.slice(-8).reverse();
        pane.innerHTML = `<p class="dim" style="margin:6px 0">Port 01H is the input device, port 02H the output terminal. Any other port keeps the last value written.</p>
          <div class="tablewrap"><table class="gt"><thead><tr><th>Port</th><th>Last OUT</th><th>ASCII</th><th>binary</th></tr></thead><tbody>${outs.length ? outs.map(([p, v]) => `<tr><td class="mono">${h2(+p)}H</td><td class="mono">${h2(v)}H</td><td class="mono">${v >= 32 && v < 127 ? esc(String.fromCharCode(v)) : '·'}</td><td class="mono">${v.toString(2).padStart(8, '0')}</td></tr>`).join('') : '<tr><td colspan="4" class="dim">no OUT yet</td></tr>'}</tbody></table></div>
          <p class="stat">Recent IN values (newest first): ${ins.length ? ins.map(([p, v]) => `<code>${h2(p)}H→${h2(v)}H</code>`).join(' ') : 'none'}</p>
          <form id="pvform" class="inrow"><label class="stat" for="pvport">Input device</label><input id="pvport" class="addr" style="width:3.2em" value="01" maxlength="2" aria-label="Port (hex)"><input id="pvval" class="addr" style="width:5em" value="${h2(mach.portVal[1] || 0)}" maxlength="4" aria-label="Value (hex)"><button class="btn">Set value</button></form>
          <p class="stat">When "Prompt for a value before IN" is off, IN reads the value set here (default 00H), like the IDE's Peripheral Devices / I/O Ports Editor.</p>`;
        const pvf = pane.querySelector('#pvform');
        if (pvf) pvf.onsubmit = (e) => { e.preventDefault(); const p = parseInt(pane.querySelector('#pvport').value, 16), v = IOZ80.parseByte(pane.querySelector('#pvval').value + (/^[0-9a-f]{1,2}$/i.test(pane.querySelector('#pvval').value.trim()) ? 'h' : '')); if (Number.isNaN(p) || p < 0 || p > 255 || v === null) { status('Port and value must be hex bytes.', 'bad'); return; } mach.portVal[p] = v; status(`Input device on port ${h2(p)}H now supplies ${h2(v)}H.`, 'ok'); drawPane(); };
      }
    }
    function drawMem() {
      const el = root.querySelector('#mem'); if (!el) return;
      const inp = root.querySelector('#memaddr'); const base = parseInt(inp.value, 16); if (Number.isNaN(base)) return; memBase = base;
      const a0 = base & ~0xF; let h = '';
      for (let r = 0; r < 8; r++) {
        const a = (a0 + r * 16) & 0xFFFF; let bytes = '', asc = '';
        for (let c = 0; c < 16; c++) {
          const v = cpu ? cpu.mem[(a + c) & 0xFFFF] : 0, w = written.has((a + c) & 0xFFFF);
          bytes += `<span class="${w ? 'chg' : ''}">${h2(v)}</span> `;
          asc += v >= 32 && v < 127 ? esc(String.fromCharCode(v)) : '.';
        }
        h += `<div>${h4(a)}: ${bytes} <span class="dim">${asc}</span></div>`;
      }
      el.innerHTML = h;
    }
    function syncTabs() { root.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === tab)); }
    function draw() { if (result && result.ok && cpu) drawListing(); drawRegs(); drawPane(); setButtons(); }

    /* ---------- wiring ---------- */
    $('asm').onclick = assemble;
    $('step').onclick = stepOnce; $('over').onclick = stepOver; $('back').onclick = stepBack; $('run').onclick = run;
    $('pause').onclick = () => { stop(); note = 'Paused.'; afterAction(); };
    $('rst').onclick = reset;
    $('int').onclick = () => {
      if (!cpu) return;
      cpu.intData = undefined;
      if (cpu.im !== 1) {                                 // the IDE asks for the byte the peripheral places on the bus
        const ask = window.prompt(cpu.im === 0 ? 'Interrupt mode 0: enter the instruction byte the device supplies (hex), normally an RST such as FF for RST 38H.' : 'Interrupt mode 2: enter the 8-bit vector (hex) the device supplies (low byte of the table pointer).', 'FF');
        if (ask === null) return;
        const b = IOZ80.parseByte(ask === '' ? 'FF' : /^[0-9a-f]{1,2}$/i.test(ask.trim()) ? ask.trim() + 'h' : ask);
        if (b === null) { status('Enter a hex byte such as FF.', 'bad'); return; }
        cpu.intData = b;
      }
      intPending = true; note = cpu.iff1 ? 'INT raised.' : 'INT raised, but interrupts are disabled (run EI first). It stays pending.';
      if (!running) { if (cpu.iff1 && !cpu.ei) { pollInterrupt(); note = 'Interrupt accepted.'; } afterAction(); }
    };
    $('nmi').onclick = () => { if (!cpu) return; cpu.nmiPending = true; if (!running) { pollInterrupt(); note = 'NMI accepted: jumped to 0066H.'; afterAction(); } };
    $('o-halt').onchange = (e) => { o.haltStops = e.target.checked; saveOpts(); setButtons(); };
    $('o-start').onchange = (e) => { const v = parseInt(e.target.value, 16); if (Number.isNaN(v) || v < 0 || v > 0xFFFF) { e.target.value = h4(o.start); return; } o.start = v; e.target.value = h4(v); saveOpts(); if (result && result.ok && cpu && !history.length) reset(); };
    $('o-origin').onclick = () => { if (!result || !result.ok) return; o.start = result.origin; $('o-start').value = h4(o.start); saveOpts(); reset(); };
    $('o-prompt').onchange = (e) => { o.promptIn = e.target.checked; saveOpts(); if (mach) mach.promptIn = o.promptIn; };
    root.querySelectorAll('.tab').forEach((t) => (t.onclick = () => { tab = t.dataset.tab; syncTabs(); drawPane(); }));
    $('ex').onchange = (e) => { if (e.target.value === '') return; stop(); src.value = EX[+e.target.value].src; keep(KEY, src.value); gutter(); const orgs = [...src.value.matchAll(/\.ORG\s+([0-9A-F]+)H/gi)]; o.start = orgs.length ? parseInt(orgs[0][1], 16) : 0; $('o-start').value = h4(o.start); saveOpts(); e.target.value = ''; curName = ''; keep(CURKEY, ''); result = null; cpu = null; mach = null; $('listing').hidden = true; $('editorbox').hidden = false; $('problems').hidden = true; status('Example loaded as a scratch program. Click Assemble (or Ctrl+Enter), or Save as… to keep your edits.', ''); draw(); setButtons(); projList(); };
    function resumeAfterInput() { if (cpu && waiting !== null && !finished()) { waiting = null; if (running) return; run(); } }
    $('inform').onsubmit = (e) => {
      e.preventDefault(); if (!mach) { status('Assemble a program first.', 'bad'); return; }
      const port = parseInt($('inport').value, 16), v = IOZ80.parseByte($('inp').value);
      if (Number.isNaN(port) || port < 0 || port > 255) { status('Enter the port number as hex 00–FF.', 'bad'); return; }
      if (v === null) { status('Enter a byte: hex like 41 or 0x41, decimal like 65, or a quoted character like \'A\'.', 'bad'); return; }
      mach.feed(port, v); $('inp').value = ''; status(`Queued ${h2(v)}H for port ${h2(port)}H.`, 'ok'); drawPane(); resumeAfterInput();
    };
    $('textform').onsubmit = (e) => {
      e.preventDefault(); if (!mach) { status('Assemble a program first.', 'bad'); return; }
      const t = $('txt').value; if (!t && !$('crlf').checked) return;
      mach.feedText(1, t); if ($('crlf').checked) mach.feed(1, 13);
      $('txt').value = ''; status(`Queued ${t.length + ($('crlf').checked ? 1 : 0)} character(s) for port 01H.`, 'ok'); drawPane(); resumeAfterInput();
    };
    $('clr').onclick = () => { if (mach) { mach.text = ''; renderOut(); } };
    $('openf').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { stop(); src.value = String(r.result); keep(KEY, src.value); gutter(); result = null; cpu = null; mach = null; $('listing').hidden = true; $('editorbox').hidden = false; status(`Opened ${f.name}. Click Assemble.`); draw(); setButtons(); }; r.readAsText(f); e.target.value = ''; };
    const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    $('dl-asm').onclick = () => download('program.asm', src.value);
    $('dl-lst').onclick = () => result && download('program.lst', AsmZ80.listingText(result));
    $('dl-hex').onclick = () => result && result.ok && download('program.hex', AsmZ80.intelHex(result));
    $('share').onclick = () => {
      const url = location.href.split('#')[0] + '#/' + PACKS.ui.slug + '/sandbox?c=' + b64.enc(src.value);
      const done = () => status('Share link copied to the clipboard.' + (url.length > 2000 ? ' (It is long; some apps may truncate it. Use Save .asm for big programs.)' : ''), 'ok');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => { location.hash = '#/' + PACKS.ui.slug + '/sandbox?c=' + b64.enc(src.value); status('Link placed in the address bar.', 'ok'); });
      else { location.hash = '#/' + PACKS.ui.slug + '/sandbox?c=' + b64.enc(src.value); status('Link placed in the address bar.', 'ok'); }
    };

    /* ---------- projects: save / switch / export ---------- */
    let curName = saved(CURKEY) || '';
    if (q && q.get('c')) curName = '';          // a shared link opens as an unsaved scratch program
    const isDirty = () => (curName ? Projects.get(curName) !== src.value : src.value.trim() !== '');
    function projNote(msg) {
      const n = $('projnote'); if (!n) return;
      n.textContent = msg || (curName ? `Project "${curName}"${isDirty() ? '  ·  ● unsaved changes' : '  ·  saved in this browser'}` : 'Scratch program (autosaved here). Use Save as… to keep it as a named project.');
    }
    function projList() {
      const sel = $('proj'); const list = Projects.list();
      sel.innerHTML = `<option value="">(scratch)</option>` + list.map((p) => `<option value="${esc(p.name)}"${p.name === curName ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
      if (!curName) sel.value = '';
      projNote();
    }
    function loadProject(name) {
      stop(); const text = name ? Projects.get(name) : null;
      if (name && text == null) { curName = ''; keep(CURKEY, ''); projList(); return; }
      curName = name; keep(CURKEY, name);
      if (name) { src.value = text; keep(KEY, text); gutter(); }
      result = null; cpu = null; mach = null; $('listing').hidden = true; $('editorbox').hidden = false; $('problems').hidden = true;
      status(name ? `Opened "${name}". Click Assemble.` : ''); draw(); setButtons(); projList();
    }
    function saveAs(defaultName) {
      const name = window.prompt('Name for this project:', defaultName || curName || ''); if (name == null) return;
      try { curName = Projects.save(name, src.value); keep(CURKEY, curName); projList(); status(`Saved "${curName}" in this browser. Use Export all (.zip) to keep copies outside the browser.`, 'ok'); } catch (e) { status(e.message, 'bad'); }
    }
    $('psave').onclick = () => { if (!curName) return saveAs(); Projects.save(curName, src.value); projList(); status(`Saved "${curName}".`, 'ok'); };
    $('psaveas').onclick = () => saveAs();
    $('pdel').onclick = () => { if (!curName) { status('Nothing to delete: this is the scratch program.', ''); return; } if (!window.confirm(`Delete the saved project "${curName}"? This cannot be undone (export first if unsure).`)) return; Projects.remove(curName); curName = ''; keep(CURKEY, ''); projList(); status('Project deleted. The text is still in the editor as a scratch program.', ''); };
    $('proj').onchange = (e) => { const to = e.target.value; if (isDirty() && !window.confirm('Switch projects? Unsaved changes in the editor will be replaced. (Cancel, then Save first to keep them.)')) { projList(); return; } loadProject(to); };
    src.addEventListener('input', () => projNote());
    $('pzip').onclick = () => { const z = Projects.zipAll(src.value); if (!z) { status('Nothing to export yet.', 'bad'); return; } Projects.download(`z80-quest-projects-${Projects.stamp()}.zip`, z, 'application/zip'); status('Downloaded a ZIP with one .asm file per project plus the editor text.', 'ok'); };
    $('pback').onclick = () => { Projects.download(`z80-quest-backup-${Projects.stamp()}.json`, Projects.backup({ editor: src.value, progress: window.Store ? Store.state : null }), 'application/json'); status('Downloaded a backup of your projects and study progress. Restore it from any browser with Restore…', 'ok'); };
    $('prest').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => {
        try {
          const res = Projects.restore(String(r.result));
          let msg = `Restored ${res.added} new and ${res.replaced} updated project${res.added + res.replaced === 1 ? '' : 's'} from the backup.`;
          if (res.progress && window.Store && window.confirm('This backup also contains study progress (XP, cards, badges). Replace your current progress with it?')) { Object.assign(Store.state, res.progress); Store.save(); msg += ' Progress restored.'; if (opts.afterRestore) opts.afterRestore(); }
          projList(); status(msg, 'ok');
        } catch (err) { status(err.message, 'bad'); }
      };
      r.readAsText(f); e.target.value = '';
    };
    projList();
    if (curName && Projects.get(curName) != null && !(q && q.get('c'))) { const t = Projects.get(curName); if (saved(KEY) === null || saved(KEY) === t) { src.value = t; gutter(); } }
    draw(); setButtons();
    if (opts.onLeave) opts.onLeave(() => { stop(); });
  } };
})();
