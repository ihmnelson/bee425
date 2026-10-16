/* A 68000 assembler using EASy68K source conventions. Two passes; emits real machine code,
   a listing, a symbol table, and S-records. Written from the Motorola M68000 PRM and by
   black-box comparison with the EASy68K assembler. */
(function (root) {
  'use strict';
  const u32 = (x) => x >>> 0;
  const hex = (v, w) => (v >>> 0).toString(16).toUpperCase().padStart(w, '0');
  class AsmError extends Error { constructor(msg) { super(msg); this.asm = true; } }
  const fail = (m) => { throw new AsmError(m); };

  /* ---------------- expressions ---------------- */
  function evalExpr(text, ctx) {
    const s = text.trim(); let i = 0, undef = false; const names = [];
    const peek = () => s[i];
    const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
    function primary() {
      ws(); const ch = s[i];
      if (ch === undefined) fail('Expression expected');
      if (ch === '(') { i++; const v = orExpr(); ws(); if (s[i] !== ')') fail('Missing )'); i++; return v; }
      if (ch === '-') { i++; return -primary() | 0; }
      if (ch === '+') { i++; return primary(); }
      if (ch === '~') { i++; return ~primary(); }
      if (ch === "'") { const m = /^'((?:[^']|'')*)'/.exec(s.slice(i)); if (!m) fail('Bad character constant'); i += m[0].length; let v = 0; for (const c of m[1].replace(/''/g, "'")) v = ((v << 8) | c.charCodeAt(0)) >>> 0; return v | 0; }
      if (ch === '$') { const m = /^\$([0-9A-Fa-f]+)/.exec(s.slice(i)); if (!m) fail('Bad hex number'); i += m[0].length; return parseInt(m[1], 16) | 0; }
      if (ch === '%') { const m = /^%([01]+)/.exec(s.slice(i)); if (!m) fail('Bad binary number'); i += m[0].length; return parseInt(m[1], 2) | 0; }
      if (ch === '@') { const m = /^@([0-7]+)/.exec(s.slice(i)); if (!m) fail('Bad octal number'); i += m[0].length; return parseInt(m[1], 8) | 0; }
      if (ch === '*' ) { i++; return ctx.loc | 0; }
      if (/[0-9]/.test(ch)) { const m = /^[0-9]+/.exec(s.slice(i)); i += m[0].length; return parseInt(m[0], 10) | 0; }
      if (/[A-Za-z_.]/.test(ch)) {
        const m = /^[A-Za-z_.][A-Za-z0-9_.$]*/.exec(s.slice(i)); i += m[0].length;
        const r = ctx.lookup(m[0]);
        if (r === undefined) { undef = true; names.push(m[0]); return 0; }
        return r | 0;
      }
      fail('Unexpected "' + ch + '" in expression');
    }
    function mul() { let v = primary(); for (;;) { ws(); const c = peek(); if (c === '*') { i++; v = Math.imul(v, primary()); } else if (c === '/') { i++; const d = primary(); if (d === 0 && !undef) fail('Division by zero'); v = d === 0 ? 0 : Math.trunc(v / d) | 0; } else return v; } }
    function add() { let v = mul(); for (;;) { ws(); const c = peek(); if (c === '+') { i++; v = (v + mul()) | 0; } else if (c === '-') { i++; v = (v - mul()) | 0; } else return v; } }
    function shift() { let v = add(); for (;;) { ws(); if (s.startsWith('<<', i)) { i += 2; v = v << add(); } else if (s.startsWith('>>', i)) { i += 2; v = v >> add(); } else return v; } }
    function andE() { let v = shift(); for (;;) { ws(); if (peek() === '&') { i++; v &= shift(); } else return v; } }
    function xorE() { let v = andE(); for (;;) { ws(); if (peek() === '^') { i++; v ^= andE(); } else return v; } }
    function orExpr() { let v = xorE(); for (;;) { ws(); if (peek() === '|' || peek() === '!') { i++; v |= xorE(); } else return v; } }
    const v = orExpr(); ws();
    if (i < s.length) fail('Unexpected "' + s.slice(i) + '" in expression');
    return { v, undef, names };
  }

  /* ---------------- operand parsing ---------------- */
  const REGRE = /^(?:D([0-7])|A([0-7])|SP)$/i;
  function splitTop(str) {
    const out = []; let depth = 0, cur = '', q = false;
    for (const ch of str) {
      if (ch === "'") q = !q;
      if (!q) { if (ch === '(') depth++; else if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; } }
      cur += ch;
    }
    if (cur.trim() !== '' || out.length) out.push(cur.trim());
    return out;
  }
  function areg(t) { t = t.toUpperCase(); return t === 'SP' ? 7 : +t[1]; }
  function parseOp(t) {
    t = t.trim(); let m;
    if (!t) fail('Operand expected');
    if (t[0] === '#') return { k: '#', expr: t.slice(1) };
    if ((m = /^D([0-7])$/i.exec(t))) return { k: 'D', reg: +m[1] };
    if ((m = /^(A[0-7]|SP)$/i.exec(t))) return { k: 'A', reg: areg(m[1]) };
    if (/^SR$/i.test(t)) return { k: 'SR' };
    if (/^CCR$/i.test(t)) return { k: 'CCR' };
    if (/^USP$/i.test(t)) return { k: 'USP' };
    if ((m = /^\(\s*(A[0-7]|SP)\s*\)\+$/i.exec(t))) return { k: 'P', reg: areg(m[1]) };
    if ((m = /^-\(\s*(A[0-7]|SP)\s*\)$/i.exec(t))) return { k: 'M', reg: areg(m[1]) };
    if ((m = /^\(\s*(A[0-7]|SP)\s*\)$/i.exec(t))) return { k: 'I', reg: areg(m[1]) };
    const idx = (disp, base, xr, xs) => ({ k: /^PC$/i.test(base) ? 'Y' : 'X', reg: /^PC$/i.test(base) ? 0 : areg(base), expr: disp || '0', xa: /^A/i.test(xr) || /^SP$/i.test(xr), xreg: areg2(xr), xl: (xs || 'W').toUpperCase() === 'L' });
    if ((m = /^(.*?)\(\s*(A[0-7]|SP|PC)\s*,\s*([DA][0-7]|SP)(?:\.([WL]))?\s*\)$/i.exec(t))) return idx(m[1], m[2], m[3], m[4]);
    if ((m = /^\(\s*(.*?)\s*,\s*(A[0-7]|SP|PC)\s*,\s*([DA][0-7]|SP)(?:\.([WL]))?\s*\)$/i.exec(t))) return idx(m[1], m[2], m[3], m[4]);
    if ((m = /^\(\s*(A[0-7]|SP|PC)\s*,\s*([DA][0-7]|SP)(?:\.([WL]))?\s*\)$/i.exec(t))) return idx('0', m[1], m[2], m[3]);
    if ((m = /^(.+?)\(\s*(A[0-7]|SP|PC)\s*\)$/i.exec(t)) && !/^\(/.test(t)) return /^PC$/i.test(m[2]) ? { k: 'C', expr: m[1] } : { k: 'R', reg: areg(m[2]), expr: m[1] };
    if ((m = /^\(\s*(.+?)\s*,\s*(A[0-7]|SP|PC)\s*\)$/i.exec(t))) return /^PC$/i.test(m[2]) ? { k: 'C', expr: m[1] } : { k: 'R', reg: areg(m[2]), expr: m[1] };
    if ((m = /^\(\s*(.+)\s*\)\.([WL])$/i.exec(t))) return { k: m[2].toUpperCase() === 'W' ? 'W' : 'L', expr: m[1] };
    if ((m = /^(.+?)\.([WL])$/i.exec(t)) && !/^[DA][0-7]$/i.test(m[1])) return { k: m[2].toUpperCase() === 'W' ? 'W' : 'L', expr: m[1] };
    return { k: 'ABS', expr: t };
  }
  function areg2(x) { x = x.toUpperCase(); return x === 'SP' ? 7 : +x[1]; }

  function parseRegList(t, syms) {
    const v = syms && syms[t.toUpperCase()]; if (typeof v === 'string') t = v;
    let mask = 0;
    for (const part of t.split('/')) {
      const m = /^([DA])([0-7])(?:-([DA])([0-7]))?$/i.exec(part.trim()) || (/^SP$/i.test(part.trim()) ? ['', 'A', '7'] : null);
      if (!m) return null;
      const a = (m[1].toUpperCase() === 'A' ? 8 : 0) + +m[2], b = m[3] ? (m[3].toUpperCase() === 'A' ? 8 : 0) + +m[4] : a;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) mask |= 1 << i;
    }
    return mask;
  }
  const bitrev16 = (m) => { let r = 0; for (let i = 0; i < 16; i++) if (m & (1 << i)) r |= 1 << (15 - i); return r; };

  /* legal-mode sets */
  const ALL = 'DAIPMRXWLCY#', DATA = 'DIPMRXWLCY#', DALT = 'DIPMRXWL', MALT = 'IPMRXWL', CTL = 'IRXWLCY', ALT = 'DAIPMRXWL';

  /* ---------------- encoding ---------------- */
  const SIZEBITS = { B: 0, W: 1, L: 2 };
  const SIZEBYTES = { B: 1, W: 2, L: 4 };
  const CC = { T: 0, F: 1, HI: 2, LS: 3, CC: 4, HS: 4, CS: 5, LO: 5, NE: 6, EQ: 7, VC: 8, VS: 9, PL: 10, MI: 11, GE: 12, LT: 13, GT: 14, LE: 15 };

  /* Encodes one instruction. ctx: { pc, eval(expr)->{v,undef}, pass, choice } */
  function encodeInst(mn, size, opTexts, ctx) {
    const ops = opTexts.map(parseOp);
    const words = [];
    const state = { ext: 0 };
    const undef = { any: false, names: [] };
    const val = (expr) => { const r = ctx.eval(expr); if (r.undef) { undef.any = true; undef.names.push(...(r.names || [])); } return r; };
    const need = (n) => { if (ops.length !== n) fail(`${mn} needs ${n} operand${n === 1 ? '' : 's'}`); };
    const allow = (op, set, what) => { const k = op.k === 'ABS' ? 'W' : op.k; if (!set.includes(k)) fail('Invalid addressing mode' + (what ? ' for ' + what : '')); };
    const sz = (def) => { const s = size || def; if (!s || !SIZEBITS.hasOwnProperty(s)) fail('Invalid size code'); return s; };
    const immVal = (op, s) => { const r = val(op.expr); let v = r.v; const lim = s === 'B' ? [-128, 255] : s === 'W' ? [-32768, 65535] : [-2147483648, 4294967295]; if (!r.undef && (v < lim[0] && s !== 'L' || v > lim[1] && s !== 'L')) fail('Immediate value out of range'); return v; };
    const pushImm = (v, s) => { if (s === 'L') { words.push((v >>> 16) & 0xFFFF, v & 0xFFFF); } else words.push(s === 'B' ? v & 0xFF : v & 0xFFFF); };

    /* effective address: returns 6-bit mode/reg field; pushes extension words */
    function ea(op, s) {
      const base = ctx.pc + 2 + 2 * state.ext; // address of next ext word is computed from words so far
      const here = () => ctx.pc + 2 * (words.length + 1); // + opcode word position handled by caller
      switch (op.k) {
        case 'D': return op.reg;
        case 'A': return 8 | op.reg;
        case 'I': return 16 | op.reg;
        case 'P': return 24 | op.reg;
        case 'M': return 32 | op.reg;
        case 'R': { const r = val(op.expr); if (!r.undef && (r.v < -32768 || r.v > 32767)) fail('Displacement out of range'); words.push(r.v & 0xFFFF); return 40 | op.reg; }
        case 'X': { const r = val(op.expr); if (!r.undef && (r.v < -128 || r.v > 127)) fail('Displacement out of range'); words.push(((op.xa ? 1 : 0) << 15) | (op.xreg << 12) | ((op.xl ? 1 : 0) << 11) | (r.v & 0xFF)); return 48 | op.reg; }
        case 'W': { const r = val(op.expr); words.push(r.v & 0xFFFF); return 56; }
        case 'L': { const r = val(op.expr); words.push((r.v >>> 16) & 0xFFFF, r.v & 0xFFFF); return 57; }
        case 'ABS': {
          const r = val(op.expr), v = r.v | 0;
          const choice = ctx.choice('abs', () => (!r.undef && v >= -32768 && v <= 32767) ? 'W' : 'L');
          if (choice === 'W') { words.push(v & 0xFFFF); return 56; }
          words.push((v >>> 16) & 0xFFFF, v & 0xFFFF); return 57;
        }
        case 'C': { const r = val(op.expr); const extAddr = ctx.pc + 2 * (words.length + 1); const d = r.v - extAddr; if (!r.undef && (d < -32768 || d > 32767)) fail('Displacement out of range'); words.push(d & 0xFFFF); return 58; }
        case 'Y': { const r = val(op.expr); const extAddr = ctx.pc + 2 * (words.length + 1); const d = r.v - extAddr; if (!r.undef && (d < -128 || d > 127)) fail('Displacement out of range'); words.push(((op.xa ? 1 : 0) << 15) | (op.xreg << 12) | ((op.xl ? 1 : 0) << 11) | (d & 0xFF)); return 59; }
        case '#': { const v = immVal(op, s); pushImm(v, s); return 60; }
      }
      fail('Invalid addressing mode');
    }
    // run ea() while accounting for words already placed in front (opcode + earlier operands)
    const eaAt = (op, s, leading) => { const save = ctx.preExt; ctx.preExt = leading; const r = ea(op, s); ctx.preExt = save; return r; };
    const out = (opcode, tail) => ({ words: [opcode & 0xFFFF, ...tail], undef: undef.any, names: undef.names });
    const legal = (op, set) => allow(op, set);

    /* ADD/SUB family helper: returns {words} */
    function addsub(isAdd) {
      need(2);
      const [s, d] = ops; const base = isAdd ? 0xD000 : 0x9000, qbase = isAdd ? 0x5000 : 0x5100;
      if (mn === isAdd ? mn === 'ADDA' : mn === 'SUBA') { /* handled below */ }
      if (s.k === '#' && d.k !== 'SR' && (mn === 'ADD' || mn === 'SUB' || mn === 'ADDI' || mn === 'SUBI' || mn === 'ADDQ' || mn === 'SUBQ' || mn === 'ADDA' || mn === 'SUBA')) {
        const z = sz('W'); const r = val(s.expr);
        const quickOK = !r.undef && r.v >= 1 && r.v <= 8;
        if ((mn === 'ADDQ' || mn === 'SUBQ') || (quickOK && !((mn === 'ADDA' || mn === 'SUBA') && d.k !== 'A'))) {
          if (!quickOK) fail('Quick immediate data range must be 1 to 8');
          legal(d, ALT); if (d.k === 'A' && z === 'B') fail('Invalid size code');
          const f = eaAt(d, z, 0); return out(qbase | ((r.v & 7) << 9) | (SIZEBITS[z] << 6) | f, words);
        }
        if (d.k === 'A' || mn === 'ADDA' || mn === 'SUBA') {
          if (d.k !== 'A') fail('Invalid addressing mode'); if (z === 'B') fail('Invalid size code');
          const v = immVal(s, z); pushImm(v, z);
          return out(base | (d.reg << 9) | ((z === 'W' ? 3 : 7) << 6) | 60, words);
        }
        legal(d, DALT);
        const v = immVal(s, z);
        words.length = 0; pushImm(v, z); const lead = words.length;
        const f = eaAt(d, z, lead);
        return out((isAdd ? 0x0600 : 0x0400) | (SIZEBITS[z] << 6) | f, words);
      }
      if (mn === 'ADDQ' || mn === 'SUBQ' || mn === 'ADDI' || mn === 'SUBI') fail('Invalid addressing mode');
      if (d.k === 'A' || mn === 'ADDA' || mn === 'SUBA') {
        if (d.k !== 'A') fail('Invalid addressing mode'); const z = sz('W'); if (z === 'B') fail('Invalid size code');
        legal(s, ALL); const f = eaAt(s, z, 0); return out(base | (d.reg << 9) | ((z === 'W' ? 3 : 7) << 6) | f, words);
      }
      const z = sz('W');
      if (d.k === 'D') { legal(s, ALL); if (s.k === 'A' && z === 'B') fail('Invalid size code'); const f = eaAt(s, z, 0); return out(base | (d.reg << 9) | (SIZEBITS[z] << 6) | f, words); }
      if (s.k === 'D') { legal(d, MALT); const f = eaAt(d, z, 0); return out(base | (s.reg << 9) | ((4 + SIZEBITS[z]) << 6) | f, words); }
      fail('Invalid addressing mode');
    }

    switch (mn) {
      case 'NOP': need(0); return out(0x4E71, []);
      case 'RTS': need(0); return out(0x4E75, []);
      case 'RTE': need(0); return out(0x4E73, []);
      case 'RTR': need(0); return out(0x4E77, []);
      case 'TRAPV': need(0); return out(0x4E76, []);
      case 'RESET': need(0); return out(0x4E70, []);
      case 'ILLEGAL': need(0); return out(0x4AFC, []);
      case 'SIMHALT': need(0); return { words: [0xFFFF, 0xFFFF], undef: false };
      case 'STOP': { need(1); if (ops[0].k !== '#') fail('Invalid addressing mode'); const v = val(ops[0].expr).v; return out(0x4E72, [v & 0xFFFF]); }
      case 'TRAP': { need(1); if (ops[0].k !== '#') fail('Invalid addressing mode'); const v = val(ops[0].expr); if (!v.undef && (v.v < 0 || v.v > 15)) fail('TRAP vector must be 0 to 15'); return out(0x4E40 | (v.v & 15), []); }
      case 'LINK': { need(2); if (ops[0].k !== 'A' || ops[1].k !== '#') fail('Invalid addressing mode'); return out(0x4E50 | ops[0].reg, [val(ops[1].expr).v & 0xFFFF]); }
      case 'UNLK': { need(1); if (ops[0].k !== 'A') fail('Invalid addressing mode'); return out(0x4E58 | ops[0].reg, []); }
      case 'SWAP': { need(1); if (ops[0].k !== 'D') fail('Invalid addressing mode'); return out(0x4840 | ops[0].reg, []); }
      case 'EXT': { need(1); if (ops[0].k !== 'D') fail('Invalid addressing mode'); const z = sz('W'); if (z === 'B') fail('Invalid size code'); return out((z === 'W' ? 0x4880 : 0x48C0) | ops[0].reg, []); }
      case 'EXG': {
        need(2); const [a, b] = ops;
        if (a.k === 'D' && b.k === 'D') return out(0xC140 | (a.reg << 9) | b.reg, []);
        if (a.k === 'A' && b.k === 'A') return out(0xC148 | (a.reg << 9) | b.reg, []);
        if (a.k === 'D' && b.k === 'A') return out(0xC188 | (a.reg << 9) | b.reg, []);
        if (a.k === 'A' && b.k === 'D') return out(0xC188 | (b.reg << 9) | a.reg, []);
        fail('Invalid addressing mode');
      }
      case 'MOVEQ': { need(2); if (ops[0].k !== '#' || ops[1].k !== 'D') fail('Invalid addressing mode'); const r = val(ops[0].expr); return out(0x7000 | (ops[1].reg << 9) | (r.v & 0xFF), []); }
      case 'LEA': { need(2); legal(ops[0], CTL); if (ops[1].k !== 'A') fail('Invalid addressing mode'); const f = eaAt(ops[0], 'L', 0); return out(0x41C0 | (ops[1].reg << 9) | f, words); }
      case 'PEA': { need(1); legal(ops[0], CTL); const f = eaAt(ops[0], 'L', 0); return out(0x4840 | f, words); }
      case 'JMP': case 'JSR': { need(1); legal(ops[0], CTL); const f = eaAt(ops[0], 'L', 0); return out((mn === 'JMP' ? 0x4EC0 : 0x4E80) | f, words); }
      case 'CLR': case 'NEG': case 'NEGX': case 'NOT': case 'TST': {
        need(1); const z = sz('W'); legal(ops[0], mn === 'TST' ? DALT : DALT); const f = eaAt(ops[0], z, 0);
        const b = { CLR: 0x4200, NEG: 0x4400, NEGX: 0x4000, NOT: 0x4600, TST: 0x4A00 }[mn];
        return out(b | (SIZEBITS[z] << 6) | f, words);
      }
      case 'TAS': { need(1); legal(ops[0], DALT); const f = eaAt(ops[0], 'B', 0); return out(0x4AC0 | f, words); }
      case 'NBCD': { need(1); legal(ops[0], DALT); const f = eaAt(ops[0], 'B', 0); return out(0x4800 | f, words); }
      case 'CHK': { need(2); legal(ops[0], DATA); if (ops[1].k !== 'D') fail('Invalid addressing mode'); const f = eaAt(ops[0], 'W', 0); return out(0x4180 | (ops[1].reg << 9) | f, words); }
      case 'ADD': case 'ADDI': case 'ADDQ': case 'ADDA': return addsub(true);
      case 'SUB': case 'SUBI': case 'SUBQ': case 'SUBA': return addsub(false);
      case 'ADDX': case 'SUBX': {
        need(2); const z = sz('W'), b = mn === 'ADDX' ? 0xD100 : 0x9100;
        if (ops[0].k === 'D' && ops[1].k === 'D') return out(b | (ops[1].reg << 9) | (SIZEBITS[z] << 6) | ops[0].reg, []);
        if (ops[0].k === 'M' && ops[1].k === 'M') return out(b | (ops[1].reg << 9) | (SIZEBITS[z] << 6) | 8 | ops[0].reg, []);
        fail('Invalid addressing mode');
      }
      case 'ABCD': case 'SBCD': {
        need(2); const b = mn === 'ABCD' ? 0xC100 : 0x8100;
        if (ops[0].k === 'D' && ops[1].k === 'D') return out(b | (ops[1].reg << 9) | ops[0].reg, []);
        if (ops[0].k === 'M' && ops[1].k === 'M') return out(b | (ops[1].reg << 9) | 8 | ops[0].reg, []);
        fail('Invalid addressing mode');
      }
      case 'CMP': case 'CMPI': case 'CMPA': {
        need(2); const [s, d] = ops; const z = sz('W');
        if (d.k === 'A' || mn === 'CMPA') { if (d.k !== 'A') fail('Invalid addressing mode'); if (z === 'B') fail('Invalid size code'); legal(s, ALL); const f = eaAt(s, z, 0); return out(0xB0C0 | (d.reg << 9) | ((z === 'W' ? 0 : 4) << 6) | f, words); }
        if (mn === 'CMPI' || (s.k === '#' && d.k !== 'D')) { if (s.k !== '#') fail('Invalid addressing mode'); legal(d, DALT); const v = immVal(s, z); pushImm(v, z); const f = eaAt(d, z, words.length); return out(0x0C00 | (SIZEBITS[z] << 6) | f, words); }
        if (d.k !== 'D') fail('Invalid addressing mode'); legal(s, ALL); if (s.k === 'A' && z === 'B') fail('Invalid size code');
        const f = eaAt(s, z, 0); return out(0xB000 | (d.reg << 9) | (SIZEBITS[z] << 6) | f, words);
      }
      case 'CMPM': { need(2); if (ops[0].k !== 'P' || ops[1].k !== 'P') fail('Invalid addressing mode'); const z = sz('W'); return out(0xB108 | (ops[1].reg << 9) | (SIZEBITS[z] << 6) | ops[0].reg, []); }
      case 'AND': case 'OR': case 'ANDI': case 'ORI': {
        need(2); const [s, d] = ops; const z = sz('W'), isAnd = mn.startsWith('AND'), b = isAnd ? 0xC000 : 0x8000, ib = isAnd ? 0x0200 : 0x0000;
        if (d.k === 'CCR' || d.k === 'SR') { if (s.k !== '#') fail('Invalid addressing mode'); const v = val(s.expr).v; return out(ib | (d.k === 'CCR' ? 0x3C : 0x7C), [d.k === 'CCR' ? v & 0xFF : v & 0xFFFF]); }
        if (mn === 'ANDI' || mn === 'ORI' || (s.k === '#' && d.k !== 'D')) { if (s.k !== '#') fail('Invalid addressing mode'); legal(d, DALT); const v = immVal(s, z); pushImm(v, z); const f = eaAt(d, z, words.length); return out(ib | (SIZEBITS[z] << 6) | f, words); }
        if (d.k === 'D') { legal(s, DATA); const f = eaAt(s, z, 0); return out(b | (d.reg << 9) | (SIZEBITS[z] << 6) | f, words); }
        if (s.k === 'D') { legal(d, MALT); const f = eaAt(d, z, 0); return out(b | (s.reg << 9) | ((4 + SIZEBITS[z]) << 6) | f, words); }
        fail('Invalid addressing mode');
      }
      case 'EOR': case 'EORI': {
        need(2); const [s, d] = ops; const z = sz('W');
        if (d.k === 'CCR' || d.k === 'SR') { if (s.k !== '#') fail('Invalid addressing mode'); const v = val(s.expr).v; return out(0x0A00 | (d.k === 'CCR' ? 0x3C : 0x7C), [d.k === 'CCR' ? v & 0xFF : v & 0xFFFF]); }
        if (s.k === '#') { legal(d, DALT); const v = immVal(s, z); pushImm(v, z); const f = eaAt(d, z, words.length); return out(0x0A00 | (SIZEBITS[z] << 6) | f, words); }
        if (mn === 'EORI' || s.k !== 'D') fail('Invalid addressing mode');
        legal(d, DALT); const f = eaAt(d, z, 0); return out(0xB100 | (s.reg << 9) | (SIZEBITS[z] << 6) | f, words);
      }
      case 'MULU': case 'MULS': case 'DIVU': case 'DIVS': {
        need(2); if (ops[1].k !== 'D') fail('Invalid addressing mode'); legal(ops[0], DATA);
        if (size && size !== 'W') fail('Invalid size code');
        const f = eaAt(ops[0], 'W', 0); const b = { MULU: 0xC0C0, MULS: 0xC1C0, DIVU: 0x80C0, DIVS: 0x81C0 }[mn];
        return out(b | (ops[1].reg << 9) | f, words);
      }
      case 'ASL': case 'ASR': case 'LSL': case 'LSR': case 'ROL': case 'ROR': case 'ROXL': case 'ROXR': {
        const type = { AS: 0, LS: 1, ROX: 2, RO: 3 }[mn.slice(0, -1)], left = mn.endsWith('L') ? 1 : 0;
        if (ops.length === 1) { // memory shift
          legal(ops[0], MALT); if (size && size !== 'W') fail('Invalid size code'); const f = eaAt(ops[0], 'W', 0);
          return out(0xE0C0 | (type << 9) | (left << 8) | f, words);
        }
        need(2); const z = sz('W'); const [c, d] = ops; if (d.k !== 'D') fail('Invalid addressing mode');
        if (c.k === 'D') return out(0xE020 | (c.reg << 9) | (left << 8) | (SIZEBITS[z] << 6) | (type << 3) | d.reg, []);
        if (c.k === '#') { const r = val(c.expr); if (!r.undef && (r.v < 1 || r.v > 8)) fail('Invalid constant shift count'); return out(0xE000 | ((r.v & 7) << 9) | (left << 8) | (SIZEBITS[z] << 6) | (type << 3) | d.reg, []); }
        fail('Invalid addressing mode');
      }
      case 'BTST': case 'BCHG': case 'BCLR': case 'BSET': {
        need(2); const t = { BTST: 0, BCHG: 1, BCLR: 2, BSET: 3 }[mn], [b, d] = ops;
        if (d.k === 'D') { if (size && size !== 'L') fail('Invalid size code'); } else if (size && size !== 'B') fail('Invalid size code');
        const eaSet = mn === 'BTST' ? 'DIPMRXWLCY#' : DALT;
        if (b.k === 'D') { legal(d, eaSet); if (d.k === '#' && mn !== 'BTST') fail('Invalid addressing mode'); const f = eaAt(d, 'B', 0); return out(0x0100 | (b.reg << 9) | (t << 6) | f, words); }
        if (b.k === '#') { legal(d, mn === 'BTST' ? 'DIPMRXWLCY' : DALT); const n = val(b.expr).v; words.push(n & 0xFF); const f = eaAt(d, 'B', 1); return out(0x0800 | (t << 6) | f, words); }
        fail('Invalid addressing mode');
      }
      case 'MOVEP': {
        need(2); const z = sz('W'); if (z === 'B') fail('Invalid size code');
        if (ops[0].k === 'D' && ops[1].k === 'R') return out(0x0188 | (ops[0].reg << 9) | ((z === 'L' ? 1 : 0) << 6) | ops[1].reg, [val(ops[1].expr).v & 0xFFFF]);
        if (ops[0].k === 'R' && ops[1].k === 'D') return out(0x0108 | (ops[1].reg << 9) | ((z === 'L' ? 1 : 0) << 6) | ops[0].reg, [val(ops[0].expr).v & 0xFFFF]);
        if (ops[0].k === 'I' && ops[1].k === 'D') return out(0x0108 | (ops[1].reg << 9) | ((z === 'L' ? 1 : 0) << 6) | ops[0].reg, [0]);
        if (ops[0].k === 'D' && ops[1].k === 'I') return out(0x0188 | (ops[0].reg << 9) | ((z === 'L' ? 1 : 0) << 6) | ops[1].reg, [0]);
        fail('Invalid addressing mode');
      }
      case 'MOVEM': {
        need(2); const z = sz('W'); if (z === 'B') fail('Invalid size code');
        const listA = ops[0].k === 'D' || ops[0].k === 'A' ? ctx.regList(opTexts[0]) : ops[0].k === 'ABS' ? ctx.regList(opTexts[0]) : null;
        const listB = ops[1].k === 'D' || ops[1].k === 'A' ? ctx.regList(opTexts[1]) : ops[1].k === 'ABS' ? ctx.regList(opTexts[1]) : null;
        const longbit = z === 'L' ? 0x40 : 0;
        if (listA != null && listB == null) { // regs -> memory
          const d = ops[1]; legal(d, 'IMRXWL'); const mask = d.k === 'M' ? bitrev16(listA) : listA;
          words.push(mask); const f = eaAt(d, z, 1); return out(0x4880 | longbit | f, words);
        }
        if (listB != null && listA == null) { // memory -> regs
          const s = ops[0]; legal(s, 'IPRXWLCY'); words.push(listB); const f = eaAt(s, z, 1); return out(0x4C80 | longbit | f, words);
        }
        if (listA != null && listB != null) fail('Invalid addressing mode');
        fail('Invalid register list');
      }
      case 'MOVEA': {
        need(2); const z = sz('W'); if (z === 'B') fail('Invalid size code'); if (ops[1].k !== 'A') fail('Invalid addressing mode'); legal(ops[0], ALL);
        const f = eaAt(ops[0], z, 0); return out((z === 'W' ? 0x3000 : 0x2000) | (ops[1].reg << 9) | 0x40 | f, words);
      }
      case 'MOVE': {
        need(2); const [s, d] = ops;
        if (d.k === 'SR') { legal(s, DATA); const f = eaAt(s, 'W', 0); return out(0x46C0 | f, words); }
        if (d.k === 'CCR') { legal(s, DATA); const f = eaAt(s, 'W', 0); return out(0x44C0 | f, words); }
        if (s.k === 'SR') { legal(d, DALT); const f = eaAt(d, 'W', 0); return out(0x40C0 | f, words); }
        if (s.k === 'USP' && d.k === 'A') return out(0x4E68 | d.reg, []);
        if (d.k === 'USP' && s.k === 'A') return out(0x4E60 | s.reg, []);
        const z = sz('W');
        if (d.k === 'A') { // -> MOVEA
          if (z === 'B') fail('Invalid size code'); legal(s, ALL); const f = eaAt(s, z, 0);
          return out((z === 'W' ? 0x3000 : 0x2000) | (d.reg << 9) | 0x40 | f, words);
        }
        if (z === 'L' && s.k === '#' && d.k === 'D') { const r = val(s.expr); if (!r.undef && ctx.choice('moveq', () => (r.v >= -128 && r.v <= 127 ? 'Q' : 'M')) === 'Q' && r.v >= -128 && r.v <= 127) return out(0x7000 | (d.reg << 9) | (r.v & 0xFF), []); }
        if (z === 'B' && s.k === 'A') fail('Invalid size code');
        legal(s, ALL); legal(d, DALT);
        const sf = eaAt(s, z, 0); const lead = words.length; const df = eaAt(d, z, lead);
        const sc = z === 'B' ? 1 : z === 'W' ? 3 : 2;
        return out((sc << 12) | ((df & 7) << 9) | ((df >> 3) << 6) | sf, words);
      }
      case 'DBRA': case 'DBF': case 'DBT': case 'DBHI': case 'DBLS': case 'DBCC': case 'DBHS': case 'DBCS': case 'DBLO': case 'DBNE': case 'DBEQ': case 'DBVC': case 'DBVS': case 'DBPL': case 'DBMI': case 'DBGE': case 'DBLT': case 'DBGT': case 'DBLE': {
        need(2); if (ops[0].k !== 'D') fail('Invalid addressing mode');
        const cc = mn === 'DBRA' ? 1 : CC[mn.slice(2)]; const t = val(ops[1].expr);
        const d = t.v - (ctx.pc + 2); if (!t.undef && (d < -32768 || d > 32767)) fail('Branch out of range');
        return out(0x50C8 | (cc << 8) | ops[0].reg, [d & 0xFFFF]);
      }
    }
    // Scc
    if (/^S(T|F|HI|LS|CC|HS|CS|LO|NE|EQ|VC|VS|PL|MI|GE|LT|GT|LE)$/.test(mn) && CC[mn.slice(1)] !== undefined) {
      need(1); legal(ops[0], DALT); const f = eaAt(ops[0], 'B', 0); return out(0x50C0 | (CC[mn.slice(1)] << 8) | f, words);
    }
    // branches
    if (mn === 'BRA' || mn === 'BSR' || (mn[0] === 'B' && CC[mn.slice(1)] !== undefined && mn !== 'BT' + 'x')) {
      need(1);
      const cc = mn === 'BRA' ? 0 : mn === 'BSR' ? 1 : CC[mn.slice(1)];
      const t = val(ops[0].expr), d = t.v - (ctx.pc + 2);
      let form = size === 'S' || size === 'B' ? 'S' : (size === 'W' || size === 'L') ? 'W' : ctx.choice('br', () => (!t.undef && d >= -128 && d <= 127 && d !== 0) ? 'S' : 'W');
      if (form === 'S') {
        if (!t.undef && (d < -128 || d > 127 || d === 0)) fail('Branch instruction displacement is out of range or invalid');
        return out(0x6000 | (cc << 8) | (d & 0xFF), []);
      }
      if (!t.undef && (d < -32768 || d > 32767)) fail('Branch instruction displacement is out of range or invalid');
      return out(0x6000 | (cc << 8), [d & 0xFFFF]);
    }
    fail('Unknown instruction ' + mn);
  }

  /* ---------------- driver ---------------- */
  const DIRECTIVES = new Set(['ORG', 'EQU', 'SET', 'DC', 'DS', 'DCB', 'END', 'REG', 'OPT', 'LIST', 'NOLIST', 'PAGE', 'TTL', 'SECTION', 'MACRO', 'ENDM', 'MEXIT', 'IFEQ', 'IFNE', 'IFLT', 'IFLE', 'IFGT', 'IFGE', 'IFC', 'IFNC', 'IFDEF', 'IFNDEF', 'ENDC', 'ELSE', 'FAIL', 'SPC', 'INCLUDE', 'INCBIN', 'OFFSET', 'MEMORY', 'CNOP', 'EVEN']);

  function splitLine(raw) {
    if (/^\s*$/.test(raw) || /^[*]/.test(raw)) return null;
    let label = null, rest = raw;
    if (/^\S/.test(raw)) { const m = /^(\S+)(.*)$/.exec(raw); label = m[1].replace(/:$/, ''); rest = m[2]; }
    rest = rest.replace(/^\s+/, '');
    if (!rest || rest[0] === ';') return { label, mn: '', size: null, ops: '', raw };
    const m = /^([A-Za-z_][A-Za-z0-9_]*)(?:\.([A-Za-z]))?(.*)$/.exec(rest);
    if (!m) fail('Syntax error');
    let tail = m[3], ops = '', i = 0, q = false, depth = 0;
    if (tail && !/^\s/.test(tail)) fail('Invalid opcode or size');
    tail = tail.replace(/^\s+/, '');
    for (; i < tail.length; i++) {
      const ch = tail[i];
      if (ch === "'") q = !q;
      if (!q) {
        if (ch === '(') depth++; else if (ch === ')') depth--;
        else if (ch === ';') break;
        else if (/\s/.test(ch)) { const prev = ops.trimEnd().slice(-1); const nxt = tail.slice(i).trimStart()[0]; if (depth <= 0 && prev !== ',' && nxt !== ',') break; }
      }
      ops += ch;
    }
    return { label, mn: m[1].toUpperCase(), size: m[2] ? m[2].toUpperCase() : null, ops: ops.trim(), raw };
  }

  function expandMacros(src, errors) {
    const lines = src.replace(/\r/g, '').split('\n'); const out = []; const macros = {}; let uniq = 0;
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i]; const mm = /^(\S+)\s+MACRO\b/i.exec(L) || /^\s+MACRO\s+(\S+)/i.exec(L);
      if (mm) {
        const name = mm[1].replace(/:$/, '').toUpperCase(), body = []; let j = i + 1;
        while (j < lines.length && !/^\s*\S*\s+ENDM\b/i.test(lines[j]) && !/^\s+ENDM\b/i.test(lines[j])) body.push(lines[j++]);
        macros[name] = body; out.push({ n: i + 1, text: L, macroDef: true }); for (let k = i + 1; k <= j; k++) out.push({ n: k + 1, text: lines[k] || '', macroDef: true });
        i = j; continue;
      }
      out.push({ n: i + 1, text: L });
    }
    function expand(items, depth) {
      const res = [];
      for (const it of items) {
        if (it.macroDef || depth > 20) { res.push(it); continue; }
        let sl; try { sl = splitLine(it.text); } catch (e) { res.push(it); continue; }
        if (sl && sl.mn && macros[sl.mn]) {
          const args = sl.ops ? splitTop(sl.ops) : []; const id = ++uniq;
          const body = macros[sl.mn].map((b) => b.replace(/\\(\d|@)/g, (_, d) => (d === '@' ? String(id).padStart(3, '0') : (args[+d - 1] || ''))).replace(/\bNARG\b/gi, String(args.length)));
          res.push({ n: it.n, text: it.text, macroCall: true, label: sl.label });
          res.push(...expand(body.map((t) => ({ n: it.n, text: t, fromMacro: true })), depth + 1));
          continue;
        }
        res.push(it);
      }
      return res;
    }
    return expand(out, 0);
  }

  function assemble(src, opts) {
    opts = opts || {};
    const items = expandMacros(src);
    const syms = {}, errors = [], warnings = [];
    const choices = new Map(); // persistent per-(line,slot) size decisions from pass 1
    let image = null, listing = null, start = null, entryExpr = null, loc = 0, pass = 1;

    function run(passNo) {
      pass = passNo; loc = 0; image = []; listing = []; let cur = null; let ifStack = []; let ended = false; let slot = 0;
      const active = () => ifStack.every((x) => x.on);
      const emit = (bytes) => {
        if (pass !== 2) return;
        if (!cur || cur.addr + cur.bytes.length !== loc) { cur = { addr: loc, bytes: [] }; image.push(cur); }
        for (const b of bytes) cur.bytes.push(b & 0xFF);
      };
      const lookup = (name) => { const v = syms[name.toUpperCase()]; return typeof v === 'number' ? v : (pass === 2 && v === undefined ? undefined : v === undefined ? undefined : undefined); };
      for (let li = 0; li < items.length; li++) {
        const it = items[li]; const n = it.n; slot = 0;
        const entry = { n, text: it.text, addr: null, bytes: [], macro: !!it.fromMacro };
        listing.push(entry);
        if (ended || it.macroDef) continue;
        const ctxBase = {
          get loc() { return loc; },
          lookup,
          eval(expr) { return evalExpr(expr, { loc, lookup }); },
          choice(kind, decide) { const key = li + ':' + (slot++) + kind; if (pass === 1) { const v = decide(); choices.set(key, v); return v; } return choices.has(key) ? choices.get(key) : decide(); },
          regList(t) { return parseRegList(t, syms); },
        };
        try {
          const sl = splitLine(it.text);
          if (!sl) continue;
          const mn = sl.mn;
          // conditional assembly
          if (/^IF/.test(mn) && DIRECTIVES.has(mn)) {
            let on = false;
            if (active()) {
              if (mn === 'IFC' || mn === 'IFNC') { const [a, b] = splitTop(sl.ops).map((x) => x.replace(/^'|'$/g, '')); on = (a === b) === (mn === 'IFC'); }
              else if (mn === 'IFDEF' || mn === 'IFNDEF') { on = (syms[sl.ops.trim().toUpperCase()] !== undefined) === (mn === 'IFDEF'); }
              else { const v = ctxBase.eval(sl.ops).v; on = { IFEQ: v === 0, IFNE: v !== 0, IFLT: v < 0, IFLE: v <= 0, IFGT: v > 0, IFGE: v >= 0 }[mn]; }
            }
            ifStack.push({ on, parent: active(), done: on });
            entry.flag = on ? '' : 'FALSE'; continue;
          }
          if (mn === 'ELSE') { const top = ifStack[ifStack.length - 1]; if (!top) fail('ELSE without IF'); top.on = top.parent && !top.done; top.done = true; continue; }
          if (mn === 'ENDC') { if (!ifStack.length) fail('ENDC without IF'); ifStack.pop(); continue; }
          if (!active()) { entry.flag = 'FALSE'; continue; }
          if (it.macroCall) continue;

          const defLabel = (value, isSet) => {
            if (!sl.label) return;
            const key = sl.label.toUpperCase();
            if (pass === 1 && syms[key] !== undefined && !isSet && !it.fromMacro) fail('Duplicate label: ' + sl.label);
            if (pass === 2 && syms[key] !== undefined && syms[key] !== value && !isSet && typeof value === 'number') errors.push({ line: n, msg: `Phase error: ${sl.label} moved between passes` });
            syms[key] = value;
          };
          if (mn === 'EQU' || mn === 'SET') { const r = ctxBase.eval(sl.ops); if (r.undef && pass === 2) fail('Undefined symbol: ' + [...new Set(r.names)].join(', ')); defLabel(r.v, mn === 'SET'); entry.value = r.v; continue; }
          if (mn === 'REG') { defLabel(sl.ops.trim(), false); continue; }
          if (mn === 'ORG') { const r = ctxBase.eval(sl.ops); if (r.undef) fail('ORG needs a defined value'); loc = u32(r.v); defLabel(loc, false); entry.addr = loc; continue; }
          if (mn === 'END') { if (sl.ops) entryExpr = sl.ops; ended = true; entry.addr = loc; continue; }
          if (['OPT', 'LIST', 'NOLIST', 'PAGE', 'TTL', 'SECTION', 'SPC', 'MEMORY', 'FAIL'].includes(mn)) { defLabel(loc, false); continue; }
          if (mn === 'EVEN') { if (loc & 1) loc++; defLabel(loc, false); continue; }
          if (mn === 'INCLUDE' || mn === 'INCBIN') fail(mn + ' is not supported in the browser');

          if (mn === 'DC' || mn === 'DS' || mn === 'DCB') {
            const size = sl.size || 'W'; if (!SIZEBYTES[size]) fail('Invalid size code');
            const u = SIZEBYTES[size]; if (u > 1 && (loc & 1)) loc++;
            defLabel(loc, false); entry.addr = loc;
            const parts = splitTop(sl.ops);
            if (mn === 'DC') {
              const bytes = [];
              const putv = (v) => { for (let b = u - 1; b >= 0; b--) bytes.push((v >>> (8 * b)) & 0xFF); };
              for (const p of parts) {
                const sm = /^'((?:[^']|'')*)'$/.exec(p);
                if (sm) { const chars = [...sm[1].replace(/''/g, "'")].map((c) => c.charCodeAt(0));
                  if (size === 'B') bytes.push(...chars); else { let acc = 0, cnt = 0; for (const c of chars) { acc = ((acc << 8) | c) >>> 0; if (++cnt === u) { putv(acc); acc = 0; cnt = 0; } } if (cnt) { acc = (acc << (8 * (u - cnt))) >>> 0; putv(acc); } } }
                else { const r = ctxBase.eval(p); if (r.undef && pass === 2) fail('Undefined symbol: ' + [...new Set(r.names)].join(', ')); putv(r.v >>> 0); }
              }
              entry.bytes = bytes; emit(bytes); loc += bytes.length;
            } else if (mn === 'DS') {
              const r = ctxBase.eval(parts[0]); if (r.undef && pass === 2) fail('Undefined symbol: ' + [...new Set(r.names)].join(', ')); if (r.v < 0) fail('DS size cannot be negative');
              loc += r.v * u;
            } else {
              const c = ctxBase.eval(parts[0]).v, v = ctxBase.eval(parts[1] || '0').v; if (c < 0) fail('DCB count cannot be negative');
              const bytes = []; for (let k = 0; k < c; k++) for (let b = u - 1; b >= 0; b--) bytes.push((v >>> (8 * b)) & 0xFF);
              entry.bytes = bytes.slice(0, 16); emit(bytes); loc += bytes.length;
            }
            continue;
          }
          if (DIRECTIVES.has(mn) && !['ORG'].includes(mn)) { defLabel(loc, false); continue; }

          if (!mn) { if (loc & 1) loc++; defLabel(loc, false); entry.addr = loc; continue; }
          // instruction
          if (loc & 1) loc++;
          defLabel(loc, false); entry.addr = loc;
          const ctx = Object.assign(Object.create(null), ctxBase, { pc: loc, loc });
          const opTexts = sl.ops ? splitTop(sl.ops) : [];
          const r = encodeInst(mn, sl.size, opTexts, ctx);
          if (pass === 2 && r.undef) fail('Undefined symbol: ' + [...new Set(r.names)].join(', '));
          const bytes = []; for (const w of r.words) bytes.push((w >> 8) & 0xFF, w & 0xFF);
          entry.words = r.words; entry.bytes = bytes; emit(bytes);
          if (pass === 1) entry.len = bytes.length; else if (entry.len !== undefined && false) { /* noop */ }
          loc += bytes.length;
        } catch (e) {
          if (!e.asm) throw e;
          if (pass === 2 || !/Undefined/.test(e.message)) errors.push({ line: n, msg: e.message });
        }
      }
    }
    run(1);
    // symbols defined on pass 1 stay; drop pass-1 errors that pass 2 would repeat
    const p1 = errors.splice(0);
    const seen = new Set();
    run(2);
    const all = p1.concat(errors.splice(0)).filter((e) => { const k = e.line + e.msg; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.line - b.line);
    let st = null;
    if (entryExpr) { try { st = u32(evalExpr(entryExpr, { loc: 0, lookup: (nm) => (typeof syms[nm.toUpperCase()] === 'number' ? syms[nm.toUpperCase()] : undefined) }).v); } catch (e) { all.push({ line: 0, msg: 'END start address: ' + e.message }); } }
    if (st == null) { const first = listing.find((l) => l.addr != null && l.words); st = first ? first.addr : (image[0] ? image[0].addr : 0); }
    const symbols = {}; for (const [k, v] of Object.entries(syms)) if (typeof v === 'number') symbols[k] = v >>> 0;
    const instAddrs = new Map(); listing.forEach((l) => { if (l.words && l.addr != null) instAddrs.set(l.addr, l.n); });
    return { ok: all.length === 0, errors: all, image, listing, symbols, start: st, instAddrs, text: formatListing(listing, symbols, all, st) };
  }

  function formatListing(listing, symbols, errors, start) {
    const lines = [`${hex(start, 8)} Starting Address`, ''];
    const errAt = new Map(); errors.forEach((e) => { if (!errAt.has(e.line)) errAt.set(e.line, []); errAt.get(e.line).push(e.msg); });
    for (const l of listing) {
      (errAt.get(l.n) || []).forEach((m) => lines.push(`Line ${l.n} ERROR: ${m}`));
      let addr = l.addr != null ? hex(l.addr, 8) : '        ';
      let bytes = '';
      if (l.words) bytes = l.words.map((w, i) => (i === 0 || true ? hex(w, 4) : '')).join(' ');
      else if (l.bytes.length) bytes = '= ' + l.bytes.map((b) => hex(b, 2)).join(' ');
      lines.push(`${addr}  ${bytes.padEnd(22)} ${String(l.n).padStart(4)}  ${l.text}`);
    }
    lines.push('', errors.length ? `${errors.length} errors detected` : 'No errors detected', '', 'SYMBOL TABLE INFORMATION', 'Symbol-name         Value', '-------------------------');
    Object.keys(symbols).sort().forEach((k) => lines.push(`${k.padEnd(20)}${hex(symbols[k], 1)}`));
    return lines.join('\n');
  }

  function toSrec(result, name) {
    const out = [];
    const rec = (type, addr, addrBytes, data) => {
      const bytes = []; for (let i = addrBytes - 1; i >= 0; i--) bytes.push((addr >>> (8 * i)) & 0xFF);
      bytes.push(...data); const cnt = bytes.length + 1; let sum = cnt; bytes.forEach((b) => (sum += b));
      return type + hex(cnt, 2) + bytes.map((b) => hex(b, 2)).join('') + hex(~sum & 0xFF, 2);
    };
    out.push(rec('S0', 0, 2, [...(name || 'PROG')].map((c) => c.charCodeAt(0))));
    for (const seg of result.image) for (let i = 0; i < seg.bytes.length; i += 32) out.push(rec('S2', seg.addr + i, 3, seg.bytes.slice(i, i + 32)));
    out.push(rec('S8', result.start, 3, []));
    return out.join('\n') + '\n';
  }

  const api = { assemble, evalExpr, toSrec, parseOp, splitTop };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Asm68K = api;
})(typeof window !== 'undefined' ? window : globalThis);
