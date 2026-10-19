/* Sandbox page: EASy68K-style editor, assembler, simulator, console, registers, memory, stack. */
(function () {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hx = (v, w) => '$' + (v >>> 0).toString(16).toUpperCase().padStart(w, '0');
  const KEY = 'q68k.sandbox.src', BPKEY = 'q68k.sandbox.bp';
  const keep = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const saved = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const b64 = { enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))) };

  window.Sandbox = { view(root, opts) {
    opts = opts || {};
    const EX = window.EXAMPLES_68K;
    let result = null, cpu = null, con = null, history = [], bps = new Set(JSON.parse(saved(BPKEY) || '[]')), tab = 'mem', memBase = 0x1000;
    let running = false, timer = null, before = null, written = new Set(), awarded = false, note = '';

    root.innerHTML = `
      <h1>Sandbox <span class="pill">EASy68K-compatible</span></h1>
      <p class="lede">A 68000 editor, assembler and simulator that runs real machine code. Write a program, assemble it, then step or run it and watch registers, flags, memory and the stack. Output and input go through <code>TRAP #15</code>, as in EASy68K.</p>
      <div class="toolbar">
        <select id="ex" class="btn" aria-label="Example programs"><option value="">Examples…</option>${EX.map((e, i) => `<option value="${i}">${esc(e.name)}</option>`).join('')}</select>
        <button class="btn go" id="asm" title="Assemble (Ctrl+Enter)">Assemble</button>
        <span class="sep"></span>
        <button class="btn" id="step" disabled title="Execute one instruction">Step</button>
        <button class="btn" id="over" disabled title="Step over a BSR/JSR">Step over</button>
        <button class="btn" id="back" disabled title="Undo the last manual step">◀ Back</button>
        <button class="btn" id="run" disabled>▶ Run</button>
        <button class="btn" id="pause" disabled>❚❚ Pause</button>
        <button class="btn ghost" id="rst" disabled>Reset</button>
        <span class="sep"></span>
        <label class="btn ghost" for="openf">Open…</label><input type="file" id="openf" accept=".x68,.X68,.asm,.txt,text/plain" hidden>
        <button class="btn ghost" id="dl-x68">Save .X68</button>
        <button class="btn ghost" id="dl-s68" disabled>.S68</button>
        <button class="btn ghost" id="dl-l68" disabled>.L68</button>
        <button class="btn ghost" id="share">Share link</button>
      </div>
      <div class="toolbar projbar">
        <label class="stat" for="proj">Project</label>
        <select id="proj" class="btn" aria-label="Saved projects"></select>
        <button class="btn" id="psave">Save</button><button class="btn" id="psaveas">Save as…</button><button class="btn ghost" id="pdel">Delete</button>
        <span class="sep"></span>
        <button class="btn" id="pzip" title="Download every saved project (and the editor) as .X68 files in one ZIP">Export all (.zip)</button>
        <button class="btn" id="pback" title="Download a backup of your projects and study progress">Backup (.json)</button>
        <label class="btn ghost" for="prest">Restore…</label><input type="file" id="prest" accept=".json,application/json" hidden>
      </div>
      <p class="stat" id="projnote"></p>
      <div class="sbgrid">
        <div class="col-main">
          <div id="editorbox" class="edwrap"><pre id="gutter" class="gutter" aria-hidden="true">1</pre><textarea id="src" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Assembly source"></textarea></div>
          <div id="listing" class="listing" hidden></div>
          <div id="status" class="sbstatus" role="status"></div>
          <div id="problems" class="problems" hidden></div>
          <div class="panel con-panel"><div class="row" style="justify-content:space-between"><b>Output</b><button class="btn ghost" id="clr">Clear</button></div>
            <pre id="out" class="out" tabindex="0" aria-label="Program output"></pre>
            <form id="inform" class="inrow"><input id="inp" class="addr" style="flex:1" placeholder="Program input (when it asks)…" autocomplete="off" aria-label="Program input"><button class="btn">Send</button></form></div>
        </div>
        <div class="col-side">
          <div class="panel"><div id="flags" class="flagrow"></div><div class="tablewrap"><table class="regs" id="regs"></table></div></div>
          <div class="panel" style="margin-top:10px">
            <div class="tabs" role="tablist"><button data-tab="mem" class="tab on">Memory</button><button data-tab="stack" class="tab">Stack</button><button data-tab="sym" class="tab">Symbols</button></div>
            <div id="pane"></div></div>
        </div>
      </div>`;
    const $ = (id) => root.querySelector('#' + id);
    const src = $('src');
    const q = opts.query;
    let initial = saved(KEY) || EX[0].src;
    if (q && q.get('c')) { try { initial = b64.dec(q.get('c')); } catch (e) { /* ignore bad link */ } }
    src.value = initial;

    /* ---------- editor ---------- */
    function gutter() { const n = src.value.split('\n').length; $('gutter').textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n'); $('gutter').scrollTop = src.scrollTop; }
    src.addEventListener('input', () => { keep(KEY, src.value); gutter(); });
    src.addEventListener('scroll', () => ($('gutter').scrollTop = src.scrollTop));
    src.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); src.setRangeText('        ', src.selectionStart, src.selectionEnd, 'end'); keep(KEY, src.value); gutter(); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); assemble(); }
    });
    gutter();

    const status = (msg, kind) => { const el = $('status'); el.textContent = msg || ''; el.className = 'sbstatus ' + (kind || ''); };
    function setButtons() {
      const loaded = !!cpu, live = loaded && !cpu.halted && !running;
      $('step').disabled = !live; $('over').disabled = !live; $('run').disabled = !(loaded && !cpu.halted && !running); $('pause').disabled = !running;
      $('back').disabled = !(loaded && !running && history.length); $('rst').disabled = !loaded;
      $('dl-s68').disabled = !result; $('dl-l68').disabled = !result;
    }

    /* ---------- assemble / load ---------- */
    function assemble() {
      stop(); keep(KEY, src.value);
      const r = Asm68K.assemble(src.value);
      result = r;
      const pb = $('problems');
      if (!r.ok) {
        pb.hidden = false; pb.innerHTML = r.errors.map((e) => `<button class="perr" data-line="${e.line}">Line ${e.line}: ${esc(e.msg)}</button>`).join('');
        pb.querySelectorAll('.perr').forEach((b) => (b.onclick = () => gotoLine(+b.dataset.line)));
        status(`${r.errors.length} error${r.errors.length > 1 ? 's' : ''}: fix them and assemble again.`, 'bad');
        cpu = null; $('listing').hidden = true; $('editorbox').hidden = false; draw(); setButtons(); return false;
      }
      pb.hidden = true;
      load();
      status(`Assembled: ${r.listing.filter((l) => l.words).length} instructions, entry ${hx(r.start, 6)}. SP starts at $01000000 as in EASy68K.`, 'ok');
      $('editorbox').hidden = true; $('listing').hidden = false;
      const data = Object.entries(r.symbols).filter(([, v]) => v > 255 && !r.instAddrs.has(v)).sort((a, b) => a[1] - b[1]);
      memBase = (data.length ? data[0][1] : r.start) & ~0xF; awarded = false;
      draw(); setButtons(); return true;
    }
    function load() {
      cpu = new CPU68K.CPU();
      for (const seg of result.image) cpu.mem.set(seg.bytes, seg.addr);
      cpu.A[7] = 0x01000000; cpu.ssp = 0x01000000; cpu.usp = 0x00FF0000; cpu.pc = result.start;
      con = new IO68K.Console(() => renderOut());
      cpu.io = { trap15: IO68K.makeTrap15(con, (m) => { note = m; }) };
      cpu.onWrite = (a, sz) => { for (let i = 0; i < sz; i++) written.add(a + i); };
      history = []; written = new Set(); before = cpu.snapshot(); note = '';
      renderOut();
    }
    function gotoLine(n) {
      $('listing').hidden = true; $('editorbox').hidden = false;
      const lines = src.value.split('\n'); let pos = 0; for (let i = 0; i < n - 1 && i < lines.length; i++) pos += lines[i].length + 1;
      src.focus(); src.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
      src.scrollTop = Math.max(0, (n - 4) * 21);
    }

    /* ---------- execution ---------- */
    const bpAddrs = () => { const s = new Set(); if (result) result.listing.forEach((l) => { if (l.words && bps.has(l.n)) s.add(l.addr); }); return s; };
    function snapshotBefore() { before = cpu.snapshot(); written = new Set(); }
    function doStep() {
      snapshotBefore(); cpu.journal = [];
      const entry = { sn: before, outLen: con.text.length, input: con.input.slice(), echo: con.echo };
      cpu.step(); entry.journal = cpu.journal; cpu.journal = null;
      history.push(entry); if (history.length > 5000) history.shift();
    }
    function afterAction() {
      if (cpu.waitInput) status(`Waiting for input (${cpu.waitInput}): type it in the Output box and press Send.`, '');
      else if (cpu.halted && /^(SIMHALT|TRAP|STOP)/.test(cpu.halted)) { status(`${cpu.halted} after ${cpu.steps.toLocaleString()} instructions.`, 'ok'); if (!awarded && opts.award) { awarded = true; opts.award(5, 'program ran'); } }
      else if (cpu.halted) status(cpu.halted, 'bad');
      else status(note || `PC = ${hx(cpu.pc, 6)}   ·   ${cpu.steps.toLocaleString()} instructions executed`, '');
      draw(); setButtons();
    }
    function stepOnce() { if (!cpu || cpu.halted) return; note = ''; doStep(); afterAction(); }
    function stepOver() {
      if (!cpu || cpu.halted) return;
      const op = cpu.rd(cpu.pc, 2), isCall = (op & 0xFF00) === 0x6100 || (op & 0xFFC0) === 0x4E80;
      if (!isCall) return stepOnce();
      const line = result.listing.find((l) => l.words && l.addr === cpu.pc); const ret = cpu.pc + (line ? line.words.length * 2 : 2), sp = cpu.A[7];
      snapshotBefore(); history = []; note = '';
      cpu.step(); let n = 0;
      while (!cpu.halted && !cpu.waitInput && n < 5e6 && !(cpu.pc === ret && cpu.A[7] >= sp)) { cpu.step(); n++; if (bpAddrs().has(cpu.pc) && cpu.pc !== ret) break; }
      afterAction();
    }
    function stepBack() {
      const e = history.pop(); if (!e) return;
      const j = e.journal; for (let i = j.length - 2; i >= 0; i -= 2) cpu.mem[j[i]] = j[i + 1];
      cpu.restore(e.sn); cpu.waitInput = null; con.text = con.text.slice(0, e.outLen); con.input = e.input; con.echo = e.echo; renderOut();
      before = history.length ? history[history.length - 1].sn : e.sn; written = new Set(); note = '';
      status(`Stepped back to PC = ${hx(cpu.pc, 6)}.`, ''); draw(); setButtons();
    }
    function run() {
      if (!cpu || cpu.halted || running) return;
      running = true; history = []; note = ''; snapshotBefore(); setButtons(); status('Running…', '');
      const bp = bpAddrs(); let total = 0;
      const tick = () => {
        if (!running) return;
        const hadBp = bp.has(cpu.pc);
        let n = 0;
        while (n < 40000 && !cpu.halted && !cpu.waitInput) { cpu.step(); n++; if (bp.has(cpu.pc)) { running = false; note = `Breakpoint at ${hx(cpu.pc, 6)}.`; break; } }
        total += n;
        if (cpu.halted || cpu.waitInput || !running) { running = false; afterAction(); return; }
        if (total >= 20e6) { running = false; note = `Paused after ${total.toLocaleString()} instructions (possible infinite loop).`; afterAction(); return; }
        timer = setTimeout(tick, 0);
      };
      // first instruction ignores a breakpoint at the starting PC
      cpu.step(); if (cpu.halted || cpu.waitInput) { running = false; afterAction(); return; }
      timer = setTimeout(tick, 0);
    }
    function stop() { running = false; if (timer) clearTimeout(timer); timer = null; }
    function reset() { stop(); if (!result) return; load(); status('Reset.', ''); draw(); setButtons(); }

    /* ---------- drawing ---------- */
    function renderOut() { const o = $('out'); if (!o) return; o.textContent = con ? con.text.replace(/\r\n/g, '\n').replace(/\r/g, '') : ''; o.scrollTop = o.scrollHeight; }
    function drawListing() {
      const lst = $('listing'); const old = lst.scrollTop;
      const curAddr = cpu && !cpu.halted ? cpu.pc : -1, lastLine = history.length ? history[history.length - 1].line : -1;
      lst.innerHTML = '<div class="lhead"><button class="btn ghost" id="edit">✎ Edit source</button><span class="dim" style="margin-left:8px">click the left dot to set a breakpoint</span></div>' + result.listing.map((l) => {
        const isInst = !!l.words, cur = isInst && l.addr === curAddr ? ' cur' : '';
        const code = l.words ? l.words.map((w) => hx(w, 4).slice(1)).join(' ') : l.bytes && l.bytes.length ? l.bytes.slice(0, 4).map((b) => hx(b, 2).slice(1)).join(' ') + (l.bytes.length > 4 ? ' …' : '') : '';
        return `<div class="ln${cur}" data-n="${l.n}"><button class="bp${bps.has(l.n) ? ' on' : ''}" ${isInst ? '' : 'disabled'} data-n="${l.n}" aria-label="Toggle breakpoint on line ${l.n}"></button><span class="lno">${l.n}</span><span class="ad">${l.addr != null && (isInst || l.bytes.length) ? hx(l.addr, 6).slice(1) : ''}</span><span class="mc">${code}</span><span class="tx">${esc(l.text) || '&nbsp;'}</span></div>`;
      }).join('');
      lst.scrollTop = old;
      const cur = lst.querySelector('.cur'); if (cur) { const t = cur.offsetTop - lst.clientHeight / 2; if (cur.offsetTop < old + 30 || cur.offsetTop > old + lst.clientHeight - 30) lst.scrollTop = Math.max(0, t); }
      lst.querySelector('#edit').onclick = () => { stop(); lst.hidden = true; $('editorbox').hidden = false; cpu = null; setButtons(); status(''); draw(); };
      lst.querySelectorAll('.bp').forEach((b) => (b.onclick = () => { const n = +b.dataset.n; bps.has(n) ? bps.delete(n) : bps.add(n); keep(BPKEY, JSON.stringify([...bps])); b.classList.toggle('on'); }));
    }
    function drawRegs() {
      const D = cpu ? cpu.D : new Array(8).fill(0), A = cpu ? cpu.A : new Array(8).fill(0), b = before || cpu && cpu.snapshot() || { D, A, pc: 0, sr: 0 };
      const sr = cpu ? cpu.getSR() : 0, bsr = b.sr !== undefined ? b.sr : sr;
      const cell = (nm, v, old) => `<td class="${v !== old ? 'chg' : ''}">${nm}</td><td class="${v !== old ? 'chg' : ''}" title="${v !== old ? 'was ' + hx(old, 8) + ' · ' : ''}${v | 0} signed, ${v >>> 0} unsigned">${hx(v, 8).slice(1)}</td>`;
      let h = '';
      for (let i = 0; i < 8; i++) h += `<tr>${cell('D' + i, D[i], b.D[i])}${cell(i === 7 ? 'A7/SP' : 'A' + i, A[i], b.A[i])}</tr>`;
      h += `<tr>${cell('PC', cpu ? cpu.pc : 0, b.pc)}<td>SR</td><td class="${sr !== bsr ? 'chg' : ''}">${hx(sr, 4).slice(1)}</td></tr>`;
      $('regs').innerHTML = h;
      const bits = [['T', 15], ['S', 13], ['X', 4], ['N', 3], ['Z', 2], ['V', 1], ['C', 0]];
      $('flags').innerHTML = bits.map(([k, i]) => { const v = (sr >> i) & 1, o = (bsr >> i) & 1; return `<span class="fl ${v ? 'on' : ''} ${v !== o ? 'chg' : ''}" title="${k}">${k}<b>${v}</b></span>`; }).join('') + `<span class="fl" title="Interrupt mask">I<b>${(sr >> 8) & 7}</b></span>`;
    }
    function drawPane() {
      const pane = $('pane');
      if (tab === 'mem') {
        pane.innerHTML = `<div class="row" style="margin:6px 0"><input id="memaddr" class="addr" value="${memBase.toString(16).toUpperCase().padStart(6, '0')}" aria-label="Memory address (hex)">
          <button class="btn ghost" data-jump="pc">PC</button><button class="btn ghost" data-jump="sp">SP</button>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<button class="btn ghost" data-jump="a${i}">A${i}</button>`).join('')}</div><div id="mem" class="mem"></div>`;
        pane.querySelector('#memaddr').oninput = drawMem;
        pane.querySelectorAll('[data-jump]').forEach((b) => (b.onclick = () => { const k = b.dataset.jump; const v = k === 'pc' ? cpu.pc : k === 'sp' ? cpu.A[7] : cpu.A[+k[1]]; memBase = v & ~0xF; pane.querySelector('#memaddr').value = memBase.toString(16).toUpperCase().padStart(6, '0'); drawMem(); }));
        drawMem();
      } else if (tab === 'stack') {
        if (!cpu) { pane.innerHTML = '<p class="dim">Assemble a program to see the stack.</p>'; return; }
        const sp = cpu.A[7]; const rev = {}; if (result) Object.entries(result.symbols).forEach(([k, v]) => { if (!(v in rev)) rev[v] = k; });
        let h = `<p class="dim" style="margin:6px 0">Stack grows down. SP = ${hx(sp, 8)}. Each row is a long word from SP upward.</p><div class="tablewrap"><table class="gt"><thead><tr><th>Address</th><th>Offset</th><th>Value</th><th>Note</th></tr></thead><tbody>`;
        for (let i = 0; i < 12; i++) {
          const a = (sp + 4 * i) >>> 0; const v = cpu.rd(a & 0xFFFFFE, 4); const into = result && result.instAddrs.has(v);
          const nm = rev[v]; const note2 = into ? `→ code${nm ? ' (' + esc(nm) + ')' : ''}: likely a return address` : '';
          h += `<tr class="${i === 0 ? 'cur' : ''}"><td class="mono">${hx(a, 8)}</td><td class="mono">SP+${4 * i}</td><td class="mono">${hx(v, 8)}</td><td>${note2}</td></tr>`;
        }
        pane.innerHTML = h + '</tbody></table></div>';
      } else {
        if (!result || !result.ok) { pane.innerHTML = '<p class="dim">Assemble a program to see its symbols.</p>'; return; }
        const rows = Object.entries(result.symbols).sort((a, b) => a[1] - b[1]);
        pane.innerHTML = `<div class="tablewrap"><table class="gt"><thead><tr><th>Symbol</th><th>Value</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td class="mono"><button class="linkbtn" data-sym="${v}">${esc(k)}</button></td><td class="mono">${hx(v, 8)}</td></tr>`).join('')}</tbody></table></div>`;
        pane.querySelectorAll('[data-sym]').forEach((b) => (b.onclick = () => { memBase = +b.dataset.sym & ~0xF; tab = 'mem'; syncTabs(); drawPane(); }));
      }
    }
    function drawMem() {
      const el = root.querySelector('#mem'); if (!el) return;
      const inp = root.querySelector('#memaddr'); const base = parseInt(inp.value, 16); if (Number.isNaN(base)) return; memBase = base;
      const a0 = (base & ~0xF) >>> 0; let h = '';
      for (let r = 0; r < 8; r++) {
        const a = (a0 + r * 16) & 0xFFFFFF; let bytes = '', asc = '';
        for (let c = 0; c < 16; c++) {
          const v = cpu ? cpu.mem[(a + c) & 0xFFFFFF] : 0, w = written.has(a + c);
          bytes += `<span class="${w ? 'chg' : ''}">${v.toString(16).toUpperCase().padStart(2, '0')}</span> `;
          asc += v >= 32 && v < 127 ? esc(String.fromCharCode(v)) : '.';
        }
        h += `<div>${hx(a, 6).slice(1)}: ${bytes} <span class="dim">${asc}</span></div>`;
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
    root.querySelectorAll('.tab').forEach((t) => (t.onclick = () => { tab = t.dataset.tab; syncTabs(); drawPane(); }));
    $('ex').onchange = (e) => { if (e.target.value === '') return; stop(); src.value = EX[+e.target.value].src; keep(KEY, src.value); gutter(); e.target.value = ''; curName = ''; keep(CURKEY, ''); result = null; cpu = null; $('listing').hidden = true; $('editorbox').hidden = false; $('problems').hidden = true; status('Example loaded as a scratch program. Click Assemble (or Ctrl+Enter), or Save as… to keep your edits.'); draw(); setButtons(); projList(); };
    $('inform').onsubmit = (e) => {
      e.preventDefault(); const v = $('inp').value; if (!con) { status('Assemble a program first.', 'bad'); return; }
      con.feedLine(v); $('inp').value = '';
      if (cpu && cpu.waitInput && !cpu.halted) { cpu.waitInput = null; running = false; run(); }   // re-runs the waiting TRAP
    };
    $('clr').onclick = () => { if (con) { con.text = ''; renderOut(); } };
    $('openf').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { stop(); src.value = String(r.result); keep(KEY, src.value); gutter(); result = null; cpu = null; $('listing').hidden = true; $('editorbox').hidden = false; status(`Opened ${f.name}. Click Assemble.`); draw(); setButtons(); }; r.readAsText(f); e.target.value = ''; };
    const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
    $('dl-x68').onclick = () => download('program.X68', src.value);
    $('dl-s68').onclick = () => result && download('program.S68', Asm68K.toSrec(result, 'PROG'));
    $('dl-l68').onclick = () => result && download('program.L68', result.text);
    $('share').onclick = () => {
      const url = location.href.split('#')[0] + '#/' + PACKS.ui.slug + '/sandbox?c=' + b64.enc(src.value);
      const done = () => status('Share link copied to the clipboard.' + (url.length > 2000 ? ' (It is long; some apps may truncate it. Use Save .X68 for big programs.)' : ''), 'ok');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => { location.hash = '#/' + PACKS.ui.slug + '/sandbox?c=' + b64.enc(src.value); status('Link placed in the address bar.', 'ok'); });
      else { location.hash = '#/' + PACKS.ui.slug + '/sandbox?c=' + b64.enc(src.value); status('Link placed in the address bar.', 'ok'); }
    };
    root.querySelector('.tabs').addEventListener('keydown', () => {});

    /* ---------- projects: save / switch / export ---------- */
    const CURKEY = 'q68k.sandbox.current';
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
      result = null; cpu = null; $('listing').hidden = true; $('editorbox').hidden = false; $('problems').hidden = true;
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
    $('pzip').onclick = () => { const z = Projects.zipAll(src.value); if (!z) { status('Nothing to export yet.', 'bad'); return; } Projects.download(`68k-quest-projects-${Projects.stamp()}.zip`, z, 'application/zip'); status('Downloaded a ZIP with one .X68 file per project plus the editor text.', 'ok'); };
    $('pback').onclick = () => { Projects.download(`68k-quest-backup-${Projects.stamp()}.json`, Projects.backup({ editor: src.value, progress: window.Store ? Store.state : null }), 'application/json'); status('Downloaded a backup of your projects and study progress. Restore it from any browser with Restore…', 'ok'); };
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
