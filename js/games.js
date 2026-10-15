/* Question generators for the arcade games. Each make(level) returns:
   { prompt, code?, info?, kind: 'choice'|'fields'|'flags'|'multi'|'order', ... , grade(ans) -> {ok, detail} } */
(function () {
  'use strict';
  const { Sim, MASK } = M68K;
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const r32 = () => ((rnd(0x10000) << 16) | rnd(0x10000)) >>> 0;
  const hex = (v, w) => '$' + (v >>> 0).toString(16).toUpperCase().padStart(w || 1, '0');
  const SZ = { B: 2, W: 4, L: 8 };
  const normHex = (s) => String(s).trim().toUpperCase().replace(/^(\$|0X)/, '').replace(/\s+/g, '').replace(/^0+(?=.)/, '');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Register Tracer ---------- */
  const edge = (size) => pick([0, 1, MASK[size], MASK[size] >>> 1, (MASK[size] >>> 1) + 1, rnd(MASK[size] + 1)]);

  const TRACER = {
    easy: [
      () => { const op = pick(['ADD', 'SUB', 'AND', 'OR', 'EOR']), s = pick(['B', 'W']); const d0 = r32(), d1 = r32();
        return { init: { D: { 0: d0, 1: d1 } }, code: [`${op}.${s} D1,D0`], ask: ['D0'], note: 'Only the low ' + (s === 'B' ? '8' : '16') + ' bits of D0 can change.' }; },
      () => { const s = pick(['B', 'W']), v = rnd(MASK[s] + 1); const d = r32();
        return { init: { D: { 2: d } }, code: [`MOVE.${s} #${hex(v)},D2`], ask: ['D2'], note: 'A byte/word MOVE leaves the upper bits of Dn alone.' }; },
      () => { const s = pick(['B', 'W']); return { init: { D: { 3: r32() } }, code: [`CLR.${s} D3`], ask: ['D3'], note: 'CLR.B/.W only clears the low part.' }; },
      () => { const n = 1 + rnd(8); const d = r32(); return { init: { D: { 1: d } }, code: [`ADDQ.L #${n},D1`, `SUBQ.W #1,D1`], ask: ['D1'], note: '' }; },
    ],
    medium: [
      () => { const a = 0x2000 + 2 * rnd(32); const b = Array.from({ length: 8 }, () => rnd(256)); const s = pick(['B', 'W']);
        return { init: { A: { 0: a }, mem: { [a]: b }, D: { 0: r32(), 1: r32() } }, code: [`MOVE.${s} (A0)+,D0`, `MOVE.${s} (A0)+,D1`], ask: ['D0', 'D1', 'A0'], note: '(A0)+ steps A0 by the operand size.' }; },
      () => { const a = 0x3000 + 2 * rnd(32); const b = Array.from({ length: 6 }, () => rnd(256)); return { init: { A: { 0: a }, mem: { [a]: b }, D: { 0: rnd(256), 1: 0 } }, code: ['ADD.B (A0)+,D0', 'ADD.B (A0)+,D0', 'ADD.B (A0),D1'], ask: ['D0', 'D1', 'A0'], note: '' }; },
      () => { const a = 0x4000; const off = 2 * (1 + rnd(4)); const b = Array.from({ length: 12 }, () => rnd(256)); return { init: { A: { 1: a }, mem: { [a]: b } }, code: [`MOVE.W ${off}(A1),D2`], ask: ['D2'], note: 'd16(An): An is not changed.' }; },
      () => { const d0 = r32(), d1 = r32(); return { init: { D: { 0: d0, 1: d1 } }, code: ['EXG D0,D1', 'SWAP D0'], ask: ['D0', 'D1'], note: 'SWAP exchanges the two 16-bit halves.' }; },
      () => { const s = pick(['B', 'W']); const a = r32() & ~1; return { init: { D: { 0: r32() }, A: { 0: 0x00100000 } }, code: [`MOVE.${s} D0,-(A0)`], ask: ['A0'], note: 'Pre-decrement by the size first.' }; },
    ],
    hard: [
      () => { const a = 0x2008; return { init: { A: { 0: a }, D: { 0: 0x1234, 1: 0xABCD } }, code: ['MOVE.W D0,-(A0)', 'MOVE.W D1,-(A0)'], ask: ['A0', 'mem:2006:W', 'mem:2004:W'], note: 'A push moves down, so the second item lands below the first.' }; },
      () => { const base = 0x2600; const m = [rnd(256), rnd(256), rnd(256), rnd(256)]; const n = 1 + rnd(3);
        return { init: { D: { 6: r32() }, A: { 2: base }, mem: { [base]: m } }, code: [`ADDQ.L #${n},A2`, 'AND.B D6,(A2)'], ask: ['mem:2600:L'], note: 'Only one byte of the long word changes. (Lecture assessment problem style.)' }; },
      () => { const s = pick(['B', 'W']); return { init: { D: { 0: r32() } }, code: [`NEG.${s} D0`, `NOT.${s} D0`], ask: ['D0'], note: 'NOT(NEG x) = x − 1.' }; },
      () => { const a = 0x5000; const b = Array.from({ length: 8 }, () => rnd(256)); return { init: { A: { 0: a }, mem: { [a]: b }, D: { 0: 5, 1: 0 } },
        code: ['ADD.B (A0)+,D1', 'SUBQ.B #1,D0', 'ADD.B (A0)+,D1', 'SUBQ.B #1,D0'], ask: ['D0', 'D1', 'A0'], note: 'Two passes of the lecture sum loop.' }; },
      () => { const d = r32(); return { init: { D: { 0: d, 1: 0 }, A: { 0: 0x1000 } }, code: ['MOVE.L D0,D1', 'ADD.W D1,D1', 'MOVEA.W D1,A1'], ask: ['D1', 'A1'], note: 'MOVEA.W sign-extends into the whole address register.' }; },
    ],
  };

  function tracerQ(level) {
    for (let tries = 0; tries < 30; tries++) {
      const t = pick(TRACER[level])();
      const sim = new Sim(t.init);
      try { sim.run(t.code); } catch (e) { continue; }
      const answers = t.ask.map((k) => {
        if (k.startsWith('mem:')) { const [, a, s] = k.split(':'); return { key: k, label: `Memory ${s === 'B' ? 'byte' : s === 'W' ? 'word' : 'long'} at $${a}`, val: sim.readMem(parseInt(a, 16), s).toString(16).toUpperCase(), w: SZ[s] }; }
        const reg = k[0] === 'D' ? sim.D[+k[1]] : sim.A[+k[1]];
        return { key: k, label: `${k} after (hex)`, val: reg.toString(16).toUpperCase(), w: 8 };
      });
      const regs = [];
      (['D', 'A']).forEach((p) => Object.entries(t.init[p] || {}).forEach(([n, v]) => regs.push(`<tr><td>${p}${n}</td><td>${hex(v, 8)}</td></tr>`)));
      const mem = Object.entries(t.init.mem || {}).map(([a, b]) => `<div class="mem">${hex(+a, 6)}: ${b.map((x) => `<b>${x.toString(16).toUpperCase().padStart(2, '0')}</b>`).join(' ')}</div>`).join('');
      return {
        kind: 'fields', prompt: 'Run the code. What are the results?', code: t.code.join('\n'),
        info: `<table class="regs">${regs.join('')}</table>${mem}<div class="mem">All other registers and flags start at 0.</div>`,
        fields: answers.map((a) => ({ label: a.label, ph: '$' + '0'.repeat(a.w) })),
        grade(vals) {
          const bad = []; answers.forEach((a, i) => { if (normHex(vals[i]) !== normHex(a.val)) bad.push(i); });
          return { ok: !bad.length, bad, detail: answers.map((a) => `${a.label.replace(' after (hex)', '')} = <code>${hex(parseInt(a.val, 16), a.w)}</code>`).join(' &nbsp; ') + (t.note ? `<br>${esc(t.note)}` : '') };
        },
      };
    }
    throw new Error('tracer generation failed');
  }

  /* ---------- Flag Flipper ---------- */
  function flagQ(level) {
    const ops = level === 'easy' ? ['ADD', 'SUB', 'CMP'] : ['ADD', 'SUB', 'CMP', 'AND', 'OR', 'MOVE', 'EOR'];
    const op = pick(ops), s = pick(level === 'hard' ? ['B', 'W', 'L'] : ['B', 'W']);
    const a = edge(s), b = edge(s), x0 = rnd(2);
    const sim = new Sim({ D: { 0: a, 1: b }, f: { X: x0 } });
    const line = op === 'MOVE' ? `MOVE.${s} D1,D0` : `${op}.${s} D1,D0`;
    sim.exec(line);
    const exp = sim.f;
    const w = SZ[s];
    return {
      kind: 'flags', prompt: 'Which flags are set (1) after this instruction?', code: line,
      info: `<table class="regs"><tr><td>D0</td><td>${hex(a, w)}</td></tr><tr><td>D1</td><td>${hex(b, w)}</td></tr><tr><td>X (before)</td><td>${x0}</td></tr></table><div class="mem">${op === 'CMP' ? 'CMP D1,D0 computes D0 − D1 and keeps only the flags.' : ''}</div>`,
      flags: ['X', 'N', 'Z', 'V', 'C'], expected: exp,
      grade(ans) { const bad = ['X', 'N', 'Z', 'V', 'C'].filter((f) => (ans[f] ? 1 : 0) !== exp[f]); return { ok: !bad.length, bad, detail: `Result flags: <code>X=${exp.X} N=${exp.N} Z=${exp.Z} V=${exp.V} C=${exp.C}</code>${op === 'CMP' || op === 'MOVE' || op === 'AND' || op === 'OR' || op === 'EOR' ? '<br>X is not affected by this instruction.' : ''}` }; },
    };
  }

  /* ---------- Branch Oracle ---------- */
  const BCC = ['EQ', 'NE', 'GT', 'GE', 'LT', 'LE', 'HI', 'LS', 'CC', 'CS', 'MI', 'PL'];
  function branchQ(level) {
    const s = level === 'hard' ? pick(['B', 'W']) : 'B';
    let a = edge(s), b = edge(s);
    if (level === 'easy' && Math.random() < 0.5) b = a;
    const sim = new Sim({ D: { 0: a, 1: b } });
    sim.exec(`CMP.${s} D0,D1`);
    const taken = BCC.filter((c) => sim.taken(c));
    const sg = (v) => M68K.toSigned(v, s);
    return {
      kind: 'multi', prompt: 'After this compare, which branches are TAKEN? Select all.', code: `CMP.${s} D0,D1`,
      info: `<table class="regs"><tr><td>D0</td><td>${hex(a, SZ[s])}</td><td>signed ${sg(a)}, unsigned ${a}</td></tr><tr><td>D1</td><td>${hex(b, SZ[s])}</td><td>signed ${sg(b)}, unsigned ${b}</td></tr></table>`,
      options: BCC.map((c) => 'B' + c), expected: taken.map((c) => 'B' + c),
      grade(sel) { const exp = new Set(taken.map((c) => 'B' + c)); const bad = BCC.map((c) => 'B' + c).filter((c) => exp.has(c) !== sel.has(c)); return { ok: !bad.length, bad, detail: `Taken: <code>${[...exp].join(' ') || 'none'}</code><br>D1 − D0 = ${sg(b) - sg(a)} signed, ${b - a} unsigned. Signed branches: GT GE LT LE. Unsigned: HI LS CC CS.` }; },
    };
  }

  /* ---------- Mode Match ---------- */
  const FORMS = {
    dn: { f: ['D{r}'], sizes: 'BWL' }, an: { f: ['A{r}'], sizes: 'WL', src: true },
    ind: { f: ['(A{r})'], sizes: 'BWL' }, post: { f: ['(A{r})+'], sizes: 'BWL' },
    pre: { f: ['-(A{r})', '-(SP)'], sizes: 'BWL' }, disp: { f: ['($1300,A{r})', '8(A{r})'], sizes: 'BWL' },
    idx: { f: ['($2C,A{r},D{q}.L)', '($10,A{r},D{q}.W)'], sizes: 'BWL' },
    absw: { f: ['($1234).W'], sizes: 'BWL' }, absl: { f: ['($00004000).L'], sizes: 'BWL' },
    pcd: { f: ['($20,PC)'], sizes: 'BWL', src: true }, imm: { f: ['#$55', '#24', '#%1010'], sizes: 'BWL', src: true },
  };
  function modeQ() {
    const m = pick(QUEST.MODES), F = FORMS[m.key];
    const op = pick(F.f).replace('{r}', 1 + rnd(5)).replace('{q}', 2 + rnd(5));
    const s = pick(F.sizes.split(''));
    const asSrc = F.src || Math.random() < 0.5;
    const other = 'D' + rnd(8);
    const hi = `<mark>${esc(op)}</mark>`;
    const code = asSrc ? `MOVE.${s} ${hi},${other}` : `MOVE.${s} ${other},${hi}`;
    const wrong = shuffle(QUEST.MODES.filter((x) => x.key !== m.key)).slice(0, 3);
    const opts = shuffle([m, ...wrong]);
    return { kind: 'choice', prompt: 'Which addressing mode does the highlighted operand use?', codeHtml: code, options: opts.map((x) => x.name), answer: opts.indexOf(m), detail: `<code>${esc(op)}</code> is <b>${m.name}</b> (${m.mode}).` };
  }

  /* ---------- Bug Hunt ---------- */
  function bugQ() {
    const b = pick(QUEST.BUGS);
    const order = shuffle(b.lines.map((l, i) => ({ l, i })));
    return { kind: 'choice', prompt: 'One of these lines is wrong. Click it.', mono: true, options: order.map((o) => o.l), answer: order.findIndex((o) => o.i === b.bad), detail: esc(b.why) };
  }

  /* ---------- Number Ninja ---------- */
  function numberQ(level) {
    const kinds = level === 'easy' ? ['h2d', 'd2h', 'b2h'] : level === 'medium' ? ['h2d', 'd2h', 'b2h', 'h2b', 'neg', 'sgn'] : ['neg', 'sgn', 'negw', 'h2d', 'sgnw'];
    const k = pick(kinds);
    const bin8 = (v) => v.toString(2).padStart(8, '0');
    const one = (prompt, ans, ph, detail, norm) => ({ kind: 'fields', prompt, fields: [{ label: 'Answer', ph }], grade: (v) => ({ ok: norm(v[0]) === norm(ans), bad: [0], detail }) });
    const nh = normHex, nd = (s) => String(parseInt(String(s).trim(), 10)), nb = (s) => String(s).replace(/[\s%]/g, '').replace(/^0+(?=.)/, '');
    if (k === 'h2d') { const v = 16 + rnd(240); return one(`Convert ${hex(v)} to decimal`, v, 'decimal', `${hex(v)} = ${v}`, nd); }
    if (k === 'd2h') { const v = 16 + rnd(240); return one(`Convert ${v} to hex (byte)`, v.toString(16).toUpperCase(), '$..', `${v} = ${hex(v)}`, nh); }
    if (k === 'b2h') { const v = rnd(256); return one(`Convert %${bin8(v)} to hex`, v.toString(16).toUpperCase(), '$..', `%${bin8(v)} = ${hex(v, 2)}`, nh); }
    if (k === 'h2b') { const v = rnd(256); return one(`Convert ${hex(v, 2)} to 8-bit binary`, bin8(v), '%........', `${hex(v, 2)} = %${bin8(v)}`, nb); }
    if (k === 'neg') { const v = 1 + rnd(127); const r = (-v) & 0xFF; return one(`Two's complement of ${hex(v, 2)} as a byte (hex)`, r.toString(16).toUpperCase(), '$..', `Complement ${bin8(v ^ 0xFF)}, add 1 → ${bin8(r)} = ${hex(r, 2)}`, nh); }
    if (k === 'negw') { const v = 1 + rnd(0x7FFF); const r = (-v) & 0xFFFF; return one(`Two's complement of ${hex(v, 4)} as a word (hex)`, r.toString(16).toUpperCase(), '$....', `${hex(v, 4)} → ${hex(r, 4)}`, nh); }
    if (k === 'sgn') { const v = 128 + rnd(128); return one(`${hex(v, 2)} as a signed byte is…`, v - 256, 'decimal', `${hex(v, 2)} has bit 7 set, so ${v} − 256 = ${v - 256}`, nd); }
    const v = 0x8000 + rnd(0x8000); return one(`${hex(v, 4)} as a signed word is…`, v - 65536, 'decimal', `${v} − 65536 = ${v - 65536}`, nd);
  }

  /* ---------- Hardware Lab ---------- */
  function hardwareQ(level) {
    const kinds = level === 'easy' ? ['top', 'power'] : level === 'medium' ? ['top', 'pages', 'power', 'res'] : ['pages', 'range', 'res', 'power'];
    const k = pick(kinds);
    const num = (label, ans, tol) => ({ label, ans, tol: tol || 0 });
    const build = (prompt, fields, detail, note) => ({
      kind: 'fields', prompt, info: note || '', fields: fields.map((f) => ({ label: f.label, ph: f.ph || '' })),
      grade(v) {
        const bad = []; fields.forEach((f, i) => {
          if (f.hex) { if (normHex(v[i]) !== normHex(f.ans)) bad.push(i); }
          else { const x = parseFloat(String(v[i]).replace(/,/g, '')); if (!(Math.abs(x - f.ans) <= Math.abs(f.ans) * (f.tol || 0) + 1e-9)) bad.push(i); }
        });
        return { ok: !bad.length, bad, detail };
      },
    });
    if (k === 'top') { const n = 10 + rnd(15); const top = (2 ** n - 1).toString(16).toUpperCase(); return build(`A processor has ${n} address lines (A0..A${n - 1}). What is the highest byte address? (hex)`, [{ label: 'Highest address', ans: top, hex: true, ph: '$...' }], `2^${n} = ${(2 ** n).toLocaleString()} bytes, so the last address is $${top}.`); }
    if (k === 'pages') {
      const bits = 24, kk = pick([15, 16, 17, 18, 19]); const size = 2 ** kk;
      return build(`Memory pages are ${size / 1024} KB each on a 24-bit address bus. How many offset bits go to the chips, and how many pages exist?`, [{ label: 'Offset bits', ans: kk }, { label: 'Number of pages', ans: 2 ** (bits - kk) }], `${size / 1024} KB = 2^${kk} → ${kk} offset bits (A0-A${kk - 1}); the other ${bits - kk} bits are page bits → 2^${bits - kk} = ${2 ** (bits - kk)} pages.`);
    }
    if (k === 'range') {
      const kk = pick([15, 16, 18, 19]); const size = 2 ** kk, p = 1 + rnd(7);
      const start = p * size, end = start + size - 1;
      return build(`24-bit address bus, ${size / 1024} KB pages. Give the first and last address of page ${p}. (hex)`, [{ label: 'First address', ans: start.toString(16), hex: true, ph: '$......' }, { label: 'Last address', ans: end.toString(16), hex: true, ph: '$......' }], `Start = ${p} × ${hex(size)} = ${hex(start, 6)}; last = start + size − 1 = ${hex(end, 6)}. (Page boundaries need not line up with hex digits.)`);
    }
    if (k === 'res') {
      const vio = pick([3.3, 5]), ic = pick([20, 50, 100, 150, 200]), beta = pick([50, 75, 100, 150]);
      const ib = ic / beta, r = (vio - 0.6) / (ib / 1000);
      return build(`An I/O pin outputs ${vio} V. The NPN must carry ${ic} mA and β(min) = ${beta}. Base resistor value? (ohms, ±5% accepted)`, [{ label: 'R (Ω)', ans: r, tol: 0.05, ph: 'ohms' }], `IB = ${ic}/${beta} = ${ib.toFixed(2)} mA; R = (${vio} − 0.6)/${ib.toFixed(2)} mA ≈ ${Math.round(r)} Ω. Pick the next lower standard value so β(min) is still satisfied.`);
    }
    const ic = pick([50, 100, 200, 300, 500]);
    return build(`A saturated NPN (VCE(sat) ≈ 0.4 V) carries ${ic} mA. Power dissipated in the transistor? (mW)`, [{ label: 'P (mW)', ans: 0.4 * ic, tol: 0.02, ph: 'mW' }], `P = 0.4 V × ${ic} mA = ${0.4 * ic} mW.`);
  }

  /* ---------- Quiz Blitz ---------- */
  function quizQ(worldId) {
    const pool = worldId ? QUEST.QUIZ.filter((q) => q.world === worldId) : QUEST.QUIZ;
    const q = pick(pool);
    const opts = shuffle([q.correct, ...q.wrong]);
    return { kind: 'choice', prompt: q.q, options: opts, answer: opts.indexOf(q.correct), detail: esc(q.why), world: q.world };
  }

  window.Games = { tracerQ, flagQ, branchQ, modeQ, bugQ, numberQ, hardwareQ, quizQ, shuffle, pick, esc };
})();
