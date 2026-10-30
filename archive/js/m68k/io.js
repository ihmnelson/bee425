/* EASy68K-style TRAP #15 services (text I/O, number I/O, time, halt).
   Task numbers and register conventions follow the EASy68K simulator help. */
(function (root) {
  'use strict';
  const u32 = (x) => x >>> 0;

  /* A text console with an input queue. `onOutput(text)` receives output; input arrives via feed(). */
  class Console {
    constructor(onOutput) { this.onOutput = onOutput || (() => {}); this.input = []; this.echo = true; this.text = ''; this.cleared = 0; }
    print(s) { this.text += s; this.onOutput(s); }
    clear() { this.text = ''; this.cleared++; this.onOutput(null); }
    feed(str) { this.input.push(...str.split('')); }       // characters, without newline handling
    feedLine(str) { this.input.push(...str.split(''), '\n'); }
    hasLine() { return this.input.includes('\n'); }
    hasChar() { return this.input.length > 0; }
    takeChar() { return this.input.shift(); }
    takeLine() { const i = this.input.indexOf('\n'); if (i < 0) return null; const line = this.input.splice(0, i + 1).slice(0, -1).join(''); return line; }
  }

  function parseNumber(str) {
    str = str.trim();
    let m;
    if ((m = /^-?\d+$/.exec(str))) return parseInt(str, 10) | 0;
    if ((m = /^\$([0-9a-f]+)$/i.exec(str))) return parseInt(m[1], 16) | 0;
    if ((m = /^%([01]+)$/.exec(str))) return parseInt(m[1], 2) | 0;
    return null;
  }
  const cstr = (cpu, addr, max) => { let s = '', n = 0; for (;;) { const b = cpu.mem[(addr + n) & 0xFFFFFF]; if (b === 0 || (max !== undefined && n >= max)) break; s += String.fromCharCode(b); n++; } return s; };

  /* returns a trap15 handler bound to `con`; sets cpu.waitInput when it needs the user to type */
  function makeTrap15(con, notes) {
    return function trap15(cpu) {
      const task = cpu.D[0] & 0xFF; const d1 = cpu.D[1], a1 = cpu.A[1];
      const waitFor = (kind) => { cpu.pc = cpu.curPC; cpu.waitInput = kind; };       // re-run this TRAP after input arrives
      cpu.waitInput = null;
      switch (task) {
        case 0: con.print(cstr(cpu, a1, Math.min(d1 & 0xFFFF, 255)) + '\r\n'); return;
        case 1: con.print(cstr(cpu, a1, Math.min(d1 & 0xFFFF, 255))); return;
        case 2: { // read string into (A1); length -> D1.W
          if (!con.hasLine()) return waitFor('line');
          let line = con.takeLine().slice(0, 80); for (let i = 0; i < line.length; i++) cpu.mem[(a1 + i) & 0xFFFFFF] = line.charCodeAt(i);
          cpu.mem[(a1 + line.length) & 0xFFFFFF] = 0; cpu.D[1] = (cpu.D[1] & 0xFFFF0000) | line.length; if (con.echo) con.print(line + '\r\n'); return;
        }
        case 3: con.print(String(d1 | 0)); return;
        case 4: { // read number into D1.L
          if (!con.hasLine()) return waitFor('number');
          const line = con.takeLine(); const n = parseNumber(line); if (con.echo) con.print(line + '\r\n');
          cpu.D[1] = n == null ? 0 : u32(n); return;
        }
        case 5: { if (!con.hasChar()) return waitFor('char'); const ch = con.takeChar(); cpu.D[1] = (cpu.D[1] & 0xFFFFFF00) | (ch === '\n' ? 13 : ch.charCodeAt(0)); if (con.echo) con.print(ch); return; }
        case 6: { const c = d1 & 0xFF; con.print(c === 13 ? '\r' : String.fromCharCode(c)); return; }
        case 7: cpu.D[1] = (cpu.D[1] & 0xFFFFFF00) | (con.hasChar() ? 1 : 0); return;
        case 8: { const d = new Date(); cpu.D[1] = u32(Math.floor(((d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds()) * 100 + d.getMilliseconds() / 10)); return; }
        case 9: cpu.halted = 'TRAP #15 task 9: simulation halted'; return;
        case 11: if ((d1 & 0xFFFF) === 0xFF00) con.clear(); else if ((d1 & 0xFFFF) === 0x00FF) cpu.D[1] = 0; return;   // clear screen / get cursor
        case 12: con.echo = (d1 & 0xFF) !== 0; return;
        case 13: con.print(cstr(cpu, a1) + '\r\n'); return;
        case 14: con.print(cstr(cpu, a1)); return;
        case 15: { const base = cpu.D[2] & 0xFF; if (base < 2 || base > 36) return; con.print(u32(d1).toString(base).toUpperCase()); return; }
        case 17: con.print(cstr(cpu, a1) + String(d1 | 0)); return;
        case 18: {
          if (!cpu.pendingPrompt) { con.print(cstr(cpu, a1)); cpu.pendingPrompt = true; }
          if (!con.hasLine()) { cpu.pc = cpu.curPC; cpu.waitInput = 'number'; return; }
          cpu.pendingPrompt = false; const line = con.takeLine(); const n = parseNumber(line); if (con.echo) con.print(line + '\r\n'); cpu.D[1] = n == null ? 0 : u32(n); return;
        }
        case 20: { const w = cpu.D[2] & 0xFF; con.print(String(d1 | 0).padStart(w, ' ')); return; }
        default:
          if (notes) notes(`TRAP #15 task ${task} is not supported in the browser (ignored).`);
      }
    };
  }

  const api = { Console, makeTrap15, parseNumber };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.IO68K = api;
})(typeof window !== 'undefined' ? window : globalThis);
