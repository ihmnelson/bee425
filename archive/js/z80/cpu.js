/* A Z80 CPU core that executes real machine code from a 64 KB byte array.
   Written from the Zilog Z80 CPU User Manual (UM0080) and Sean Young's "The Undocumented Z80
   Documented" (flag bits 3 and 5, MEMPTR/WZ, block instructions). Counts T-states per instruction. */
(function (root) {
  'use strict';
  const S = 0x80, Z = 0x40, Y = 0x20, H = 0x10, X = 0x08, PV = 0x04, N = 0x02, C = 0x01;
  const PAR = new Uint8Array(256), SZ53P = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let p = 1; for (let b = 0; b < 8; b++) if (i & (1 << b)) p ^= 1;
    PAR[i] = p ? PV : 0;
    SZ53P[i] = (i & (S | Y | X)) | (i === 0 ? Z : 0) | PAR[i];
  }
  const sx8 = (v) => (v << 24) >> 24;
  const CC_MASK = [Z, Z, C, C, PV, PV, S, S], CC_VAL = [0, 1, 0, 1, 0, 1, 0, 1];   // NZ Z NC C PO PE P M

  class CPU {
    constructor(opts) {
      opts = opts || {};
      this.mem = new Uint8Array(0x10000);
      this.R = new Uint8Array(8);                       // B C D E H L (unused) A
      this.f = 0; this.sp = 0xFFFF; this.pc = 0; this.ix = 0; this.iy = 0;
      this.i = 0; this.r = 0; this.wz = 0;
      this.af_ = 0; this.bc_ = 0; this.de_ = 0; this.hl_ = 0;
      this.iff1 = 0; this.iff2 = 0; this.im = 0; this.ei = 0;
      this.halted = false; this.p = 0; this.q = 0; this.fw = 0; this.pfx = 0;
      this.t = 0;                                       // T-states of the last step
      this.traceOn = false; this.ev = null;             // when traceOn, step() records its bus accesses in this.ev: ['F'|'R'|'W'|'I'|'O', address, data, refresh address for F]
      this.cycles = 0; this.steps = 0; this.stopped = null;
      this.io = opts.io || null;                        // { in(port16), out(port16, v) }
      this.onWrite = null; this.journal = null;
      this.nmiPending = false; this.intLine = false;
    }

    /* ---------- register pairs ---------- */
    get a() { return this.R[7]; } set a(v) { this.R[7] = v; }
    get b() { return this.R[0]; } set b(v) { this.R[0] = v; }
    get c() { return this.R[1]; } set c(v) { this.R[1] = v; }
    get d() { return this.R[2]; } set d(v) { this.R[2] = v; }
    get e() { return this.R[3]; } set e(v) { this.R[3] = v; }
    get h() { return this.R[4]; } set h(v) { this.R[4] = v; }
    get l() { return this.R[5]; } set l(v) { this.R[5] = v; }
    get af() { return (this.R[7] << 8) | this.f; } set af(v) { this.R[7] = v >> 8; this.f = v & 0xFF; }
    get bc() { return (this.R[0] << 8) | this.R[1]; } set bc(v) { this.R[0] = v >> 8; this.R[1] = v & 0xFF; }
    get de() { return (this.R[2] << 8) | this.R[3]; } set de(v) { this.R[2] = v >> 8; this.R[3] = v & 0xFF; }
    get hl() { return (this.R[4] << 8) | this.R[5]; } set hl(v) { this.R[4] = v >> 8; this.R[5] = v & 0xFF; }
    // the "HL" of the current instruction: HL, or IX / IY under a DD / FD prefix
    get xl() { return this.pfx === 0 ? this.hl : this.pfx === 1 ? this.ix : this.iy; }
    set xl(v) { v &= 0xFFFF; if (this.pfx === 0) this.hl = v; else if (this.pfx === 1) this.ix = v; else this.iy = v; }

    getF() { return this.f; }
    snapshot() {
      return { R: Array.from(this.R), f: this.f, sp: this.sp, pc: this.pc, ix: this.ix, iy: this.iy, i: this.i, r: this.r, wz: this.wz,
        af_: this.af_, bc_: this.bc_, de_: this.de_, hl_: this.hl_, iff1: this.iff1, iff2: this.iff2, im: this.im, ei: this.ei,
        halted: this.halted, p: this.p, q: this.q, stopped: this.stopped, steps: this.steps, cycles: this.cycles };
    }
    restore(s) {
      this.R.set(s.R); this.f = s.f; this.sp = s.sp; this.pc = s.pc; this.ix = s.ix; this.iy = s.iy; this.i = s.i; this.r = s.r; this.wz = s.wz;
      this.af_ = s.af_; this.bc_ = s.bc_; this.de_ = s.de_; this.hl_ = s.hl_; this.iff1 = s.iff1; this.iff2 = s.iff2; this.im = s.im; this.ei = s.ei;
      this.halted = s.halted; this.p = s.p; this.q = s.q; this.stopped = s.stopped; this.steps = s.steps; this.cycles = s.cycles;
    }

    /* ---------- memory and ports ---------- */
    rd(a) { a &= 0xFFFF; const v = this.mem[a]; if (this.ev) this.ev.push(['R', a, v]); return v; }
    wr(a, v) {
      a &= 0xFFFF;
      if (this.journal) this.journal.push(a, this.mem[a]);
      this.mem[a] = v & 0xFF;
      if (this.ev) this.ev.push(['W', a, v & 0xFF]);
      if (this.onWrite) this.onWrite(a, 1);
    }
    rd16(a) { return this.rd(a) | (this.rd(a + 1) << 8); }
    wr16(a, v) { this.wr(a, v & 0xFF); this.wr(a + 1, v >> 8); }
    fetch() { const a = this.pc, v = this.mem[a]; this.pc = (a + 1) & 0xFFFF; if (this.ev) this.ev.push(['R', a, v]); return v; }
    fetch16() { const lo = this.fetch(); return lo | (this.fetch() << 8); }
    m1() {                                              // opcode fetch (M1 cycle): the refresh address is I:R before R counts up
      const a = this.pc, ir = (this.i << 8) | this.r, v = this.mem[a];
      this.r = (this.r & 0x80) | ((this.r + 1) & 0x7F); this.pc = (a + 1) & 0xFFFF;
      if (this.ev) this.ev.push(['F', a, v, ir]);
      return v;
    }
    push(v) { this.sp = (this.sp - 1) & 0xFFFF; this.wr(this.sp, v >> 8); this.sp = (this.sp - 1) & 0xFFFF; this.wr(this.sp, v & 0xFF); }
    pop() { const v = this.rd(this.sp) | (this.rd(this.sp + 1) << 8); this.sp = (this.sp + 2) & 0xFFFF; return v; }
    portIn(p) { const v = this.io && this.io.in ? this.io.in(p & 0xFFFF) & 0xFF : 0xFF; if (this.ev) this.ev.push(['I', p & 0xFFFF, v]); return v; }
    portOut(p, v) { if (this.io && this.io.out) this.io.out(p & 0xFFFF, v & 0xFF); if (this.ev) this.ev.push(['O', p & 0xFFFF, v & 0xFF]); }
    sf(v) { this.f = v & 0xFF; this.fw = 1; }

    /* ---------- 8-bit register access (index 6 is never used here) ---------- */
    g8(i) {
      if (this.pfx) { if (i === 4) return (this.pfx === 1 ? this.ix : this.iy) >> 8; if (i === 5) return (this.pfx === 1 ? this.ix : this.iy) & 0xFF; }
      return this.R[i];
    }
    s8(i, v) {
      v &= 0xFF;
      if (this.pfx && (i === 4 || i === 5)) {
        const x = this.pfx === 1 ? this.ix : this.iy, nv = i === 4 ? (v << 8) | (x & 0xFF) : (x & 0xFF00) | v;
        if (this.pfx === 1) this.ix = nv; else this.iy = nv;
      } else this.R[i] = v;
    }
    rp(p) { return p === 0 ? this.bc : p === 1 ? this.de : p === 2 ? this.xl : this.sp; }
    setRp(p, v) { v &= 0xFFFF; if (p === 0) this.bc = v; else if (p === 1) this.de = v; else if (p === 2) this.xl = v; else this.sp = v; }
    rp2(p) { return p === 0 ? this.bc : p === 1 ? this.de : p === 2 ? this.xl : this.af; }
    setRp2(p, v) { v &= 0xFFFF; if (p === 0) this.bc = v; else if (p === 1) this.de = v; else if (p === 2) this.xl = v; else this.af = v; }
    cond(y) { return ((this.f & CC_MASK[y]) !== 0 ? 1 : 0) === CC_VAL[y]; }

    /* ---------- ALU ---------- */
    alu(op, v) {
      const a = this.R[7]; let r, res;
      switch (op) {
        case 0: case 1: {                                // ADD, ADC
          const c = op === 1 ? this.f & C : 0; r = a + v + c; res = r & 0xFF;
          this.sf((res & (S | Y | X)) | (res === 0 ? Z : 0) | ((a ^ v ^ res) & H) | ((~(a ^ v) & (a ^ res) & 0x80) ? PV : 0) | (r > 0xFF ? C : 0));
          this.R[7] = res; break;
        }
        case 2: case 3: case 7: {                        // SUB, SBC, CP
          const c = op === 3 ? this.f & C : 0; r = a - v - c; res = r & 0xFF;
          this.sf((op === 7 ? (v & (Y | X)) : (res & (S | Y | X))) | (res & S) * (op === 7 ? 1 : 0) | (res === 0 ? Z : 0) | ((a ^ v ^ res) & H) | (((a ^ v) & (a ^ res) & 0x80) ? PV : 0) | N | (r < 0 ? C : 0));
          if (op !== 7) this.R[7] = res; break;
        }
        case 4: res = a & v; this.sf(SZ53P[res] | H); this.R[7] = res; break;
        case 5: res = a ^ v; this.sf(SZ53P[res]); this.R[7] = res; break;
        case 6: res = a | v; this.sf(SZ53P[res]); this.R[7] = res; break;
      }
    }
    inc8(v) { const r = (v + 1) & 0xFF; this.sf((this.f & C) | (r & (S | Y | X)) | (r === 0 ? Z : 0) | ((v & 0xF) === 0xF ? H : 0) | (v === 0x7F ? PV : 0)); return r; }
    dec8(v) { const r = (v - 1) & 0xFF; this.sf((this.f & C) | (r & (S | Y | X)) | (r === 0 ? Z : 0) | ((v & 0xF) === 0 ? H : 0) | (v === 0x80 ? PV : 0) | N); return r; }
    // CB-page rotate/shift: op 0 RLC 1 RRC 2 RL 3 RR 4 SLA 5 SRA 6 SLL 7 SRL
    rot(op, v) {
      let r, c;
      switch (op) {
        case 0: c = v >> 7; r = ((v << 1) | c) & 0xFF; break;
        case 1: c = v & 1; r = (v >> 1) | (c << 7); break;
        case 2: c = v >> 7; r = ((v << 1) | (this.f & C)) & 0xFF; break;
        case 3: c = v & 1; r = (v >> 1) | ((this.f & C) << 7); break;
        case 4: c = v >> 7; r = (v << 1) & 0xFF; break;
        case 5: c = v & 1; r = (v >> 1) | (v & 0x80); break;
        case 6: c = v >> 7; r = ((v << 1) | 1) & 0xFF; break;
        default: c = v & 1; r = v >> 1;
      }
      this.sf(SZ53P[r] | c); return r;
    }
    add16(a, b) {
      const r = a + b; this.wz = (a + 1) & 0xFFFF;
      this.sf((this.f & (S | Z | PV)) | ((r >> 8) & (Y | X)) | (((a ^ b ^ r) >> 8) & H) | (r > 0xFFFF ? C : 0));
      return r & 0xFFFF;
    }
    adcsbc16(sub, b) {
      const a = this.hl, c = this.f & C, r = sub ? a - b - c : a + b + c, res = r & 0xFFFF;
      this.wz = (a + 1) & 0xFFFF;
      this.sf((res >> 8 & (S | Y | X)) | (res === 0 ? Z : 0) | (((a ^ b ^ res) >> 8) & H) |
        ((sub ? ((a ^ b) & (a ^ res) & 0x8000) : (~(a ^ b) & (a ^ res) & 0x8000)) ? PV : 0) | (sub ? N : 0) | (sub ? (r < 0) : (r > 0xFFFF) ? C : 0));
      if (sub) this.f = (this.f & ~C) | (r < 0 ? C : 0);
      this.hl = res;
    }
    daa() {
      const a = this.R[7], c = this.f & C, h = this.f & H, n = this.f & N;
      let diff = 0, nc = c;
      if (h || (a & 0xF) > 9) diff |= 6;
      if (c || a > 0x99) { diff |= 0x60; nc = C; }
      const res = (n ? a - diff : a + diff) & 0xFF;
      const nh = n ? (h && (a & 0xF) < 6 ? H : 0) : ((a & 0xF) > 9 ? H : 0);
      this.sf(SZ53P[res] | n | nh | nc); this.R[7] = res;
    }
    bit(n, v, xy) {
      const z = (v & (1 << n)) === 0;
      this.sf((this.f & C) | H | (z ? (Z | PV) : 0) | (n === 7 && !z ? S : 0) | (xy & (Y | X)));
    }

    /* ---------- one instruction ---------- */
    // Returns the number of T-states used. Sets this.stopped on a HALT with interrupts off (informational).
    step() {
      this.fw = 0; this.pfx = 0; this.ev = this.traceOn ? [] : null; this.idle = this.halted;      // idle: this step is only the NOPs a halted CPU executes
      const wasEi = this.ei; this.ei = 0;
      const prevQ = this.q, startPc = this.pc, r0 = this.r, wz0 = this.wz;
      let t = 0;
      if (this.halted) { if (this.ev) this.ev.push(['F', this.pc, this.mem[this.pc], (this.i << 8) | this.r]); this.r = (this.r & 0x80) | ((this.r + 1) & 0x7F); t = 4; }
      else {
        try {
          let op = this.m1();
          while (op === 0xDD || op === 0xFD) { this.pfx = op === 0xDD ? 1 : 2; op = this.m1(); t += 4; }
          if (op === 0xED) { this.pfx = 0; t += 4 + this.edOp(this.m1(), startPc, prevQ); }
          else if (op === 0xCB) t += this.cbOp();
          else t += this.mainOp(op, startPc, this.pfx ? 0 : prevQ);
        } catch (e) {
          // an IN that has no data yet (see io.js): undo the partial fetch so the instruction can be retried
          this.pc = startPc; this.r = r0; this.wz = wz0; this.ei = wasEi; this.pfx = 0;
          throw e;
        }
      }
      this.q = this.fw ? this.f : 0;
      this.t = t; this.cycles += t; this.steps++;
      return t;
    }

    mainOp(op, startPc, prevQ) {
      const x = op >> 6, y = (op >> 3) & 7, z = op & 7, p = y >> 1, q = y & 1, pf = this.pfx;
      let t = 0;
      // helper: address of the (HL) operand, adds the displacement cost under a prefix
      const memAddr = () => {
        if (!pf) return this.hl;
        const d = sx8(this.fetch()), a = ((pf === 1 ? this.ix : this.iy) + d) & 0xFFFF;
        this.wz = a; t += 8; return a;
      };
      switch (x) {
        case 0:
          switch (z) {
            case 0:
              if (y === 0) return 4;
              if (y === 1) { const a = this.af, b = this.af_; this.af = b; this.af_ = a; return 4; }
              if (y === 2) { const d = sx8(this.fetch()); this.b = (this.b - 1) & 0xFF; if (this.b) { this.pc = (this.pc + d) & 0xFFFF; this.wz = this.pc; return 13; } return 8; }
              { const d = sx8(this.fetch()); if (y === 3 || this.cond(y - 4)) { this.pc = (this.pc + d) & 0xFFFF; this.wz = this.pc; return 12; } return 7; }
            case 1:
              if (!q) { this.setRp(p, this.fetch16()); return 10; }
              this.xl = this.add16(this.xl, this.rp(p)); return 11;
            case 2:
              switch (y) {
                case 0: this.wr(this.bc, this.a); this.wz = ((this.bc + 1) & 0xFF) | (this.a << 8); return 7;
                case 1: this.a = this.rd(this.bc); this.wz = (this.bc + 1) & 0xFFFF; return 7;
                case 2: this.wr(this.de, this.a); this.wz = ((this.de + 1) & 0xFF) | (this.a << 8); return 7;
                case 3: this.a = this.rd(this.de); this.wz = (this.de + 1) & 0xFFFF; return 7;
                case 4: { const n = this.fetch16(); this.wr16(n, this.xl); this.wz = (n + 1) & 0xFFFF; return 16; }
                case 5: { const n = this.fetch16(); this.xl = this.rd16(n); this.wz = (n + 1) & 0xFFFF; return 16; }
                case 6: { const n = this.fetch16(); this.wr(n, this.a); this.wz = ((n + 1) & 0xFF) | (this.a << 8); return 13; }
                default: { const n = this.fetch16(); this.a = this.rd(n); this.wz = (n + 1) & 0xFFFF; return 13; }
              }
            case 3: this.setRp(p, this.rp(p) + (q ? -1 : 1)); return 6;
            case 4: case 5: {
              const f = z === 4 ? 'inc8' : 'dec8';
              if (y === 6) { t = 11; const a = memAddr(); this.wr(a, this[f](this.rd(a))); return t; }
              this.s8(y, this[f](this.g8(y))); return 4;
            }
            case 6:
              if (y === 6) {
                if (pf) { const d = sx8(this.fetch()), a = ((pf === 1 ? this.ix : this.iy) + d) & 0xFFFF; this.wz = a; this.wr(a, this.fetch()); return 15; }
                this.wr(this.hl, this.fetch()); return 10;
              }
              this.s8(y, this.fetch()); return 7;
            default: {
              const a = this.a;
              switch (y) {
                case 0: { const c = a >> 7; this.a = ((a << 1) | c) & 0xFF; this.sf((this.f & (S | Z | PV)) | (this.a & (Y | X)) | c); return 4; }
                case 1: { const c = a & 1; this.a = (a >> 1) | (c << 7); this.sf((this.f & (S | Z | PV)) | (this.a & (Y | X)) | c); return 4; }
                case 2: { const c = a >> 7; this.a = ((a << 1) | (this.f & C)) & 0xFF; this.sf((this.f & (S | Z | PV)) | (this.a & (Y | X)) | c); return 4; }
                case 3: { const c = a & 1; this.a = (a >> 1) | ((this.f & C) << 7); this.sf((this.f & (S | Z | PV)) | (this.a & (Y | X)) | c); return 4; }
                case 4: this.daa(); return 4;
                case 5: this.a = a ^ 0xFF; this.sf((this.f & (S | Z | PV | C)) | (this.a & (Y | X)) | H | N); return 4;
                case 6: this.sf((this.f & (S | Z | PV)) | (((prevQ ^ this.f) | a) & (Y | X)) | C); return 4;
                default: this.sf((this.f & (S | Z | PV)) | ((this.f & C) ? H : 0) | (((prevQ ^ this.f) | a) & (Y | X)) | ((this.f & C) ^ C)); return 4;
              }
            }
          }
        case 1:
          if (y === 6 && z === 6) { this.halted = true; return 4; }
          if (y === 6) { t = 7; const a = memAddr(); this.wr(a, this.R[z]); return t; }
          if (z === 6) { t = 7; const a = memAddr(); this.R[y] = this.rd(a); return t; }
          this.s8(y, this.g8(z)); return 4;
        case 2:
          if (z === 6) { t = 7; const a = memAddr(); this.alu(y, this.rd(a)); return t; }
          this.alu(y, this.g8(z)); return 4;
        default:
          switch (z) {
            case 0: if (this.cond(y)) { this.pc = this.pop(); this.wz = this.pc; return 11; } return 5;
            case 1:
              if (!q) { this.setRp2(p, this.pop()); return 10; }
              if (p === 0) { this.pc = this.pop(); this.wz = this.pc; return 10; }
              if (p === 1) { let v = this.bc; this.bc = this.bc_; this.bc_ = v; v = this.de; this.de = this.de_; this.de_ = v; v = this.hl; this.hl = this.hl_; this.hl_ = v; return 4; }
              if (p === 2) { this.pc = this.xl; return 4; }
              this.sp = this.xl; return 6;
            case 2: { const n = this.fetch16(); this.wz = n; if (this.cond(y)) this.pc = n; return 10; }
            case 3:
              switch (y) {
                case 0: this.pc = this.fetch16(); this.wz = this.pc; return 10;
                case 2: { const n = this.fetch(), a = this.a; this.portOut((a << 8) | n, a); this.wz = ((n + 1) & 0xFF) | (a << 8); return 11; }
                case 3: { const n = this.fetch(), port = (this.a << 8) | n; this.wz = (port + 1) & 0xFFFF; this.a = this.portIn(port); return 11; }
                case 4: { const lo = this.rd(this.sp), hi = this.rd(this.sp + 1), v = this.xl; this.wr(this.sp + 1, v >> 8); this.wr(this.sp, v & 0xFF); this.xl = (hi << 8) | lo; this.wz = (hi << 8) | lo; return 19; }
                case 5: { const v = this.de; this.de = this.hl; this.hl = v; return 4; }
                case 6: this.iff1 = this.iff2 = 0; return 4;
                default: this.iff1 = this.iff2 = 1; this.ei = 1; return 4;
              }
            case 4: { const n = this.fetch16(); this.wz = n; if (this.cond(y)) { this.push(this.pc); this.pc = n; return 17; } return 10; }
            case 5:
              if (!q) { this.push(this.rp2(p)); return 11; }
              { const n = this.fetch16(); this.push(this.pc); this.pc = n; this.wz = n; return 17; }
            case 6: this.alu(y, this.fetch()); return 7;
            default: this.push(this.pc); this.pc = y * 8; this.wz = this.pc; return 11;
          }
      }
    }

    cbOp() {
      let a = 0, op, t;
      if (this.pfx) {
        const d = sx8(this.fetch()); a = ((this.pfx === 1 ? this.ix : this.iy) + d) & 0xFFFF; this.wz = a;
        op = this.fetch(); t = 11;                       // DD CB d op: only DD and CB are M1 fetches
      } else { op = this.m1(); t = 8; }
      const x = op >> 6, y = (op >> 3) & 7, z = op & 7;
      if (this.pfx || z === 6) {
        if (!this.pfx) a = this.hl;
        const v = this.rd(a);
        if (x === 1) { this.bit(y, v, this.pfx ? a >> 8 : this.wz >> 8); return this.pfx ? t + 5 : t + 4; }
        const r = x === 0 ? this.rot(y, v) : x === 2 ? v & ~(1 << y) : v | (1 << y);
        this.wr(a, r);
        if (this.pfx && z !== 6) this.R[z] = r;           // undocumented: result also copied to a register
        return this.pfx ? t + 8 : t + 7;
      }
      const v = this.R[z];
      if (x === 0) this.R[z] = this.rot(y, v);
      else if (x === 1) this.bit(y, v, v);
      else this.R[z] = x === 2 ? v & ~(1 << y) : v | (1 << y);
      return t;
    }

    edOp(op, startPc, prevQ) {
      const x = op >> 6, y = (op >> 3) & 7, z = op & 7, p = y >> 1, q = y & 1;
      if (x === 1) {
        switch (z) {
          case 0: { const v = this.portIn(this.bc); this.wz = (this.bc + 1) & 0xFFFF; if (y !== 6) this.R[y] = v; this.sf((this.f & C) | SZ53P[v]); return 8; }
          case 1: this.portOut(this.bc, y === 6 ? 0 : this.R[y]); this.wz = (this.bc + 1) & 0xFFFF; return 8;
          case 2: this.adcsbc16(!q, this.rp0(p)); return 11;
          case 3: {
            const n = this.fetch16(); this.wz = (n + 1) & 0xFFFF;
            if (!q) this.wr16(n, this.rp0(p)); else this.setRp0(p, this.rd16(n));
            return 16;
          }
          case 4: { const v = this.a; this.R[7] = 0; this.alu(2, v); return 4; }
          case 5: this.iff1 = this.iff2; this.pc = this.pop(); this.wz = this.pc; return 10;
          case 6: this.im = [0, 0, 1, 2][y & 3]; return 4;
          default:
            switch (y) {
              case 0: this.i = this.a; return 5;
              case 1: this.r = this.a; return 5;
              case 2: this.a = this.i; this.sf((this.f & C) | SZ53P[this.a] & ~PV | (this.iff2 ? PV : 0)); this.p = 1; return 5;
              case 3: this.a = this.r; this.sf((this.f & C) | SZ53P[this.a] & ~PV | (this.iff2 ? PV : 0)); this.p = 1; return 5;
              case 4: { const v = this.rd(this.hl), a = this.a; this.wr(this.hl, ((a & 0xF) << 4) | (v >> 4)); this.a = (a & 0xF0) | (v & 0xF); this.sf((this.f & C) | SZ53P[this.a]); this.wz = (this.hl + 1) & 0xFFFF; return 14; }
              case 5: { const v = this.rd(this.hl), a = this.a; this.wr(this.hl, ((v << 4) & 0xF0) | (a & 0xF)); this.a = (a & 0xF0) | (v >> 4); this.sf((this.f & C) | SZ53P[this.a]); this.wz = (this.hl + 1) & 0xFFFF; return 14; }
              default: return 4;
            }
        }
      }
      if (x === 2 && y >= 4 && z < 4) return this.block(y, z, startPc);
      return 4;                                           // undefined ED opcodes act as NOPs
    }
    rp0(p) { return p === 0 ? this.bc : p === 1 ? this.de : p === 2 ? this.hl : this.sp; }
    setRp0(p, v) { v &= 0xFFFF; if (p === 0) this.bc = v; else if (p === 1) this.de = v; else if (p === 2) this.hl = v; else this.sp = v; }

    block(y, z, startPc) {
      const dir = (y & 1) ? -1 : 1, rep = y >= 6;
      let t = 12, again = false, ioData = 0;
      if (z === 0) {                                      // LDI LDD LDIR LDDR
        const v = this.rd(this.hl); this.wr(this.de, v);
        this.hl = this.hl + dir; this.de = this.de + dir; this.bc = this.bc - 1;
        const n = (v + this.a) & 0xFF;
        this.sf((this.f & (S | Z | C)) | (n & X) | ((n & 2) << 4) | (this.bc ? PV : 0));
        again = rep && this.bc !== 0;
      } else if (z === 1) {                               // CPI CPD CPIR CPDR
        const v = this.rd(this.hl), r = (this.a - v) & 0xFF, h = (this.a ^ v ^ r) & H;
        this.hl = this.hl + dir; this.bc = this.bc - 1; this.wz = (this.wz + dir) & 0xFFFF;
        const n = (r - (h ? 1 : 0)) & 0xFF;
        this.sf((this.f & C) | N | (r & S) | (r === 0 ? Z : 0) | h | (n & X) | ((n & 2) << 4) | (this.bc ? PV : 0));
        again = rep && this.bc !== 0 && r !== 0;
      } else if (z === 2) {                               // INI IND INIR INDR
        this.wz = (this.bc + dir) & 0xFFFF;
        const v = this.portIn(this.bc); this.wr(this.hl, v);
        this.b = (this.b - 1) & 0xFF; this.hl = this.hl + dir;
        this.ioFlags(v, v + ((this.c + dir) & 0xFF));
        again = rep && this.b !== 0; ioData = v;
      } else {                                            // OUTI OUTD OTIR OTDR
        const v = this.rd(this.hl);
        this.b = (this.b - 1) & 0xFF;
        this.portOut(this.bc, v); this.wz = (this.bc + dir) & 0xFFFF;
        this.hl = this.hl + dir;
        this.ioFlags(v, v + this.l);
        again = rep && this.b !== 0; ioData = v;
      }
      if (again) {
        this.pc = (this.pc - 2) & 0xFFFF; this.wz = (this.pc + 1) & 0xFFFF; t = 17;
        this.f = (this.f & ~(Y | X)) | ((this.pc >> 8) & (Y | X));
        if (z >= 2) this.ioRepeatFlags(ioData);
      }
      return t;
    }
    ioFlags(v, k) {
      const b = this.b;
      this.sf((b & (S | Y | X)) | (b === 0 ? Z : 0) | ((v & 0x80) ? N : 0) | (k > 0xFF ? (H | C) : 0) | PAR[((k & 7) ^ b) & 0xFF]);
    }
    // Undocumented: when an INIR/INDR/OTIR/OTDR repeats (B != 0) it also disturbs H and P/V.
    ioRepeatFlags(v) {
      const b = this.b; let f = this.f;
      const tog = (x) => PAR[x & 7] ^ PV;                 // PV when x has odd parity in its low three bits
      if (f & C) {
        if (v & 0x80) { f ^= tog((b - 1) & 0xFF); f = (b & 0xF) === 0 ? f | H : f & ~H; }
        else { f ^= tog((b + 1) & 0xFF); f = (b & 0xF) === 0xF ? f | H : f & ~H; }
      } else f ^= tog(b);
      this.f = f;
    }

    /* ---------- interrupts ---------- */
    // Accept a maskable interrupt if enabled. Returns T-states used, or 0 if it was not accepted.
    interrupt(dataByte) {
      if (!this.iff1 || this.ei) return 0;
      this.iff1 = this.iff2 = 0;
      if (this.halted) { this.halted = false; this.pc = (this.pc + 1) & 0xFFFF; }
      this.r = (this.r & 0x80) | ((this.r + 1) & 0x7F);
      if (this.p) this.f &= ~PV;
      let t;
      if (this.im === 2) { this.push(this.pc); this.pc = this.rd16(((this.i << 8) | (dataByte === undefined ? 0xFF : dataByte)) & 0xFFFF); t = 19; }
      else if (this.im === 1) { this.push(this.pc); this.pc = 0x38; t = 13; }
      else { this.push(this.pc); this.pc = (dataByte === undefined ? 0xFF : dataByte) & 0x38; t = 13; }
      this.wz = this.pc; this.cycles += t; return t;
    }
    nmi() {
      this.iff2 = this.iff1; this.iff1 = 0;
      if (this.halted) { this.halted = false; this.pc = (this.pc + 1) & 0xFFFF; }
      this.r = (this.r & 0x80) | ((this.r + 1) & 0x7F);
      this.push(this.pc); this.pc = 0x66; this.wz = 0x66; this.cycles += 11; return 11;
    }
  }

  const api = { CPU, FLAGS: { S, Z, Y, H, X, PV, N, C } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CPUZ80 = api;
})(typeof self !== 'undefined' ? self : this);
