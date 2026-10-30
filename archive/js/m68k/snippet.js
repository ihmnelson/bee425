/* A tiny helper that runs a few lines of assembly on the real CPU core with a preset register/memory state.
   The arcade games use it to generate and grade questions, so they share one verified emulator. */
(function (root) {
  'use strict';
  const A = root.Asm68K || require('./asm.js'), C = root.CPU68K || require('./cpu.js');
  const CCNAME = { T: 0, F: 1, HI: 2, LS: 3, CC: 4, HS: 4, CS: 5, LO: 5, NE: 6, EQ: 7, VC: 8, VS: 9, PL: 10, MI: 11, GE: 12, LT: 13, GT: 14, LE: 15 };
  const hex8 = (v) => '$' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');

  class Sim {
    /* init: { D:{n:v}, A:{n:v}, mem:{addr:[bytes]}, f:{X,N,Z,V,C} } */
    constructor(init) { this.init = init || {}; this.D = new Array(8).fill(0); this.A = new Array(8).fill(0); this.f = { X: 0, N: 0, Z: 0, V: 0, C: 0 }; this.cpu = null; this.lines = []; this._build(); }
    _build() {
      const i = this.init, src = ['        ORG $100'];
      for (const [k, v] of Object.entries(i.D || {})) src.push(`        MOVE.L #${hex8(v)},D${k}`);
      for (const [k, v] of Object.entries(i.A || {})) src.push(`        MOVEA.L #${hex8(v)},A${k}`);
      const f = i.f || {}; const ccr = (f.X ? 16 : 0) | (f.N ? 8 : 0) | (f.Z ? 4 : 0) | (f.V ? 2 : 0) | (f.C ? 1 : 0);
      src.push(`        MOVE.W #${ccr},CCR`, 'TESTSTART');
      this.setup = src; this.dataLines = [];
      for (const [addr, bytes] of Object.entries(i.mem || {})) { this.dataLines.push(`        ORG ${hex8(+addr)}`, `        DC.B ${bytes.map((b) => '$' + (b & 255).toString(16)).join(',')}`); }
      this._sync();
    }
    _assemble(extra) {
      const src = [...this.setup, ...extra, '        SIMHALT', ...this.dataLines, '        END $100'].join('\n');
      const r = A.assemble(src);
      if (!r.ok) throw new Error(r.errors.map((e) => e.msg).join('; '));
      return r;
    }
    _sync() {
      const r = this._assemble([]); this._exec(r); // initial state (no test code)
    }
    _exec(r) {
      const cpu = new C.CPU(); for (const seg of r.image) cpu.mem.set(seg.bytes, seg.addr);
      cpu.A[7] = 0x00FF0000; cpu.pc = r.start; cpu.run(100000);
      if (cpu.halted && !/^SIMHALT/.test(cpu.halted)) throw new Error(cpu.halted);
      this.cpu = cpu; this.D = Array.from(cpu.D); this.A = Array.from(cpu.A);
      this.f = { X: cpu.x, N: cpu.n, Z: cpu.z, V: cpu.v, C: cpu.c };
    }
    run(lines) { this.lines.push(...lines); this._exec(this._assemble(this.lines.map((l) => '        ' + l.replace(/^\s+/, '')))); return this; }
    exec(line) { return this.run([line]); }
    readMem(addr, size) { const m = this.cpu.mem; let v = 0; for (let i = 0; i < size; i++) v = v * 256 + m[(addr + i) & 0xFFFFFF]; return v >>> 0; }
    rb(addr) { return this.cpu.mem[addr & 0xFFFFFF]; }
    taken(cc) { return this.cpu.cond(CCNAME[cc.toUpperCase()]); }
  }
  const signExt = (v, size) => { const bits = { B: 8, W: 16, L: 32 }[size]; v &= bits === 32 ? 0xFFFFFFFF : (1 << bits) - 1; return (bits === 32 ? v >>> 0 : v) >= 2 ** (bits - 1) ? v - 2 ** bits : v; };
  const MASK = { B: 0xFF, W: 0xFFFF, L: 0xFFFFFFFF };
  const api = { Sim, toSigned: signExt, MASK };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Snippet68K = api;
})(typeof window !== 'undefined' ? window : globalThis);
