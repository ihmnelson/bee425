/* EASy68K-style sandbox: a small two-pass assembler + step-through machine built on sim.js.
   Not byte-exact: it does not encode machine code, and a few instructions/modes are missing. */
(function (root) {
  'use strict';
  const M = root.M68K || require('./sim.js');
  const { Sim, parseNum, splitOps, signExt } = M;
  const u32 = (x) => x >>> 0;
  const hex = (v, w) => '$' + u32(v).toString(16).toUpperCase().padStart(w || 1, '0');
  const REGWORD = /^(D[0-7]|A[0-7]|SP|PC|SR|CCR)$/i;
  const BCC = ['BRA', 'BSR', 'BEQ', 'BNE', 'BGT', 'BGE', 'BLT', 'BLE', 'BHI', 'BLS', 'BCC', 'BCS', 'BMI', 'BPL', 'BVC', 'BVS', 'BHS', 'BLO'];
  const IGNORED = ['OPT', 'LIST', 'NOLIST', 'PAGE', 'SECTION', 'TTL', 'FAIL', 'SPC'];
  const UNITS = { B: 1, W: 2, L: 4 };
  const KNOWN = new Set(['NOP', 'MOVE', 'MOVEA', 'MOVEQ', 'MOVEM', 'LEA', 'CLR', 'TST', 'NOT', 'NEG', 'ADD', 'ADDI', 'ADDQ', 'ADDA', 'SUB', 'SUBI', 'SUBQ', 'SUBA',
    'CMP', 'CMPI', 'CMPA', 'AND', 'ANDI', 'OR', 'ORI', 'EOR', 'EORI', 'EXG', 'SWAP', 'JMP', 'JSR', 'RTS', 'SIMHALT', 'STOP', 'TRAP', ...BCC]);

  /* ---------- expression evaluation (numbers, symbols, + - only) ---------- */
  function evalExpr(txt, syms, ctx) {
    txt = txt.trim();
    const toks = txt.match(/[+-]|[^+-]+/g) || [];
    let total = 0, sign = 1, expectVal = true;
    for (let tk of toks) {
      tk = tk.trim();
      if (!tk) continue;
      if (tk === '+' || tk === '-') { if (tk === '-') sign = -sign; continue; }
      let v;
      if (/^[$%@]?[0-9A-Fa-f]+$/.test(tk) && !/^[A-Za-z_]\w*$/.test(tk) || /^[$%@]/.test(tk) || /^\d+$/.test(tk)) v = parseNum(tk);
      else if (tk === '*') v = ctx.loc;
      else {
        const key = tk.toUpperCase();
        if (!(key in syms)) { const e = new Error('Undefined symbol: ' + tk); e.undef = true; throw e; }
        v = syms[key];
        if (typeof v !== 'number') throw new Error(tk + ' is not a numeric symbol');
      }
      total += sign * v; sign = 1; expectVal = false;
    }
    if (expectVal) throw new Error('Bad expression: ' + txt);
    return total;
  }

  /* ---------- parsing a source line ---------- */
  function parseLine(raw) {
    if (/^\s*$/.test(raw) || /^[*;]/.test(raw)) return { blank: true };
    const m = /^(\S+)?\s*(.*)$/.exec(raw);
    let label = null, rest = raw;
    if (/^\S/.test(raw)) { const mm = /^(\S+)(.*)$/.exec(raw); label = mm[1].replace(/:$/, ''); rest = mm[2]; }
    rest = rest.trim();
    if (!rest) return { label };
    const mn = /^([A-Za-z.]+)\s*(.*)$/.exec(rest);
    if (!mn) throw new Error('Cannot parse: ' + rest);
    let [mnem, tail] = [mn[1], mn[2]];
    // operands: up to the first whitespace outside quotes/parens
    let ops = '', i = 0, q = false, depth = 0;
    for (; i < tail.length; i++) {
      const ch = tail[i];
      if (ch === "'") q = !q;
      if (!q) { if (ch === '(') depth++; else if (ch === ')') depth--; else if (/\s/.test(ch) && depth <= 0) break; }
      ops += ch;
    }
    const [base, size] = mnem.toUpperCase().split('.');
    return { label, mn: base, size: size || null, opsText: ops };
  }

  /* operand extension-word bytes (for address layout) */
  function extLen(op, size, mn, syms, ctx) {
    op = op.trim();
    if (/^(D[0-7]|A[0-7]|SP)$/i.test(op) || /^\(A[0-7]\)\+?$/i.test(op) || /^-\((A[0-7]|SP)\)$/i.test(op) || /^\(SP\)\+?$/i.test(op)) return 0;
    if (/^#/.test(op)) return /^(ADDQ|SUBQ|MOVEQ)$/.test(mn) ? 0 : (size === 'L' ? 4 : 2);
    if (/\(.*(PC).*\)/i.test(op)) return 2;
    if (/^\(.*,A[0-7].*\)$/i.test(op) || /\(A[0-7]\)$/i.test(op) && /^[^(]/.test(op) || /\(A[0-7],/i.test(op)) return 2;
    const ex = /^\(?(.*?)\)?(?:\.([WL]))?$/i.exec(op);
    if (ex && ex[2]) return ex[2].toUpperCase() === 'W' ? 2 : 4;
    const body = op.replace(/^\((.*)\)$/, '$1');
    try { const v = evalExpr(body, syms, ctx); return (v >= -32768 && v <= 32767 && !(/^[A-Za-z_]/.test(body) && ctx.isLabel(body))) ? 2 : 4; }
    catch (e) { return 4; }
  }

  /* ---------- assembler ---------- */
  function assemble(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    const syms = {}, labels = new Set(), errors = [], items = [];
    let loc = 0, start = null, entryExpr = null, mem = new Map();
    const ctxFor = () => ({ loc, isLabel: (n) => labels.has(n.toUpperCase()) });
    const err = (n, msg) => errors.push({ line: n + 1, msg });
    const align = () => { if (loc & 1) loc++; };

    // pass 1: addresses and symbols
    lines.forEach((raw, n) => {
      let p;
      try { p = parseLine(raw); } catch (e) { return err(n, e.message); }
      if (p.blank) return items.push({ n, text: raw, listing: true });
      const item = { n, text: raw, p, addr: null };
      try {
        const mn = p.mn;
        const isEqu = mn === 'EQU' || mn === 'SET' || mn === 'REG';
        if (p.label && !isEqu) {
          const key = p.label.toUpperCase();
          const willAlign = !mn || (!['DC', 'DS', 'DCB', 'ORG', 'END'].includes(mn) || (p.size && p.size !== 'B' && ['DC', 'DS', 'DCB'].includes(mn)));
          if (willAlign && mn && mn !== 'ORG') align();
          if (key in syms && mn !== 'SET') err(n, 'Duplicate label: ' + p.label);
          syms[key] = loc; labels.add(key);
        }
        if (!mn) { item.addr = loc; return items.push(item); }
        if (IGNORED.includes(mn)) return items.push(item);
        if (mn === 'ORG') { loc = u32(evalExpr(p.opsText, syms, ctxFor())); item.addr = loc; return items.push(item); }
        if (mn === 'EQU' || mn === 'SET') { const key = p.label.toUpperCase(); syms[key] = evalExpr(p.opsText, syms, ctxFor()); item.addr = null; return items.push(item); }
        if (mn === 'REG') { syms[p.label.toUpperCase()] = p.opsText; return items.push(item); }
        if (mn === 'END') { entryExpr = p.opsText || null; return items.push(item); }
        if (mn === 'DC' || mn === 'DS' || mn === 'DCB') {
          const size = p.size || 'W', u = UNITS[size];
          if (!u) throw new Error('Bad size on ' + mn);
          if (u > 1) { align(); if (p.label) { syms[p.label.toUpperCase()] = loc; } }
          item.addr = loc; item.size = size;
          const parts = splitOps(p.opsText);
          if (mn === 'DC') { let count = 0; parts.forEach((x) => { const s = /^'(.*)'$/.exec(x.trim()); count += s ? (size === 'B' ? s[1].length : 1) : 1; }); item.count = count; loc += count * u; }
          else { const cnt = evalExpr(parts[0], syms, ctxFor()); item.count = cnt; loc += cnt * u; }
          return items.push(item);
        }
        if (mn === 'MACRO' || mn === 'ENDM') throw new Error('MACRO is not supported in the sandbox');
        // instruction
        if (!KNOWN.has(mn)) throw new Error('Unknown or unsupported instruction: ' + mn);
        align();
        if (p.label) syms[p.label.toUpperCase()] = loc;
        const ops = p.opsText ? splitOps(p.opsText) : [];
        let len;
        if (BCC.includes(mn)) len = p.size === 'B' || p.size === 'S' ? 2 : 4;
        else if (mn === 'SIMHALT') len = 4;
        else if (mn === 'STOP') len = 4;
        else if (['NOP', 'RTS', 'RTE', 'TRAP'].includes(mn)) len = 2;
        else if (mn === 'MOVEM') { len = 4 + ops.map((o) => (/^[DA]\d|^SP|\//.test(o) && !/\(/.test(o) ? 0 : extLen(o, p.size || 'W', mn, syms, ctxFor()))).reduce((a, b) => a + b, 0); }
        else len = 2 + ops.reduce((a, o) => a + extLen(o, p.size || 'W', mn, syms, ctxFor()), 0);
        item.addr = loc; item.len = len; item.ops = ops; item.inst = true;
        loc += len;
      } catch (e) { err(n, e.message); }
      items.push(item);
    });

    // pass 2: resolve operands and lay out data
    const resolveOp = (op, ctx) => {
      let t = op.trim();
      if (REGWORD.test(t)) return t.toUpperCase().replace('SP', 'A7');
      if (/\(.*PC.*\)/i.test(t)) throw new Error('PC-relative addressing is not simulated in the sandbox: use LEA label,An instead');
      // replace identifiers (not registers / size suffixes) with values
      t = t.replace(/(^|[^.\w$%@])([A-Za-z_]\w*)/g, (m0, pre, id) => {
        if (REGWORD.test(id)) return m0;
        const v = syms[id.toUpperCase()];
        if (typeof v !== 'number') { const e = new Error('Undefined symbol: ' + id); throw e; }
        return pre + '$' + u32(v).toString(16);
      });
      // simple +/- arithmetic outside register syntax
      const m = /^(#?)\(?(-?[$%@]?[0-9A-Fa-f]+(?:[+-][$%@]?[0-9A-Fa-f]+)+)\)?(\.[WL])?$/.exec(t);
      if (m && !/,/.test(t)) { const v = evalExpr(m[2], syms, ctx); t = (m[1] || '') + (v < 0 ? '-' + '$' + (-v).toString(16) : '$' + u32(v).toString(16)); }
      return t;
    };
    const insts = new Map(), order = [], listing = [];
    items.forEach((it) => {
      if (it.listing) return listing.push({ n: it.n, text: it.text });
      if (!it.p) return listing.push({ n: it.n, text: it.text });
      const p = it.p, ctx = { loc: it.addr, isLabel: (n) => labels.has(n.toUpperCase()) };
      try {
        if (it.inst) {
          const ops = it.ops.map((o) => {
            if (p.mn === 'MOVEM' && (/^[DA]\d|^SP/i.test(o)) && /[-/]/.test(o) || (p.mn === 'MOVEM' && syms[o.toUpperCase()] && typeof syms[o.toUpperCase()] === 'string')) return o;
            if (p.mn === 'MOVEM' && /^[DA][0-7](-[DA][0-7])?(\/[DA][0-7](-[DA][0-7])?)*$/i.test(o)) return o;
            return resolveOp(o, ctx);
          });
          const ins = { addr: it.addr, len: it.len, mn: p.mn, size: p.size && p.size !== 'S' ? p.size : null, ops, n: it.n, text: it.text };
          insts.set(it.addr, ins); order.push(ins);
          listing.push({ n: it.n, addr: it.addr, text: it.text, inst: true });
        } else if (p.mn === 'DC') {
          let a = it.addr; const u = UNITS[it.size];
          splitOps(p.opsText).forEach((x) => {
            x = x.trim(); const s = /^'(.*)'$/.exec(x);
            const vals = s ? (it.size === 'B' ? [...s[1]].map((c) => c.charCodeAt(0)) : [parseInt(s[1].charCodeAt(0), 10)]) : [evalExpr(x, syms, ctx)];
            vals.forEach((v) => { for (let b = u - 1; b >= 0; b--) { mem.set(a + b, v & 0xFF); v = Math.floor(v / 256) === 0 && v < 0 ? -1 : Math.floor(v / 256); } a += u; });
          });
          listing.push({ n: it.n, addr: it.addr, text: it.text });
        } else if (p.mn === 'DCB') {
          const [cnt, val] = splitOps(p.opsText); const u = UNITS[it.size]; let a = it.addr;
          const c = evalExpr(cnt, syms, ctx), v0 = evalExpr(val, syms, ctx);
          for (let k = 0; k < c; k++) { let v = v0; for (let b = u - 1; b >= 0; b--) { mem.set(a + b, v & 0xFF); v = Math.floor(v / 256); } a += u; }
          listing.push({ n: it.n, addr: it.addr, text: it.text });
        } else listing.push({ n: it.n, addr: it.addr == null ? undefined : it.addr, text: it.text });
      } catch (e) { err(it.n, e.message); listing.push({ n: it.n, text: it.text }); }
    });

    if (entryExpr) { try { start = u32(evalExpr(entryExpr, syms, { loc: 0, isLabel: () => false })); } catch (e) { errors.push({ line: 0, msg: 'END start address: ' + e.message }); } }
    if (start == null) start = order.length ? order[0].addr : 0;
    errors.sort((a, b) => a.line - b.line);
    return { insts, order, mem, syms, start, errors, listing };
  }

  /* ---------- machine ---------- */
  class Machine {
    constructor(prog) {
      this.prog = prog; this.reset();
    }
    reset() {
      const sim = new Sim(); this.sim = sim;
      this.prog.mem.forEach((v, a) => sim.mem.set(a, v));
      sim.A[7] = 0x01000000;
      this.pc = this.prog.start; this.steps = 0; this.halted = null; this.error = null; this.note = null;
      this.written = new Set();
      const orig = sim.writeMem.bind(sim);
      sim.writeMem = (a, s, v) => { orig(a, s, v); for (let i = 0; i < M.BYTES[s]; i++) this.written.add(u32(a + i)); };
    }
    snapshot() { return { D: this.sim.D.slice(), A: this.sim.A.slice(), f: Object.assign({}, this.sim.f), pc: this.pc }; }
    get running() { return !this.halted && !this.error; }

    push32(v) { this.sim.A[7] = u32(this.sim.A[7] - 4); this.sim.writeMem(this.sim.A[7], 'L', v); }
    pop32() { const v = this.sim.readMem(this.sim.A[7], 'L'); this.sim.A[7] = u32(this.sim.A[7] + 4); return v; }
    target(opText) { const op = this.sim.parseOp(opText); const loc = this.sim.locate(op, 'L'); if (loc.k !== 'M') throw new Error('Bad jump target'); return loc.a; }

    step() {
      if (!this.running) return false;
      this.written = new Set(); this.note = null;
      const ins = this.prog.insts.get(this.pc);
      if (!ins) { this.error = `PC = ${hex(this.pc, 6)} is not the start of an instruction: execution ran into data or off the end of the program (did you forget SIMHALT?)`; return false; }
      this.line = ins.n;
      const sim = this.sim, next = ins.addr + ins.len;
      try {
        const mn = ins.mn, name = ins.mn + (ins.size ? '.' + ins.size : '');
        if (BCC.includes(mn)) {
          const tgt = parseNum(ins.ops[0]);
          if (mn === 'BRA') this.pc = tgt;
          else if (mn === 'BSR') { this.push32(next); this.pc = tgt; }
          else { const cc = mn.slice(1); this.pc = sim.taken(cc) ? tgt : next; }
        } else if (mn === 'JMP') this.pc = this.target(ins.ops[0]);
        else if (mn === 'JSR') { const t = this.target(ins.ops[0]); this.push32(next); this.pc = t; }
        else if (mn === 'RTS') this.pc = this.pop32();
        else if (mn === 'NOP') this.pc = next;
        else if (mn === 'SIMHALT') { this.halted = 'SIMHALT: simulation halted'; this.pc = next; }
        else if (mn === 'STOP') { this.halted = 'STOP: processor stopped'; this.pc = next; }
        else if (mn === 'TRAP') {
          if (parseNum(ins.ops[0].replace('#', '')) === 15 && (sim.D[0] & 0xFF) === 9) this.halted = 'TRAP #15 task 9: simulation halted';
          else this.note = 'TRAP ignored: the sandbox has no I/O services';
          this.pc = next;
        } else if (mn === 'MOVEM') { this.movem(ins); this.pc = next; }
        else { sim.exec(`${name} ${ins.ops.join(',')}`); this.pc = next; }
      } catch (e) { this.error = `Line ${ins.n + 1}: ${e.message}`; return false; }
      this.steps++;
      return true;
    }

    movem(ins) {
      const sim = this.sim, size = ins.size || 'W', u = M.BYTES[size];
      const regs = (txt) => { // -> sorted register indices 0-15 (D0-D7, A0-A7)
        const set = new Set();
        txt.toUpperCase().split('/').forEach((part) => {
          const m = /^([DA])([0-7])(?:-([DA])([0-7]))?$/.exec(part);
          if (!m) throw new Error('Bad register list: ' + txt);
          const a = (m[1] === 'A' ? 8 : 0) + +m[2], b = m[3] ? (m[3] === 'A' ? 8 : 0) + +m[4] : a;
          for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(i);
        });
        return [...set].sort((x, y) => x - y);
      };
      const get = (i) => (i < 8 ? sim.D[i] : sim.A[i - 8]);
      const put = (i, v) => { if (i < 8) sim.D[i] = v; else sim.A[i - 8] = v; };
      const [a, b] = ins.ops;
      const isList = (x) => /^[DA][0-7]([-/]|$)/i.test(x) && !/\(/.test(x) || (this.prog.syms[x.toUpperCase()] && typeof this.prog.syms[x.toUpperCase()] === 'string');
      const resolveList = (x) => (typeof this.prog.syms[x.toUpperCase()] === 'string' ? this.prog.syms[x.toUpperCase()] : x);
      if (isList(a)) { // registers -> memory
        const list = regs(resolveList(a)), op = sim.parseOp(b);
        if (op.k === 'PRE') { for (let k = list.length - 1; k >= 0; k--) { sim.A[op.n] = u32(sim.A[op.n] - u); sim.writeMem(sim.A[op.n], size, get(list[k]) & M.MASK[size]); } }
        else { let addr = sim.locate(op, size).a; list.forEach((i) => { sim.writeMem(addr, size, get(i) & M.MASK[size]); addr += u; }); }
      } else { // memory -> registers
        const list = regs(resolveList(b)), op = sim.parseOp(a);
        let addr = op.k === 'POST' ? sim.A[op.n] : sim.locate(op, size).a;
        list.forEach((i) => { let v = sim.readMem(addr, size); if (size === 'W') v = signExt(v, 'W'); put(i, v); addr += u; });
        if (op.k === 'POST') sim.A[op.n] = u32(addr);
      }
    }

    run(max) {
      const limit = max || 200000; let n = 0;
      while (this.running && n < limit) { this.step(); n++; }
      if (this.running) this.note = `Stopped after ${limit.toLocaleString()} steps: probably an infinite loop`;
      return n;
    }
  }

  /* ---------- examples ---------- */
  const EXAMPLES = [
    { name: 'Zero a block of memory (L4)', src: `* Clear a block of long words. Memory is pre-filled with $FF so you can watch it clear.
st_addr  EQU   $00002000
end_addr EQU   $00002020

         ORG   st_addr
         DCB.B 64,$FF            Pre-fill 64 bytes with $FF

         ORG   $00001000
START    LEA   st_addr,A0        A0 = start of block
         LEA   end_addr,A1       A1 = limit (never cleared)
clr_loop CMPA.L A1,A0            reached the end?
         BEQ   done
         CLR.L (A0)+             clear a long word, advance A0 by 4
         BRA   clr_loop
done     SIMHALT
         END   START
` },
    { name: 'Sum five bytes (L5)', src: `* Add five numbers with post-increment
         ORG   $1000
START    MOVE.B #5,D0            five numbers to add
         LEA   Table,A0          A0 points to the first
         CLR.W D1                clear the sum
Loop     ADD.B (A0)+,D1          add number to total
         SUBQ.B #1,D0            decrement loop counter
         BNE   Loop              until all numbers added
         SIMHALT
Table    DC.B  1,4,2,6,5
         END   START
` },
    { name: 'Largest of 4 bytes (L4)', src: `* Compare 4 bytes; the largest ends up in MAX_NUM. (The lecture header says D0, but the
* last compare stores straight to memory, so D0 finishes holding $4C, not $7F.)
         ORG   $00001000
START    LEA   DATA,A0           pointer to data
         LEA   MAX_NUM,A1        pointer to result
         MOVE.B (A0)+,D0         first number
         MOVE.B (A0)+,D1         second number
         CMP.B D1,D0
         BGE   NEXT1             keep first
         MOVE.B D1,D0            else take second
NEXT1    MOVE.B (A0)+,D1
         CMP.B D1,D0
         BGE   NEXT2
         MOVE.B D1,D0
NEXT2    MOVE.B (A0),D1
         CMP.B D1,D0
         BGE   NEXT3
         MOVE.B D1,(A1)
         BRA   DONE
NEXT3    MOVE.B D0,(A1)
DONE     SIMHALT
DATA     DC.B  $05,$4C,$42,$7F
MAX_NUM  DS.B  1
         END   START
` },
    { name: 'Largest in null-terminated array (L5)', src: `* Find the largest byte; array ends with $00
         ORG   $400
start    LEA   data,A0
         CLR.B D0
next     MOVE.B (A0)+,D1
         BEQ   exit              null byte? we're done
         CMP.B D0,D1             D1 - D0
         BLE   end_test          not bigger: skip
         MOVE.B D1,D0            new maximum
end_test BRA   next
exit     STOP  #$2700
         ORG   $1000
data     DC.B  12,13,5,6,8,4,10,0
         END   $400
` },
    { name: 'Subroutine, stack and MOVEM (L5)', src: `* BSR pushes the return address; MOVEM saves registers
         ORG   $1000
start    LEA   $2000,SP          initialise the stack
         MOVE.L #$11111111,D1    D1 must survive the call
         MOVE.B #5,D0
         BSR   double
         BSR   double            D0 = 20
         SIMHALT
double   MOVEM.L D1,-(SP)        save D1
         MOVE.B D0,D1
         ADD.B D1,D0             D0 = D0 * 2
         MOVE.L #$DEADBEEF,D1    trash D1 on purpose
         MOVEM.L (SP)+,D1        restore D1
         RTS
         END   start
` },
    { name: 'Memory test (L5)', src: `* Write four patterns to RAM and read them back (lecture example, shortened)
end_test EQU   $11
test1    EQU   $00
test2    EQU   $FF
test3    EQU   $55
test4    EQU   $AA
st_addr  EQU   $00002000
end_addr EQU   $00002100
stack    EQU   $00007000
max_cnt  EQU   10

         ORG   $400
start    LEA   stack,SP
         LEA   tests,A2          A2 -> test patterns
         LEA   bad_addr,A3       A3 -> bad address list
         LEA   bad_cnt,A4        A4 -> bad count
         MOVE.B #end_test,D6
         MOVE.B #max_cnt,D7
tst_loop CMP.B (A2),D6           done?
         BEQ   done
         LEA   st_addr,A0
         LEA   end_addr,A1
         BSR   do_test
         ADDQ.L #1,A2            next pattern
         CMP.B (A4),D7
         BGT   tst_loop
done     MOVE.B #9,D0
         TRAP  #15               halt the simulator

do_test  MOVEM.L A5,-(SP)        save A5
         MOVEA.L A0,A5           A5 walks through memory
         MOVE.B (A2),D1          D1 = pattern
chk_loop MOVE.B D1,(A5)          write
         CMP.B (A5),D1           read back and compare
         BEQ   nxt_test
         MOVE.L A5,(A3)+         record bad address
         ADDQ.B #1,(A4)
         CMP.B (A4),D7
         BLE   exit
nxt_test ADDQ.L #1,A5
         CMPA.L A5,A1
         BGE   chk_loop
exit     MOVEM.L (SP)+,A5
         RTS

bad_addr DS.L  10
tests    DC.B  test1,test2,test3,test4,end_test
bad_cnt  DC.B  0
         END   start
` },
    { name: 'Odd-address error (try it!)', src: `* A word access on an odd address raises an address error on a real 68000
         ORG   $1000
start    LEA   $2001,A0
         MOVE.W (A0),D0          <- boom
         SIMHALT
         END   start
` },
  ];

  const api = { assemble, Machine, EXAMPLES, evalExpr };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Sandbox = Object.assign(api, { view: null });
})(typeof window !== 'undefined' ? window : globalThis);
