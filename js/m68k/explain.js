/* Plain-English explanation of a single 68000 assembly line. */
(function (root) {
  'use strict';
  const splitOps = (str) => { // split on commas outside parentheses
    const out = []; let depth = 0, cur = '';
    for (const ch of str) { if (ch === '(') depth++; else if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; }
    if (cur.trim() !== '') out.push(cur); return out;
  };
  const SIZE_NAME = { B: 'byte (8 bits)', W: 'word (16 bits)', L: 'long word (32 bits)' };
  const SIZE_BITS = { B: 8, W: 16, L: 32 };
  const SIZE_STEP = { B: 1, W: 2, L: 4 };
  const REG = /^(D[0-7]|A[0-7]|SP)$/i;
  const CC = {
    EQ: 'Z = 1 (equal / result was zero)', NE: 'Z = 0 (not equal / non-zero)', CS: 'C = 1 (unsigned lower / carry set)', CC: 'C = 0 (unsigned higher-or-same / carry clear)',
    MI: 'N = 1 (negative)', PL: 'N = 0 (positive or zero)', VS: 'V = 1 (overflow)', VC: 'V = 0 (no overflow)',
    HI: 'C = 0 and Z = 0 (unsigned higher)', LS: 'C = 1 or Z = 1 (unsigned lower or same)', GE: 'N = V (signed greater or equal)', LT: 'N ≠ V (signed less than)',
    GT: 'Z = 0 and N = V (signed greater than)', LE: 'Z = 1 or N ≠ V (signed less or equal)', HS: 'C = 0 (unsigned higher-or-same)', LO: 'C = 1 (unsigned lower)',
  };
  const regName = (t) => { t = t.toUpperCase(); return t === 'SP' ? 'A7 (the stack pointer)' : t; };
  const num = (t) => { // describe a literal
    const m = /^(-?)([$%@]?)([0-9A-F]+)$/i.exec(t.replace(/^#/, ''));
    if (!m) return null;
    const v = parseInt(m[3], m[2] === '$' ? 16 : m[2] === '%' ? 2 : m[2] === '@' ? 8 : 10) * (m[1] ? -1 : 1);
    return Number.isNaN(v) ? null : v;
  };

  /* describe an operand: { text, mode, desc, memory } */
  function operand(txt, size) {
    const t = txt.trim(), u = t.toUpperCase();
    let m;
    const where = { B: 'the low byte of', W: 'the low word of', L: '' }[size] || '';
    if ((m = /^D([0-7])$/.exec(u))) return { mode: 'Data register direct', desc: `${where ? where + ' ' : ''}data register D${m[1]}`, reg: true };
    if ((m = /^(A([0-7])|SP)$/.exec(u))) return { mode: 'Address register direct', desc: `address register ${regName(u)}`, reg: true };
    if (/^#/.test(t)) {
      const v = num(t); const lit = t.slice(1);
      return { mode: 'Immediate', desc: v == null ? `the constant ${lit} (a symbol defined with EQU)` : `the constant ${lit}${/^-?[$%@]/.test(lit) ? ` (= ${v} decimal)` : ''}`, imm: true };
    }
    if ((m = /^\((A[0-7]|SP)\)\+$/i.exec(t))) return { mode: 'Address register indirect with post-increment', desc: `the memory at the address in ${regName(m[1])}`, side: `After the access, ${regName(m[1])} increases by ${SIZE_STEP[size] || 'the operand size'}.`, mem: true };
    if ((m = /^-\((A[0-7]|SP)\)$/i.exec(t))) return { mode: 'Address register indirect with pre-decrement', desc: `the memory at the address in ${regName(m[1])} (after it has been decreased)`, side: `Before the access, ${regName(m[1])} decreases by ${SIZE_STEP[size] || 'the operand size'}.`, mem: true };
    if ((m = /^\((A[0-7]|SP)\)$/i.exec(t))) return { mode: 'Address register indirect', desc: `the memory at the address held in ${regName(m[1])}`, mem: true };
    if ((m = /^\((.+),(A[0-7]|SP),([DA][0-7])(?:\.([WL]))?\)$/i.exec(t)) || (m = /^(.+)\((A[0-7]|SP),([DA][0-7])(?:\.([WL]))?\)$/i.exec(t)))
      return { mode: 'Address register indirect with index', desc: `the memory at ${regName(m[2])} + ${m[3].toUpperCase()}${m[4] ? '.' + m[4].toUpperCase() : '.W'} + ${m[1]}`, mem: true };
    if ((m = /^\((.+),(A[0-7]|SP)\)$/i.exec(t)) || (m = /^(.+)\((A[0-7]|SP)\)$/i.exec(t)))
      return { mode: 'Address register indirect with displacement', desc: `the memory at ${regName(m[2])} + ${m[1]}`, mem: true };
    if (/\(.*PC.*\)/i.test(t)) return { mode: 'Program counter relative', desc: `the memory at an address relative to the program counter (${t})`, mem: true };
    if ((m = /^\(?(.+?)\)?\.([WL])$/i.exec(t))) return { mode: m[2].toUpperCase() === 'W' ? 'Absolute short' : 'Absolute long', desc: `the memory at the fixed address ${m[1]}${m[2].toUpperCase() === 'W' ? ' (16-bit, sign-extended)' : ''}`, mem: true };
    if (/^[A-Za-z_]\w*$/.test(t)) return { mode: 'Absolute (label)', desc: `the memory at the address of label ${t}`, mem: true, label: true };
    return { mode: 'Absolute', desc: `the memory at the fixed address ${t}`, mem: true };
  }

  const FLAGS = {
    move: 'N and Z are set from the value copied; V and C are cleared; X is unchanged.',
    add: 'X, N, Z, V, C all reflect the result (C = carry out, V = signed overflow).',
    sub: 'X, N, Z, V, C all reflect the result (C = borrow, V = signed overflow).',
    cmp: 'N, Z, V, C reflect destination − source; the result is thrown away and X is unchanged.',
    logic: 'N and Z are set from the result; V and C are cleared; X is unchanged.',
    none: 'No flags are affected.',
  };

  /* main entry: returns { kind, title, lines:[...], flags, notes:[...] } */
  function explain(raw) {
    let line = raw.replace(/\r/g, '');
    if (/^\s*$/.test(line)) return { kind: 'blank', title: 'Blank line', lines: ['Nothing happens. Blank lines are ignored.'] };
    if (/^[*;]/.test(line)) return { kind: 'comment', title: 'Comment', lines: ['A whole-line comment: the assembler ignores it. Comment lines start with * or ; in column 1.'] };
    let label = null;
    if (/^\S/.test(line)) { const mm = /^(\S+)(.*)$/.exec(line); label = mm[1].replace(/:$/, ''); line = mm[2]; }
    line = line.trim();
    const out = { kind: 'inst', title: '', lines: [], flags: null, notes: [], label };
    if (label) out.notes.push(`Label "${label}": a name for this line's address, so branches and LEA can refer to it. (Labels must start in column 1.)`);
    if (!line) { out.kind = 'label'; out.title = `Label ${label}`; return out; }
    const m = /^([A-Za-z]+)(?:\.([A-Za-z]))?\s*(.*)$/.exec(line);
    if (!m) { out.title = 'Unrecognised'; out.lines.push('This line does not look like assembly: check the spelling.'); return out; }
    const mn = m[1].toUpperCase(); let size = m[2] ? m[2].toUpperCase() : null;
    // operands run to the first whitespace outside parens/quotes
    let ops = '', q = false, depth = 0, i = 0; const tail = m[3];
    for (; i < tail.length; i++) { const ch = tail[i]; if (ch === "'") q = !q; if (!q) { if (ch === '(') depth++; else if (ch === ')') depth--; else if (/\s/.test(ch) && depth <= 0) break; } ops += ch; }
    const comment = tail.slice(i).trim();
    const parts = ops ? splitOps(ops) : [];
    if (comment) out.notes.push(`Trailing comment: "${comment.replace(/^[*;]\s*/, '')}"`);
    const sz = size && SIZE_NAME[size] ? size : null;
    const needSize = () => { if (!sz) out.notes.push('No size given: the assembler assumes .W (word).'); return sz || 'W'; };
    const S = parts.map((p) => p);
    const od = (k, s) => operand(S[k], s);
    const set = (title, ...ls) => { out.title = title; out.lines.push(...ls); };
    const modes = () => { S.forEach((p, k) => { if (mn === 'MOVEM' && /^[DA][0-7]([-/]|$)/i.test(p) && !/\(/.test(p)) { out.notes.push(`Operand ${k + 1} \`${p}\`: a register list.`); return; } const o = operand(p, sz || 'W'); out.notes.push(`Operand ${k + 1} \`${p}\`: ${o.mode}.`); }); };
    const partial = (s, dst) => (dst && /^D[0-7]$/i.test(dst) && s !== 'L' ? `Only the low ${SIZE_BITS[s]} bits of ${dst.toUpperCase()} change; the upper bits are left alone.` : null);

    switch (mn) {
      /* ----- directives ----- */
      case 'ORG': set('ORG: set the origin', `Tells the assembler to place the following code/data starting at address ${S[0]}. Assembler directive: it generates no instruction.`); return out;
      case 'EQU': set('EQU: define a constant', `Gives the label ${label || '(label)'} the value ${S[0]}. Wherever the label appears later, the assembler substitutes the value (like #define in C). Generates no code.`); if (out.notes[0] && out.notes[0].startsWith('Label')) out.notes.shift(); return out;
      case 'SET': set('SET: define a redefinable symbol', `Like EQU, but ${label || 'the symbol'} may be redefined later in the source. Value: ${S[0]}.`); return out;
      case 'REG': set('REG: register list', `Names the register list ${S[0]} for use with MOVEM.`); return out;
      case 'DC': { const s = needSize(); set('DC: define constants', `Stores ${S.length} item(s) in memory, each as a ${SIZE_NAME[s]}: ${ops}. ${s === 'B' && /'/.test(ops) ? 'Text in quotes becomes one byte per character (ASCII).' : ''}`); out.notes.push('Data directive: it reserves and fills memory, but is not executed.'); return out; }
      case 'DS': { const s = needSize(); set('DS: reserve storage', `Reserves ${S[0]} ${SIZE_NAME[s]} unit(s) of uninitialised memory (${num(S[0]) != null ? num(S[0]) * SIZE_STEP[s] + ' bytes' : 'count × ' + SIZE_STEP[s] + ' bytes'}).`); return out; }
      case 'DCB': { const s = needSize(); set('DCB: define constant block', `Fills ${S[0]} ${SIZE_NAME[s]} unit(s) of memory with the value ${S[1]}.`); return out; }
      case 'END': set('END: end of source', `Marks the end of the program${S[0] ? `; execution starts at ${S[0]}` : ''}. Everything after END is ignored.`); return out;
      case 'OPT': set('OPT: assembler options', `Sets assembler options (${ops}). Not a CPU instruction.`); return out;
      case 'SIMHALT': set('SIMHALT: stop the simulator', 'EASy68K pseudo-instruction that halts the simulation. It is not a real 68000 instruction.'); return out;
      case 'MACRO': case 'ENDM': set(mn + ': macro definition', 'Defines a macro: a named group of instructions the assembler expands wherever the name is used.'); return out;
    }

    /* ----- branches ----- */
    if (mn === 'BRA') { set('BRA: branch always', `Jump to ${S[0]} unconditionally by adding a signed displacement to the program counter (like goto).`); out.flags = FLAGS.none; return out; }
    if (mn === 'BSR') { set('BSR: branch to subroutine', `Push the address of the next instruction (4 bytes) onto the stack, then jump to ${S[0]}. Return later with RTS.`); out.flags = FLAGS.none; return out; }
    if (/^B[A-Z]{2}$/.test(mn) && CC[mn.slice(1)]) {
      const cc = mn.slice(1);
      set(`${mn}: branch if ${cc}`, `If ${CC[cc]}, jump to ${S[0]}; otherwise continue with the next instruction.`);
      out.notes.push('It tests flags set by the instruction just before it (usually a CMP, TST or arithmetic op).');
      out.flags = 'Tests the flags; changes none.'; return out;
    }
    if (mn === 'JMP') { set('JMP: jump', `Load the program counter with the address ${od(0).desc.replace(/^the memory at /, '')}.`); out.flags = FLAGS.none; return out; }
    if (mn === 'JSR') { set('JSR: jump to subroutine', `Push the return address (4 bytes) onto the stack, then jump to ${S[0]}. Return with RTS.`); out.flags = FLAGS.none; return out; }
    if (mn === 'RTS') { set('RTS: return from subroutine', 'Pop the 4-byte return address off the stack into the program counter, resuming after the JSR/BSR that called here. The return address must be on top of the stack.'); out.flags = FLAGS.none; return out; }
    if (mn === 'RTE') { set('RTE: return from exception', 'Return from an interrupt/exception handler: restores the status register and program counter from the stack (supervisor mode only).'); return out; }
    if (mn === 'NOP') { set('NOP: no operation', 'Does nothing for one instruction time. Machine code $4E71.'); out.flags = FLAGS.none; return out; }
    if (mn === 'STOP') { set('STOP: stop', `Loads the status register with ${S[0]} and stops the processor until an interrupt. In the lecture programs it ends the run.`); return out; }
    if (mn === 'TRAP') { set('TRAP: system call', `Raises exception ${S[0]}, a controlled way to call operating-system services. In EASy68K, TRAP #15 with D0 = 9 halts the simulation.`); return out; }

    /* ----- data movement / arithmetic ----- */
    const two = () => { if (S.length !== 2) { out.notes.push(`${mn} expects two operands separated by a comma (no spaces).`); return false; } return true; };
    modes();
    const sized = !['LEA', 'EXG', 'SWAP', 'MOVEQ'].includes(mn);
    const s = sized ? needSize() : 'L';
    const sn = SIZE_NAME[s];
    if (sized) out.notes.push(`Size .${s} = ${sn}.`);
    switch (mn) {
      case 'MOVE': if (!two()) break; set(`MOVE.${s}: copy`, `Copy a ${sn} from ${od(0, s).desc} to ${od(1, s).desc}. The source is not changed.`); out.flags = FLAGS.move; { const p = partial(s, S[1]); if (p) out.notes.push(p); } if (/^A/i.test(S[1])) out.notes.push('MOVE cannot target an address register: use MOVEA.'); if (od(1, s).imm) out.notes.push('An immediate value can only be a source, not a destination.'); break;
      case 'MOVEA': if (!two()) break; set(`MOVEA.${s}: copy into an address register`, `Copy a ${sn} from ${od(0, s).desc} into ${od(1, s).desc}.${s === 'W' ? ' A word is sign-extended to 32 bits.' : ''}`); out.flags = FLAGS.none; break;
      case 'MOVEQ': if (!two()) break; set('MOVEQ: quick move', `Load the constant ${S[0].replace('#', '')} (−128..127) into all 32 bits of ${S[1].toUpperCase()}, sign-extended.`); out.flags = FLAGS.logic; break;
      case 'LEA': if (!two()) break; set('LEA: load effective address', `Put the address (not the contents) of ${od(0).label ? 'label ' + S[0] : od(0).desc.replace(/^the memory at (the address in )?/, '')} into ${S[1].toUpperCase()}. The preferred way to point an address register at data.`); out.flags = FLAGS.none; break;
      case 'CLR': set(`CLR.${s}: clear`, `Set ${od(0, s).desc} to zero.`); out.flags = 'N = 0, Z = 1, V = 0, C = 0; X unchanged.'; { const p = partial(s, S[0]); if (p) out.notes.push(p); } break;
      case 'TST': set(`TST.${s}: test`, `Compare ${od(0, s).desc} with zero and set the flags. Nothing is stored.`); out.flags = 'N and Z reflect the value; V and C are cleared; X unchanged.'; break;
      case 'NOT': set(`NOT.${s}: invert bits`, `Flip every bit of ${od(0, s).desc} (one's complement).`); out.flags = FLAGS.logic; break;
      case 'NEG': set(`NEG.${s}: negate`, `Replace ${od(0, s).desc} with 0 minus itself (two's complement).`); out.flags = FLAGS.sub; break;
      case 'ADD': case 'ADDI': case 'ADDQ': if (!two()) break; set(`${mn}.${s}: add`, `Add ${od(0, s).desc} to ${od(1, s).desc} and store the sum back in the destination.`); out.flags = /^A/i.test(S[1]) ? 'Adding to an address register changes the whole 32-bit register and affects no flags.' : FLAGS.add; { const p = partial(s, S[1]); if (p) out.notes.push(p); } if (mn === 'ADDQ') out.notes.push('ADDQ is the "quick" form: the constant must be 1 to 8.'); break;
      case 'SUB': case 'SUBI': case 'SUBQ': if (!two()) break; set(`${mn}.${s}: subtract`, `Subtract ${od(0, s).desc} from ${od(1, s).desc} and store the result in the destination.`); out.flags = /^A/i.test(S[1]) ? 'Subtracting from an address register changes the whole 32-bit register and affects no flags.' : FLAGS.sub; { const p = partial(s, S[1]); if (p) out.notes.push(p); } if (mn === 'SUBQ') out.notes.push('SUBQ is the "quick" form: the constant must be 1 to 8. It is often used to count a loop down.'); break;
      case 'ADDA': if (!two()) break; set(`ADDA.${s}: add to address register`, `Add ${od(0, s).desc} to ${od(1, s).desc} (a word source is sign-extended).`); out.flags = FLAGS.none; break;
      case 'SUBA': if (!two()) break; set(`SUBA.${s}: subtract from address register`, `Subtract ${od(0, s).desc} from ${od(1, s).desc} (a word source is sign-extended).`); out.flags = FLAGS.none; break;
      case 'CMP': case 'CMPI': case 'CMPA': if (!two()) break; set(`${mn}.${s}: compare`, `Compute (destination − source), i.e. ${od(1, s).desc} minus ${od(0, s).desc}, set the flags, and discard the result.`); out.flags = FLAGS.cmp; out.notes.push('Follow it immediately with a Bcc branch to act on the result.'); break;
      case 'AND': case 'ANDI': case 'OR': case 'ORI': case 'EOR': case 'EORI': { if (!two()) break; const op = mn.replace(/I$/, ''); const w = { AND: 'AND', OR: 'OR', EOR: 'exclusive-OR' }[op]; set(`${mn}.${s}: bitwise ${op}`, `Bitwise ${w} ${od(0, s).desc} with ${od(1, s).desc}; the result goes into the destination.`); out.flags = FLAGS.logic; const p = partial(s, S[1]); if (p) out.notes.push(p); if (op === 'AND') out.notes.push('Common use: AND with a mask to isolate bits, then test Z with BEQ/BNE.'); break; }
      case 'EXG': if (!two()) break; set('EXG: exchange', `Swap the full 32-bit contents of ${S[0].toUpperCase()} and ${S[1].toUpperCase()}.`); out.flags = FLAGS.none; break;
      case 'SWAP': set('SWAP: swap halves', `Exchange the upper and lower 16-bit halves of ${S[0].toUpperCase()}.`); out.flags = FLAGS.logic; break;
      case 'MOVEM': { if (!two()) break; const toMem = /^[DA][0-7]/i.test(S[0]) && !/\(/.test(S[0]); set(`MOVEM.${s}: move multiple registers`, toMem ? (/^-\(/.test(S[1]) ? `Push the registers ${S[0]} onto the stack: for each register the stack pointer drops by ${SIZE_STEP[s]} and the register is stored there.` : `Store the registers ${S[0]} in consecutive memory starting at ${od(1, s).desc}.`) : (/\)\+$/.test(S[0]) ? `Pop the registers ${S[1]} off the stack: each is loaded from memory and the pointer rises by ${SIZE_STEP[s]}.` : `Load the registers ${S[1]} from consecutive memory starting at ${od(0, s).desc}.`)); out.flags = FLAGS.none; out.notes.push(toMem && /^-\(/.test(S[1]) ? 'This is the standard "push registers" at the start of a subroutine.' : !toMem && /\)\+$/.test(S[0]) ? 'This is the standard "pop registers" before RTS.' : 'MOVEM saves/restores many registers with one instruction.'); break; }
      default: out.title = `${mn}: not in the lecture set`; out.lines.push(`The explainer doesn't know ${mn}. It covers the instructions taught in Lessons 3-5.`); out.notes.length = 0; return out;
    }
    if (!out.title) out.title = mn;
    if (mn !== 'MOVEM') S.forEach((p, k) => { const o = operand(p, s); if (o.side) out.notes.unshift(o.side); });
    return out;
  }

  const api = { explain };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Explain = api;
})(typeof window !== 'undefined' ? window : globalThis);
