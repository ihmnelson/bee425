/* A small Z80 disassembler (documented instructions plus the common undocumented ones).
   Output uses the same syntax the assembler in asm.js accepts: dis(read, pc) -> { len, text, op }. */
(function (root) {
  'use strict';
  const R = ['B', 'C', 'D', 'E', 'H', 'L', '(HL)', 'A'];
  const RP = ['BC', 'DE', 'HL', 'SP'], RP2 = ['BC', 'DE', 'HL', 'AF'];
  const CC = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'];
  const ALU = ['ADD A,', 'ADC A,', 'SUB ', 'SBC A,', 'AND ', 'XOR ', 'OR ', 'CP '];
  const ROT = ['RLC', 'RRC', 'RL', 'RR', 'SLA', 'SRA', 'SLL', 'SRL'];
  const h2 = (v) => { const s = (v & 0xFF).toString(16).toUpperCase().padStart(2, '0'); return (/^[A-F]/.test(s) ? '0' : '') + s + 'H'; };
  const h4 = (v) => { const s = (v & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'); return (/^[A-F]/.test(s) ? '0' : '') + s + 'H'; };

  function dis(read, pc) {
    let p = pc & 0xFFFF; const start = p;
    const next = () => { const v = read(p) & 0xFF; p = (p + 1) & 0xFFFF; return v; };
    const word = () => { const lo = next(); return lo | (next() << 8); };
    let pfx = 0, op = next();
    if (op === 0xDD || op === 0xFD) { pfx = op; op = next(); if (op === 0xDD || op === 0xFD || op === 0xED) return { len: 1, text: 'DB ' + h2(pfx), op: 'DB', note: 'prefix with no effect' }; }
    const ix = pfx === 0xDD ? 'IX' : pfx === 0xFD ? 'IY' : 'HL';
    let used = false;
    const disp = () => { used = true; return disp0(); };
    const disp0 = () => { const d = (next() << 24) >> 24; return d < 0 ? '-' + h2(-d) : '+' + h2(d); };
    const mem = () => (pfx ? `(${ix}${disp()})` : '(HL)');
    const r8 = (i) => (i === 6 ? mem() : (i === 4 || i === 5) && pfx && (used = true) ? (i === 4 ? ix + 'H' : ix + 'L') : pfx && i === 4 ? ix + 'H' : pfx && i === 5 ? ix + 'L' : R[i]);
    const rp = (i) => (i === 2 ? (used = true, ix) : RP[i]);
    const rp2 = (i) => (i === 2 ? (used = true, ix) : RP2[i]);
    const done = (t) => (pfx && !used && !/\b(IX|IY)\b/.test(t) ? { len: 1, text: 'DB ' + h2(pfx), op: 'DB', note: 'prefix with no effect' } : { len: (p - start) & 0xFFFF, text: t, op: t.split(' ')[0] });
    const x = op >> 6, y = (op >> 3) & 7, z = op & 7, pp = y >> 1, q = y & 1;

    if (op === 0xCB) {
      let d = '', o;
      if (pfx) { d = disp(); o = next(); } else o = next();
      const ox = o >> 6, oy = (o >> 3) & 7, oz = o & 7;
      const tgt = pfx ? `(${ix}${d})` : R[oz];
      const extra = pfx && oz !== 6 ? ',' + R[oz] : '';
      if (ox === 0) return done(`${ROT[oy]} ${tgt}${extra}`);
      return done(`${['', 'BIT', 'RES', 'SET'][ox]} ${oy},${tgt}${ox === 1 ? '' : extra}`);
    }
    if (op === 0xED) {
      const o = next(), ox = o >> 6, oy = (o >> 3) & 7, oz = o & 7, op2 = oy >> 1, oq = oy & 1;
      if (ox === 1) {
        switch (oz) {
          case 0: return done(oy === 6 ? 'IN F,(C)' : `IN ${R[oy]},(C)`);
          case 1: return done(oy === 6 ? 'OUT (C),0' : `OUT (C),${R[oy]}`);
          case 2: return done(`${oq ? 'ADC' : 'SBC'} HL,${RP[op2]}`);
          case 3: { const n = word(); return done(oq ? `LD ${RP[op2]},(${h4(n)})` : `LD (${h4(n)}),${RP[op2]}`); }
          case 4: return done('NEG');
          case 5: return done(oy === 1 ? 'RETI' : 'RETN');
          case 6: return done('IM ' + [0, 0, 1, 2][oy & 3]);
          default: return done(['LD I,A', 'LD R,A', 'LD A,I', 'LD A,R', 'RRD', 'RLD', 'NOP', 'NOP'][oy]);
        }
      }
      if (!(ox === 1 || (ox === 2 && oy >= 4 && oz < 4))) return { len: 1, text: 'DB 0EDH', op: 'DB', note: 'undefined ED opcode (acts as NOP)' };
      if (ox === 2 && oy >= 4 && oz < 4) return done([['LDI', 'LDD', 'LDIR', 'LDDR'], ['CPI', 'CPD', 'CPIR', 'CPDR'], ['INI', 'IND', 'INIR', 'INDR'], ['OUTI', 'OUTD', 'OTIR', 'OTDR']][oz][oy - 4]);
      return done('NOP');
    }

    switch (x) {
      case 0:
        switch (z) {
          case 0:
            if (y === 0) return done('NOP');
            if (y === 1) return done("EX AF,AF'");
            { const d = (next() << 24) >> 24, t = (p + d) & 0xFFFF; return done(y === 2 ? `DJNZ ${h4(t)}` : y === 3 ? `JR ${h4(t)}` : `JR ${CC[y - 4]},${h4(t)}`); }
          case 1: if (!q) return done(`LD ${rp(pp)},${h4(word())}`); return done(`ADD ${ix},${rp(pp)}`);
          case 2:
            switch (y) {
              case 0: return done('LD (BC),A'); case 1: return done('LD A,(BC)'); case 2: return done('LD (DE),A'); case 3: return done('LD A,(DE)');
              case 4: return done(`LD (${h4(word())}),${ix}`); case 5: return done(`LD ${ix},(${h4(word())})`);
              case 6: return done(`LD (${h4(word())}),A`); default: return done(`LD A,(${h4(word())})`);
            }
          case 3: return done(`${q ? 'DEC' : 'INC'} ${rp(pp)}`);
          case 4: { const m = r8(y); return done(`INC ${m}`); }
          case 5: { const m = r8(y); return done(`DEC ${m}`); }
          case 6: { const m = r8(y); return done(`LD ${m},${h2(next())}`); }
          default: return done(['RLCA', 'RRCA', 'RLA', 'RRA', 'DAA', 'CPL', 'SCF', 'CCF'][y]);
        }
      case 1: {
        if (y === 6 && z === 6) return done('HALT');
        if (y === 6) { const m = mem(); return done(`LD ${m},${R[z]}`); }
        if (z === 6) { const m = mem(); return done(`LD ${R[y]},${m}`); }
        return done(`LD ${r8(y)},${r8(z)}`);
      }
      case 2: { const m = r8(z); return done(ALU[y] + m); }
      default:
        switch (z) {
          case 0: return done(`RET ${CC[y]}`);
          case 1:
            if (!q) return done(`POP ${rp2(pp)}`);
            return done(['RET', 'EXX', `JP (${ix})`, `LD SP,${ix}`][pp]);
          case 2: return done(`JP ${CC[y]},${h4(word())}`);
          case 3:
            switch (y) {
              case 0: return done(`JP ${h4(word())}`);
              case 2: return done(`OUT (${h2(next())}),A`);
              case 3: return done(`IN A,(${h2(next())})`);
              case 4: return done(`EX (SP),${ix}`);
              case 5: return done('EX DE,HL');
              case 6: return done('DI');
              default: return done('EI');
            }
          case 4: return done(`CALL ${CC[y]},${h4(word())}`);
          case 5: if (!q) return done(`PUSH ${rp2(pp)}`); return done(`CALL ${h4(word())}`);
          case 6: return done(ALU[y] + h2(next()));
          default: return done(`RST ${h2(y * 8)}`);
        }
    }
  }

  const api = { dis, h2, h4 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DisZ80 = api;
})(typeof window !== 'undefined' ? window : globalThis);
