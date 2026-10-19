/* A two-pass Z80 assembler that follows the Oshonsoft Z80 Simulator IDE source conventions:
   labels with or without a colon, directives with or without a leading period (ORG EQU DB/DEFB/BYTE DW/DEFW/WORD DS/DEFS/BLOCK END, = for EQU),
   hex as 0FFH / 0xFF / $FF, binary as 1010b / %1010 / 0b1010, decimal, 'c' characters, [..] or (..) for memory operands,
   $ for the current address, ; comments.  Encodings written from the Zilog Z80 CPU User Manual (UM0080). */
(function (root) {
  'use strict';
  const R8 = { B: 0, C: 1, D: 2, E: 3, H: 4, L: 5, A: 7 };
  const R8X = { IXH: [0xDD, 4], IXL: [0xDD, 5], IYH: [0xFD, 4], IYL: [0xFD, 5], XH: [0xDD, 4], XL: [0xDD, 5], YH: [0xFD, 4], YL: [0xFD, 5], HX: [0xDD, 4], LX: [0xDD, 5], HY: [0xFD, 4], LY: [0xFD, 5] };
  const R16 = { BC: 0, DE: 1, HL: 2, SP: 3, AF: 3 };
  const CC = { NZ: 0, Z: 1, NC: 2, C: 3, PO: 4, PE: 5, P: 6, M: 7 };
  const ALU = { ADD: 0, ADC: 1, SUB: 2, SBC: 3, AND: 4, XOR: 5, OR: 6, CP: 7 };
  const ROT = { RLC: 0, RRC: 1, RL: 2, RR: 3, SLA: 4, SRA: 5, SLL: 6, SLI: 6, SRL: 7 };
  const SIMPLE = {
    NOP: [0x00], HALT: [0x76], DI: [0xF3], EI: [0xFB], EXX: [0xD9], DAA: [0x27], CPL: [0x2F], CCF: [0x3F], SCF: [0x37],
    RLCA: [0x07], RRCA: [0x0F], RLA: [0x17], RRA: [0x1F], NEG: [0xED, 0x44], RETI: [0xED, 0x4D], RETN: [0xED, 0x45],
    RLD: [0xED, 0x6F], RRD: [0xED, 0x67], LDI: [0xED, 0xA0], LDD: [0xED, 0xA8], LDIR: [0xED, 0xB0], LDDR: [0xED, 0xB8],
    CPI: [0xED, 0xA1], CPD: [0xED, 0xA9], CPIR: [0xED, 0xB1], CPDR: [0xED, 0xB9], INI: [0xED, 0xA2], IND: [0xED, 0xAA],
    INIR: [0xED, 0xB2], INDR: [0xED, 0xBA], OUTI: [0xED, 0xA3], OUTD: [0xED, 0xAB], OTIR: [0xED, 0xB3], OTDR: [0xED, 0xBB],
  };
  const MNEMONICS = new Set(['LD', 'PUSH', 'POP', 'EX', 'ADD', 'ADC', 'SUB', 'SBC', 'AND', 'XOR', 'OR', 'CP', 'INC', 'DEC', 'IM', 'JP', 'JR', 'DJNZ',
    'CALL', 'RET', 'RST', 'IN', 'OUT', 'BIT', 'RES', 'SET', ...Object.keys(ROT), ...Object.keys(SIMPLE)]);
  const DIRECTIVES = new Set(['ORG', 'EQU', 'DB', 'DEFB', 'BYTE', 'DW', 'DEFW', 'WORD', 'DS', 'DEFS', 'BLOCK', 'END', 'INCLUDE']);

  class AsmError extends Error {}
  const err = (m) => { throw new AsmError(m); };

  /* ---------- expressions ---------- */
  function parseNumberToken(tok) {
    const t = tok.toUpperCase();
    let m;
    if ((m = /^0X([0-9A-F]+)$/.exec(t))) return parseInt(m[1], 16);
    if ((m = /^0B([01]+)$/.exec(t)) && !/H$/.test(t)) return parseInt(m[1], 2);
    if ((m = /^([0-9][0-9A-F]*)H$/.exec(t))) return parseInt(m[1], 16);
    if ((m = /^([01]+)B$/.exec(t))) return parseInt(m[1], 2);
    if ((m = /^([0-9]+)D?$/.exec(t))) return parseInt(m[1], 10);
    return null;
  }

  function tokenize(s) {
    const out = []; let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === "'" || ch === '"') {
        let j = i + 1; while (j < s.length && s[j] !== ch) j++;
        if (j >= s.length) err('Unterminated character constant');
        out.push({ t: 'str', v: s.slice(i + 1, j) }); i = j + 1; continue;
      }
      if (ch === '#' ) { i++; continue; }                               // optional # on numeric constants
      let m;
      const rest = s.slice(i);
      if ((m = /^[Hh]'([0-9A-Fa-f]+)'/.exec(rest))) { out.push({ t: 'num', v: parseInt(m[1], 16) }); i += m[0].length; continue; }
      if ((m = /^[Bb]'([01]+)'/.exec(rest))) { out.push({ t: 'num', v: parseInt(m[1], 2) }); i += m[0].length; continue; }
      if ((m = /^[Dd]'([0-9]+)'/.exec(rest))) { out.push({ t: 'num', v: parseInt(m[1], 10) }); i += m[0].length; continue; }
      if ((m = /^[Aa]'(.)'/.exec(rest))) { out.push({ t: 'num', v: m[1].charCodeAt(0) }); i += m[0].length; continue; }
      if ((m = /^&[Hh]([0-9A-Fa-f]+)/.exec(rest))) { out.push({ t: 'num', v: parseInt(m[1], 16) }); i += m[0].length; continue; }
      if ((m = /^&([0-9A-Fa-f]+)/.exec(rest)) && (out.length === 0 || out[out.length - 1].t === 'op')) { out.push({ t: 'num', v: parseInt(m[1], 16) }); i += m[0].length; continue; }
      if ((m = /^\$([0-9A-Fa-f]+)/.exec(rest))) { out.push({ t: 'num', v: parseInt(m[1], 16) }); i += m[0].length; continue; }
      if ((m = /^%([01]+)/.exec(rest)) && (out.length === 0 || out[out.length - 1].t === 'op')) { out.push({ t: 'num', v: parseInt(m[1], 2) }); i += m[0].length; continue; }
      if ((m = /^\.([0-9]+)/.exec(rest)) && (out.length === 0 || out[out.length - 1].t === 'op')) { out.push({ t: 'num', v: parseInt(m[1], 10) }); i += m[0].length; continue; }
      if ((m = /^[0-9][0-9A-Za-z_]*/.exec(rest))) {
        const v = parseNumberToken(m[0]); if (v === null) err('Bad number "' + m[0] + '"');
        out.push({ t: 'num', v }); i += m[0].length; continue;
      }
      if ((m = /^[A-Za-z_?@][A-Za-z0-9_?@']*/.exec(rest))) {
        // a trailing apostrophe belongs only to AF'
        let w = m[0]; if (w.endsWith("'") && w.toUpperCase() !== "AF'") w = w.slice(0, -1);
        out.push({ t: 'id', v: w }); i += w.length; continue;
      }
      if (ch === '$') { out.push({ t: 'id', v: '$' }); i++; continue; }
      if ((m = /^(<<|>>)/.exec(rest))) { out.push({ t: 'op', v: m[1] }); i += 2; continue; }
      if ('+-*/\\%&|^~()[]'.includes(ch) || ch === '<' || ch === '>') { out.push({ t: 'op', v: ch }); i++; continue; }
      err('Unexpected character "' + ch + '"');
    }
    return out;
  }

  // Evaluate an expression. ctx = { sym(name) -> number|undefined, pc }. Returns { v, unres }.
  function evalExpr(s, ctx) {
    const toks = tokenize(s); let pos = 0, unres = false, missing = null;
    const peek = () => toks[pos];
    const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
    function primary() {
      const t = toks[pos++];
      if (!t) err('Expression expected');
      if (t.t === 'num') return t.v;
      if (t.t === 'str') { if (t.v.length !== 1) err('Character constant must be one character'); return t.v.charCodeAt(0); }
      if (t.t === 'id') {
        if (t.v === '$' || t.v.toUpperCase() === 'PC') return ctx.pc;
        const v = ctx.sym(t.v);
        if (v === undefined) { unres = true; if (!missing) missing = t.v; return 0; }
        return v;
      }
      if (t.t === 'op' && (t.v === '(' || t.v === '[')) {
        const v = or(); const c = toks[pos++];
        if (!c || c.t !== 'op' || c.v !== (t.v === '(' ? ')' : ']')) err('Missing closing bracket');
        return v;
      }
      err('Unexpected "' + (t.v) + '" in expression');
    }
    function unary() {
      const t0 = peek();
      if (t0 && t0.t === 'id' && /^(HIGH|LOW|HIGHW|LOWW)$/i.test(t0.v)) {          // Oshonsoft prefixes: byte and word extraction
        pos++; const v = unary(), k = t0.v.toUpperCase();
        return k === 'HIGH' ? (v >> 8) & 0xFF : k === 'LOW' ? v & 0xFF : k === 'HIGHW' ? Math.floor(v / 65536) & 0xFFFF : v & 0xFFFF;
      }
      if (isOp('>')) { pos++; return (unary() >> 8) & 0xFF; }
      if (isOp('<')) { pos++; return unary() & 0xFF; }
      if (isOp('-')) { pos++; return -unary(); }
      if (isOp('+')) { pos++; return unary(); }
      if (isOp('~')) { pos++; return ~unary(); }
      return primary();
    }
    function mul() { let v = unary(); for (;;) { if (isOp('*')) { pos++; v *= unary(); } else if (isOp('/') || isOp('\\')) { pos++; const d = unary(); if (d === 0) { if (!unres) err('Division by zero'); v = 0; } else v = Math.trunc(v / d); } else if (isOp('%')) { pos++; const d = unary(); if (d === 0) { if (!unres) err('Division by zero'); v = 0; } else v %= d; } else return v; } }
    function add() { let v = mul(); for (;;) { if (isOp('+')) { pos++; v += mul(); } else if (isOp('-')) { pos++; v -= mul(); } else return v; } }
    function shift() { let v = add(); for (;;) { if (isOp('<<')) { pos++; v = v << add(); } else if (isOp('>>')) { pos++; v = v >> add(); } else return v; } }
    function and() { let v = shift(); while (isOp('&')) { pos++; v &= shift(); } return v; }
    function xor() { let v = and(); while (isOp('^')) { pos++; v ^= and(); } return v; }
    function or() { let v = xor(); while (isOp('|')) { pos++; v |= xor(); } return v; }
    const v = or();
    if (pos < toks.length) err('Unexpected "' + toks[pos].v + '" in expression');
    return { v, unres, missing };
  }

  /* ---------- operand classification ---------- */
  function splitTop(s) {
    const parts = []; let depth = 0, q = null, cur = '';
    for (const ch of s) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim() !== '' || parts.length) parts.push(cur.trim());
    return parts;
  }
  function stripComment(line) {
    let q = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === q) q = null; continue; }
      if (ch === "'" && /[A-Za-z]/.test(line[i - 1] || '') && (line[i - 1] + '').toUpperCase() === 'F') continue;   // AF'
      if (ch === "'" || ch === '"') { q = ch; continue; }
      if (ch === ';') return line.slice(0, i);
    }
    return line;
  }
  function wrapped(s) {                     // is the whole operand enclosed by one bracket pair?
    const o = s[0], c = s[s.length - 1];
    if (!((o === '(' && c === ')') || (o === '[' && c === ']'))) return false;
    let depth = 0, q = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === q) q = null; continue; }
      if (ch === "'" || ch === '"') { q = ch; continue; }
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') { depth--; if (depth === 0 && i < s.length - 1) return false; }
    }
    return depth === 0;
  }

  function classify(text, ev) {
    const s = text.trim(), u = s.toUpperCase();
    if (u === '') err('Missing operand');
    if (u in R8) return { k: 'r8', n: u, c: R8[u] };
    if (u in R8X) return { k: 'r8x', n: u, pfx: R8X[u][0], c: R8X[u][1] };
    if (u === 'I' || u === 'R') return { k: 'ir', n: u };
    if (u === "AF'") return { k: 'af2' };
    if (u === 'IX' || u === 'IY') return { k: 'r16', n: u, c: 2, pfx: u === 'IX' ? 0xDD : 0xFD };
    if (u in R16) return { k: 'r16', n: u, c: R16[u] };
    if (wrapped(s)) {
      const inner = s.slice(1, -1).trim(), iu = inner.toUpperCase();
      if (iu === 'HL' || iu === 'BC' || iu === 'DE' || iu === 'SP' || iu === 'C') return { k: 'ind', n: iu };
      let m = /^(IX|IY)\s*([+-].*)?$/.exec(iu);
      if (m) {
        const rest = inner.slice(2).trim();
        const d = rest === '' ? { v: 0, unres: false } : ev(rest);
        return { k: 'idx', n: m[1], pfx: m[1] === 'IX' ? 0xDD : 0xFD, d: d.v, unres: d.unres };
      }
      const e = ev(inner);
      return { k: 'mem', v: e.v, unres: e.unres };
    }
    const e = ev(s);
    return { k: 'imm', v: e.v, unres: e.unres };
  }

  /* ---------- encoding ---------- */
  // Encode one instruction. ev(expr) -> {v, unres}; pc = address of the instruction; final = last pass.
  function encode(mn, args, ev, pc, final) {
    const out = [];
    const emit = (...b) => { for (const x of b) out.push(x & 0xFF); };
    const need = (n) => { if (args.length !== n) err(mn + ' takes ' + n + ' operand' + (n === 1 ? '' : 's')); };
    const byte = (o) => { if (final && !o.unres && (o.v < -128 || o.v > 255)) err('Value ' + o.v + ' does not fit in a byte'); return o.v & 0xFF; };
    const word = (o) => { if (final && !o.unres && (o.v < -32768 || o.v > 65535)) err('Value ' + o.v + ' does not fit in 16 bits'); return o.v & 0xFFFF; };
    const disp = (o) => { if (final && !o.unres && (o.d < -128 || o.d > 127)) err('Index displacement ' + o.d + ' is outside -128..127'); return o.d & 0xFF; };
    const cls = (i) => classify(args[i], ev);
    const isReg = (o) => o.k === 'r8' || o.k === 'r8x';
    const ccOf = (txt) => { const u = txt.trim().toUpperCase(); return u in CC ? CC[u] : undefined; };
    // r/(HL)/(IX+d) operand in the low three bits; returns {code, pre:[bytes], tail:[bytes]}
    function regField(o, opName) {
      if (o.k === 'r8') return { code: o.c, pre: [], tail: [] };
      if (o.k === 'r8x') return { code: o.c, pre: [o.pfx], tail: [], half: true };
      if (o.k === 'ind' && o.n === 'HL') return { code: 6, pre: [], tail: [] };
      if (o.k === 'idx') return { code: 6, pre: [o.pfx], tail: [disp(o)] };
      err('Bad operand for ' + opName);
    }

    if (mn in SIMPLE) { need(0); emit(...SIMPLE[mn]); return out; }

    switch (mn) {
      case 'LD': {
        need(2);
        const d = cls(0), s = cls(1);
        // 8-bit register / memory destinations
        if (isReg(d) || (d.k === 'ind' && d.n === 'HL') || d.k === 'idx') {
          const dr = regField(d, 'LD');
          if (isReg(s) || (s.k === 'ind' && s.n === 'HL') || s.k === 'idx') {
            const sr = regField(s, 'LD');
            if (dr.code === 6 && sr.code === 6) err('LD (HL),(HL) is not an instruction (that code is HALT)');
            const mem = dr.code === 6 || sr.code === 6;
            const half = dr.half || sr.half;
            if (mem && half) err('Index halves cannot be combined with a memory operand');
            if (half && dr.pre.length && sr.pre.length && dr.pre[0] !== sr.pre[0]) err('Cannot mix IX and IY halves');
            if (half) {
              const dp = dr.half ? dr.pre[0] : 0, sp = sr.half ? sr.pre[0] : 0;
              if ((dr.half && !sr.half && (s.c === 4 || s.c === 5)) || (sr.half && !dr.half && (d.c === 4 || d.c === 5))) err('Cannot mix H/L with an index half');
              emit(dp || sp, 0x40 | (dr.code << 3) | sr.code); return out;
            }
            emit(...dr.pre, ...sr.pre, 0x40 | (dr.code << 3) | sr.code, ...dr.tail, ...sr.tail); return out;
          }
          if (s.k === 'imm') {
            emit(...dr.pre, 0x06 | (dr.code << 3), ...dr.tail, byte(s)); return out;
          }
          if (d.k === 'r8' && d.n === 'A') {
            if (s.k === 'ind' && s.n === 'BC') { emit(0x0A); return out; }
            if (s.k === 'ind' && s.n === 'DE') { emit(0x1A); return out; }
            if (s.k === 'mem') { emit(0x3A, word(s) & 0xFF, word(s) >> 8); return out; }
            if (s.k === 'ir') { emit(0xED, s.n === 'I' ? 0x57 : 0x5F); return out; }
          }
          err('Bad operands for LD');
        }
        if (d.k === 'ir') { if (!(s.k === 'r8' && s.n === 'A')) err('LD ' + d.n + ',A is the only form'); emit(0xED, d.n === 'I' ? 0x47 : 0x4F); return out; }
        if (d.k === 'ind' && (d.n === 'BC' || d.n === 'DE')) {
          if (!(s.k === 'r8' && s.n === 'A')) err('Only A can be stored through (' + d.n + ')');
          emit(d.n === 'BC' ? 0x02 : 0x12); return out;
        }
        if (d.k === 'mem') {
          const a = word(d);
          if (s.k === 'r8' && s.n === 'A') { emit(0x32, a & 0xFF, a >> 8); return out; }
          if (s.k === 'r16' && s.n === 'HL') { emit(0x22, a & 0xFF, a >> 8); return out; }
          if (s.k === 'r16' && s.pfx) { emit(s.pfx, 0x22, a & 0xFF, a >> 8); return out; }
          if (s.k === 'r16' && s.n !== 'AF') { emit(0xED, 0x43 | (s.c << 4), a & 0xFF, a >> 8); return out; }
          err('Bad source for LD (nn),...');
        }
        if (d.k === 'r16' && d.n !== 'AF') {
          if (d.n === 'SP' && s.k === 'r16' && (s.n === 'HL' || s.pfx)) { emit(...(s.pfx ? [s.pfx] : []), 0xF9); return out; }
          if (s.k === 'imm') { const w = word(s); emit(...(d.pfx ? [d.pfx] : []), 0x01 | (d.c << 4), w & 0xFF, w >> 8); return out; }
          if (s.k === 'mem') {
            const a = word(s);
            if (d.n === 'HL') emit(0x2A, a & 0xFF, a >> 8);
            else if (d.pfx) emit(d.pfx, 0x2A, a & 0xFF, a >> 8);
            else emit(0xED, 0x4B | (d.c << 4), a & 0xFF, a >> 8);
            return out;
          }
        }
        err('Bad operands for LD');
        break;
      }
      case 'PUSH': case 'POP': {
        need(1); const o = cls(0);
        if (o.k !== 'r16' || o.n === 'SP') err(mn + ' takes BC, DE, HL, AF, IX or IY');
        emit(...(o.pfx ? [o.pfx] : []), (mn === 'PUSH' ? 0xC5 : 0xC1) | (o.c << 4)); return out;
      }
      case 'EX': {
        need(2); const a = cls(0), b = cls(1);
        if (a.k === 'r16' && a.n === 'DE' && b.k === 'r16' && b.n === 'HL') { emit(0xEB); return out; }
        if (a.k === 'r16' && a.n === 'AF' && b.k === 'af2') { emit(0x08); return out; }
        if (a.k === 'ind' && a.n === 'SP' && b.k === 'r16' && (b.n === 'HL' || b.pfx)) { emit(...(b.pfx ? [b.pfx] : []), 0xE3); return out; }
        err('Bad operands for EX');
        break;
      }
      case 'ADD': case 'ADC': case 'SBC': case 'SUB': case 'AND': case 'XOR': case 'OR': case 'CP': {
        const op = ALU[mn];
        if (args.length === 2) {
          const a = cls(0);
          if (a.k === 'r16' && (mn === 'ADD' || mn === 'ADC' || mn === 'SBC')) {
            const b = cls(1);
            if (b.k !== 'r16' || b.n === 'AF') err('Bad operand for ' + mn + ' ' + a.n);
            if (mn === 'ADD') {
              if (a.n === 'SP') err('ADD SP,... is not an instruction');
              if (a.n !== 'HL' && !a.pfx) err('16-bit ADD needs HL, IX or IY as its destination');
              if (a.n === 'HL' && b.pfx) err('ADD HL cannot take IX or IY');
              if (a.pfx && b.pfx && a.n !== b.n) err('Cannot add ' + b.n + ' to ' + a.n);
              if (a.pfx && (b.n === 'HL')) err('ADD ' + a.n + ',HL is not an instruction');
              const code = a.pfx && b.pfx ? 2 : b.c;
              emit(...(a.pfx ? [a.pfx] : []), 0x09 | (code << 4)); return out;
            }
            if (a.n !== 'HL' || b.pfx) err(mn + ' HL,rr takes BC, DE, HL or SP');
            emit(0xED, (mn === 'ADC' ? 0x4A : 0x42) | (b.c << 4)); return out;
          }
          if (!(a.k === 'r8' && a.n === 'A')) err(mn + ' needs A as its first operand');
        } else need(1);
        const s = cls(args.length - 1);
        if (s.k === 'imm') { emit(0xC6 | (op << 3), byte(s)); return out; }
        const r = regField(s, mn);
        emit(...r.pre, 0x80 | (op << 3) | r.code, ...r.tail); return out;
      }
      case 'INC': case 'DEC': {
        need(1); const o = cls(0);
        if (o.k === 'r16' && o.n !== 'AF') { emit(...(o.pfx ? [o.pfx] : []), (mn === 'INC' ? 0x03 : 0x0B) | (o.c << 4)); return out; }
        const r = regField(o, mn);
        emit(...r.pre, (mn === 'INC' ? 0x04 : 0x05) | (r.code << 3), ...r.tail); return out;
      }
      case 'IM': {
        need(1); const o = cls(0); if (o.k !== 'imm' || ![0, 1, 2].includes(o.v)) err('IM takes 0, 1 or 2');
        emit(0xED, [0x46, 0x56, 0x5E][o.v]); return out;
      }
      case 'JP': {
        if (args.length === 2) {
          const c = ccOf(args[0]); if (c === undefined) err('Unknown condition "' + args[0] + '"');
          const o = cls(1); if (o.k !== 'imm' && o.k !== 'mem') err('JP cc needs an address');
          const w = word(o); emit(0xC2 | (c << 3), w & 0xFF, w >> 8); return out;
        }
        need(1); const o = cls(0);
        if (o.k === 'ind' && o.n === 'HL') { emit(0xE9); return out; }
        if (o.k === 'idx' && o.d === 0 && !/[+-]/.test(args[0])) { emit(o.pfx, 0xE9); return out; }
        if (o.k === 'imm') { const w = word(o); emit(0xC3, w & 0xFF, w >> 8); return out; }
        err('Bad operand for JP');
        break;
      }
      case 'JR': case 'DJNZ': {
        let c;
        if (mn === 'JR' && args.length === 2) { c = ccOf(args[0]); if (c === undefined || c > 3) err('JR takes NZ, Z, NC or C'); }
        else need(1);
        const o = cls(args.length - 1); if (o.k !== 'imm') err(mn + ' needs a target address');
        const off = o.v - (pc + 2);
        if (final && !o.unres && (off < -128 || off > 127)) err('Jump target is ' + off + ' bytes away; ' + mn + ' reaches only -128..127');
        emit(mn === 'DJNZ' ? 0x10 : c === undefined ? 0x18 : 0x20 | (c << 3), off); return out;
      }
      case 'CALL': {
        if (args.length === 2) {
          const c = ccOf(args[0]); if (c === undefined) err('Unknown condition "' + args[0] + '"');
          const w = word(cls(1)); emit(0xC4 | (c << 3), w & 0xFF, w >> 8); return out;
        }
        need(1); const o = cls(0); if (o.k !== 'imm') err('CALL needs an address');
        const w = word(o); emit(0xCD, w & 0xFF, w >> 8); return out;
      }
      case 'RET': {
        if (args.length === 0) { emit(0xC9); return out; }
        need(1); const c = ccOf(args[0]); if (c === undefined) err('Unknown condition "' + args[0] + '"');
        emit(0xC0 | (c << 3)); return out;
      }
      case 'RST': {
        need(1); const o = cls(0); if (o.k !== 'imm' || o.v & ~0x38) err('RST takes 0, 08H, 10H, 18H, 20H, 28H, 30H or 38H');
        emit(0xC7 | o.v); return out;
      }
      case 'IN': {
        if (args.length === 1) { const o = cls(0); if (o.k === 'ind' && o.n === 'C') { emit(0xED, 0x70); return out; } }
        need(2); const b = cls(1), a = args[0].trim().toUpperCase() === 'F' ? { k: 'f' } : cls(0);
        if (b.k === 'ind' && b.n === 'C') {
          if (a.k === 'f') { emit(0xED, 0x70); return out; }
          if (a.k === 'r8') { emit(0xED, 0x40 | (a.c << 3)); return out; }
          if (a.k === 'imm' && a.v === 0) { emit(0xED, 0x70); return out; }
          err('IN r,(C) takes a register A, B, C, D, E, H or L');
        }
        if (a.k === 'r8' && a.n === 'A' && b.k === 'mem') { emit(0xDB, byte({ v: b.v, unres: b.unres })); return out; }
        err('Bad operands for IN');
        break;
      }
      case 'OUT': {
        need(2); const a = cls(0), b = cls(1);
        if (a.k === 'ind' && a.n === 'C') {
          if (b.k === 'r8') { emit(0xED, 0x41 | (b.c << 3)); return out; }
          if (b.k === 'imm' && b.v === 0) { emit(0xED, 0x71); return out; }
          err('OUT (C),r takes a register A, B, C, D, E, H or L');
        }
        if (a.k === 'mem' && b.k === 'r8' && b.n === 'A') { emit(0xD3, byte({ v: a.v, unres: a.unres })); return out; }
        err('Bad operands for OUT');
        break;
      }
      case 'BIT': case 'RES': case 'SET': {
        if (args.length !== 2 && args.length !== 3) err(mn + ' takes a bit number and an operand');
        const b = cls(0); if (b.k !== 'imm' || b.v < 0 || b.v > 7) err('Bit number must be 0..7');
        const o = cls(1), base = mn === 'BIT' ? 0x40 : mn === 'RES' ? 0x80 : 0xC0;
        if (o.k === 'idx') {
          let z = 6;
          if (args.length === 3) { const r = cls(2); if (r.k !== 'r8') err('Third operand must be a register'); z = r.c; }
          emit(o.pfx, 0xCB, disp(o), base | (b.v << 3) | z); return out;
        }
        if (args.length === 3) err(mn + ' takes only two operands here');
        const r = regField(o, mn); if (r.half) err(mn + ' does not take an index half');
        emit(0xCB, base | (b.v << 3) | r.code); return out;
      }
      default:
        if (mn in ROT) {
          if (args.length !== 1 && args.length !== 2) err(mn + ' takes one operand');
          const o = cls(0), op = ROT[mn];
          if (o.k === 'idx') {
            let z = 6;
            if (args.length === 2) { const r = cls(1); if (r.k !== 'r8') err('Second operand must be a register'); z = r.c; }
            emit(o.pfx, 0xCB, disp(o), (op << 3) | z); return out;
          }
          if (args.length === 2) err(mn + ' takes one operand');
          const r = regField(o, mn); if (r.half) err(mn + ' does not take an index half');
          emit(0xCB, (op << 3) | r.code); return out;
        }
        err('Unknown instruction "' + mn + '"');
    }
    return out;
  }

  /* ---------- the assembler ---------- */
  function assemble(source) {
    const lines = source.replace(/\r\n?/g, '\n').split('\n');
    const errors = []; let symbols = {}, listing = [], mem = new Uint8Array(0x10000), written = new Uint8Array(0x10000);
    let origin = null, entry = null, maxAddr = -1;
    const key = (n) => n.toUpperCase();

    function pass(final, last) {
      const newSyms = {}; let pc = 0, ended = false;
      if (last) { listing = []; mem.fill(0); written.fill(0); origin = null; maxAddr = -1; }
      const sym = (n) => (key(n) in newSyms ? newSyms[key(n)] : symbols[key(n)]);
      const ctx = () => ({ sym, pc });
      const ev = (s) => { const e = evalExpr(s, ctx()); if (final && e.unres) err('Undefined symbol "' + e.missing + '"'); return e; };
      for (let ln = 0; ln < lines.length && !ended; ln++) {
        const raw = lines[ln];
        const addr0 = pc; let bytes = [];
        const fail = (m) => { if (last) errors.push({ line: ln + 1, msg: m }); };
        try {
          let text = stripComment(raw).trim();
          if (text === '') { if (last) listing.push({ line: ln + 1, addr: null, bytes: [], text: raw }); continue; }
          // label?
          let label = null, m;
          if ((m = /^([A-Za-z_?@][A-Za-z0-9_?@]*)\s*:/.exec(text))) { label = m[1]; text = text.slice(m[0].length).trim(); }
          else if ((m = /^([A-Za-z_?@][A-Za-z0-9_?@]*)(\s+|$)/.exec(text))) {
            // a label without a colon starts in column 1, or is followed by a directive (Oshonsoft: "   lab2 equ 0x1264")
            const w = m[1].toUpperCase(), nx = /^\.?([A-Za-z]+|=)/.exec(text.slice(m[0].length));
            const nextIsDirective = !!nx && (DIRECTIVES.has(nx[1].toUpperCase()) || nx[1] === '=');
            if (!MNEMONICS.has(w) && !DIRECTIVES.has(w) && text[0] !== '.' && (/^\S/.test(raw) || nextIsDirective)) { label = m[1]; text = text.slice(m[0].length).trim(); }
          }
          let mn = '', rest = '';
          if (text !== '') {
            m = /^\.?([A-Za-z_]+|=)\s*(.*)$/.exec(text);
            if (!m) err('Cannot understand "' + text + '"');
            mn = m[1].toUpperCase(); rest = m[2];
          }
          if (mn === 'EQU' || mn === '=') {
            if (!label) err('EQU needs a label');
            if (rest.trim() === '') err('EQU needs a value');
            const e = ev(rest); if (final && e.unres) err('Undefined symbol in EQU');
            if (final && label && key(label) in newSyms) err('Duplicate label "' + label + '"');
            newSyms[key(label)] = e.v; label = null;
            if (last) listing.push({ line: ln + 1, addr: null, bytes: [], text: raw, value: e.v });
            continue;
          }
          if (label) {
            if (final && key(label) in newSyms) err('Duplicate label "' + label + '"');
            newSyms[key(label)] = pc;
          }
          if (mn === '') { if (last) listing.push({ line: ln + 1, addr: pc, bytes: [], text: raw }); continue; }
          let out = [];
          if (DIRECTIVES.has(mn)) {
            const args = splitTop(rest);
            switch (mn) {
              case 'ORG': { if (args.length !== 1) err('ORG takes one address'); const e = ev(args[0]); if (final && e.unres) err('ORG needs a value that is defined above this line'); pc = e.v & 0xFFFF; if (origin === null && last) origin = pc; break; }
              case 'END': ended = true; break;
              case 'INCLUDE': err('INCLUDE is not supported in this editor'); break;
              case 'DB': case 'DEFB': case 'BYTE':
                if (!args.length) err(mn + ' needs at least one value');
                for (const a of args) {
                  if (/^(['"]).*\1$/.test(a) && a.length !== 3) { for (const ch of a.slice(1, -1)) out.push(ch.charCodeAt(0) & 0xFF); continue; }
                  const e = ev(a); if (final && !e.unres && (e.v < -128 || e.v > 255)) err('Value ' + e.v + ' does not fit in a byte');
                  out.push(e.v & 0xFF);
                }
                break;
              case 'DW': case 'DEFW': case 'WORD':
                if (!args.length) err(mn + ' needs at least one value');
                for (const a of args) {
                  const e = ev(a); if (final && !e.unres && (e.v < -32768 || e.v > 65535)) err('Value ' + e.v + ' does not fit in 16 bits');
                  out.push(e.v & 0xFF, (e.v >> 8) & 0xFF);
                }
                break;
              case 'DS': case 'DEFS': case 'BLOCK': {
                if (args.length < 1 || args.length > 2) err(mn + ' takes a size and an optional fill value');
                const n = ev(args[0]); if (final && n.unres) err('Size must be defined above this line');
                if (n.v < 0 || n.v > 0x10000) err('Bad block size');
                const fill = args[1] !== undefined ? ev(args[1]).v & 0xFF : 0;
                out = new Array(n.v).fill(fill); break;
              }
            }
          } else {
            const args = rest.trim() === '' ? [] : splitTop(rest);
            out = encode(mn, args, ev, pc, final);
          }
          if (last) {
            for (let i = 0; i < out.length; i++) {
              const a = (pc + i) & 0xFFFF;
              if (written[a]) errors.push({ line: ln + 1, msg: 'Overwrites address ' + a.toString(16).toUpperCase().padStart(4, '0') + 'H assembled earlier' });
              mem[a] = out[i]; written[a] = 1; if (a > maxAddr) maxAddr = a;
            }
            if (origin === null && out.length) origin = pc;
            listing.push({ line: ln + 1, addr: DIRECTIVES.has(mn) && mn === 'ORG' ? pc : addr0, bytes: out, text: raw, inst: !DIRECTIVES.has(mn) && out.length > 0 });
          }
          if (pc + out.length > 0x10000 && final) err('Program runs past the end of memory (FFFFH)');
          pc = (pc + out.length) & 0xFFFF;
        } catch (e) {
          if (!(e instanceof AsmError)) throw e;
          fail(e.message);
          if (last) listing.push({ line: ln + 1, addr: pc, bytes: [], text: raw, error: e.message });
        }
      }
      symbols = newSyms;
    }
    pass(false, false); pass(false, false); pass(true, true);
    const segs = []; let i = 0;
    while (i < 0x10000) { if (!written[i]) { i++; continue; } let j = i; while (j < 0x10000 && written[j]) j++; segs.push({ addr: i, len: j - i }); i = j; }
    const names = Object.keys(symbols);
    return { ok: errors.length === 0, errors, listing, mem, segments: segs, symbols, symbolNames: names, origin: origin === null ? 0 : origin, size: segs.reduce((n, s) => n + s.len, 0) };
  }

  const hex = (v, n) => v.toString(16).toUpperCase().padStart(n, '0');
  function intelHex(res) {
    const out = [];
    for (const s of res.segments) {
      for (let a = s.addr; a < s.addr + s.len; a += 16) {
        const n = Math.min(16, s.addr + s.len - a), rec = [n, a >> 8, a & 0xFF, 0];
        for (let i = 0; i < n; i++) rec.push(res.mem[a + i]);
        const sum = (-rec.reduce((x, y) => x + y, 0)) & 0xFF;
        out.push(':' + rec.map((b) => hex(b, 2)).join('') + hex(sum, 2));
      }
    }
    out.push(':00000001FF'); return out.join('\n') + '\n';
  }
  function listingText(res) {
    return res.listing.map((l) => {
      const addr = l.addr === null || l.addr === undefined ? '    ' : hex(l.addr, 4);
      const b = l.bytes.slice(0, 4).map((x) => hex(x, 2)).join(' ');
      return `${String(l.line).padStart(4)}  ${addr}  ${b.padEnd(11)} ${l.text}` + (l.error ? `\n      ** ${l.error}` : '');
    }).join('\n');
  }

  const api = { assemble, encode, evalExpr, intelHex, listingText, classify, MNEMONICS, DIRECTIVES, AsmError };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AsmZ80 = api;
})(typeof self !== 'undefined' ? self : this);
