/* Mini 68000 simulator: just enough of the instruction set from Lessons 3-5
   to generate and grade puzzles. Big-endian memory, X N Z V C flags. */
(function (root) {
  'use strict';
  const MASK = { B: 0xFF, W: 0xFFFF, L: 0xFFFFFFFF };
  const MSB = { B: 0x80, W: 0x8000, L: 0x80000000 };
  const BYTES = { B: 1, W: 2, L: 4 };
  const u32 = (x) => x >>> 0;

  function parseNum(s) {
    s = s.trim();
    let neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    let v;
    if (s[0] === '$') v = parseInt(s.slice(1), 16);
    else if (s[0] === '%') v = parseInt(s.slice(1), 2);
    else if (s[0] === '@') v = parseInt(s.slice(1), 8);
    else v = parseInt(s, 10);
    if (Number.isNaN(v)) throw new Error('Bad number: ' + s);
    return neg ? -v : v;
  }

  /* split an operand string on commas that are not inside parentheses */
  function splitOps(str) {
    const out = []; let depth = 0, cur = '';
    for (const ch of str) {
      if (ch === '(') depth++; else if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    if (cur.trim() !== '') out.push(cur);
    return out;
  }

  function signExt(v, size) {
    v &= MASK[size];
    return (v & MSB[size]) ? u32(v - MASK[size] - 1) : v;
  }
  function toSigned(v, size) {
    v &= MASK[size];
    return (v & MSB[size]) ? v - MASK[size] - 1 : v;
  }

  class Sim {
    constructor(init) {
      this.D = new Array(8).fill(0);
      this.A = new Array(8).fill(0);
      this.mem = new Map();
      this.f = { X: 0, N: 0, Z: 0, V: 0, C: 0 };
      if (init) this.load(init);
    }
    load(init) {
      for (const [k, v] of Object.entries(init.D || {})) this.D[+k] = u32(v);
      for (const [k, v] of Object.entries(init.A || {})) this.A[+k] = u32(v);
      for (const [addr, bytes] of Object.entries(init.mem || {})) {
        bytes.forEach((b, i) => this.mem.set(+addr + i, b & 0xFF));
      }
      Object.assign(this.f, init.f || {});
    }
    rb(a) { return this.mem.get(u32(a)) || 0; }
    readMem(addr, size) {
      const n = BYTES[size];
      if (n > 1 && (addr & 1)) throw new Error('Address error: ' + size + ' access at odd address $' + addr.toString(16).toUpperCase());
      let v = 0;
      for (let i = 0; i < n; i++) v = (v * 256) + this.rb(addr + i);
      return u32(v);
    }
    writeMem(addr, size, val) {
      const n = BYTES[size];
      if (n > 1 && (addr & 1)) throw new Error('Address error: ' + size + ' access at odd address $' + addr.toString(16).toUpperCase());
      for (let i = n - 1; i >= 0; i--) { this.mem.set(u32(addr + i), val & 0xFF); val = Math.floor(val / 256); }
    }

    /* ---- operands ---- */
    parseOp(txt) {
      txt = txt.trim().toUpperCase().replace(/\bSP\b/g, 'A7');
      let m;
      if ((m = /^D([0-7])$/.exec(txt))) return { k: 'D', n: +m[1] };
      if ((m = /^A([0-7])$/.exec(txt))) return { k: 'A', n: +m[1] };
      if ((m = /^#(.+)$/.exec(txt))) return { k: 'I', v: parseNum(m[1]) };
      if ((m = /^\(A([0-7])\)\+$/.exec(txt))) return { k: 'POST', n: +m[1] };
      if ((m = /^-\(A([0-7])\)$/.exec(txt))) return { k: 'PRE', n: +m[1] };
      if ((m = /^\(A([0-7])\)$/.exec(txt))) return { k: 'IND', n: +m[1] };
      if ((m = /^\((.+),A([0-7]),([DA])([0-7])(?:\.([WL]))?\)$/.exec(txt))) return { k: 'IDX', d: parseNum(m[1]), n: +m[2], xk: m[3], xn: +m[4], xs: m[5] || 'W' };
      if ((m = /^(-?[$%@]?[0-9A-F]+)\(A([0-7]),([DA])([0-7])(?:\.([WL]))?\)$/.exec(txt))) return { k: 'IDX', d: parseNum(m[1]), n: +m[2], xk: m[3], xn: +m[4], xs: m[5] || 'W' };
      if ((m = /^\((.+),A([0-7])\)$/.exec(txt))) return { k: 'DISP', d: parseNum(m[1]), n: +m[2] };
      if ((m = /^(-?[$%@]?[0-9A-F]+)\(A([0-7])\)$/.exec(txt))) return { k: 'DISP', d: parseNum(m[1]), n: +m[2] };
      if ((m = /^\$?[0-9A-F]+(\.[WL])?$/.exec(txt))) return { k: 'ABS', a: parseNum(txt.replace(/\.[WL]$/, '')) };
      throw new Error('Cannot parse operand: ' + txt);
    }
    /* resolve an operand to a location, applying (An)+ / -(An) side effects once */
    locate(op, size) {
      switch (op.k) {
        case 'D': case 'A': case 'I': return op;
        case 'IND': return { k: 'M', a: this.A[op.n] };
        case 'POST': { const a = this.A[op.n]; this.A[op.n] = u32(a + this.step(op.n, size)); return { k: 'M', a }; }
        case 'PRE': { this.A[op.n] = u32(this.A[op.n] - this.step(op.n, size)); return { k: 'M', a: this.A[op.n] }; }
        case 'DISP': return { k: 'M', a: u32(this.A[op.n] + op.d) };
        case 'IDX': {
          let x = (op.xk === 'D' ? this.D : this.A)[op.xn];
          if (op.xs === 'W') x = signExt(x & 0xFFFF, 'W');
          return { k: 'M', a: u32(this.A[op.n] + x + op.d) };
        }
        case 'ABS': return { k: 'M', a: u32(op.a) };
      }
    }
    step(n, size) { return (n === 7 && size === 'B') ? 2 : BYTES[size]; }
    get(loc, size) {
      switch (loc.k) {
        case 'D': return this.D[loc.n] & MASK[size];
        case 'A': return this.A[loc.n] & MASK[size];
        case 'I': return u32(loc.v) & MASK[size];
        case 'M': return this.readMem(loc.a, size);
      }
    }
    put(loc, size, val) {
      val = u32(val) & MASK[size];
      switch (loc.k) {
        case 'D': this.D[loc.n] = u32((this.D[loc.n] & ~MASK[size]) | val); break;
        case 'M': this.writeMem(loc.a, size, val); break;
        default: throw new Error('Illegal destination');
      }
    }

    setNZ(r, size) { this.f.N = (r & MSB[size]) ? 1 : 0; this.f.Z = (r & MASK[size]) === 0 ? 1 : 0; }
    addFlags(s, d, size, ext) {
      const full = s + d;
      const r = full & MASK[size];
      this.f.C = full > MASK[size] ? 1 : 0;
      this.f.V = (!((s ^ d) & MSB[size]) && ((s ^ r) & MSB[size])) ? 1 : 0;
      this.setNZ(r, size);
      if (ext) this.f.X = this.f.C;
      return r;
    }
    subFlags(s, d, size, ext) { // d - s
      const r = (d - s) & MASK[size];
      this.f.C = s > d ? 1 : 0;
      this.f.V = (((d ^ s) & (d ^ r)) & MSB[size]) ? 1 : 0;
      this.setNZ(r, size);
      if (ext) this.f.X = this.f.C;
      return r;
    }

    /* ---- execute one line of source ---- */
    exec(line) {
      line = line.replace(/[;*].*$/, '').trim();
      if (!line) return;
      const m = /^([A-Za-z]+)(?:\.([BWLbwl]))?\s*(.*)$/.exec(line);
      if (!m) throw new Error('Cannot parse: ' + line);
      const mn = m[1].toUpperCase();
      const size = (m[2] || 'W').toUpperCase();
      const parts = m[3] ? splitOps(m[3]) : [];
      const ops = parts.map((p) => this.parseOp(p));
      const need = (n) => { if (ops.length !== n) throw new Error(mn + ' needs ' + n + ' operand(s)'); };

      switch (mn) {
        case 'NOP': return;
        case 'MOVE': {
          need(2);
          if (ops[1].k === 'A') throw new Error('MOVE cannot target an address register: use MOVEA');
          if (ops[1].k === 'I') throw new Error('Immediate cannot be a destination');
          const s = this.get(this.locate(ops[0], size), size);
          const dl = this.locate(ops[1], size);
          this.put(dl, size, s);
          this.setNZ(s, size); this.f.V = 0; this.f.C = 0;
          return;
        }
        case 'MOVEA': {
          need(2);
          if (ops[1].k !== 'A') throw new Error('MOVEA destination must be an address register');
          if (size === 'B') throw new Error('MOVEA has no byte size');
          const s = this.get(this.locate(ops[0], size), size);
          this.A[ops[1].n] = size === 'W' ? signExt(s, 'W') : s;
          return;
        }
        case 'LEA': {
          need(2);
          if (ops[1].k !== 'A') throw new Error('LEA destination must be an address register');
          const src = ops[0];
          if (src.k === 'IND') this.A[ops[1].n] = this.A[src.n];
          else if (src.k === 'DISP') this.A[ops[1].n] = u32(this.A[src.n] + src.d);
          else if (src.k === 'ABS') this.A[ops[1].n] = u32(src.a);
          else throw new Error('Bad LEA source');
          return;
        }
        case 'MOVEQ': {
          need(2);
          if (ops[0].k !== 'I' || ops[0].v < -128 || ops[0].v > 127) throw new Error('MOVEQ data must be #-128 to #127');
          if (ops[1].k !== 'D') throw new Error('MOVEQ destination must be Dn');
          const r = signExt(ops[0].v & 0xFF, 'B');
          this.D[ops[1].n] = r; this.setNZ(r, 'L'); this.f.V = 0; this.f.C = 0;
          return;
        }
        case 'CLR': {
          need(1);
          this.put(this.locate(ops[0], size), size, 0);
          this.f.N = 0; this.f.Z = 1; this.f.V = 0; this.f.C = 0;
          return;
        }
        case 'TST': {
          need(1);
          const v = this.get(this.locate(ops[0], size), size);
          this.setNZ(v, size); this.f.V = 0; this.f.C = 0;
          return;
        }
        case 'NOT': case 'NEG': {
          need(1);
          const loc = this.locate(ops[0], size);
          const d = this.get(loc, size);
          if (mn === 'NOT') { const r = (~d) & MASK[size]; this.put(loc, size, r); this.setNZ(r, size); this.f.V = 0; this.f.C = 0; }
          else { const r = this.subFlags(d, 0, size, true); this.put(loc, size, r); }
          return;
        }
        case 'ADD': case 'ADDI': case 'ADDQ': case 'SUB': case 'SUBI': case 'SUBQ': {
          need(2);
          const isAdd = mn.startsWith('ADD');
          if (mn.endsWith('Q') && (ops[0].k !== 'I' || ops[0].v < 1 || ops[0].v > 8)) throw new Error(mn + ' data must be #1 to #8');
          if (ops[1].k === 'A') { // ADDQ/SUBQ to An: whole register, no flags
            if (!mn.endsWith('Q')) throw new Error(mn + ' cannot target An: use ' + mn + 'A');
            if (size === 'B') throw new Error('Address registers have no byte size');
            const s = this.get(this.locate(ops[0], size), size);
            this.A[ops[1].n] = u32(isAdd ? this.A[ops[1].n] + s : this.A[ops[1].n] - s);
            return;
          }
          const s = this.get(this.locate(ops[0], size), size);
          const dl = this.locate(ops[1], size);
          const d = this.get(dl, size);
          this.put(dl, size, isAdd ? this.addFlags(s, d, size, true) : this.subFlags(s, d, size, true));
          return;
        }
        case 'ADDA': case 'SUBA': {
          need(2);
          if (ops[1].k !== 'A') throw new Error(mn + ' destination must be An');
          let s = this.get(this.locate(ops[0], size), size);
          if (size === 'W') s = signExt(s, 'W');
          this.A[ops[1].n] = u32(mn === 'ADDA' ? this.A[ops[1].n] + s : this.A[ops[1].n] - s);
          return;
        }
        case 'CMP': case 'CMPI': {
          need(2);
          const s = this.get(this.locate(ops[0], size), size);
          const d = this.get(this.locate(ops[1], size), size);
          this.subFlags(s, d, size, false);
          return;
        }
        case 'CMPA': {
          need(2);
          if (ops[1].k !== 'A') throw new Error('CMPA destination must be An');
          let s = this.get(this.locate(ops[0], size), size);
          if (size === 'W') s = signExt(s, 'W');
          this.subFlags(s, this.A[ops[1].n], 'L', false);
          return;
        }
        case 'AND': case 'OR': case 'EOR': case 'ANDI': case 'ORI': case 'EORI': {
          need(2);
          const s = this.get(this.locate(ops[0], size), size);
          const dl = this.locate(ops[1], size);
          const d = this.get(dl, size);
          const base = mn.replace(/I$/, '');
          const r = (base === 'AND' ? s & d : base === 'OR' ? s | d : s ^ d) & MASK[size];
          this.put(dl, size, r); this.setNZ(r, size); this.f.V = 0; this.f.C = 0;
          return;
        }
        case 'EXG': {
          need(2);
          const get = (o) => (o.k === 'D' ? this.D : this.A);
          const a = get(ops[0]), b = get(ops[1]);
          const t = a[ops[0].n]; a[ops[0].n] = b[ops[1].n]; b[ops[1].n] = t;
          return;
        }
        case 'SWAP': {
          need(1);
          const v = this.D[ops[0].n];
          const r = u32(((v & 0xFFFF) << 16) | (v >>> 16));
          this.D[ops[0].n] = r; this.setNZ(r, 'L'); this.f.V = 0; this.f.C = 0;
          return;
        }
        default: throw new Error('Unsupported instruction: ' + mn);
      }
    }
    run(lines) { lines.forEach((l) => this.exec(l)); return this; }

    /* branch condition test, using current flags */
    taken(cc) {
      const { N, Z, V, C } = this.f;
      switch (cc.toUpperCase()) {
        case 'EQ': return !!Z;
        case 'NE': return !Z;
        case 'CS': case 'LO': return !!C;
        case 'CC': case 'HS': return !C;
        case 'MI': return !!N;
        case 'PL': return !N;
        case 'VS': return !!V;
        case 'VC': return !V;
        case 'HI': return !C && !Z;
        case 'LS': return !!(C || Z);
        case 'GE': return N === V;
        case 'LT': return N !== V;
        case 'GT': return !Z && N === V;
        case 'LE': return !!Z || N !== V;
      }
      throw new Error('Unknown condition ' + cc);
    }
  }

  const api = { Sim, parseNum, signExt, toSigned, splitOps, MASK, MSB, BYTES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M68K = api;
})(typeof window !== 'undefined' ? window : globalThis);
