/* A tiny helper that runs a few lines of Z80 assembly on the real CPU core with a preset register/memory state.
   The arcade games use it to generate and grade questions, so they share one verified emulator. */
(function (root) {
  'use strict';
  const A = root.AsmZ80 || require('./asm.js'), C = root.CPUZ80 || require('./cpu.js');
  const FL = { S: 0x80, Z: 0x40, H: 0x10, P: 0x04, N: 0x02, C: 0x01 };
  const CCBIT = { NZ: [0x40, 0], Z: [0x40, 1], NC: [0x01, 0], C: [0x01, 1], PO: [0x04, 0], PE: [0x04, 1], P: [0x80, 0], M: [0x80, 1] };
  const REG8 = ['B', 'C', 'D', 'E', 'H', 'L', null, 'A'];

  class Sim {
    /* init: { A:v, B:v, ... (bytes), BC/DE/HL/IX/IY/SP:v (words), f:{S,Z,H,P,N,C}, mem:{addr:[bytes]} }
       All other registers and flags start at 0.  Test code is assembled at 0100H followed by HALT. */
    constructor(init) { this.init = init || {}; this.lines = []; this.cpu = null; this._exec([]); }
    _exec(lines) {
      const src = ['        ORG 0100H', ...lines.map((l) => '        ' + l.replace(/^\s+/, '')), '        HALT'].join('\n');
      const r = A.assemble(src);
      if (!r.ok) throw new Error(r.errors.map((e) => e.msg).join('; '));
      const cpu = new C.CPU(), i = this.init;
      cpu.mem.set(r.mem.subarray(0x100, 0x100 + r.size), 0x100);
      for (const [addr, bytes] of Object.entries(i.mem || {})) bytes.forEach((b, k) => { cpu.mem[(+addr + k) & 0xFFFF] = b; });
      REG8.forEach((n, k) => { if (n && i[n] !== undefined) cpu.R[k] = i[n] & 0xFF; });
      for (const n of ['BC', 'DE', 'HL']) if (i[n] !== undefined) cpu[n.toLowerCase()] = i[n];
      if (i.IX !== undefined) cpu.ix = i.IX; if (i.IY !== undefined) cpu.iy = i.IY;
      cpu.sp = i.SP !== undefined ? i.SP : 0xF000;
      if (i.f) for (const k of Object.keys(i.f)) if (i.f[k]) cpu.f |= FL[k];
      cpu.pc = 0x100;
      let n = 0; while (!cpu.halted && n++ < 100000) cpu.step();
      if (!cpu.halted) throw new Error('program did not halt');
      this.cpu = cpu;
    }
    run(lines) { this.lines.push(...lines); this._exec(this.lines); return this; }
    exec(line) { return this.run([line]); }
    get regs() { const c = this.cpu; return { A: c.a, B: c.b, C: c.c, D: c.d, E: c.e, H: c.h, L: c.l, BC: c.bc, DE: c.de, HL: c.hl, IX: c.ix, IY: c.iy, SP: c.sp, F: c.f }; }
    get flags() { const f = this.cpu.f; return { S: (f >> 7) & 1, Z: (f >> 6) & 1, H: (f >> 4) & 1, P: (f >> 2) & 1, N: (f >> 1) & 1, C: f & 1 }; }
    readMem(addr, size) { let v = 0; for (let i = size - 1; i >= 0; i--) v = v * 256 + this.cpu.mem[(addr + i) & 0xFFFF]; return v; }   // little-endian
    rb(addr) { return this.cpu.mem[addr & 0xFFFF]; }
    taken(cc) { const [m, want] = CCBIT[cc.toUpperCase()]; return ((this.cpu.f & m) !== 0 ? 1 : 0) === want; }
  }
  const toSigned = (v, bits) => { v &= bits === 16 ? 0xFFFF : 0xFF; return v >= 2 ** (bits - 1) ? v - 2 ** bits : v; };
  const api = { Sim, toSigned, FL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SnippetZ80 = api;
})(typeof window !== 'undefined' ? window : globalThis);
