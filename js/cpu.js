/* A 68000 CPU core that executes real machine code from a 16 MB byte array.
   Written from the Motorola M68000 Family Programmer's Reference Manual. */
(function (root) {
  'use strict';
  const MASK = [0, 0xFF, 0xFFFF, 0, 0xFFFFFFFF];
  const MSB = [0, 0x80, 0x8000, 0, 0x80000000];
  const u32 = (x) => x >>> 0;
  const mk = (v, sz) => (sz === 4 ? v >>> 0 : v & MASK[sz]);   // mask to operand size, always unsigned
  const sx8 = (v) => (v << 24) >> 24;
  const sx16 = (v) => (v << 16) >> 16;
  const sxs = (v, sz) => (sz === 1 ? sx8(v) : sz === 2 ? sx16(v) : v | 0);

  class Exc { constructor(vec, info) { this.vec = vec; this.info = info || {}; } }
  const VEC_NAMES = { 2: 'Bus error', 3: 'Address error', 4: 'Illegal instruction', 5: 'Divide by zero', 6: 'CHK instruction', 7: 'TRAPV', 8: 'Privilege violation', 9: 'Trace', 10: 'Line A emulator', 11: 'Line F emulator' };

  class CPU {
    constructor(opts) {
      opts = opts || {};
      this.mem = new Uint8Array(0x1000000);
      this.D = new Uint32Array(8); this.A = new Uint32Array(8);
      this.usp = 0; this.ssp = 0; this.pc = 0;
      this.x = 0; this.n = 0; this.z = 0; this.v = 0; this.c = 0;
      this.s = 1; this.t = 0; this.ipl = 0;
      this.halted = null; this.steps = 0; this.cycles = 0;
      this.io = opts.io || null;
      this.onWrite = null;           // optional hook (addr, size) for UI highlighting
      this.ek = 0; this.ev = 0;      // effective-address kind / value scratch
      this.curPC = 0; this.curOp = 0;
    }

    /* ---------- status register ---------- */
    getCCR() { return (this.x << 4) | (this.n << 3) | (this.z << 2) | (this.v << 1) | this.c; }
    setCCR(v) { this.x = (v >> 4) & 1; this.n = (v >> 3) & 1; this.z = (v >> 2) & 1; this.v = (v >> 1) & 1; this.c = v & 1; }
    getSR() { return (this.t << 15) | (this.s << 13) | (this.ipl << 8) | this.getCCR(); }
    setSR(v) {
      const ns = (v >> 13) & 1;
      if (ns !== this.s) { if (this.s) this.ssp = this.A[7]; else this.usp = this.A[7]; this.A[7] = ns ? this.ssp : this.usp; }
      this.t = (v >> 15) & 1; this.s = ns; this.ipl = (v >> 8) & 7; this.setCCR(v);
    }

    snapshot() { return { D: Array.from(this.D), A: Array.from(this.A), usp: this.usp, ssp: this.ssp, pc: this.pc, sr: this.getSR(), halted: this.halted, steps: this.steps }; }
    restore(sn) { this.D.set(sn.D); this.A.set(sn.A); this.usp = sn.usp; this.ssp = sn.ssp; this.pc = sn.pc; this.t = (sn.sr >> 15) & 1; this.s = (sn.sr >> 13) & 1; this.ipl = (sn.sr >> 8) & 7; this.setCCR(sn.sr); this.halted = sn.halted; this.steps = sn.steps; }

    /* ---------- memory ---------- */
    rd(a, sz) {
      a = u32(a) & 0xFFFFFF;
      if (sz === 1) return this.mem[a];
      if (a & 1) throw new Exc(3, { addr: a, read: true });
      if (sz === 2) return (this.mem[a] << 8) | this.mem[a + 1];
      return u32((this.mem[a] << 24) | (this.mem[a + 1] << 16) | (this.mem[a + 2] << 8) | this.mem[a + 3]);
    }
    wr(a, sz, v) {
      a = u32(a) & 0xFFFFFF;
      if (sz > 1 && (a & 1)) throw new Exc(3, { addr: a, read: false });
      if (this.journal) for (let i = 0; i < sz; i++) this.journal.push(a + i, this.mem[a + i]);
      if (sz === 1) this.mem[a] = v & 0xFF;
      else if (sz === 2) { this.mem[a] = (v >> 8) & 0xFF; this.mem[a + 1] = v & 0xFF; }
      else { this.mem[a] = (v >>> 24) & 0xFF; this.mem[a + 1] = (v >>> 16) & 0xFF; this.mem[a + 2] = (v >>> 8) & 0xFF; this.mem[a + 3] = v & 0xFF; }
      if (this.onWrite) this.onWrite(a, sz);
    }
    fetch16() { const pc = this.pc; if (pc & 1) throw new Exc(3, { addr: pc, read: true, ifetch: true }); const v = this.rd(pc, 2); this.pc = u32(pc + 2); return v; }
    fetch32() { const hi = this.fetch16(); const lo = this.fetch16(); return u32(hi * 65536 + lo); }
    push16(v) { this.A[7] = u32(this.A[7] - 2); this.wr(this.A[7], 2, v); }
    push32(v) { this.A[7] = u32(this.A[7] - 4); this.wr(this.A[7], 4, v); }
    pop16() { const v = this.rd(this.A[7], 2); this.A[7] = u32(this.A[7] + 2); return v; }
    pop32() { const v = this.rd(this.A[7], 4); this.A[7] = u32(this.A[7] + 4); return v; }

    /* ---------- effective addresses ---------- */
    // kinds: 0 Dn, 1 An, 2 memory, 3 immediate
    ea(mode, reg, sz) {
      switch (mode) {
        case 0: this.ek = 0; this.ev = reg; return;
        case 1: this.ek = 1; this.ev = reg; return;
        case 2: this.ek = 2; this.ev = this.A[reg]; return;
        case 3: { const a = this.A[reg]; this.A[reg] = u32(a + (sz === 1 && reg === 7 ? 2 : sz)); this.ek = 2; this.ev = a; return; }
        case 4: { this.A[reg] = u32(this.A[reg] - (sz === 1 && reg === 7 ? 2 : sz)); this.ek = 2; this.ev = this.A[reg]; return; }
        case 5: { const d = sx16(this.fetch16()); this.ek = 2; this.ev = u32(this.A[reg] + d); return; }
        case 6: { const e = this.fetch16(); this.ek = 2; this.ev = u32(this.A[reg] + this.index(e)); return; }
        case 7:
          switch (reg) {
            case 0: this.ek = 2; this.ev = u32(sx16(this.fetch16())); return;
            case 1: this.ek = 2; this.ev = this.fetch32(); return;
            case 2: { const base = this.pc; const d = sx16(this.fetch16()); this.ek = 2; this.ev = u32(base + d); return; }
            case 3: { const base = this.pc; const e = this.fetch16(); this.ek = 2; this.ev = u32(base + this.index(e)); return; }
            case 4: this.ek = 3; this.ev = sz === 4 ? this.fetch32() : sz === 2 ? this.fetch16() : this.fetch16() & 0xFF; return;
          }
      }
      throw new Exc(4);
    }
    index(e) {
      let xr = (e & 0x8000) ? this.A[(e >> 12) & 7] : this.D[(e >> 12) & 7];
      if (!(e & 0x0800)) xr = sx16(xr & 0xFFFF);
      return sx8(e & 0xFF) + (xr | 0);
    }
    get(sz) {
      switch (this.ek) {
        case 0: return mk(this.D[this.ev], sz);
        case 1: return mk(this.A[this.ev], sz);
        case 2: return this.rd(this.ev, sz);
        default: return mk(this.ev, sz);
      }
    }
    put(sz, val) {
      val = (sz === 4 ? val >>> 0 : mk(val, sz));
      switch (this.ek) {
        case 0: this.D[this.ev] = sz === 4 ? val : (this.D[this.ev] & ~MASK[sz]) | val; return;
        case 1: this.A[this.ev] = sz === 4 ? val : sx16(val) >>> 0; return;
        case 2: this.wr(this.ev, sz, val); return;
        default: throw new Exc(4);
      }
    }
    // control addressing only (for LEA/PEA/JMP/JSR/MOVEM): returns address
    ctlAddr(mode, reg) {
      this.ea(mode, reg, 4);
      if (this.ek !== 2) throw new Exc(4);
      return this.ev;
    }

    /* ---------- flags ---------- */
    nz(r, sz) { this.n = (r & MSB[sz]) ? 1 : 0; this.z = (mk(r, sz)) === 0 ? 1 : 0; }
    logicFlags(r, sz) { this.nz(r, sz); this.v = 0; this.c = 0; }
    add(s, d, sz, cin, keepZ) {
      const full = s + d + cin, r = sz === 4 ? full >>> 0 : mk(full, sz);
      this.c = full > MASK[sz] ? 1 : 0; this.x = this.c;
      this.v = ((~(s ^ d)) & (s ^ r) & MSB[sz]) ? 1 : 0;
      this.n = (r & MSB[sz]) ? 1 : 0;
      if (keepZ) { if (r !== 0) this.z = 0; } else this.z = r === 0 ? 1 : 0;
      return r;
    }
    sub(s, d, sz, cin, keepZ, noX) { // d - s - cin
      const r = mk((d - s - cin), sz), rr = sz === 4 ? r >>> 0 : r;
      this.c = (s + cin) > d ? 1 : 0; if (!noX) this.x = this.c;
      this.v = (((d ^ s) & (d ^ rr)) & MSB[sz]) ? 1 : 0;
      this.n = (rr & MSB[sz]) ? 1 : 0;
      if (keepZ) { if (rr !== 0) this.z = 0; } else this.z = rr === 0 ? 1 : 0;
      return rr;
    }
    cond(cc) {
      switch (cc) {
        case 0: return true; case 1: return false;
        case 2: return !this.c && !this.z; case 3: return !!(this.c || this.z);
        case 4: return !this.c; case 5: return !!this.c;
        case 6: return !this.z; case 7: return !!this.z;
        case 8: return !this.v; case 9: return !!this.v;
        case 10: return !this.n; case 11: return !!this.n;
        case 12: return this.n === this.v; case 13: return this.n !== this.v;
        case 14: return !this.z && this.n === this.v; case 15: return !!this.z || this.n !== this.v;
      }
    }
    needSuper() { if (!this.s) throw new Exc(8); }

    /* ---------- exceptions ---------- */
    exception(vec, info) {
      info = info || {};
      const oldSR = this.getSR();
      if (!this.s) { this.usp = this.A[7]; this.A[7] = this.ssp; }
      this.s = 1; this.t = 0;
      const handler = this.rd(vec * 4, 4);
      if (vec === 3) { // address error: 14-byte frame
        this.push32(this.curPC); this.push16(oldSR); this.push16(this.curOp); this.push32(info.addr || 0);
        this.push16((info.read ? 16 : 0) | (this.s ? 5 : 1));
      } else { this.push32(vec >= 32 && vec < 48 || vec === 4 || vec === 8 || vec === 10 || vec === 11 ? (vec === 4 || vec === 8 || vec === 10 || vec === 11 ? this.curPC : this.pc) : this.pc); this.push16(oldSR); }
      if (handler === 0 || (handler & 1)) {
        this.halted = `${VEC_NAMES[vec] || 'Exception ' + vec} at PC=$${this.curPC.toString(16).toUpperCase().padStart(6, '0')}${info.addr != null ? ' (address $' + info.addr.toString(16).toUpperCase() + ')' : ''}: no handler installed in the vector table`;
        this.excVec = vec;
        return;
      }
      this.pc = handler;
    }

    /* ---------- execution ---------- */
    step() {
      if (this.halted) return false;
      this.curPC = this.pc;
      try {
        if (this.pc & 1) throw new Exc(3, { addr: this.pc, read: true, ifetch: true });
        const op = this.fetch16(); this.curOp = op;
        this.exec(op);
      } catch (e) {
        if (e instanceof Exc) { this.exception(e.vec, e.info); }
        else throw e;
      }
      this.steps++;
      return !this.halted;
    }
    run(max, breakpoints) {
      let n = 0;
      while (!this.halted && n < max) {
        this.step(); n++;
        if (breakpoints && breakpoints.has(this.pc)) { this.hitBreak = this.pc; break; }
      }
      return n;
    }

    exec(op) {
      switch (op >>> 12) {
        case 0x0: return this.group0(op);
        case 0x1: return this.move(op, 1);
        case 0x2: return this.move(op, 4);
        case 0x3: return this.move(op, 2);
        case 0x4: return this.group4(op);
        case 0x5: return this.group5(op);
        case 0x6: return this.branch(op);
        case 0x7: { // MOVEQ
          if (op & 0x100) throw new Exc(4);
          const v = sx8(op & 0xFF) >>> 0; this.D[(op >> 9) & 7] = v; this.logicFlags(v, 4); return;
        }
        case 0x8: return this.group8(op);
        case 0x9: return this.addsub(op, true);
        case 0xA: throw new Exc(10);
        case 0xB: return this.groupB(op);
        case 0xC: return this.groupC(op);
        case 0xD: return this.addsub(op, false);
        case 0xE: return this.shifts(op);
        default:
          if (op === 0xFFFF) { this.fetch16(); this.halted = 'SIMHALT: simulation halted'; return; } // EASy68K pseudo-instruction $FFFF $FFFF
          throw new Exc(11);
      }
    }

    /* ----- MOVE / MOVEA ----- */
    move(op, sz) {
      const sm = (op >> 3) & 7, sr = op & 7, dm = (op >> 6) & 7, dr = (op >> 9) & 7;
      this.ea(sm, sr, sz);
      if (sz === 1 && sm === 1) throw new Exc(4);
      const v = this.get(sz);
      if (dm === 1) { // MOVEA
        if (sz === 1) throw new Exc(4);
        this.A[dr] = sz === 2 ? sx16(v) >>> 0 : v; return;
      }
      if (dm === 7 && dr > 1) throw new Exc(4);
      this.ea(dm, dr, sz);
      if (this.ek === 3) throw new Exc(4);
      this.put(sz, v); this.logicFlags(v, sz);
    }

    /* ----- group 0: immediate ops, bit ops, MOVEP ----- */
    group0(op) {
      const mode = (op >> 3) & 7, reg = op & 7;
      if (op & 0x100) { // dynamic bit ops or MOVEP
        if (mode === 1) return this.movep(op);
        return this.bitop((op >> 6) & 3, this.D[(op >> 9) & 7], mode, reg, true);
      }
      const kind = (op >> 9) & 7;
      if (kind === 4) { // static bit ops
        const bit = this.fetch16() & 0xFF;
        return this.bitop((op >> 6) & 3, bit, mode, reg, false);
      }
      if (kind === 7 || (kind === 4)) throw new Exc(4);
      const szc = (op >> 6) & 3; if (szc === 3) throw new Exc(4);
      const sz = 1 << szc;
      if (mode === 7 && reg === 4) { // to CCR / SR
        if (kind !== 0 && kind !== 1 && kind !== 5) throw new Exc(4);
        const imm = this.fetch16();
        if (sz === 1) { const m = imm & 0x1F, c = this.getCCR(); this.setCCR(kind === 0 ? c | m : kind === 1 ? c & m : c ^ m); return; }
        if (sz === 2) { this.needSuper(); const c = this.getSR(); this.setSR(kind === 0 ? c | imm : kind === 1 ? c & imm : c ^ imm); return; }
        throw new Exc(4);
      }
      const imm = sz === 4 ? this.fetch32() : (sz === 2 ? this.fetch16() : this.fetch16() & 0xFF);
      this.ea(mode, reg, sz);
      if (this.ek === 1 || this.ek === 3) throw new Exc(4);
      if (kind !== 6 && mode === 7 && reg > 1) throw new Exc(4);
      const d = this.get(sz); let r;
      switch (kind) {
        case 0: r = mk((d | imm), sz); this.logicFlags(r, sz); break;
        case 1: r = mk((d & imm), sz); this.logicFlags(r, sz); break;
        case 2: r = this.sub(imm, d, sz, 0); break;
        case 3: r = this.add(imm, d, sz, 0); break;
        case 5: r = mk((d ^ imm), sz); this.logicFlags(r, sz); break;
        case 6: this.sub(imm, d, sz, 0, false, true); return;
        default: throw new Exc(4);
      }
      this.put(sz, r >>> 0);
    }
    bitop(type, bit, mode, reg, dyn) {
      if (mode === 1) throw new Exc(4);
      if (mode === 0) {
        const b = bit & 31, m = (1 << b) >>> 0; let d = this.D[reg];
        this.z = (d & m) ? 0 : 1;
        if (type === 1) d ^= m; else if (type === 2) d &= ~m; else if (type === 3) d |= m;
        if (type) this.D[reg] = d >>> 0; return;
      }
      this.ea(mode, reg, 1);
      if (this.ek === 3 && (type !== 0 || dyn === false && false)) throw new Exc(4);
      if (this.ek === 3 && type !== 0) throw new Exc(4);
      if (mode === 7 && reg > 1 && type !== 0) throw new Exc(4);
      const b = bit & 7, m = 1 << b; let d = this.get(1);
      this.z = (d & m) ? 0 : 1;
      if (type === 1) d ^= m; else if (type === 2) d &= ~m; else if (type === 3) d |= m;
      if (type) this.put(1, d);
    }
    movep(op) {
      const dn = (op >> 9) & 7, an = op & 7, opm = (op >> 6) & 7, d = sx16(this.fetch16());
      let a = u32(this.A[an] + d);
      const long = opm & 1;
      if (opm < 6) { // memory -> register
        let v = this.rd(a, 1) << 8 | this.rd(a + 2, 1);
        if (long) v = (v << 16) | (this.rd(a + 4, 1) << 8) | this.rd(a + 6, 1);
        this.D[dn] = long ? v >>> 0 : (this.D[dn] & 0xFFFF0000) | (v & 0xFFFF);
      } else { // register -> memory
        const v = this.D[dn];
        if (long) { this.wr(a, 1, v >>> 24); this.wr(a + 2, 1, v >>> 16); this.wr(a + 4, 1, v >>> 8); this.wr(a + 6, 1, v); }
        else { this.wr(a, 1, v >>> 8); this.wr(a + 2, 1, v); }
      }
    }

    /* ----- group 4: miscellaneous ----- */
    group4(op) {
      const mode = (op >> 3) & 7, reg = op & 7;
      if ((op & 0x1C0) === 0x1C0) { // LEA (and CHK uses 0x180)
        if (mode === 0 || mode === 1 || mode === 3 || mode === 4 || (mode === 7 && reg > 3)) throw new Exc(4);
        this.A[(op >> 9) & 7] = this.ctlAddr(mode, reg); return;
      }
      if ((op & 0x1C0) === 0x180) { // CHK
        this.ea(mode, reg, 2); if (this.ek === 1) throw new Exc(4);
        const bound = sx16(this.get(2)), dn = sx16(this.D[(op >> 9) & 7] & 0xFFFF);
        if (dn < 0) { this.n = 1; throw new Exc(6); }
        if (dn > bound) { this.n = 0; throw new Exc(6); }
        return;
      }
      switch (op & 0xFF00) {
        case 0x4000: case 0x4200: case 0x4400: case 0x4600: {
          const szc = (op >> 6) & 3;
          if (szc === 3) { // MOVE from SR / to CCR / to SR
            const w = op & 0xFF00;
            if (w === 0x4000) { this.ea(mode, reg, 2); if (this.ek === 1 || this.ek === 3) throw new Exc(4); this.put(2, this.getSR()); return; }
            if (w === 0x4200) throw new Exc(4);
            if (w === 0x4400) { this.ea(mode, reg, 2); if (this.ek === 1) throw new Exc(4); this.setCCR(this.get(2) & 0x1F); return; }
            this.needSuper(); this.ea(mode, reg, 2); if (this.ek === 1) throw new Exc(4); this.setSR(this.get(2)); return;
          }
          const sz = 1 << szc;
          this.ea(mode, reg, sz); if (this.ek === 1 || this.ek === 3) throw new Exc(4);
          const w = op & 0xFF00, d = this.get(sz); let r;
          if (w === 0x4000) { r = this.sub(d, 0, sz, this.x, true); }               // NEGX
          else if (w === 0x4200) { r = 0; this.n = 0; this.z = 1; this.v = 0; this.c = 0; } // CLR
          else if (w === 0x4400) { r = this.sub(d, 0, sz, 0); }                      // NEG
          else { r = mk((~d), sz); this.logicFlags(r, sz); }                      // NOT
          this.put(sz, r >>> 0); return;
        }
        case 0x4800: {
          if ((op & 0xFFF8) === 0x4840) { const r = this.D[reg]; const v = u32(((r & 0xFFFF) << 16) | (r >>> 16)); this.D[reg] = v; this.logicFlags(v, 4); return; }
          if ((op & 0xFFF8) === 0x4880) { const v = sx8(this.D[reg] & 0xFF) & 0xFFFF; this.D[reg] = (this.D[reg] & 0xFFFF0000) | v; this.logicFlags(v, 2); return; }
          if ((op & 0xFFF8) === 0x48C0) { const v = sx16(this.D[reg] & 0xFFFF) >>> 0; this.D[reg] = v; this.logicFlags(v, 4); return; }
          if ((op & 0xFFC0) === 0x4840) { // PEA
            if (mode === 0 || mode === 1 || mode === 3 || mode === 4 || (mode === 7 && reg > 3)) throw new Exc(4);
            this.push32(this.ctlAddr(mode, reg)); return;
          }
          if ((op & 0xFFC0) === 0x4800) { // NBCD
            this.ea(mode, reg, 1); if (this.ek === 1 || this.ek === 3) throw new Exc(4);
            this.put(1, this.bcdSub(this.get(1), 0)); return;
          }
          if ((op & 0xFB80) === 0x4880) return this.movemOut(op); // MOVEM regs -> mem
          throw new Exc(4);
        }
        case 0x4A00: {
          if (op === 0x4AFC) throw new Exc(4);
          const szc = (op >> 6) & 3;
          if (szc === 3) { // TAS
            this.ea(mode, reg, 1); if (this.ek === 1 || this.ek === 3) throw new Exc(4);
            const d = this.get(1); this.logicFlags(d, 1); this.put(1, d | 0x80); return;
          }
          const sz = 1 << szc; this.ea(mode, reg, sz); if (this.ek === 3 || (this.ek === 1)) throw new Exc(4);
          this.logicFlags(this.get(sz), sz); return;
        }
        case 0x4C00: if ((op & 0xFF80) === 0x4C80) return this.movemIn(op); throw new Exc(4);
        case 0x4E00: return this.group4E(op);
        default: throw new Exc(4);
      }
    }
    movemOut(op) {
      const sz = (op & 0x40) ? 4 : 2, mode = (op >> 3) & 7, reg = op & 7;
      const mask = this.fetch16();
      if (mode === 0 || mode === 1 || mode === 3 || (mode === 7 && reg > 1)) throw new Exc(4);
      if (mode === 4) {
        let a = this.A[reg]; const init = a;
        for (let i = 0; i < 16; i++) { // bit0 = A7 ... bit15 = D0
          if (mask & (1 << i)) {
            const r = 15 - i; const val = r < 8 ? this.D[r] : (r - 8 === reg ? init : this.A[r - 8]);
            a = u32(a - sz); this.wr(a, sz, sz === 2 ? val & 0xFFFF : val);
          }
        }
        this.A[reg] = a; return;
      }
      let a = this.ctlAddr(mode, reg);
      for (let i = 0; i < 16; i++) if (mask & (1 << i)) { const val = i < 8 ? this.D[i] : this.A[i - 8]; this.wr(a, sz, sz === 2 ? val & 0xFFFF : val); a = u32(a + sz); }
    }
    movemIn(op) {
      const sz = (op & 0x40) ? 4 : 2, mode = (op >> 3) & 7, reg = op & 7;
      const mask = this.fetch16();
      if (mode === 0 || mode === 1 || mode === 4 || (mode === 7 && reg > 3)) throw new Exc(4);
      let a = mode === 3 ? this.A[reg] : this.ctlAddr(mode, reg);
      for (let i = 0; i < 16; i++) if (mask & (1 << i)) {
        let v = this.rd(a, sz); if (sz === 2) v = sx16(v) >>> 0;
        if (i < 8) this.D[i] = v; else this.A[i - 8] = v;
        a = u32(a + sz);
      }
      if (mode === 3) this.A[reg] = a;
    }
    group4E(op) {
      const reg = op & 7, mode = (op >> 3) & 7;
      if ((op & 0xFFF0) === 0x4E40) { // TRAP #n
        const n = op & 15;
        if (n === 15 && this.io && this.io.trap15) { this.io.trap15(this); return; }
        throw new Exc(32 + n);
      }
      switch (op & 0xFFF8) {
        case 0x4E50: { const d = sx16(this.fetch16()); this.push32(this.A[reg]); this.A[reg] = this.A[7]; this.A[7] = u32(this.A[7] + d); return; } // LINK
        case 0x4E58: this.A[7] = this.A[reg]; this.A[reg] = this.pop32(); return; // UNLK
        case 0x4E60: this.needSuper(); this.usp = this.A[reg]; return;
        case 0x4E68: this.needSuper(); this.A[reg] = this.usp; return;
      }
      switch (op) {
        case 0x4E70: this.needSuper(); return;                       // RESET
        case 0x4E71: return;                                          // NOP
        case 0x4E72: { this.needSuper(); const v = this.fetch16(); this.setSR(v); this.halted = 'STOP: processor stopped (STOP #$' + v.toString(16).toUpperCase().padStart(4, '0') + ')'; return; }
        case 0x4E73: { this.needSuper(); const sr = this.pop16(); const pc = this.pop32(); this.setSR(sr); this.pc = pc; return; } // RTE
        case 0x4E75: this.pc = this.pop32(); return;                  // RTS
        case 0x4E76: if (this.v) throw new Exc(7); return;            // TRAPV
        case 0x4E77: { this.setCCR(this.pop16() & 0x1F); this.pc = this.pop32(); return; } // RTR
      }
      if ((op & 0xFFC0) === 0x4E80 || (op & 0xFFC0) === 0x4EC0) { // JSR / JMP
        if (mode === 0 || mode === 1 || mode === 3 || mode === 4 || (mode === 7 && reg > 3)) throw new Exc(4);
        const t = this.ctlAddr(mode, reg);
        if (op & 0x40) { this.pc = t; } else { this.push32(this.pc); this.pc = t; }
        return;
      }
      throw new Exc(4);
    }

    /* ----- group 5: ADDQ SUBQ Scc DBcc ----- */
    group5(op) {
      const mode = (op >> 3) & 7, reg = op & 7;
      if (((op >> 6) & 3) === 3) {
        const cc = (op >> 8) & 15;
        if (mode === 1) { // DBcc
          const disp = sx16(this.fetch16()), base = this.pc - 2;
          if (!this.cond(cc)) {
            const w = ((this.D[reg] & 0xFFFF) - 1) & 0xFFFF;
            this.D[reg] = (this.D[reg] & 0xFFFF0000) | w;
            if (w !== 0xFFFF) this.pc = u32(base + disp);
          }
          return;
        }
        this.ea(mode, reg, 1); if (this.ek === 1 || this.ek === 3) throw new Exc(4);
        this.put(1, this.cond(cc) ? 0xFF : 0); return;
      }
      const sz = 1 << ((op >> 6) & 3); let q = (op >> 9) & 7; if (q === 0) q = 8;
      this.ea(mode, reg, sz);
      if (this.ek === 3) throw new Exc(4);
      if (this.ek === 1) { // address register: whole register, no flags
        if (sz === 1) throw new Exc(4);
        this.A[reg] = u32(op & 0x100 ? this.A[reg] - q : this.A[reg] + q); return;
      }
      const d = this.get(sz);
      const r = (op & 0x100) ? this.sub(q, d, sz, 0) : this.add(q, d, sz, 0);
      this.put(sz, r >>> 0);
    }

    /* ----- branches ----- */
    branch(op) {
      const cc = (op >> 8) & 15; let disp = op & 0xFF;
      const base = this.pc;
      if (disp === 0) disp = sx16(this.fetch16()); else if (disp === 0xFF) disp = this.fetch32() | 0; else disp = sx8(disp);
      if (cc === 1) { this.push32(this.pc); this.pc = u32(base + disp); return; }
      if (this.cond(cc)) this.pc = u32(base + disp);
    }

    /* ----- group 8: OR DIVU DIVS SBCD ----- */
    group8(op) {
      const dn = (op >> 9) & 7, mode = (op >> 3) & 7, reg = op & 7, opm = (op >> 6) & 7;
      if (opm === 3 || opm === 7) return this.div(op, opm === 7);
      if (opm === 4 && mode < 2) { // SBCD
        const rm = mode === 1;
        if (rm) { this.A[reg] = u32(this.A[reg] - (reg === 7 ? 2 : 1)); const s = this.rd(this.A[reg], 1); this.A[dn] = u32(this.A[dn] - (dn === 7 ? 2 : 1)); const d = this.rd(this.A[dn], 1); this.wr(this.A[dn], 1, this.bcdSub(s, d)); }
        else { this.D[dn] = (this.D[dn] & ~0xFF) | this.bcdSub(this.D[reg] & 0xFF, this.D[dn] & 0xFF); }
        return;
      }
      const sz = 1 << (opm & 3); if (sz === 8) throw new Exc(4);
      this.ea(mode, reg, sz);
      if (opm < 3) { if (this.ek === 1) throw new Exc(4); const r = mk((this.get(sz) | (mk(this.D[dn], sz))), sz); this.logicFlags(r, sz); this.D[dn] = sz === 4 ? r >>> 0 : (this.D[dn] & ~MASK[sz]) | r; }
      else { if (this.ek < 2 || this.ek === 3) throw new Exc(4); const r = mk((this.get(sz) | (mk(this.D[dn], sz))), sz); this.logicFlags(r, sz); this.put(sz, r >>> 0); }
    }
    div(op, signed) {
      const dn = (op >> 9) & 7; this.ea((op >> 3) & 7, op & 7, 2); if (this.ek === 1) throw new Exc(4);
      const dv = this.get(2), D = this.D[dn];
      if (dv === 0) throw new Exc(5);
      if (!signed) {
        const q = Math.floor(D / dv), r = D % dv;
        if (q > 0xFFFF) { this.v = 1; this.c = 0; return; }
        this.D[dn] = u32(((r & 0xFFFF) << 16) | q); this.n = (q & 0x8000) ? 1 : 0; this.z = q === 0 ? 1 : 0; this.v = 0; this.c = 0;
      } else {
        const dd = D | 0, ds = sx16(dv);
        let q = Math.trunc(dd / ds), r = dd % ds;
        if (q > 32767 || q < -32768) { this.v = 1; this.c = 0; return; }
        this.D[dn] = u32(((r & 0xFFFF) << 16) | (q & 0xFFFF)); this.n = q < 0 ? 1 : 0; this.z = q === 0 ? 1 : 0; this.v = 0; this.c = 0;
      }
    }
    bcdSub(s, d) { // d - s - X  (decimal)
      let lo = (d & 0xF) - (s & 0xF) - this.x, borrow = 0;
      if (lo < 0) { lo += 10; borrow = 1; }
      let hi = (d >> 4) - (s >> 4) - borrow, carry = 0;
      if (hi < 0) { hi += 10; carry = 1; }
      const r = ((hi << 4) | lo) & 0xFF;
      // use exact 68000 algorithm for binary-coded results
      const bin = (d & 0xFF) - (s & 0xFF) - this.x;
      let res = bin & 0xFF; let c = bin < 0 ? 1 : 0;
      if (((d & 0xF) - (s & 0xF) - this.x) < 0) { res = (res - 6) & 0xFF; }
      if (bin < 0 || (((d & 0xFF) - (s & 0xFF) - this.x - ((((d & 0xF) - (s & 0xF) - this.x) < 0) ? 6 : 0)) < 0)) { res = (res - 0x60) & 0xFF; c = 1; }
      this.c = c; this.x = c; if (res !== 0) this.z = 0; this.n = (res & 0x80) ? 1 : 0;
      return res;
    }
    bcdAdd(s, d) {
      let lo = (d & 0xF) + (s & 0xF) + this.x; let res = (d & 0xFF) + (s & 0xFF) + this.x; let c = 0;
      if (lo > 9) res += 6;
      if (res > 0x99) { res += 0x60; c = 1; }
      res &= 0xFF; this.c = c; this.x = c; if (res !== 0) this.z = 0; this.n = (res & 0x80) ? 1 : 0;
      return res;
    }

    /* ----- ADD / SUB (groups 9 and D) ----- */
    addsub(op, isSub) {
      const dn = (op >> 9) & 7, mode = (op >> 3) & 7, reg = op & 7, opm = (op >> 6) & 7;
      if (opm === 3 || opm === 7) { // ADDA / SUBA
        const sz = opm === 3 ? 2 : 4; this.ea(mode, reg, sz);
        let s = this.get(sz); if (sz === 2) s = sx16(s);
        this.A[dn] = u32(isSub ? this.A[dn] - s : this.A[dn] + s); return;
      }
      const sz = 1 << (opm & 3);
      if (opm >= 4 && mode < 2) { // ADDX / SUBX
        const rm = mode === 1; let s, d;
        if (rm) {
          const dec = (r) => (sz === 1 && r === 7 ? 2 : sz); this.A[reg] = u32(this.A[reg] - dec(reg)); s = this.rd(this.A[reg], sz);
          this.A[dn] = u32(this.A[dn] - dec(dn)); d = this.rd(this.A[dn], sz);
          const r = isSub ? this.sub(s, d, sz, this.x, true) : this.add(s, d, sz, this.x, true); this.wr(this.A[dn], sz, r);
        } else {
          s = mk(this.D[reg], sz); d = mk(this.D[dn], sz);
          const r = isSub ? this.sub(s, d, sz, this.x, true) : this.add(s, d, sz, this.x, true);
          this.D[dn] = sz === 4 ? r >>> 0 : (this.D[dn] & ~MASK[sz]) | r;
        }
        return;
      }
      this.ea(mode, reg, sz);
      if (opm < 3) {
        if (this.ek === 1 && sz === 1) throw new Exc(4);
        const s = this.get(sz), d = mk(this.D[dn], sz);
        const r = isSub ? this.sub(s, d, sz, 0) : this.add(s, d, sz, 0);
        this.D[dn] = sz === 4 ? r >>> 0 : (this.D[dn] & ~MASK[sz]) | r;
      } else {
        if (this.ek < 2 || this.ek === 3) throw new Exc(4);
        const s = mk(this.D[dn], sz), d = this.get(sz);
        const r = isSub ? this.sub(s, d, sz, 0) : this.add(s, d, sz, 0);
        this.put(sz, r >>> 0);
      }
    }

    /* ----- group B: CMP CMPA EOR CMPM ----- */
    groupB(op) {
      const dn = (op >> 9) & 7, mode = (op >> 3) & 7, reg = op & 7, opm = (op >> 6) & 7;
      if (opm === 3 || opm === 7) { // CMPA
        const sz = opm === 3 ? 2 : 4; this.ea(mode, reg, sz);
        let s = this.get(sz); if (sz === 2) s = sx16(s) >>> 0;
        this.sub(s >>> 0, this.A[dn], 4, 0, false, true); return;
      }
      const sz = 1 << (opm & 3);
      if (opm >= 4) {
        if (mode === 1) { // CMPM (Ay)+,(Ax)+
          const s = this.rd(this.A[reg], sz); this.A[reg] = u32(this.A[reg] + (sz === 1 && reg === 7 ? 2 : sz));
          const d = this.rd(this.A[dn], sz); this.A[dn] = u32(this.A[dn] + (sz === 1 && dn === 7 ? 2 : sz));
          this.sub(s, d, sz, 0, false, true); return;
        }
        this.ea(mode, reg, sz); if (this.ek === 1 || this.ek === 3) throw new Exc(4);
        const r = mk((this.get(sz) ^ (mk(this.D[dn], sz))), sz); this.logicFlags(r, sz); this.put(sz, r >>> 0); return;
      }
      this.ea(mode, reg, sz); if (this.ek === 1 && sz === 1) throw new Exc(4);
      this.sub(this.get(sz), mk(this.D[dn], sz), sz, 0, false, true);
    }

    /* ----- group C: AND MULU MULS ABCD EXG ----- */
    groupC(op) {
      const dn = (op >> 9) & 7, mode = (op >> 3) & 7, reg = op & 7, opm = (op >> 6) & 7;
      if (opm === 3 || opm === 7) { // MULU / MULS
        this.ea(mode, reg, 2); if (this.ek === 1) throw new Exc(4);
        const s = this.get(2), d = this.D[dn] & 0xFFFF;
        const r = opm === 3 ? u32(s * d) : u32(sx16(s) * sx16(d));
        this.D[dn] = r; this.logicFlags(r, 4); return;
      }
      if (opm === 4 && mode < 2) { // ABCD
        if (mode === 1) { this.A[reg] = u32(this.A[reg] - (reg === 7 ? 2 : 1)); const s = this.rd(this.A[reg], 1); this.A[dn] = u32(this.A[dn] - (dn === 7 ? 2 : 1)); const d = this.rd(this.A[dn], 1); this.wr(this.A[dn], 1, this.bcdAdd(s, d)); }
        else this.D[dn] = (this.D[dn] & ~0xFF) | this.bcdAdd(this.D[reg] & 0xFF, this.D[dn] & 0xFF);
        return;
      }
      if (opm === 5 && mode === 0) { const t = this.D[dn]; this.D[dn] = this.D[reg]; this.D[reg] = t; return; }       // EXG Dx,Dy
      if (opm === 5 && mode === 1) { const t = this.A[dn]; this.A[dn] = this.A[reg]; this.A[reg] = t; return; }       // EXG Ax,Ay
      if (opm === 6 && mode === 1) { const t = this.D[dn]; this.D[dn] = this.A[reg]; this.A[reg] = t; return; }       // EXG Dx,Ay
      const sz = 1 << (opm & 3); this.ea(mode, reg, sz);
      if (opm < 3) { if (this.ek === 1) throw new Exc(4); const r = mk((this.get(sz) & mk(this.D[dn], sz)), sz); this.logicFlags(r, sz); this.D[dn] = sz === 4 ? r >>> 0 : (this.D[dn] & ~MASK[sz]) | r; }
      else { if (this.ek < 2 || this.ek === 3) throw new Exc(4); const r = mk((this.get(sz) & mk(this.D[dn], sz)), sz); this.logicFlags(r, sz); this.put(sz, r >>> 0); }
    }

    /* ----- group E: shifts and rotates ----- */
    shifts(op) {
      if (((op >> 6) & 3) === 3) { // memory form: shift word by 1
        const mode = (op >> 3) & 7, reg = op & 7, type = (op >> 9) & 3, left = (op >> 8) & 1;
        if (op & 0x800) throw new Exc(4);
        this.ea(mode, reg, 2); if (this.ek < 2 || this.ek === 3) throw new Exc(4);
        if (mode === 7 && reg > 1) throw new Exc(4);
        this.put(2, this.shiftOp(type, left, this.get(2), 1, 2)); return;
      }
      const sz = 1 << ((op >> 6) & 3), type = (op >> 3) & 3, left = (op >> 8) & 1, reg = op & 7, cr = (op >> 9) & 7;
      let cnt = (op & 0x20) ? (this.D[cr] & 63) : (cr === 0 ? 8 : cr);
      const r = this.shiftOp(type, left, mk(this.D[reg], sz), cnt, sz);
      this.D[reg] = sz === 4 ? r >>> 0 : (this.D[reg] & ~MASK[sz]) | r;
    }
    shiftOp(type, left, val, cnt, sz) {
      const bits = sz * 8, msb = MSB[sz], mask = MASK[sz];
      let v = val, c = 0, ov = 0;
      if (cnt === 0) {
        this.c = type === 2 ? this.x : 0; this.v = 0; this.nz(v, sz); return v;
      }
      for (let i = 0; i < cnt; i++) {
        if (type === 0) { // arithmetic
          if (left) { c = (v & msb) ? 1 : 0; const nv = (v << 1) & mask; if (((nv ^ v) & msb)) ov = 1; v = sz === 4 ? nv >>> 0 : nv; }
          else { c = v & 1; v = ((v >>> 1) | (v & msb)) & mask; v = sz === 4 ? v >>> 0 : v; }
          this.x = c;
        } else if (type === 1) { // logical
          if (left) { c = (v & msb) ? 1 : 0; v = (v << 1) & mask; } else { c = v & 1; v = v >>> 1; }
          v = sz === 4 ? v >>> 0 : v; this.x = c;
        } else if (type === 2) { // rotate through X
          if (left) { c = (v & msb) ? 1 : 0; v = (((v << 1) & mask) | this.x); } else { c = v & 1; v = (v >>> 1) | (this.x ? msb : 0); }
          v = sz === 4 ? v >>> 0 : v & mask; this.x = c;
        } else { // rotate
          if (left) { c = (v & msb) ? 1 : 0; v = (((v << 1) & mask) | c); } else { c = v & 1; v = (v >>> 1) | (c ? msb : 0); }
          v = sz === 4 ? v >>> 0 : v & mask;
        }
      }
      this.c = c; this.v = type === 0 && left ? ov : 0; this.nz(v, sz);
      return v >>> 0;
    }
  }

  const api = { CPU, Exc, VEC_NAMES, MASK, MSB };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CPU68K = api;
})(typeof window !== 'undefined' ? window : globalThis);
