/* "Read Code": a plain-English breakdown of one line of Z80 assembly.
   Machine code and T-states come from the assembler and the CPU core, so they are never out of step with the simulator. */
(function (root) {
  'use strict';
  const A = root.AsmZ80 || require('./asm.js'), C = root.CPUZ80 || require('./cpu.js');
  const h = (v, w) => { const s = (v & (w === 4 ? 0xFFFF : 0xFF)).toString(16).toUpperCase().padStart(w, '0'); return (/^[A-F]/.test(s) ? '0' : '') + s + 'H'; };
  const lenient = (s) => A.evalExpr(s, { sym: () => undefined, pc: 0x100 });
  const SZ = { BC: 'BC', DE: 'DE', HL: 'HL', SP: 'SP', AF: 'AF', IX: 'IX', IY: 'IY' };

  function opText(o) {
    switch (o.k) {
      case 'r8': return `register ${o.n}`;
      case 'r8x': return `the undocumented register half ${o.n}`;
      case 'r16': return `register pair ${o.n}`;
      case 'af2': return "the alternate AF' pair";
      case 'ir': return `register ${o.n}`;
      case 'imm': return o.unres ? 'a value computed from a label or symbol' : `the constant ${h(o.v & 0xFFFF, o.v > 255 || o.v < -128 ? 4 : 2)} (${o.v})`;
      case 'mem': return o.unres ? 'the memory byte at a labelled address' : `the memory byte at address ${h(o.v, 4)}`;
      case 'ind': return o.n === 'C' ? 'the port whose number is in register C' : `the memory byte whose address is in ${o.n}`;
      case 'idx': return `the memory byte at ${o.n} ${o.d < 0 ? '−' : '+'} ${Math.abs(o.d)}`;
      default: return '?';
    }
  }

  const FL = {
    arith: 'S, Z, H, P/V (overflow), N and C are all updated (N = 0 for add, 1 for subtract).',
    logic: 'S, Z and P/V (parity) are set from the result; H = 1 for AND and 0 for OR/XOR; N = 0 and C = 0.',
    incdec: 'S, Z, H and P/V (overflow) are updated; N = 0 for INC, 1 for DEC; C is not changed.',
    none: 'No flags are changed.',
    rot: 'C gets the bit shifted out; S, Z and P/V (parity) follow the result; H = 0, N = 0.',
    rota: 'Only C (and H = 0, N = 0) change; S, Z and P/V are untouched.',
  };
  const DESC = {
    LD: (a, o) => ({ lines: [`Copies ${opText(o[1])} into ${opText(o[0])}. The source is not changed.`, 'The destination is the first operand.'], flags: FL.none }),
    PUSH: (a, o) => ({ lines: [`Pushes ${o[0].n} on the stack: SP is decremented twice and the high byte is stored at the higher address.`], flags: FL.none }),
    POP: (a, o) => ({ lines: [`Pops two bytes from the top of the stack into ${o[0].n} and adds 2 to SP.`], flags: o[0].n === 'AF' ? 'All flags are loaded from the stack.' : FL.none }),
    EX: (a, o) => ({ lines: [o[0].k === 'af2' || o[1].k === 'af2' ? "Swaps AF with the alternate pair AF'." : o[0].k === 'ind' ? `Swaps ${o[1].n} with the 16-bit value on top of the stack.` : 'Swaps DE and HL.'], flags: o[0].k === 'r16' && o[0].n === 'AF' ? "AF is replaced by AF'." : FL.none }),
    EXX: () => ({ lines: ["Swaps BC, DE and HL with the alternate pairs BC', DE', HL'. Quick way to save a set of registers."], flags: FL.none }),
    ADD: (a, o) => o[0].k === 'r16' ? ({ lines: [`Adds ${o[1].n} to ${o[0].n} (16-bit).`], flags: 'C is set from bit 15; H and N are updated; S, Z and P/V are not changed.' }) : ({ lines: [`A = A + ${opText(o[o.length - 1])}.`], flags: FL.arith }),
    ADC: (a, o) => o[0].k === 'r16' ? ({ lines: [`HL = HL + ${o[1].n} + carry.`], flags: 'All flags are updated, including Z for the 16-bit result.' }) : ({ lines: [`A = A + ${opText(o[o.length - 1])} + carry.`], flags: FL.arith }),
    SUB: (a, o) => ({ lines: [`A = A − ${opText(o[o.length - 1])}.`], flags: FL.arith }),
    SBC: (a, o) => o[0].k === 'r16' ? ({ lines: [`HL = HL − ${o[1].n} − carry.`], flags: 'All flags are updated. There is no plain 16-bit SUB: clear the carry first with OR A.' }) : ({ lines: [`A = A − ${opText(o[o.length - 1])} − carry.`], flags: FL.arith }),
    AND: (a, o) => ({ lines: [`A = A AND ${opText(o[o.length - 1])} (bitwise).`], flags: FL.logic }),
    OR: (a, o) => ({ lines: [`A = A OR ${opText(o[o.length - 1])} (bitwise).`, 'OR A leaves A alone and just sets the flags.'], flags: FL.logic }),
    XOR: (a, o) => ({ lines: [`A = A XOR ${opText(o[o.length - 1])} (bitwise).`, 'XOR A is the quickest way to set A = 0.'], flags: FL.logic }),
    CP: (a, o) => ({ lines: [`Compares A with ${opText(o[o.length - 1])}: computes A − operand, sets the flags and throws the result away.`, 'Afterwards Z = 1 means equal and C = 1 means A was smaller (unsigned).'], flags: FL.arith }),
    INC: (a, o) => o[0].k === 'r16' ? ({ lines: [`${o[0].n} = ${o[0].n} + 1 (16-bit).`], flags: FL.none }) : ({ lines: [`Adds 1 to ${opText(o[0])}.`], flags: FL.incdec }),
    DEC: (a, o) => o[0].k === 'r16' ? ({ lines: [`${o[0].n} = ${o[0].n} − 1 (16-bit).`], flags: FL.none }) : ({ lines: [`Subtracts 1 from ${opText(o[0])}.`], flags: FL.incdec }),
    DAA: () => ({ lines: ['Decimal adjust: after adding or subtracting two packed-BCD bytes, corrects A so it is a valid BCD result.'], flags: 'Uses H, C and N; sets S, Z, P/V (parity) and C.' }),
    CPL: () => ({ lines: ['Complements every bit of A (one\'s complement).'], flags: 'H = 1 and N = 1; the other flags are unchanged.' }),
    NEG: () => ({ lines: ['A = 0 − A (two\'s complement).'], flags: 'All flags updated; C = 1 unless A was 0; P/V = 1 if A was 80H.' }),
    CCF: () => ({ lines: ['Complements the carry flag.'], flags: 'C is inverted, H takes the old C, N = 0.' }),
    SCF: () => ({ lines: ['Sets the carry flag.'], flags: 'C = 1, H = 0, N = 0.' }),
    NOP: () => ({ lines: ['Does nothing for 4 clock cycles. The machine code is 00H.'], flags: FL.none }),
    HALT: () => ({ lines: ['Stops executing instructions (it runs NOPs) until an interrupt or reset arrives. The Oshonsoft IDE can end the simulation here.'], flags: FL.none }),
    DI: () => ({ lines: ['Disables maskable interrupts.'], flags: FL.none }),
    EI: () => ({ lines: ['Enables maskable interrupts after the next instruction has executed.'], flags: FL.none }),
    IM: (a, o) => ({ lines: [`Selects interrupt mode ${o[0].v}: ${['the device supplies an instruction (usually an RST)', 'every interrupt jumps to 0038H', 'the device supplies a vector byte; with register I it points into a table of addresses'][o[0].v]}.`], flags: FL.none }),
    RLCA: () => ({ lines: ['Rotates A left; bit 7 goes to bit 0 and to the carry flag.'], flags: FL.rota }),
    RRCA: () => ({ lines: ['Rotates A right; bit 0 goes to bit 7 and to the carry flag.'], flags: FL.rota }),
    RLA: () => ({ lines: ['Rotates A left through the carry: the old carry enters bit 0 and bit 7 becomes the new carry.'], flags: FL.rota }),
    RRA: () => ({ lines: ['Rotates A right through the carry: the old carry enters bit 7 and bit 0 becomes the new carry.'], flags: FL.rota }),
    RLC: (a, o) => ({ lines: [`Rotates ${opText(o[0])} left; bit 7 goes to bit 0 and to the carry.`], flags: FL.rot }),
    RRC: (a, o) => ({ lines: [`Rotates ${opText(o[0])} right; bit 0 goes to bit 7 and to the carry.`], flags: FL.rot }),
    RL: (a, o) => ({ lines: [`Rotates ${opText(o[0])} left through the carry.`], flags: FL.rot }),
    RR: (a, o) => ({ lines: [`Rotates ${opText(o[0])} right through the carry.`], flags: FL.rot }),
    SLA: (a, o) => ({ lines: [`Arithmetic shift left of ${opText(o[0])}: bit 7 goes to the carry, 0 enters bit 0 (multiplies by 2).`], flags: FL.rot }),
    SRA: (a, o) => ({ lines: [`Arithmetic shift right of ${opText(o[0])}: bit 0 goes to the carry, bit 7 is kept (signed divide by 2).`], flags: FL.rot }),
    SRL: (a, o) => ({ lines: [`Logical shift right of ${opText(o[0])}: bit 0 goes to the carry, 0 enters bit 7 (unsigned divide by 2).`], flags: FL.rot }),
    SLL: (a, o) => ({ lines: [`Undocumented: shift left of ${opText(o[0])}, but 1 enters bit 0.`], flags: FL.rot }),
    BIT: (a, o) => ({ lines: [`Tests bit ${o[0].v} of ${opText(o[1])}: Z = 1 if the bit is 0.`], flags: 'Z = complement of the bit, H = 1, N = 0; C is unchanged.' }),
    SET: (a, o) => ({ lines: [`Sets bit ${o[0].v} of ${opText(o[1])} to 1.`], flags: FL.none }),
    RES: (a, o) => ({ lines: [`Clears bit ${o[0].v} of ${opText(o[1])} to 0.`], flags: FL.none }),
    JP: (a, o) => o.length === 2 ? ({ lines: [`If condition ${a[0].toUpperCase()} is true, jumps to the 16-bit address ${a[1]}; otherwise carries on.`], flags: FL.none }) : o[0].k === 'ind' || o[0].k === 'idx' ? ({ lines: [`Jumps to the address held in ${o[0].n === 'HL' ? 'HL' : o[0].n}. (The brackets mean "the contents of", not a memory read.)`], flags: FL.none }) : ({ lines: [`Jumps to ${a[0]} (a 16-bit absolute address).`], flags: FL.none }),
    JR: (a, o) => o.length === 2 ? ({ lines: [`If condition ${a[0].toUpperCase()} is true, jumps relative to ${a[1]} (signed 8-bit offset); otherwise carries on.`, 'JR can test only NZ, Z, NC and C.'], flags: FL.none }) : ({ lines: [`Jumps relative to ${a[0]}: PC + a signed 8-bit offset (about −126 to +129 bytes).`], flags: FL.none }),
    DJNZ: (a) => ({ lines: [`Decrements B; if B is not zero, jumps relative to ${a[0]}. A built-in loop counter.`], flags: FL.none }),
    CALL: (a, o) => o.length === 2 ? ({ lines: [`If condition ${a[0].toUpperCase()} is true, pushes the return address and jumps to ${a[1]}.`], flags: FL.none }) : ({ lines: [`Pushes the address of the next instruction on the stack and jumps to ${a[0]}.`], flags: FL.none }),
    RET: (a, o) => o.length ? ({ lines: [`If condition ${a[0].toUpperCase()} is true, pops the return address into PC.`], flags: FL.none }) : ({ lines: ['Pops the return address off the stack into PC.'], flags: FL.none }),
    RETI: () => ({ lines: ['Returns from an interrupt routine (pops PC) and tells Z80 peripherals the routine is finished.'], flags: FL.none }),
    RETN: () => ({ lines: ['Returns from a non-maskable interrupt and restores the interrupt-enable state.'], flags: FL.none }),
    RST: (a, o) => ({ lines: [`A one-byte CALL to address ${h(o[0].v, 4)} in page zero.`], flags: FL.none }),
    IN: (a, o) => o.length === 2 && o[1].k === 'mem' ? ({ lines: [`Reads one byte from I/O port ${h(o[1].v, 2)} into A.`], flags: FL.none }) : ({ lines: ['Reads one byte from the port numbered in C.'], flags: 'S, Z, H, P/V (parity) are set; N = 0; C unchanged.' }),
    OUT: (a, o) => o[0].k === 'mem' ? ({ lines: [`Writes A to I/O port ${h(o[0].v, 2)}.`], flags: FL.none }) : ({ lines: ['Writes a register to the port numbered in C.'], flags: FL.none }),
    LDI: () => ({ lines: ['Copies (HL) to (DE), then HL = HL + 1, DE = DE + 1, BC = BC − 1.'], flags: 'P/V = 1 if BC ≠ 0; H = 0, N = 0.' }),
    LDD: () => ({ lines: ['Copies (HL) to (DE), then HL = HL − 1, DE = DE − 1, BC = BC − 1.'], flags: 'P/V = 1 if BC ≠ 0; H = 0, N = 0.' }),
    LDIR: () => ({ lines: ['Block copy: repeats LDI until BC = 0. Set HL (source), DE (destination) and BC (count) first.'], flags: 'P/V = 0, H = 0, N = 0 when finished.' }),
    LDDR: () => ({ lines: ['Block copy backwards: repeats LDD until BC = 0.'], flags: 'P/V = 0, H = 0, N = 0 when finished.' }),
    CPI: () => ({ lines: ['Compares A with (HL), then HL = HL + 1 and BC = BC − 1.'], flags: 'Z = 1 on a match; P/V = 1 if BC ≠ 0; N = 1; C unchanged.' }),
    CPIR: () => ({ lines: ['Searches memory: repeats CPI until A matches (HL) or BC = 0.'], flags: 'Z = 1 on a match; P/V = 1 if BC ≠ 0 afterwards.' }),
    CPD: () => ({ lines: ['Compares A with (HL), then HL = HL − 1 and BC = BC − 1.'], flags: 'Z = 1 on a match; P/V = 1 if BC ≠ 0.' }),
    CPDR: () => ({ lines: ['Searches backwards: repeats CPD until a match or BC = 0.'], flags: 'Z = 1 on a match.' }),
    RLD: () => ({ lines: ['Rotates the BCD digits of (HL) and the low nibble of A one digit to the left.'], flags: 'S, Z and P/V follow A.' }),
    RRD: () => ({ lines: ['Rotates the BCD digits of (HL) and the low nibble of A one digit to the right.'], flags: 'S, Z and P/V follow A.' }),
  };

  function timing(bytes) {
    const set = new Set();
    for (const f of [0x00, 0xFF]) for (const b of [1, 2]) {
      const cpu = new C.CPU(); cpu.mem.set(bytes, 0x100); cpu.pc = 0x100; cpu.sp = 0xF000; cpu.f = f; cpu.b = b; cpu.io = { in: () => 0 };
      cpu.hl = 0x4000; cpu.bc = (b << 8) | 2; cpu.de = 0x5000; cpu.ix = 0x6000; cpu.iy = 0x6000;
      try { set.add(cpu.step()); } catch (e) { /* ignore */ }
    }
    return [...set].sort((x, y) => x - y);
  }

  function explain(line) {
    const out = { title: '', lines: [], flags: '', notes: [], bytes: null, tstates: null };
    let text = String(line).replace(/;.*$/, '').trim();
    if (!text) { out.title = '(blank line)'; out.lines = ['Nothing to do: blank lines and comments are ignored by the assembler.']; return out; }
    if (/^\s*;/.test(line)) { out.title = 'Comment'; out.lines = ['A semicolon starts a comment; the assembler ignores the rest of the line.']; return out; }
    let m, label = null;
    if ((m = /^([A-Za-z_?@][A-Za-z0-9_?@]*)\s*:/.exec(text))) { label = m[1]; text = text.slice(m[0].length).trim(); }
    else if (/^\S/.test(line) && (m = /^([A-Za-z_?@][A-Za-z0-9_?@]*)(\s+|$)/.exec(text)) && !A.MNEMONICS.has(m[1].toUpperCase()) && !A.DIRECTIVES.has(m[1].toUpperCase())) { label = m[1]; text = text.slice(m[0].length).trim(); }
    if (label) out.notes.push(/^\.?(EQU|=)\b/i.test(text) || /^=/.test(text) ? `\`${label}\` is a symbol that takes the value given on this line.` : `\`${label}\` is a label: a name for the address of this spot. Other instructions can jump to it or load its address.`);
    if (!text) { out.title = `Label ${label}`; out.lines = ['This line only defines a label.']; return out; }
    m = /^\.?([A-Za-z_]+|=)\s*(.*)$/.exec(text);
    if (!m) { out.title = 'Not understood'; out.lines = ['This does not look like Z80 assembly.']; return out; }
    const mn = m[1].toUpperCase(), rest = m[2];
    out.title = mn + (rest ? ' ' + rest : '');
    if (A.DIRECTIVES.has(mn) || mn === '=') {
      const D = {
        ORG: 'Sets the address where the following code or data is placed.', EQU: 'Gives a name a value. It generates no code.', '=': 'Gives a name a value (same as EQU).', END: 'Marks the end of the source.',
        DB: 'Stores byte values (numbers or characters) in memory, one after another.', DEFB: 'Stores byte values (numbers or characters) in memory, one after another.', BYTE: 'Stores byte values in memory.',
        DW: 'Stores 16-bit words in memory, low byte first (little-endian).', DEFW: 'Stores 16-bit words in memory, low byte first (little-endian).', WORD: 'Stores 16-bit words in memory.',
        DS: 'Reserves a block of bytes (filled with 0).', DEFS: 'Reserves a block of bytes (filled with 0).', BLOCK: 'Reserves a block of bytes.', INCLUDE: 'Not supported in this editor.',
      };
      out.lines = [`Assembler directive: ${D[mn]}`]; out.notes.push('Directives are instructions to the assembler, not to the CPU. In the Oshonsoft IDE they may be written with a leading period (.ORG, .EQU, .DB).');
      return out;
    }
    if (!A.MNEMONICS.has(mn)) { out.title = mn; out.lines = [`"${mn}" is not a Z80 mnemonic that this site knows.`]; return out; }
    // operands
    const parts = rest.trim() ? (function split(s) { const r = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { r.push(cur.trim()); cur = ''; } else cur += ch; } r.push(cur.trim()); return r; }(rest)) : [];
    const CCS = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'];
    const isCond = (s) => CCS.includes(s.toUpperCase());
    let ops;
    try {
      ops = parts.map((p, i) => {
        if ((mn === 'JP' || mn === 'JR' || mn === 'CALL') && parts.length === 2 && i === 0) return { k: 'cc', n: p.toUpperCase() };
        if (mn === 'RET' && i === 0 && isCond(p)) return { k: 'cc', n: p.toUpperCase() };
        return A.classify(p, lenient);
      });
    } catch (e) { out.lines = [`Cannot read the operands: ${e.message}`]; return out; }
    // bytes and T-states
    try {
      const bytes = A.encode(mn, parts, lenient, 0x100, false);
      out.bytes = bytes; out.tstates = timing(bytes);
    } catch (e) { out.notes.push(`This line will not assemble: ${e.message}.`); }
    const d = DESC[mn];
    if (d) { try { const r = d(parts, ops); out.lines = r.lines; out.flags = r.flags; } catch (e) { out.lines = ['(no description for this form)']; } }
    if ((mn === 'IN' || mn === 'OUT') && ops.some((o) => o.k === 'mem')) out.notes.push('The brackets around the port number mean "I/O port" here, not a memory address: IN and OUT use a separate address space.');
    else if (ops.some((o) => o.k === 'ind' && o.n !== 'C') || ops.some((o) => o.k === 'mem')) out.notes.push('Brackets or parentheses around an operand mean "the memory at that address" (Oshonsoft accepts both, so [HL] is the same as (HL)).');
    if (mn === 'LD' || mn === 'ADD' || mn === 'SUB') out.notes.push('The destination comes first on the Z80 (the 68K writes the source first).');
    if (out.bytes) out.notes.push(`Machine code: ${out.bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')} (${out.bytes.length} byte${out.bytes.length > 1 ? 's' : ''}); ${out.tstates.length > 1 ? out.tstates.join(' or ') : out.tstates[0]} T-states on the simulator's CPU core.`);
    return out;
  }

  const api = { explain };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Explain = api;
})(typeof window !== 'undefined' ? window : globalThis);
