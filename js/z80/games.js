/* Question generators for the arcade games. Each make(level) returns:
   { prompt, code?, info?, kind: 'choice'|'fields'|'flags'|'multi'|'order', ... , grade(ans) -> {ok, detail} }
   Register Tracer, Flag Flipper and Branch Oracle compute their answers by running real code on the CPU core. */
(function (root) {
  'use strict';
  const SN = root.SnippetZ80 || require('./snippet.js');
  const { Sim } = SN;
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const hex = (v, w) => { const s = (v >>> 0).toString(16).toUpperCase().padStart(w || 1, '0'); return (/^[A-F]/.test(s) ? '0' : '') + s + 'H'; };
  const normHex = (s) => String(s).trim().toUpperCase().replace(/^(\$|0X)/, '').replace(/H$/, '').replace(/\s+/g, '').replace(/^0+(?=.)/, '');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const edge8 = () => pick([0, 1, 0x7F, 0x80, 0xFF, 0x0F, 0x10, rnd(256), rnd(256)]);
  const REG16 = ['BC', 'DE', 'HL', 'IX', 'IY', 'SP'];

  /* ---------- Register Tracer ---------- */
  const TRACER = {
    easy: [
      () => { const op = pick(['ADD A,', 'SUB ', 'AND ', 'OR ', 'XOR ']); return { init: { A: rnd(256), B: rnd(256) }, code: [`${op}B`], ask: ['A'], note: 'The accumulator A is both a source and the destination.' }; },
      () => { const v = rnd(256); return { init: { A: rnd(256) }, code: [`LD B,${hex(v, 2)}`, 'LD A,B'], ask: ['A', 'B'], note: 'LD copies; the source is not changed.' }; },
      () => { const a = rnd(256); return { init: { A: a, C: rnd(256) }, code: ['INC C', 'DEC A', 'DEC A'], ask: ['A', 'C'], note: 'INC and DEC wrap around at 00H/FFH.' }; },
      () => { return { init: { A: rnd(256) }, code: ['CPL'], ask: ['A'], note: 'CPL flips every bit (one\'s complement).' }; },
      () => { return { init: { A: rnd(256) }, code: ['NEG'], ask: ['A'], note: 'NEG computes 0 − A (two\'s complement).' }; },
    ],
    medium: [
      () => { const a = 0x2000 + rnd(32); const b = Array.from({ length: 6 }, () => rnd(256)); return { init: { HL: a, mem: { [a]: b } }, code: ['LD A,[HL]', 'INC HL', 'ADD A,[HL]'], ask: ['A', 'HL'], note: 'INC HL moves the pointer by one byte.' }; },
      () => { const a = 0x3000; const b = Array.from({ length: 4 }, () => rnd(256)); return { init: { HL: a, mem: { [a]: b } }, code: ['LD B,[HL]', 'INC HL', 'LD C,[HL]'], ask: ['B', 'C', 'HL'], note: '' }; },
      () => { return { init: { HL: rnd(0x8000) + 0x100, DE: rnd(0x8000) + 0x100 }, code: ['ADD HL,DE'], ask: ['HL'], note: 'A 16-bit add: the low byte is L, the high byte is H.' }; },
      () => { return { init: { HL: rnd(0x10000), DE: rnd(0x10000) }, code: ['EX DE,HL'], ask: ['HL', 'DE'], note: 'EX DE,HL swaps the two register pairs.' }; },
      () => { return { init: { A: rnd(256) }, code: ['RLCA', 'RLCA'], ask: ['A'], note: 'RLCA rotates left; bit 7 wraps around into bit 0.' }; },
      () => { const a = 0x4000 + rnd(16) * 2; return { init: { IX: a, mem: { [a]: Array.from({ length: 8 }, () => rnd(256)) } }, code: [`LD A,[IX+${rnd(4) + 1}]`], ask: ['A', 'IX'], note: '(IX+d) does not change IX.' }; },
    ],
    hard: [
      () => { const sp = 0x8000; return { init: { SP: sp, BC: rnd(0x10000), DE: rnd(0x10000) }, code: ['PUSH BC', 'PUSH DE', 'POP BC'], ask: ['BC', 'SP'], note: 'The stack is last-in first-out: POP BC receives what PUSH DE stored last.' }; },
      () => { const sp = 0x8000; return { init: { SP: sp, BC: 0x1234 }, code: ['PUSH BC'], ask: ['SP', 'mem:7FFF', 'mem:7FFE'], note: 'PUSH decrements SP, then stores the high byte, then the low byte.' }; },
      () => { const a = 0x5000; return { init: { A: 0, HL: a, B: 4, mem: { [a]: Array.from({ length: 6 }, () => rnd(40)) } }, code: ['LOOP: ADD A,[HL]', 'INC HL', 'DJNZ LOOP'], ask: ['A', 'HL', 'B'], note: 'DJNZ decrements B and repeats until B = 0.' }; },
      () => { const s = 0x6000, d = 0x6100; return { init: { HL: s, DE: d, BC: 3, mem: { [s]: [rnd(256), rnd(256), rnd(256), rnd(256)] } }, code: ['LDIR'], ask: ['HL', 'DE', 'BC', 'mem:' + d.toString(16).toUpperCase()], note: 'LDIR leaves HL and DE just past the block and BC = 0.' }; },
      () => { return { init: { A: 0x99, f: { C: rnd(2) } }, code: ['ADD A,01H', 'DAA'], ask: ['A'], note: 'DAA turns the binary sum into packed BCD (99 + 1 = 100).' }; },
      () => { return { init: { HL: rnd(0x10000), DE: rnd(0x10000), f: { C: 1 } }, code: ['SBC HL,DE'], ask: ['HL'], note: 'SBC subtracts the carry flag as well: HL − DE − C.' }; },
      () => { return { init: { A: rnd(256), f: { C: rnd(2) } }, code: ['RLA', 'RRA'], ask: ['A'], note: 'RLA and RRA rotate through the carry flag (a 9-bit rotation), so RRA undoes RLA.' }; },
    ],
  };

  function tracerQ(level) {
    for (let tries = 0; tries < 30; tries++) {
      const t = pick(TRACER[level])();
      const sim = new Sim(t.init);
      try { sim.run(t.code); } catch (e) { continue; }
      const answers = t.ask.map((k) => {
        if (k.startsWith('mem:')) { const a = parseInt(k.slice(4), 16); return { key: k, label: `Byte at ${hex(a, 4)}`, val: sim.readMem(a, 1).toString(16).toUpperCase(), w: 2 }; }
        const w = k.length === 1 ? 2 : 4;
        return { key: k, label: `${k} after (hex)`, val: sim.regs[k].toString(16).toUpperCase(), w };
      });
      const regs = [];
      const shown = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'BC', 'DE', 'HL', 'IX', 'IY', 'SP'];
      shown.forEach((n) => { if (t.init[n] !== undefined) regs.push(`<tr><td>${n}</td><td>${hex(t.init[n], n.length === 1 ? 2 : 4)}</td></tr>`); });
      const f = t.init.f || {}; const fl = Object.keys(f).filter((k) => f[k]);
      const mem = Object.entries(t.init.mem || {}).map(([a, b]) => `<div class="mem">${hex(+a, 4)}: ${b.map((x) => `<b>${x.toString(16).toUpperCase().padStart(2, '0')}</b>`).join(' ')}</div>`).join('');
      return {
        kind: 'fields', prompt: 'Run the code. What are the results?', code: t.code.join('\n'),
        info: `<table class="regs">${regs.join('')}</table>${mem}<div class="mem">All other registers start at 0. Flags: ${fl.length ? fl.map((k) => k + '=1').join(' ') + ', the rest 0' : 'all 0'}.</div>`,
        fields: answers.map((a) => ({ label: a.label, ph: '0'.repeat(a.w) + 'H' })),
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
    const ops = level === 'easy' ? ['ADD A,B', 'SUB B', 'CP B'] : level === 'medium' ? ['ADD A,B', 'SUB B', 'CP B', 'AND B', 'OR B', 'XOR B', 'ADC A,B'] : ['ADD A,B', 'SUB B', 'CP B', 'AND B', 'XOR B', 'ADC A,B', 'SBC A,B', 'INC B', 'DEC B', 'NEG', 'RLCA', 'DAA'];
    const line = pick(ops), a = edge8(), b = edge8(), c0 = rnd(2);
    const sim = new Sim({ A: a, B: b, f: { C: c0 } });
    sim.exec(line);
    const exp = sim.flags;
    const names = ['S', 'Z', 'H', 'P', 'N', 'C'];
    const base = line.split(' ')[0];
    const notes = {
      CP: 'CP B computes A − B, sets the flags, and throws the result away.', AND: 'AND always sets H and clears N and C.', OR: 'OR/XOR clear H, N and C; P is the parity of the result.', XOR: 'OR/XOR clear H, N and C; P is the parity of the result.',
      INC: 'INC/DEC leave the carry flag alone.', DEC: 'INC/DEC leave the carry flag alone.', RLCA: 'RLCA changes only C (and clears H and N); S, Z and P/V are untouched.', DAA: 'DAA depends on N, H and C from the previous operation.',
      ADD: 'P/V means signed overflow after arithmetic, and parity after logic operations.', ADC: 'ADC adds the old carry as well.', SUB: 'N is set by every subtraction.', SBC: 'SBC subtracts the old carry as well.', NEG: 'NEG is 0 − A: C is set unless A was 0.',
    };
    return {
      kind: 'flags', prompt: 'Which flags are set (1) after this instruction?', code: line,
      info: `<table class="regs"><tr><td>A</td><td>${hex(a, 2)}</td></tr><tr><td>B</td><td>${hex(b, 2)}</td></tr><tr><td>C (before)</td><td>${c0}</td></tr></table>`,
      flags: names, expected: exp,
      grade(ans) { const bad = names.filter((f) => (ans[f] ? 1 : 0) !== exp[f]); return { ok: !bad.length, bad, detail: `Result: <code>S=${exp.S} Z=${exp.Z} H=${exp.H} P/V=${exp.P} N=${exp.N} C=${exp.C}</code>` + (notes[base] ? `<br>${esc(notes[base])}` : '') }; },
    };
  }

  /* ---------- Branch Oracle ---------- */
  const CCS = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'];
  function branchQ(level) {
    let a = edge8(), b = edge8();
    if (level === 'easy' && Math.random() < 0.5) b = a;
    const sim = new Sim({ A: a, B: b });
    sim.exec('CP B');
    const taken = CCS.filter((c) => sim.taken(c));
    const sg = (v) => SN.toSigned(v, 8);
    return {
      kind: 'multi', prompt: 'After this compare, which conditions are TRUE (so JP cc / JR cc would jump)? Select all.', code: 'CP B',
      info: `<table class="regs"><tr><td>A</td><td>${hex(a, 2)}</td><td>signed ${sg(a)}, unsigned ${a}</td></tr><tr><td>B</td><td>${hex(b, 2)}</td><td>signed ${sg(b)}, unsigned ${b}</td></tr></table>`,
      options: CCS, expected: taken,
      grade(sel) { const exp = new Set(taken); const bad = CCS.filter((c) => exp.has(c) !== sel.has(c)); return { ok: !bad.length, bad, detail: `True: <code>${[...exp].join(' ') || 'none'}</code><br>A − B = ${sg(a) - sg(b)} signed, ${a - b} unsigned. Z/NZ test equality, C/NC compare unsigned numbers, and P/M test the sign flag of the 8-bit result (they are not the signed comparison; after CP the P/V flag says overflow, so PE/PO only matter for signed overflow).` }; },
    };
  }

  /* ---------- Mode Match ---------- */
  const MODES = () => QUEST.MODES;
  const FORMS = [
    { key: 'reg', ex: ['LD A,<m>B</m>', 'ADD A,<m>C</m>', 'LD <m>D</m>,E'] },
    { key: 'imm', ex: ['LD A,<m>55H</m>', 'ADD A,<m>12</m>', 'CP <m>0DH</m>'] },
    { key: 'immx', ex: ['LD HL,<m>0A34BH</m>', 'LD SP,<m>0F000H</m>', 'LD BC,<m>100</m>'] },
    { key: 'ind', ex: ['LD A,<m>[HL]</m>', 'LD <m>[DE]</m>,A', 'ADD A,<m>(HL)</m>'] },
    { key: 'idx', ex: ['LD A,<m>[IX+5]</m>', 'LD <m>(IY-2)</m>,B', 'INC <m>(IX+0)</m>'] },
    { key: 'ext', ex: ['LD A,<m>[1234H]</m>', 'LD <m>[0FF20H]</m>,HL', 'LD HL,<m>(4000H)</m>'] },
    { key: 'rel', ex: ['JR <m>LOOP</m>', 'JR NZ,<m>AGAIN</m>', 'DJNZ <m>NEXT</m>'] },
    { key: 'implied', ex: ['<m>CPL</m>', '<m>EXX</m>', '<m>DAA</m>'] },
    { key: 'bit', ex: ['<m>BIT 3,A</m>', '<m>SET 7,[HL]</m>', '<m>RES 0,B</m>'] },
    { key: 'page0', ex: ['<m>RST 38H</m>', '<m>RST 08H</m>', '<m>RST 00H</m>'] },
  ];
  function modeQ() {
    const f = pick(FORMS), m = MODES().find((x) => x.key === f.key);
    const code = pick(f.ex).replace(/<m>/g, '<mark>').replace(/<\/m>/g, '</mark>');
    const wrong = shuffle(MODES().filter((x) => x.key !== m.key)).slice(0, 3);
    const opts = shuffle([m, ...wrong]);
    const plain = code.replace(/<\/?mark>/g, '');
    return { kind: 'choice', prompt: 'Which addressing mode does the highlighted part use?', codeHtml: code, options: opts.map((x) => x.name), answer: opts.indexOf(m), detail: `<code>${esc(plain)}</code>: <b>${m.name}</b>. ${esc(m.what)}` };
  }

  /* ---------- Bug Hunt ---------- */
  function bugQ() {
    const b = pick(QUEST.BUGS);
    const order = shuffle(b.lines.map((l, i) => ({ l, i })));
    return { kind: 'choice', prompt: 'One of these lines is wrong. Click it.', mono: true, options: order.map((o) => o.l), answer: order.findIndex((o) => o.i === b.bad), detail: esc(b.why) };
  }

  /* ---------- Number Ninja ---------- */
  function numberQ(level) {
    const kinds = level === 'easy' ? ['h2d', 'd2h', 'b2h'] : level === 'medium' ? ['h2d', 'd2h', 'b2h', 'h2b', 'neg', 'sgn'] : ['neg', 'sgn', 'negw', 'h2d', 'sgnw', 'le'];
    const k = pick(kinds);
    const bin8 = (v) => v.toString(2).padStart(8, '0');
    const one = (prompt, ans, ph, detail, norm) => ({ kind: 'fields', prompt, fields: [{ label: 'Answer', ph }], grade: (v) => ({ ok: norm(v[0]) === norm(ans), bad: [0], detail }) });
    const nh = normHex, nd = (s) => String(parseInt(String(s).trim(), 10)), nb = (s) => String(s).replace(/[\s%B]/gi, '').replace(/^0+(?=.)/, '');
    if (k === 'h2d') { const v = 16 + rnd(240); return one(`Convert ${hex(v, 2)} to decimal`, v, 'decimal', `${hex(v, 2)} = ${v}`, nd); }
    if (k === 'd2h') { const v = 16 + rnd(240); return one(`Convert ${v} to hex (byte)`, v.toString(16).toUpperCase(), '..H', `${v} = ${hex(v, 2)}`, nh); }
    if (k === 'b2h') { const v = rnd(256); return one(`Convert ${bin8(v)}B to hex`, v.toString(16).toUpperCase(), '..H', `${bin8(v)}B = ${hex(v, 2)}`, nh); }
    if (k === 'h2b') { const v = rnd(256); return one(`Convert ${hex(v, 2)} to 8-bit binary`, bin8(v), '........', `${hex(v, 2)} = ${bin8(v)}B`, nb); }
    if (k === 'neg') { const v = 1 + rnd(127); const r = (-v) & 0xFF; return one(`Two's complement of ${hex(v, 2)} as a byte (hex)`, r.toString(16).toUpperCase(), '..H', `Complement ${bin8(v ^ 0xFF)}, add 1 → ${bin8(r)} = ${hex(r, 2)}`, nh); }
    if (k === 'negw') { const v = 1 + rnd(0x7FFF); const r = (-v) & 0xFFFF; return one(`Two's complement of ${hex(v, 4)} as a 16-bit number (hex)`, r.toString(16).toUpperCase(), '....H', `${hex(v, 4)} → ${hex(r, 4)}`, nh); }
    if (k === 'sgn') { const v = 128 + rnd(128); return one(`${hex(v, 2)} as a signed byte is…`, v - 256, 'decimal', `${hex(v, 2)} has bit 7 set, so ${v} − 256 = ${v - 256}`, nd); }
    if (k === 'le') {
      const v = 0x100 + rnd(0xFEFF), a = 0x4000 + rnd(0x100);
      return { kind: 'fields', prompt: `LD (${hex(a, 4)}),HL is executed with HL = ${hex(v, 4)}. What byte lands at each address? (the Z80 is little-endian)`, fields: [{ label: hex(a, 4), ph: '..H' }, { label: hex(a + 1, 4), ph: '..H' }],
        grade: (vals) => { const bad = []; if (nh(vals[0]) !== nh((v & 255).toString(16))) bad.push(0); if (nh(vals[1]) !== nh((v >> 8).toString(16))) bad.push(1); return { ok: !bad.length, bad, detail: `Low byte (L = ${hex(v & 255, 2)}) goes first at ${hex(a, 4)}, high byte (H = ${hex(v >> 8, 2)}) at ${hex(a + 1, 4)}.` }; } };
    }
    const v = 0x8000 + rnd(0x8000); return one(`${hex(v, 4)} as a signed 16-bit number is…`, v - 65536, 'decimal', `${v} − 65536 = ${v - 65536}`, nd);
  }

  /* ---------- Hardware Lab ---------- */
  function hardwareQ(level) {
    const kinds = level === 'easy' ? ['top', 'power'] : level === 'medium' ? ['top', 'pages', 'power', 'res'] : ['pages', 'range', 'res', 'power'];
    const k = pick(kinds);
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
    if (k === 'top') { const n = 10 + rnd(7); const top = (2 ** n - 1).toString(16).toUpperCase(); return build(`A processor has ${n} address lines (A0..A${n - 1}). What is the highest byte address? (hex)`, [{ label: 'Highest address', ans: top, hex: true, ph: '..H' }], `2^${n} = ${(2 ** n).toLocaleString()} bytes, so the last address is ${hex(2 ** n - 1, 4)}. (The Z80 has 16 address lines: 64 KB, 0000H–FFFFH.)`); }
    if (k === 'pages') {
      const bits = 16, kk = pick([10, 11, 12, 13, 14]); const size = 2 ** kk;
      return build(`The Z80's address bus is 16 bits. Memory chips are ${size / 1024} KB each. How many address lines go to each chip, and how many chips fill the 64 KB space?`, [{ label: 'Address lines per chip', ans: kk }, { label: 'Number of chips', ans: 2 ** (bits - kk) }], `${size / 1024} KB = 2^${kk} → ${kk} lines (A0–A${kk - 1}) go to every chip; the remaining ${bits - kk} lines (A${kk}–A15) feed a decoder that selects one of ${2 ** (bits - kk)} chips.`);
    }
    if (k === 'range') {
      const kk = pick([12, 13, 14]); const size = 2 ** kk, p = 1 + rnd(2 ** (16 - kk) - 1);
      const start = p * size, end = start + size - 1;
      return build(`16-bit address bus, ${size / 1024} KB blocks. Give the first and last address of block ${p}. (hex)`, [{ label: 'First address', ans: start.toString(16), hex: true, ph: '....H' }, { label: 'Last address', ans: end.toString(16), hex: true, ph: '....H' }], `Start = ${p} × ${hex(size, 4)} = ${hex(start, 4)}; last = start + ${hex(size, 4)} − 1 = ${hex(end, 4)}.`);
    }
    if (k === 'res') {
      const vio = pick([3.3, 5]), ic = pick([20, 50, 100, 150, 200]), beta = pick([50, 75, 100, 150]);
      const ib = ic / beta, r = (vio - 0.6) / (ib / 1000);
      return build(`An I/O pin outputs ${vio} V. The NPN must carry ${ic} mA and β(min) = ${beta}. Base resistor value? (ohms, ±5% accepted)`, [{ label: 'R (Ω)', ans: r, tol: 0.05, ph: 'ohms' }], `IB = ${ic}/${beta} = ${ib.toFixed(2)} mA; R = (${vio} − 0.6)/${ib.toFixed(2)} mA ≈ ${Math.round(r)} Ω. Pick the next lower standard value so the transistor saturates.`);
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

  const api = { tracerQ, flagQ, branchQ, modeQ, bugQ, numberQ, hardwareQ, quizQ, shuffle, pick, esc, TRACER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Games = api;
})(typeof window !== 'undefined' ? window : globalThis);
