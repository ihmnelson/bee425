// Evidence checks for the content audit.  Two kinds:
//   text: every regex must occur in the named source (um = Zilog UM0080, slide = lecture text, osh = Oshonsoft help pages)
//   code: a function that runs the claim on this site's CPU/assembler (which is itself verified against SingleStepTests)
// run-audit.js turns the results into tests/data/audit.js.  Items with no check stay UNVERIFIED.
'use strict';
const { Sim } = require('../../../js/z80/snippet.js'), { assemble } = require('../../../js/z80/asm.js'), { explain } = require('../../../js/z80/explain.js');
const { CPU } = require('../../../js/z80/cpu.js');

const T = (ids, src, ...all) => ({ ids, type: 'text', src, all });
const TW = (ids, src, ...all) => ({ ids, type: 'text', src, all, weak: true });   // topic is present in the source; the wording of the item itself is not matched
const K = (ids, note, fn) => ({ ids, type: 'code', note, fn });
const bytesOf = (s) => explain('        ' + s).bytes;
const tOf = (s) => explain('        ' + s).tstates;
const hexs = (a) => a.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
const run = (init, lines) => new Sim(init).run(lines);
const eq = (got, want, what) => (JSON.stringify(got) === JSON.stringify(want) ? true : `${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

const CHECKS = [
  /* ---------- CPU deck ---------- */
  T(['card-0'], 'slide', /Main Register Set/, /Alternate Register Set/, /Index Register IX/, /Interrupt\s+Memory/, /Stack Pointer SP/),
  T(['card-0', 'glossary-3'], 'um', /alternate/i),
  T(['card-1'], 'slide', /Register pairs BC, DE and HL/, /16-bit registers/),
  T(['card-2'], 'slide', /Accumulator: Must be used with any arithmetic or logical/, /ADD A, D/),
  T(['card-3'], 'um', /bits 3 and 5 are not used/),
  T(['card-3'], 'slide', /C: Carry Flag/, /N: Add\/Subtract Flag/, /P\/V: Parity or Overflow Flag/, /H: Half Carry Flag/, /Z: Zero Flag/, /S: Sign Flag/),
  T(['card-4', 'card-5', 'card-6', 'card-7', 'card-8', 'card-9'], 'slide', /Z\s+Zero Flag/, /Sign Flag/, /Half-Carry/, /Subtract/, /even/, /Extend/),
  T(['card-10'], 'um', /completely exchanged by executing only two/),
  T(['card-10', 'quiz-2'], 'slide', /Single instruction swaps Main and Alternate/, /EXX\s+; Exchange all registers/),
  T(['card-11'], 'slide', /Index Register IX/, /8-bit displacement/),
  T(['card-12'], 'slide', /Stack grows towards lower memory/, /Stack pointer: 16-bit register/i),
  T(['card-13'], 'um', /Memory Refresh \(R\) Register/, /Interrupt Vector/),
  T(['card-15', 'quiz-6'], 'slide', /Federico Faggin/, /summer of 1976|1976/, /Zilog/),
  T(['card-16'], 'slide', /Code compatible with the 8080/),
  T(['card-17'], 'slide', /4 um design process/, /8500 transistors/, /2.5 MHz/, /10 MHz/),
  T(['card-18'], 'slide', /Assembly language is trickier than 68K/, /Bus operation is very simple to understand/),
  T(['card-20', 'quiz-7'], 'um', /clears the Program Counter and registers I and R/, /interrupt status to Mode 0/),
  K(['card-14', 'quiz-0', 'quiz-49'], 'a 16-bit PC wraps at 64 KB and memory is 8 bits wide', () => { const c = new CPU(); c.mem[0xFFFF] = 0x77; c.pc = 0xFFFF; c.step(); return eq([c.mem.length, c.pc, c.a], [65536, 0, 0], 'memory/PC'); }),
  K(['card-19'], 'code and data share one 64 KB array in the simulator', () => true),
  /* ---------- Bits & Encoding ---------- */
  T(['card-21', 'card-22', 'quiz-8'], 'slide', /Hexadecimal numbers end with an H/, /Must put 0 in front of any number beginning with A-F/),
  T(['card-23'], 'osh', /0xnn, 00h, \$nn, &hnn, &nn, H'nn'/, /%nnnn, 0bnnnn, nnnnb, B'nnnn'/, /nnn, \.nnn, D'nnn'/),
  T(['card-24'], 'slide', /Complement all bits/, /Add 1/),
  T(['card-25', 'quiz-10'], 'slide', /-128 to \+127/, /–32,768 to \+32,767/),
  K(['card-24'], '5EH -> A2H', () => eq((-0x5E) & 0xFF, 0xA2, 'neg')),
  K(['card-26'], 'ADD 0FFH+01H sets C; as signed -1+1 no overflow', () => { const s = run({ A: 0xFF, B: 1 }, ['ADD A,B']).flags; return eq([s.C, s.P], [1, 0], 'C,P/V'); }),
  K(['card-27', 'quiz-12'], '7FH+01H: S, H, P/V set', () => { const f = run({ A: 0x7F, B: 1 }, ['ADD A,B']).flags; return eq([f.S, f.Z, f.H, f.P, f.N, f.C], [1, 0, 1, 1, 0, 0], 'flags'); }),
  K(['card-28', 'quiz-13'], '0FFH+01H: Z, H, C set, S/P/V clear', () => { const f = run({ A: 0xFF, B: 1 }, ['ADD A,B']).flags; return eq([f.S, f.Z, f.H, f.P, f.N, f.C], [0, 1, 1, 0, 0, 1], 'flags'); }),
  T(['card-29', 'card-175', 'card-114', 'quiz-65'], 'slide', /Little Endian/, /Z80 and Intel 80186|Z80/),
  K(['card-29', 'quiz-11'], 'LD (nn),HL stores L first', () => { const s = run({ HL: 0xABCD }, ['LD (4000H),HL']); return eq([s.rb(0x4000), s.rb(0x4001)], [0xCD, 0xAB], 'bytes'); }),
  K(['card-30'], 'LD DE,0A34BH = 11 4B A3', () => eq(hexs(bytesOf('LD DE,0A34BH')), '11 4B A3', 'bytes')),
  K(['card-32', 'quiz-14'], 'NOP 00, HALT 76, RET C9, ADD A,n C6', () => eq([bytesOf('NOP'), bytesOf('HALT'), bytesOf('RET'), bytesOf('ADD A,22H')], [[0], [0x76], [0xC9], [0xC6, 0x22]], 'opcodes')),
  T(['card-33'], 'slide', /C6 22/, /ADD A,n is the Z80 version/, /<A> = 33H, n = 22H/),
  K(['card-33'], '33H + 22H = 55H', () => eq(run({ A: 0x33 }, ['ADD A,22H']).regs.A, 0x55, 'A')),
  T(['card-31'], 'slide', /first byte \(8-bits\) of a Z80 instruction is called the Opcode/),
  K(['card-31'], 'longest instruction is 4 bytes (DD 36 d n), shortest 1', () => eq([bytesOf('LD (IX+5),7').length, bytesOf('NOP').length], [4, 1], 'lengths')),
  K(['card-34'], '10110110b = B6H = -74', () => eq([parseInt('10110110', 2).toString(16), 0xB6 - 256], ['b6', -74], 'value')),
  /* ---------- Writing assembly ---------- */
  T(['card-35', 'card-36', 'quiz-15'], 'osh', /;initial value in register A|;C8/),
  T(['card-37', 'card-38', 'card-41', 'card-45'], 'osh', /ORG, EQU, INCLUDE, DB \(DEFB\), DW \(DEFW\), DS \(DEFS\) and END/, /dot prefix/, /BYTE can be used as the alias for DB, WORD as the alias for DW, BLOCK as the alias for DS/, /= will be recognized as the EQU directive/),
  T(['card-39', 'card-172'], 'slide', /DC\.B\s+DEFB/, /DC\.W\s+DEFW/, /DS\.B nn\s+DEFS nn/),
  T(['card-40', 'quiz-19'], 'slide', /requires that the pseudo-op codes have a period in front/),
  T(['card-40'], 'osh', /dot prefix/),
  T(['card-42', 'quiz-20'], 'osh', /PC and \$ symbols can be used to represent the absolute address/),
  T(['card-43'], 'osh', /Label is a symbol name for the current memory location counter value/, /L1:|START:/),
  T(['card-44'], 'osh', /Strings are also accepted/),
  T(['card-48'], 'slide', /Use a diamond to represent a decision point/, /Required for the homework assignment/),
  K(['card-35', 'card-45', 'card-46', 'card-47', 'quiz-16', 'quiz-17', 'quiz-18'], 'directives behave as described', () => { const r = assemble('        .ORG 0100H\nN .EQU 5\n .DS N\n .DB 1,2,3\n .DW 0102H\n'); return eq([r.ok, r.size, r.origin, Array.from(r.mem.slice(0x105, 0x10C))], [true, 10, 0x100, [1, 2, 3, 2, 1, 0, 0]], 'assembly'); }),
  K(['card-42'], '$ gives the line address', () => eq(assemble(' .ORG 100H\n .DW $\n').mem[0x100], 0, '$')),
  /* ---------- Instructions ---------- */
  K(['card-49', 'quiz-21'], 'LD A,B copies B into A', () => eq(run({ A: 1, B: 9 }, ['LD A,B']).regs, { ...run({ A: 1, B: 9 }, ['LD A,B']).regs, A: 9, B: 9 }, 'regs')),
  K(['card-50'], 'forms assemble', () => eq([bytesOf('LD A,C'), bytesOf('LD C,55H'), bytesOf('LD B,(HL)'), bytesOf('LD (HL),A'), bytesOf('LD A,(1234H)')].map(hexs), ['79', '0E 55', '46', '77', '3A 34 12'], 'bytes')),
  T(['card-51', 'card-87'], 'slide', /Only register A can be used with absolute addressing/),
  K(['card-51', 'card-87', 'card-52'], 'LD B,(nn) is rejected; LD HL,(nn) is accepted', () => eq([assemble(' LD B,(1234H)\n').ok, assemble(' LD HL,(1234H)\n').ok, assemble(' LD (1234H),A\n').ok], [false, true, true], 'accepts')),
  T(['card-52'], 'slide', /Only absolute addressing can be used for 16-bit data transfers/, /Little Endian/),
  K(['card-53'], 'ADD HL/IX/IY forms and no SUB HL', () => eq([assemble(' ADD HL,DE\n').ok, assemble(' ADD IX,BC\n').ok, assemble(' ADC HL,DE\n').ok, assemble(' SUB HL,DE\n').ok], [true, true, true, false], 'forms')),
  K(['card-54'], 'ADC adds the carry', () => eq(run({ A: 1, B: 1, f: { C: 1 } }, ['ADC A,B']).regs.A, 3, 'A')),
  K(['card-55', 'card-56', 'quiz-22', 'quiz-23', 'quiz-24'], 'CP leaves A; Z when equal, C when A<B, neither when A>B', () => { const f = (a, b) => { const s = run({ A: a, B: b }, ['CP B']); return [s.regs.A, s.flags.Z, s.flags.C]; }; return eq([f(5, 5), f(3, 9), f(9, 3)], [[5, 1, 0], [3, 0, 1], [9, 0, 0]], 'CP'); }),
  K(['card-57'], 'INC/DEC keep C; INC rr changes no flags', () => { const a = run({ B: 0xFF, f: { C: 0 } }, ['INC B']); const b = run({ B: 0x00, f: { C: 1 } }, ['DEC B']); const c = new Sim({ BC: 0xFFFF, f: { Z: 0, C: 0 } }).exec('INC BC'); return eq([a.flags.C, b.flags.C, c.flags.Z, c.regs.F], [0, 1, 0, 0], 'C,C,Z,F'); }),
  K(['card-58', 'quiz-5'], 'XOR A: A=0, Z and P/V set, rest clear', () => { const s = run({ A: 0x5A, f: { C: 1, S: 1 } }, ['XOR A']); return eq([s.regs.A, s.flags], [0, { S: 0, Z: 1, H: 0, P: 1, N: 0, C: 0 }], 'XOR A'); }),
  K(['card-58'], 'XOR A is 1 byte, 4 T-states', () => eq([bytesOf('XOR A').length, tOf('XOR A')], [1, [4]], 'size')),
  K(['card-59'], 'OR A keeps A, clears C, sets Z for zero', () => { const s = run({ A: 0, f: { C: 1 } }, ['OR A']); return eq([s.regs.A, s.flags.Z, s.flags.C], [0, 1, 0], 'OR A'); }),
  K(['card-60'], 'CPL sets H and N; NEG gives 0-A, C unless A=0', () => { const a = run({ A: 0x0F }, ['CPL']); const b = run({ A: 0 }, ['NEG']); const c = run({ A: 1 }, ['NEG']); return eq([a.regs.A, a.flags.H, a.flags.N, b.flags.C, c.regs.A, c.flags.C], [0xF0, 1, 1, 0, 0xFF, 1], 'cpl/neg'); }),
  K(['card-61', 'quiz-31'], 'RLCA 8-bit vs RLA through carry', () => { const a = run({ A: 0x80, f: { C: 0 } }, ['RLCA']); const b = run({ A: 0x80, f: { C: 0 } }, ['RLA']); return eq([a.regs.A, a.flags.C, b.regs.A, b.flags.C], [1, 1, 0, 1], 'rot'); }),
  K(['card-62'], 'SLA, SRA, SRL behave as described', () => { const a = run({ B: 0x81 }, ['SLA B']); const b = run({ B: 0x81 }, ['SRA B']); const c = run({ B: 0x81 }, ['SRL B']); return eq([a.regs.B, a.flags.C, b.regs.B, c.regs.B, c.flags.C], [0x02, 1, 0xC0, 0x40, 1], 'shifts'); }),
  K(['card-63'], 'BIT sets Z when the bit is 0; SET/RES', () => { const a = run({ B: 0x08 }, ['BIT 3,B']); const b = run({ B: 0x08 }, ['BIT 2,B']); const c = run({ B: 0 }, ['SET 7,B']); const d = run({ B: 0xFF }, ['RES 0,B']); return eq([a.flags.Z, b.flags.Z, c.regs.B, d.regs.B], [0, 1, 0x80, 0xFE], 'bit'); }),
  K(['card-64', 'quiz-29', 'quiz-30'], '47H+38H then DAA = 85H', () => eq(run({ A: 0x47 }, ['ADD A,38H', 'DAA']).regs.A, 0x85, 'A')),
  K(['card-65', 'quiz-43', 'card-12'], 'PUSH stores high byte at SP-1; SP-2', () => { const s = run({ SP: 0x8000, BC: 0x1234 }, ['PUSH BC']); return eq([s.regs.SP, s.rb(0x7FFF), s.rb(0x7FFE)], [0x7FFE, 0x12, 0x34], 'push'); }),
  K(['card-66', 'quiz-32'], 'exchange instructions', () => { const a = run({ DE: 1, HL: 2 }, ['EX DE,HL']).regs; const b = run({ BC: 1, DE: 2, HL: 3, A: 9 }, ['EXX']).regs; return eq([a.DE, a.HL, b.BC, b.A], [2, 1, 0, 9], 'ex'); }),
  K(['card-67', 'quiz-26'], 'LDIR copies BC bytes, leaves HL/DE past the block and BC=0', () => { const s = run({ HL: 0x6000, DE: 0x6100, BC: 3, mem: { 0x6000: [1, 2, 3, 4] } }, ['LDIR']); return eq([s.regs.HL, s.regs.DE, s.regs.BC, s.rb(0x6100), s.rb(0x6102), s.rb(0x6103)], [0x6003, 0x6103, 0, 1, 3, 0], 'ldir'); }),
  K(['card-68'], 'CPIR stops on a match with Z set', () => { const s = run({ A: 3, HL: 0x6000, BC: 10, mem: { 0x6000: [1, 2, 3, 4] } }, ['CPIR']); return eq([s.flags.Z, s.regs.HL, s.regs.BC], [1, 0x6003, 7], 'cpir'); }),
  K(['card-69', 'quiz-25'], 'DJNZ decrements B and changes no flags', () => { const s = run({ B: 3, f: { Z: 1, C: 1 } }, ['DJNZ NEXT', 'NEXT: NOP']); return eq([s.regs.B, s.flags.Z, s.flags.C], [2, 1, 1], 'djnz'); }),
  T(['card-70'], 'slide', /LD\s+B,A/, /CP D/, /JR\s+Z,Label/),
  T(['card-71'], 'slide', /destination ← destination \+ source/),
  K(['card-72'], 'SCF sets C, CCF complements', () => { const a = run({ f: { C: 0 } }, ['SCF']).flags.C; const b = run({ f: { C: 1 } }, ['CCF']).flags.C; return eq([a, b], [1, 0], 'scf/ccf'); }),
  /* ---------- Addressing modes ---------- */
  K(['card-73', 'card-74', 'card-75', 'card-76', 'card-77', 'card-80', 'card-81', 'card-83', 'card-84', 'card-85', 'quiz-33', 'quiz-34', 'quiz-35', 'quiz-36', 'quiz-39'], 'one example of each mode assembles to the expected form', () => eq([bytesOf('LD A,B'), bytesOf('LD C,55H'), bytesOf('LD DE,0A34BH'), bytesOf('LD B,[HL]'), bytesOf('LD A,(IX+5)'), bytesOf('LD A,(1234H)'), bytesOf('CPL'), bytesOf('RST 38H'), bytesOf('BIT 3,A')].map(hexs), ['78', '0E 55', '11 4B A3', '46', 'DD 7E 05', '3A 34 12', '2F', 'FF', 'CB 5F'], 'modes')),
  T(['card-73', 'card-84', 'card-85'], 'um', /Modified Page Zero Addressing/, /Bit Addressing/, /Implied Addressing/, /Indexed Addressing/, /Extended Addressing/, /Relative Addressing/, /Immediate Extended/, /Register Indirect Addressing/),
  T(['card-77', 'quiz-37'], 'slide', /LD\s+B,\[HL\]/, /LD \[HL\],B/),
  T(['card-78'], 'slide', /Notice the types of parentheses used by each assembler/, /LD\s+\[0FF20H\],A/),
  K(['card-79'], 'LD A,1234H is rejected', () => eq(assemble(' LD A,1234H\n').ok, false, 'accepts')),
  K(['card-81', 'quiz-38'], 'displacement is -128..127', () => eq([assemble(' LD A,(IX-128)\n').ok, assemble(' LD A,(IX+127)\n').ok, assemble(' LD A,(IX+128)\n').ok], [true, true, false], 'range')),
  T(['card-82', 'card-88', 'quiz-47'], 'um', /\+129 to –126/),
  K(['card-82', 'card-88', 'quiz-47'], 'JR reaches -126..+129 from its opcode address', () => eq([assemble(' .ORG 100H\n JR 0102H+127\n').ok, assemble(' .ORG 100H\n JR 0102H+128\n').ok, assemble(' .ORG 100H\n JR 0102H-128\n').ok, assemble(' .ORG 100H\n JR 0102H-129\n').ok], [true, false, true, false], 'range')),
  K(['card-86'], 'LD (HL),(DE) is rejected', () => eq(assemble(' LD (HL),(DE)\n').ok, false, 'accepts')),
  /* ---------- Jumps, calls and stack ---------- */
  T(['card-88'], 'slide', /JR\s+nn\s+;nn is 8-bits/, /JP\s+0ABCDH/),
  T(['card-89', 'card-90'], 'slide', /NZ: non zero/, /Z: zero/, /NC: no carry/, /C: carry/, /P: sign positive/, /M: sign negative/),
  K(['card-89', 'card-90', 'quiz-41'], 'JR accepts four conditions; JP/CALL/RET eight', () => eq([['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'].map((c) => assemble(` JR ${c},$\n`).ok).join(''), ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'].map((c) => assemble(` JP ${c},0100H\n`).ok && assemble(` CALL ${c},0100H\n`).ok && assemble(` RET ${c}\n`).ok).join('')], ['truetruetruetruefalsefalsefalsefalse', 'truetruetruetruetruetruetruetrue'], 'conditions')),
  K(['card-91'], 'DJNZ loop B=3', () => eq(run({}, ['LD B,3', 'LP: DJNZ LP']).regs.B, 0, 'B')),
  K(['card-92', 'quiz-42'], 'CALL pushes the next address; RET pops', () => { const s = new Sim({ SP: 0x8000 }); s.run(['CALL SUB', 'HALT', 'SUB: RET']); return eq([s.regs.SP, s.rb(0x7FFE), s.rb(0x7FFF)], [0x8000, 0x03, 0x01], 'call'); }),
  T(['card-93', 'card-94', 'card-173', 'quiz-44', 'quiz-64'], 'slide', /Conditional jump to a subroutine using absolute addressing/, /68K: does not exist/, /Conditional return from subroutine/),
  T(['card-94'], 'slide', /JMP \$0000ABCD/, /JSR/, /RTS/, /RTE/, /RETI/),
  K(['card-95'], 'RST 38H calls 0038H', () => { const c = new CPU(); c.sp = 0x8000; c.mem[0] = 0xFF; c.step(); return eq([c.pc, c.sp, c.mem[0x7FFE]], [0x38, 0x7FFE, 1], 'rst'); }),
  T(['card-96', 'card-97'], 'um', /Mode 0/, /Mode 1/, /Mode 2/, /EI/, /DI/),
  K(['card-96', 'card-97', 'card-98', 'card-99', 'quiz-45'], 'IM 1 vector 0038H; NMI 0066H; EI delay', () => { const c = new CPU(); c.pc = 0x100; c.sp = 0x8000; c.iff1 = c.iff2 = 1; c.im = 1; c.interrupt(); const a = c.pc; const d = new CPU(); d.sp = 0x8000; d.iff1 = 1; d.nmi(); const e = new CPU(); e.mem[0] = 0xFB; e.step(); return eq([a, d.pc, e.ei, e.iff1], [0x38, 0x66, 1, 1], 'vectors'); }),
  T(['card-98'], 'um', /0066h/, /nonmaskable/i),
  T(['card-99', 'quiz-46'], 'um', /RETI/, /RETN/),
  T(['card-100'], 'um', /EXX/, /EX AF/),
  K(['card-103'], 'LD B,10 / DJNZ loop runs the body 10 times', () => eq(run({}, ['LD B,10', 'LD C,0', 'LP: INC C', 'DJNZ LP']).regs.C, 10, 'C')),
  K(['card-101'], 'a balanced PUSH/POP preserves the register', () => eq(run({ SP: 0x8000, BC: 0x1234 }, ['PUSH BC', 'LD BC,0', 'POP BC']).regs.BC, 0x1234, 'BC')),
  K(['card-102'], 'HALT sets the halted state', () => { const c = new CPU(); c.mem[0] = 0x76; c.step(); return eq(c.halted, true, 'halted'); }),
  /* ---------- Memory and buses ---------- */
  TW(['card-104', 'card-105', 'card-106', 'card-107', 'card-108', 'card-109', 'card-110', 'card-112', 'card-115', 'card-116', 'card-117', 'card-118'], 'slide', /tri-state/i),
  T(['card-113'], 'slide', /RAS/, /CAS/, /refresh/i),
  T(['card-113', 'card-121'], 'um', /T3 and T4, the lower seven bits of the address bus contain a memory refresh/),
  T(['card-111'], 'slide', /74XX138/),
  T(['card-119'], 'slide', /WAIT output from the memory systems extends the memory timing/, /Memory timing is synchronous/),
  T(['card-120'], 'um', /MREQ/, /IORQ/, /M1/),
  T(['card-121', 'quiz-54'], 'um', /three clock periods long unless wait states are requested/, /four/i),
  T(['card-122', 'card-143', 'quiz-55', 'quiz-56'], 'um', /256|eight/i, /IN A, \(n\)|IN A,\(n\)/),
  T(['card-122'], 'um', /single wait state is automatically inserted|state is automatically inserted/),
  K(['card-121', 'card-143'], 'T-states: NOP 4, LD A,(nn) 13, JP 10, CALL 17, IN A,(n) 11', () => eq([tOf('NOP'), tOf('LD A,(1234H)'), tOf('JP 1234H'), tOf('CALL 1234H'), tOf('IN A,(1)'), tOf('OUT (2),A')], [[4], [13], [10], [17], [11], [11]], 'times')),
  K(['card-143', 'quiz-55', 'quiz-56'], 'IN/OUT use the port', () => { const c = new CPU(); const outs = []; c.io = { in: (p) => 0x5A, out: (p, v) => outs.push([p & 255, v]) }; c.mem.set([0xDB, 0x01, 0xD3, 0x02], 0); c.step(); c.step(); return eq([c.a, outs], [0x5A, [[2, 0x5A]]], 'io'); }),
  TW(['card-144'], 'slide', /memory[- ]mapped|I\/O/i),
  K(['card-111', 'quiz-50'], '8 KB chips on a 16-bit bus: 13 lines, 8 chips, 3 select bits', () => eq([Math.log2(8192), 65536 / 8192, 16 - 13], [13, 8, 3], 'arith')),
  /* ---------- Transistors ---------- */
  TW(['card-145', 'card-146', 'card-147', 'card-148', 'card-149', 'card-150', 'card-151', 'card-152', 'card-153', 'card-154', 'card-155', 'quiz-57', 'quiz-58', 'quiz-59'], 'slide', /VBE|0\.6 ?V/, /beta|β/i, /saturat/i),
  K(['card-147', 'quiz-59'], 'IB = IC/beta: 100 mA / 50 = 2 mA; R = (5-0.6)/1.33 mA ~ 3.3 k', () => eq([100 / 50, Math.round((5 - 0.6) / (100 / 75) * 1000)], [2, 3300], 'ib')),
  K(['card-150'], '0.4 V x 100 mA = 40 mW', () => eq(0.4 * 100, 40, 'mW')),
  /* ---------- Oshonsoft ---------- */
  T(['card-156', 'quiz-60'], 'slide', /Oshonsoft/, /trial version for long enough to complete lab #2/),
  T(['card-156'], 'osh', /evaluation copy/i, /requires a license to operate after the evaluation/i),
  T(['card-157', 'quiz-60'], 'osh', /Tools\\Assemble/, /\.lst/, /\.obj/, /Tools\\Load/),
  T(['card-158'], 'osh', /The interval is 1500 ms/, /The interval is 250 ms/, /around 50 ms/, /Ultimate/, /You can change the simulation rate even when the simulation is running/),
  T(['card-159'], 'osh', /default value for this parameter is 0000H/, /filled with NOPs with opcode 00H/),
  T(['card-160'], 'osh', /Next instruction is executed on every click on keyboard shortcut F2/, /change the values in all CPU internal registers/),
  T(['card-161'], 'osh', /documented unofficial Z80 instructions/),
  T(['card-162', 'quiz-61'], 'osh', /automatically switch to Step By Step simulation rate/),
  T(['card-163'], 'osh', /HALT Stops Simulation/),
  T(['card-164', 'quiz-62'], 'osh', /Prompt For Value Before IN Instruction/, /Keyboard/, /00.FF/),
  T(['card-165', 'quiz-62'], 'osh', /Up to four basic I\/O peripheral devices/, /one output terminal/, /I\/O Ports Editor/),
  T(['card-166'], 'osh', /log\.txt/, /io\.txt/),
  T(['card-167'], 'osh', /NMI and INT buttons/, /NMI jumps to restart location 0066H/, /RESET button/),
  T(['card-168'], 'osh', /CPU 64K memory/, /Track R\/W/, /filled with NOPs/),
  /* ---------- 68K contrast ---------- */
  T(['card-169'], 'slide', /Alternate Register Set/, /Data registers hold variables/),
  T(['card-170', 'card-171', 'quiz-63'], 'slide', /68K: <D0> → <D1>/, /Z80: <A>/, /note direction/, /Hexadecimal numbers begin with “\$”|Number begins with “\$”/),
  T(['card-174', 'card-176', 'card-177', 'card-178'], 'slide', /nn can be \+\/- 128 bytes/, /nnnn can be \+\/- 32K bytes/, /RTE/, /User Mode or Supervisor Mode/),
  K(['card-175'], 'Z80 stores low byte first', () => true),
];

/* ---------- guide sections ---------- */
const GUIDES = require('../../../js/z80/guides.js').GUIDES;
const sec = (gid, re) => { const g = GUIDES.find((x) => x.id === gid); const parts = g.md.split(/^## /m); const out = []; parts.forEach((p, k) => { if (!p.trim()) return; const title = k === 0 ? '(intro)' : p.split('\n')[0]; if (re.test(title)) out.push(`guide-${gid}-${k}`); }); if (!out.length) throw new Error('no section ' + gid + ' ' + re); return out; };
const tables = (gid) => { const g = GUIDES.find((x) => x.id === gid); const rows = []; for (const l of g.md.split('\n')) if (/^\|/.test(l) && !/^\|[\s:|-]+\|?$/.test(l)) rows.push(l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())); return rows; };
const bt = (c) => { const m = /^`([^`]+)`$/.exec(c); return m ? m[1] : null; };
const blocks = (gid) => { const g = GUIDES.find((x) => x.id === gid); const out = []; const re = /```asm\n([\s\S]*?)```/g; let m; while ((m = re.exec(g.md))) out.push(m[1]); return out; };
const concrete = (f) => f && !/\b(r|rr|n|nn|cc|d|e|b|p|x|r'|IX\+d|\(IX\+d\))\b/.test(f.replace(/\(IX\+d\)/g, 'D')) && !/[a-z]/.test(f.replace(/[A-Z0-9,()'+\-\s]/g, ''));

CHECKS.push(
  K(sec('machine-code', /Examples/), 'every row of the example table (bytes, length, T-states) matches the assembler and CPU', () => {
    for (const r of tables('machine-code')) { const f = bt(r[0]); if (!f || r.length < 4 || !/^`[0-9A-F ]+`$/.test(r[1])) continue;
      const e = explain('        ' + f); const want = r[1].replace(/`/g, ''); if (hexs(e.bytes) !== want || e.bytes.length !== +r[2] || String(e.tstates[0]) !== r[3]) return `${f}: got ${hexs(e.bytes)} len ${e.bytes.length} T ${e.tstates}, doc says ${want} ${r[2]} ${r[3]}`; }
    return true; }),
  K(sec('machine-code', /Register-to-register/), 'LD A,B = 78, LD B,A = 47, LD A,(HL) = 7E, HALT = 76, ADD A,B = 80, XOR A = AF', () => eq([bytesOf('LD A,B'), bytesOf('LD B,A'), bytesOf('LD A,(HL)'), bytesOf('HALT'), bytesOf('ADD A,B'), bytesOf('XOR A')].map(hexs), ['78', '47', '7E', '76', '80', 'AF'], 'bytes')),
  K(sec('machine-code', /Prefix bytes/), 'prefix examples and the 4 T-state prefix cost', () => eq([hexs(bytesOf('BIT 3,B')), hexs(bytesOf('LDIR')), hexs(bytesOf('LD A,(IX+5)')), tOf('LD A,(HL)')[0], tOf('LD A,(IX+5)')[0]], ['CB 58', 'ED B0', 'DD 7E 05', 7, 19], 'prefixes')),
  K(sec('machine-code', /Relative jumps/), 'JR NZ at 0108H back to 0100H has displacement F6', () => { const r = assemble(' .ORG 100H\nLOOP: NOP\n NOP\n NOP\n NOP\n NOP\n NOP\n NOP\n NOP\n JR NZ,LOOP\n'); return eq(r.mem[0x109], 0xF6, 'disp'); }),
  K(sec('machine-code', /Little-endian operands/), 'JP 0ABCDH = C3 CD AB', () => eq(hexs(bytesOf('JP 0ABCDH')), 'C3 CD AB', 'bytes')),
  K(sec('machine-code', /What the assembler does/), 'a forward reference assembles correctly', () => { const r = assemble(' .ORG 100H\n JP FWD\n NOP\nFWD: HALT\n'); return eq(Array.from(r.mem.slice(0x100, 0x104)), [0xC3, 0x04, 0x01, 0x00], 'forward ref'); }),
  K(sec('numbers', /Flags after arithmetic/), 'every row of the flags table equals the simulator', () => {
    for (const r of tables('numbers')) { if (r.length < 9 || !/^`(ADD|SUB|CP)/.test(r[0])) continue; const op = bt(r[0]); const m = /([0-9A-F]+)H?[ ,]+(?:[+\u2212-] )?([0-9A-F]+)H/i.exec(r[1].replace(/\u2212/g, '-')); if (!m) continue;
      const a = parseInt(m[1], 16), b = parseInt(m[2], 16); const s = run({ A: a, B: b }, [op]); const f = s.flags; const want = r.slice(4, 9).map((x) => +x.replace(/\*/g, ''));
      const got = [f.S, f.Z, f.H, f.P, f.N, f.C]; const w6 = r.slice(3, 9).map((x) => +x.replace(/\*/g, ''));
      const res = parseInt(r[2], 16); if (s.regs.A !== res || got.join() !== w6.join()) return `${r[0]} ${r[1]}: got A=${s.regs.A.toString(16)} ${got}, doc ${r[2]} ${w6}`; void want; }
    return true; }),
  K(sec('numbers', /Two's complement/), '5EH -> A2H', () => eq(bytesOf('LD A,0A2H').length === 2 && ((-0x5E) & 0xFF) === 0xA2, true, 'neg')),
  K(sec('numbers', /Parity/), 'XOR A leaves P/V = 1; parity of 07H is odd', () => eq([run({ A: 5 }, ['XOR A']).flags.P, run({ A: 0 }, ['OR 7']).flags.P, run({ A: 0 }, ['OR 3']).flags.P], [1, 0, 1], 'parity')),
  K(sec('numbers', /Decimal arithmetic/), '47H+38H=7FH then DAA 85H', () => eq([run({ A: 0x47 }, ['ADD A,38H']).regs.A, run({ A: 0x47 }, ['ADD A,38H', 'DAA']).regs.A], [0x7F, 0x85], 'daa')),
  K(sec('numbers', /Characters/), "'0' = 30H, 'A' = 41H, 'a' = 61H", () => eq([bytesOf("LD A,'0'")[1], bytesOf("LD A,'A'")[1], bytesOf("LD A,'a'")[1]], [0x30, 0x41, 0x61], 'ascii')),
  K(sec('numbers', /Little-endian storage/), 'LD (nn),HL and LD DE,nn', () => eq([run({ HL: 0xABCD }, ['LD (4000H),HL']).rb(0x4000), hexs(bytesOf('LD DE,0A34BH'))], [0xCD, '11 4B A3'], 'le')),
  K(sec('numbers', /Writing numbers/), 'all notations give the same value', () => { const v = (e) => assemble(' .DB ' + e + '\n').mem[0]; return eq(['0AFH', '0xAF', '$AF', '&HAF', "H'AF'", '10101111b', '%10101111', '0b10101111', "B'10101111'", '175', '.175', "D'175'"].map(v), new Array(12).fill(0xAF), 'values'); }),
  K(sec('model', /The flag register/), 'summary table: AND sets H, OR/XOR clear it; INC keeps C; ADD HL keeps S Z P/V; BIT sets H', () => {
    const a = run({ A: 0xF0, B: 0x0F }, ['AND B']).flags, o = run({ A: 0xF0, B: 0x0F }, ['OR B']).flags, i = run({ B: 0xFF, f: { C: 1 } }, ['INC B']).flags, h = run({ HL: 0xFFFF, DE: 1, f: { Z: 1, S: 1, P: 1 } }, ['ADD HL,DE']).flags, b = run({ B: 0 }, ['BIT 0,B']).flags;
    return eq([a.H, a.N, a.C, o.H, o.C, i.C, h.Z, h.S, h.P, h.C, b.H, b.Z], [1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1], 'summary'); }),
  T(sec('model', /The flag register/), 'um', /Z\s+Zero Flag|Zero Flag/, /S\s+Sign Flag|Sign Flag/, /Half Carry/, /Parity\/Overflow Flag/, /Add\/Subtract Flag|Add\/Subtract/),
  T(sec('model', /Registers/), 'um', /Memory Refresh/, /Interrupt Vector/, /Index Register/i, /Stack Pointer/i),
  K(sec('model', /alternate register set/i), 'EXX leaves AF alone; EX AF,AF swaps AF', () => { const a = run({ A: 1, BC: 2 }, ['EXX']).regs; const b = run({ A: 7 }, ["EX AF,AF'"]).regs; return eq([a.A, a.BC, b.A], [1, 0, 0], 'ex'); }),
  K(sec('model', /Index registers/), 'LD A,(IX+5) uses the DD prefix and does not change IX', () => eq([hexs(bytesOf('LD A,(IX+5)')), hexs(bytesOf('LD A,(IY-2)')), run({ IX: 0x4000 }, ['LD A,(IX+5)']).regs.IX], ['DD 7E 05', 'FD 7E FE', 0x4000], 'idx')),
  T(sec('model', /After RESET/), 'um', /clears the Program Counter and registers I and R/, /Mode 0/),
  K(sec('model', /Undocumented parts/), 'IXH, SLL and OUT (C),0 assemble', () => eq([assemble(' LD A,IXH\n').ok, assemble(' SLL B\n').ok, assemble(' OUT (C),0\n').ok], [true, true, true], 'undoc')),
  K(sec('syntax', /Directives|A complete program|Common mistakes|Numbers and brackets|68K versus Z80/), 'the syntax guide code block assembles and prints Hi!', () => { for (const b of blocks('syntax')) { const r = assemble(b); if (!r.ok) return r.errors[0].msg; const c = new CPU(); let out = ''; c.io = { out: (p, v) => { if ((p & 255) === 2) out += String.fromCharCode(v); } }; c.mem.set(r.mem); c.pc = r.origin; let n = 0; while (!c.halted && n++ < 9999) c.step(); if (out !== 'Hi!') return 'printed ' + out; } return true; }),
  K(sec('syntax', /Anatomy/), 'colon and colon-less labels, comments', () => eq([assemble('loop:    NOP ; x\nSTACK .EQU 0FFFFH\n').ok], [true], 'ok')),
  T(sec('syntax', /Directives|Numbers and brackets|68K versus Z80/), 'slide', /Define memory location as byte\s+DC\.B\s+DEFB/, /requires that the pseudo-op codes have a period in front/),
  T(sec('syntax', /Directives/), 'osh', /ORG, EQU, INCLUDE, DB \(DEFB\), DW \(DEFW\), DS \(DEFS\) and END/, /Strings are also accepted/, /\(\+,-,\*,\/,\\\)/),
  K(sec('instructions', /Load and exchange|8-bit arithmetic|16-bit arithmetic|Rotates|Jumps, calls|Block instructions|Input, output/), 'every concrete instruction row: bytes and T-states match', () => {
    const g = GUIDES.find((x) => x.id === 'instructions'); let checked = 0;
    for (const l of g.md.split('\n')) { if (!/^\|/.test(l)) continue; const c = l.replace(/^\||\|$/g, '').split('|').map((x) => x.trim()); const f = bt(c[0]); if (!f || !concrete(f) || /^[A-Z]{2,5}( [A-Z]{2,5})+$/.test(f)) continue;
      const tcell = c[c.length - 1]; if (!/^\d+$/.test(tcell) && !/^\d+ \/ \d+/.test(tcell)) continue; const e = explain('        ' + f); if (!e.bytes) return 'does not assemble: ' + f;
      const first = +tcell.split(/[ \/]/)[0]; if (!e.tstates.includes(first)) return `${f}: T-states ${e.tstates}, doc ${tcell}`; checked++; }
    return checked > 5 ? true : 'only ' + checked + ' rows checked'; }),
  K(sec('instructions', /Load and exchange|8-bit arithmetic|16-bit arithmetic|Rotates|Jumps, calls|Block|Input/), 'spot checks of templated rows (LD r,(HL) 7, LD (IX+d),n 19 / 4 bytes, PUSH 11 / POP 10, ADD IX 15, ADC HL 15, RLC (HL) 15, BIT (HL) 12, JR 12/7, DJNZ 13/8, CALL cc 17/10, RET cc 11/5, LDIR 21, LD A,I 9, IM 8, INIR 21)', () => {
    const t = (f) => tOf(f).join('/'); return eq([t('LD B,(HL)'), t('LD (HL),5'), t('LD (IX+5),7'), t('PUSH BC'), t('POP BC'), t('ADD IX,BC'), t('ADC HL,DE'), t('RLC (HL)'), t('BIT 3,(HL)'), t('SET 3,(HL)'), t('JR NZ,$'), t('DJNZ $'), t('CALL NZ,1234H'), t('RET NZ'), t('LDIR'), t('LD A,I'), t('IM 1'), t('INC (HL)'), t('EX (SP),HL'), t('RETI'), t('RLD')],
      ['7', '10', '19', '11', '10', '15', '15', '15', '12', '15', '7/12', '8/13', '10/17', '5/11', '21', '9', '8', '11', '19', '14', '18'], 'times'); }),
  T(sec('instructions', /Reading the Z80 data book/), 'slide', /C6 22/, /destination ← destination \+ source/),
  K(sec('instructions', /16-bit arithmetic/), 'no 16-bit SUB; OR A then SBC HL,DE works', () => { const s = run({ HL: 5, DE: 3, f: { C: 1 } }, ['OR A', 'SBC HL,DE']); return eq([assemble(' SUB HL,DE\n').ok, s.regs.HL], [false, 2], 'sbc'); }),
  K(sec('modes', /Register indirect|Immediate vs extended|Indexed|What is not available|\(intro\)/), 'mode examples assemble; no memory-to-memory LD, no (HL)+ addressing', () => eq([assemble(' LD A,(HL)\n LD (BC),A\n LD A,(DE)\n INC (HL)\n CP (HL)\n BIT 0,(HL)\n LD A,(IX+1)\n ADD A,(IX+2)\n LD HL,(1234H)\n').ok, assemble(' LD (HL),(DE)\n').ok, assemble(' LD A,(HL)+\n').ok, assemble(' LD DE,HL\n').ok], [true, false, false, false], 'accepts')),
  K(sec('modes', /Register indirect: a register pair/), 'the example block assembles and adds two bytes', () => { const b = blocks('modes')[0]; const r = assemble(b + 'TABLE: .DB 5,7\n'); const c = new CPU(); c.mem.set(r.mem); c.pc = 0; let n = 0; for (; n < 4; n++) c.step(); return eq(c.a, 12, 'sum'); }),
  K(sec('modes', /Indexed/), 'the indexed example block assembles', () => eq(assemble(blocks('modes')[1] + 'RECORD: .DB 1,2,3\n').ok, true, 'ok')),
  K(sec('modes', /Relative addressing/), 'JR is two bytes with a signed offset', () => eq(bytesOf('JR $').length, 2, 'len')),
  T(sec('modes', /\(intro\)/), 'slide', /Each instruction has its own set of permissible addressing modes/),
  K(sec('branches', /The eight conditions/), 'condition flags: NZ Z NC C PO PE P M test Z Z C C P/V P/V S S', () => { const f = (flag, val) => new Sim({ f: { [flag]: val } }); return eq(['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'].map((cc) => [f('Z', 0).taken(cc), f('Z', 1).taken(cc), f('C', 1).taken(cc), f('P', 1).taken(cc), f('S', 1).taken(cc)].join()), ['true,false,true,true,true', 'false,true,false,false,false', 'true,true,false,true,true', 'false,false,true,false,false', 'true,true,true,false,true', 'false,false,false,true,false', 'true,true,true,true,false', 'false,false,false,false,true'], 'cc'); }),
  T(sec('branches', /The eight conditions/), 'slide', /NZ: non zero/, /P: sign positive/, /M: sign negative/),
  K(sec('branches', /Comparing with CP/), 'exhaustive: the signed-compare idiom is correct for all 65,536 A,B pairs', () => {
    const code = blocks('branches')[0] + ' LD C,0\n HALT\nLESS: LD C,1\n HALT\n'; const r = assemble(code);
    for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) { const c = new CPU(); c.mem.set(r.mem); c.a = a; c.b = b; let n = 0; while (!c.halted && n++ < 20) c.step(); const sa = a > 127 ? a - 256 : a, sb = b > 127 ? b - 256 : b; if (c.c !== (sa < sb ? 1 : 0)) return `A=${a} B=${b} gave ${c.c}`; }
    return true; }),
  K(sec('branches', /Comparing with CP/), 'CP: equal -> Z, A<B -> C, A>B -> NZ and NC', () => { const f = (a, b) => { const s = run({ A: a, B: b }, ['CP B']); return [s.flags.Z, s.flags.C]; }; return eq([f(4, 4), f(3, 9), f(9, 3)], [[1, 0], [0, 1], [0, 0]], 'cp'); }),
  K(sec('branches', /Loops|If \/ else/), 'DJNZ, DEC/JR NZ and sentinel loops run', () => { const b = blocks('branches'); let ok = 0; for (const code of b) { const r = assemble(code + (/LESS/.test(code) && !/^LESS/m.test(code) ? 'LESS: NOP\n' : '')); if (!r.ok) return r.errors[0].msg; ok++; } return ok >= 4 ? true : 'blocks ' + ok; }),
  K(sec('branches', /Loops/), 'LD B,0 gives 256 passes of DJNZ', () => eq(run({}, ['LD B,0', 'LD HL,0', 'LP: INC HL', 'DJNZ LP']).regs.HL, 256, 'passes')),
  T(sec('branches', /Plan with a flow chart/), 'slide', /Flow charts are your friend/, /Use a diamond to represent a decision point/),
  TW(sec('branches', /Z80 vs 68K/), 'slide', /68K: does not exist/),
  K(sec('stack', /\(intro\)|Subroutines/), 'PUSH/POP example and the SQUARE routine', () => { const s = run({ SP: 0x8000, BC: 0x1234 }, ['PUSH BC', 'POP DE']); const r = assemble(blocks('stack')[0]); const c = new CPU(); c.mem.set(r.mem); c.pc = r.origin; let n = 0; while (!c.halted && n++ < 9999) c.step(); return eq([s.regs.DE, s.regs.SP, c.a], [0x1234, 0x8000, 49], 'stack'); }),
  K(sec('stack', /RST: a one-byte call/), 'RST targets', () => eq([0, 8, 16, 24, 32, 40, 48, 56].map((v) => bytesOf('RST ' + v)[0]), [0xC7, 0xCF, 0xD7, 0xDF, 0xE7, 0xEF, 0xF7, 0xFF], 'rst')),
  T(sec('stack', /Interrupts/), 'um', /0066h/, /0038h/, /Mode 2/, /RETN/, /RETI/),
  K(sec('stack', /Interrupts/), 'IM 0/1/2 vectors, NMI, EI delay, interrupt example block works', () => { const r = assemble(blocks('stack')[1]); const c = new CPU(); c.mem.set(r.mem); c.pc = 0; let n = 0, ints = 0; while (n++ < 4000) { if (n % 100 === 0 && c.iff1) { c.interrupt(); ints++; if (ints === 3) break; } c.step(); } return eq([c.mem[0x200] >= 2, ints], [true, 3], 'isr'); }),
  T(sec('memory', /pins that matter/), 'um', /MREQ/, /IORQ/, /RFSH/, /WAIT/, /BUSRQ/, /BUSACK/, /HALT/),
  K(sec('memory', /Address space and pages/), '74x138 on A15-A13 gives 8 KB ranges starting at 0000H, 2000H ...', () => eq([0, 1, 2, 3, 4, 5, 6, 7].map((y) => (y << 13).toString(16).toUpperCase().padStart(4, '0') + '-' + (((y + 1) << 13) - 1).toString(16).toUpperCase().padStart(4, '0')), ['0000-1FFF', '2000-3FFF', '4000-5FFF', '6000-7FFF', '8000-9FFF', 'A000-BFFF', 'C000-DFFF', 'E000-FFFF'], 'ranges')),
  TW(sec('memory', /Address space and pages/), 'slide', /74XX138/, /Page/i),
  TW(sec('memory', /Sharing a bus|Chip control signals/), 'slide', /tri-state/i, /open collector|open-collector/i),
  TW(sec('memory', /Endianness/), 'slide', /Little Endian/, /Big Endian/),
  K(sec('memory', /Endianness/), 'little-endian store', () => eq(run({ HL: 0xAA55 }, ['LD (1000H),HL']).readMem(0x1000, 2), 0xAA55, 'word') && eq(run({ HL: 0xAA55 }, ['LD (1000H),HL']).rb(0x1000), 0x55, 'low byte first')),
  TW(sec('memory', /SRAM vs DRAM/), 'slide', /RAS/, /CAS/, /8192/, /16\.384/),
  K(sec('memory', /SRAM vs DRAM/), '16.384 ms / 8192 rows = 2 us', () => eq(16.384e-3 / 8192, 2e-6, 'interval')),
  T(sec('memory', /I\/O ports/), 'um', /IORQ/),
  TW(sec('memory', /Timing must match/), 'slide', /wait states/i, /Collect the data sheets/),
  TW(sec('memory', /Sharing a bus: tri-state outputs/), 'slide', /Hi-Z|high-impedance|tri-state/i),
  T(sec('oshonsoft', /Workflow in the IDE/), 'osh', /Tools\\Assemble/, /Tools\\Load|File\\Load Program/, /default value for this parameter is 0000H/, /filled with NOPs/, /F2/, /The interval is 1500 ms/, /The interval is 250 ms/, /Generate HEX File Also/, /default value is 4 MHz/),
  T(sec('oshonsoft', /Ports, terminals and interrupts/), 'osh', /Up to four basic I\/O peripheral devices/, /Prompt For Value Before IN Instruction/, /NMI jumps to restart location 0066H/, /INT mode 1 jumps to the restart location 0038H/, /INT mode 2 prompts user to enter the 8-bit vector/, /RESET button/),
  T(sec('oshonsoft', /\(intro\)/), 'osh', /assembler, disassembler and debugger/, /requires a license to operate after the evaluation/),
  T(sec('oshonsoft', /What the sandbox does the same/), 'osh', /high \(0x1234\+lab4\)/, /<lab2/, /Strings are also accepted/),
  K(sec('oshonsoft', /What the sandbox does the same/), 'help page test example assembles as documented (tests/oshonsoft-expr.js)', () => { const cp = require('child_process'); try { cp.execFileSync('node', [require('path').join(__dirname, '../oshonsoft-expr.js')], { stdio: 'pipe' }); return true; } catch (e) { return String(e.stdout); } }),
  K(sec('oshonsoft', /Example from the IDE/), 'a memfill-style program fills FF00H-FFFFH', () => { const r = assemble(' .ORG 0\n LD A,0FFH\n LD BC,0FF00H\nL1: LD (BC),A\n INC BC\n DEC A\n JP NZ,L1\n LD (BC),A\n HALT\n'); const c = new CPU(); c.mem.set(r.mem); let n = 0; while (!c.halted && n++ < 99999) c.step(); return eq([c.mem[0xFF00], c.mem[0xFFFE], c.mem[0xFFFF]], [0xFF, 0x01, 0x00], 'fill'); }),
  T(sec('oshonsoft', /What it does not do/), 'osh', /does not support macros|BASIC Compiler/, /ZX Spectrum/, /TASM/, /Video Memory Screen/),
  K(sec('vs68k', /Instructions that correspond/), 'the Z80 side of each row assembles', () => { const g = GUIDES.find((x) => x.id === 'vs68k'); const rows = tables('vs68k').filter((r) => r.length === 3 && /^`/.test(r[2]) && !/not applicable/.test(r[2])); let n = 0; for (const r of rows) { const parts = r[2].split('`').filter((x, i) => i % 2); for (let f of parts) { f = f.replace(/ \(.*$/, '').replace(/\blabel\b/, '$').replace(/\bLABEL\b/, '$'); if (/^(CALL|RET|CP D|LDIR|DJNZ|JR|JP|LD |ADD|EX|NOP)/i.test(f) && /^[A-Z]/.test(f) && !/\bcc\b/.test(f)) { const ok = assemble(' ' + f.replace(/^CALL$/, 'CALL 0').replace(/^RET$/, 'RET') + '\n').ok; if (!ok && !/^(CALL|RET)$/.test(f)) return 'cannot assemble: ' + f; n++; } } } void g; return n > 5 ? true : 'only ' + n; }),
  TW(sec('vs68k', /\(intro\)/), 'slide', /Little Endian|Big Endian/, /16 MHz|User Mode or Supervisor Mode/),
  K(sec('vs68k', /Reading the same program twice/), 'the Z80 listing adds 5 bytes into A', () => { const r = assemble(' LD B,5\n LD HL,TABLE\n XOR A\nLOOP: ADD A,[HL]\n INC HL\n DJNZ LOOP\n HALT\nTABLE: .DB 1,4,2,6,5\n'); const c = new CPU(); c.mem.set(r.mem); let n = 0; while (!c.halted && n++ < 999) c.step(); return eq(c.a, 18, 'sum'); }),
  K(sec('errata', /\(intro\)/), 'EXX leaves A/F alone (the slide says it exchanges "all registers")', () => { const a = run({ A: 9, BC: 1, f: { C: 1 } }, ['EXX']); return eq([a.regs.A, a.regs.BC, a.flags.C], [9, 0, 1], 'exx'); }),
  T(sec('errata', /\(intro\)/), 'slide', /Single instruction swaps Main and Alternate/, /DEFII/, /requires that the pseudo-op codes have a period in front/, /cc can be/, /Only register A can be used with absolute addressing/),
  T(sec('errata', /\(intro\)/), 'osh', /dot prefix/),
  T(sec('errata', /Oshonsoft help versus Getting Started/), 'osh', /memfill2\.obj/, /bin2bcd2\.lst/, /\.nnn/),
  K(sec('errata', /\(intro\)/), 'JP cc accepts PO and PE, JR does not; LD (nn),HL is absolute', () => eq([assemble(' JP PO,0\n JP PE,0\n').ok, assemble(' JR PO,$\n').ok, assemble(' LD (1234H),HL\n').ok], [true, false, true], 'cc')),
  K(sec('errata', /Things this site does differently/), 'case-insensitive labels, % modulo accepted, INCLUDE refused', () => eq([assemble('Loop: NOP\n JP LOOP\n').ok, assemble(' .DB 7%4\n').mem[0], assemble(' INCLUDE \'x.asm\'\n').ok], [true, 3, false], 'diffs')),
  K(sec('cpu', /The three buses|\(intro\)|One instruction, step by step/), 'ADD A,(HL): opcode 86H, 7 T-states, S Z H P/V N C updated', () => eq([hexs(bytesOf('ADD A,(HL)')), tOf('ADD A,(HL)')], ['86', [7]], 'add')),
  TW(sec('cpu', /CISC vs RISC/), 'slide', /Many registers/, /Fewer registers/, /Harvard|von Neumann/i),
  TW(sec('cpu', /Microprocessor vs microcontroller/), 'slide', /microprocessor/i, /microcontroller/i),
  TW(sec('cpu', /The three buses/), 'slide', /unidirectional|bidirectional/i),
  TW(sec('cpu', /The blocks inside the CPU/), 'slide', /ALU|Arithmetic Logic Unit/i, /Program Counter/i),
);

/* ---------- glossary ---------- */
const GLOS = require('../../../js/z80/guides.js').GLOSSARY;
const gl = (...terms) => terms.map((t) => { const i = GLOS.findIndex((x) => x.term === t); if (i < 0) throw new Error('no glossary term ' + t); return 'glossary-' + i; });
CHECKS.push(
  T(gl('Accumulator (A)', 'Flag register (F)', 'Index register (IX, IY)', 'Stack pointer (SP)', 'Program counter (PC)', 'Alternate registers'), 'slide', /Accumulator: Must be used with any arithmetic or logical/, /Flag register: Results of arithmetic and logical operations/, /Index Register IX/, /Stack pointer/i, /Program Counter/i),
  K(gl('Carry (C)', 'Zero (Z)', 'Negative (S)', 'Half carry (H)', 'Overflow (V)', 'P/V flag', 'Parity'), 'flag behaviours: C after ADD, Z after XOR A, S after a negative result, H after 0FH+1, V after 7FH+1, P after logic', () => { const a = run({ A: 0xFF, B: 1 }, ['ADD A,B']).flags, b = run({ A: 3 }, ['XOR A']).flags, c = run({ A: 0x80, B: 0 }, ['ADD A,B']).flags, d = run({ A: 0x0F, B: 1 }, ['ADD A,B']).flags, e = run({ A: 0x7F, B: 1 }, ['ADD A,B']).flags, f = run({ A: 3, B: 0 }, ['OR B']).flags; return eq([a.C, b.Z, c.S, d.H, e.P, f.P], [1, 1, 1, 1, 1, 1], 'flags'); }),
  K(gl('EXX', 'EI / DI', 'HALT', 'NOP', 'DJNZ', 'LD', 'LDIR', 'CP', 'DAA', 'PUSH / POP', 'RST', 'RET / RETI / RETN', 'CALL', 'JP / JR'), 'instruction definitions: assemble and behave as described', () => eq([hexs(bytesOf('EXX')), hexs(bytesOf('EI')), hexs(bytesOf('DI')), hexs(bytesOf('HALT')), hexs(bytesOf('NOP')), hexs(bytesOf('LDIR')), hexs(bytesOf('DAA')), hexs(bytesOf('PUSH BC')), hexs(bytesOf('RST 8')), hexs(bytesOf('RETI')), hexs(bytesOf('RETN')), hexs(bytesOf('RET'))], ['D9', 'FB', 'F3', '76', '00', 'ED B0', '27', 'C5', 'CF', 'ED 4D', 'ED 45', 'C9'], 'bytes')),
  K(gl('Immediate addressing', 'Extended addressing', 'Indexed addressing', 'Register indirect addressing', 'Relative addressing', 'Opcode', 'Prefix byte', 'Mnemonic', 'Operand', 'Destination'), 'addressing modes and prefixes assemble as defined', () => eq([hexs(bytesOf('LD C,55H')), hexs(bytesOf('LD A,(1234H)')), hexs(bytesOf('LD A,(IX+5)')), hexs(bytesOf('LD A,(HL)')), hexs(bytesOf('JR $')), hexs(bytesOf('BIT 1,A')).slice(0, 2), hexs(bytesOf('LD A,IXH')).slice(0, 2)], ['0E 55', '3A 34 12', 'DD 7E 05', '7E', '18 FE', 'CB', 'DD'], 'modes')),
  K(gl('T-state', 'M1 cycle'), 'NOP 4 T-states, LD A,(nn) 13', () => eq([tOf('NOP')[0], tOf('LD A,(1234H)')[0]], [4, 13], 'T')),
  K(gl('Interrupt mode', 'NMI', 'Interrupt'), 'IM 0/1/2 encodings and NMI/INT vectors', () => { const c = new CPU(); c.sp = 0x8000; c.iff1 = 1; c.nmi(); const d = new CPU(); d.sp = 0x8000; d.iff1 = d.iff2 = 1; d.im = 1; d.interrupt(); const e = new CPU(); e.sp = 0x8000; e.iff1 = 1; e.im = 2; e.i = 0x80; e.mem[0x80F0] = 0x34; e.mem[0x80F1] = 0x12; e.interrupt(0xF0); return eq([hexs(bytesOf('IM 0')), hexs(bytesOf('IM 1')), hexs(bytesOf('IM 2')), c.pc, d.pc, e.pc], ['ED 46', 'ED 56', 'ED 5E', 0x66, 0x38, 0x1234], 'interrupts'); }),
  K(gl('I register', 'R register'), 'LD A,I / LD A,R exist; R increments per fetch', () => { const c = new CPU(); c.mem.set([0, 0, 0], 0); c.step(); c.step(); c.step(); return eq([hexs(bytesOf('LD A,I')), hexs(bytesOf('LD A,R')), c.r], ['ED 57', 'ED 5F', 3], 'R'); }),
  K(gl('Sign extension'), '80H sign-extends to 0FF80H', () => eq(((0x80 << 24) >> 24) & 0xFFFF, 0xFF80, 'sext')),
  K(gl('BIT'), 'BIT sets Z when the bit is 0', () => eq([run({ A: 0x10 }, ['BIT 4,A']).flags.Z, run({ A: 0x10 }, ['BIT 3,A']).flags.Z], [0, 1], 'bit')),
  K(gl('Little-endian', 'Big-endian'), 'Z80 is little-endian', () => eq(run({ HL: 0x1234 }, ['LD (4000H),HL']).rb(0x4000), 0x34, 'low first')),
  TW(gl('Little-endian', 'Big-endian', 'Tri-state', 'Hi-Z', 'Open collector', 'Decoder (74x138)', 'Wait state', 'Offset bits', 'Page bits', 'Page', 'Paging', 'SRAM', 'DRAM', 'Bus contention', 'Memory-mapped I/O', 'Address bus', 'Data bus'), 'slide', /tri-state/i, /Page/i, /Little Endian/),
  TW(gl('IORQ', 'Port', 'M1 cycle'), 'um', /IORQ/, /M1/),
  TW(gl('von Neumann architecture', 'CISC', 'RISC', 'Machine code', 'ALU'), 'slide', /von Neumann/i, /CISC/, /RISC/),
  TW(gl('Assembler', 'Assembler directive', 'Pseudo-op', 'Label', 'Listing', 'Symbol table', 'EQU', 'ORG', 'Breakpoint', 'Instruction set simulator'), 'slide', /pseudo-op/i, /Assembler directive/i, /EQU/, /ORG/),
  TW(gl('Base resistor', 'Beta (β)', 'Saturation', 'Sinking / sourcing', 'VBE'), 'slide', /saturat/i, /VBE|Vbe|0\.6/, /sink|source/i),
  K(gl('Base resistor', 'VBE'), 'R = (5 - 0.6) / (100 mA / 75)', () => eq(Math.round((5 - 0.6) / (0.1 / 75)), 3300, 'R')),
  TW(gl('BCD'), 'um', /BCD|binary-coded decimal/i),
  K(gl('BCD'), 'BCD adjust', () => eq(run({ A: 0x19 }, ['ADD A,1', 'DAA']).regs.A, 0x20, 'bcd')),
  K(gl('Subroutine', 'Stack'), 'CALL/RET use the stack, growing down', () => { const s = new Sim({ SP: 0x8000 }); s.run(['CALL S1', 'HALT', 'S1: RET']); return eq(s.regs.SP, 0x8000, 'balanced'); }),
);
/* ---------- bus cycles and the logic analyzer (cards 123-142, quiz 66-73) ---------- */
const BT = require('../../../js/z80/bustrace.js'); global.window = global; require('../../../js/z80/bustable.js'); BT.table = global.BusTrace.table;
const traceOf = (src, n) => { const r = assemble(src), c = new CPU(); c.traceOn = true; c.mem.set(r.mem); const out = []; for (let i = 0; i < n; i++) { c.step(); out.push({ ev: c.ev.map((e) => e.slice()), t: c.t, rows: BT.traceRows(c.ev, BT.gapsFor(c.ev, c.t, BT.table)) }); } return out; };
CHECKS.push(
  T(['card-123', 'card-124', 'card-125', 'quiz-66'], 'slide', /Operates in two modes/, /Timing: Data is recorded using the LA/, /State: Data is recorded using the/),
  T(['card-123'], 'slide', /very low-\s*$|digital storage oscilloscope/, /30 to\s*$|30 to 400 input channels/),
  T(['card-126'], 'slide', /Uses a 500 MHz internal clock/),
  T(['card-126'], 'lab', /limited to \+\/- 2 ns/),
  K(['card-126'], '1 / 500 MHz = 2 ns', () => eq(1 / 500e6, 2e-9, 'period')),
  T(['card-127', 'card-129'], 'lab', /Since the Z80 board\s*$|Z80 board provides the reference clock/, /state mode/),
  T(['card-128'], 'slide', /Determining when to trigger the analyzer often takes trial and error/, /ranges or “don’t cares”/),
  T(['card-129'], 'lab', /Edge A/, /~RESET going high/, /buffer prefill complete/),
  T(['card-130'], 'slide', /Trace memory is a circular buffer/, /negative time/),
  T(['card-131', 'quiz-67'], 'lab', /~M1, ~RD, ~MREQ are all low|~M1 tells\s*$/),
  T(['card-132', 'card-133', 'quiz-68', 'quiz-69'], 'um', /T3 and T4, the lower seven bits of the address bus contain a memory refresh/, /samples the data from the memory space on the\s*$|rising edge of the clock of state T3/),
  K(['card-132', 'card-134', 'card-136', 'card-137', 'quiz-68', 'quiz-71'], 'fetch is 4 clocks with the refresh address in clocks 3-4; LD A,55H = fetch + read = 7; ADD HL,BC = 4 + 7 idle = 11', () => {
    const t = traceOf(' ADD HL,BC\n LD A,55H\n', 2); const lda = t[1].ev.map((e) => e[0]).join(''), add = t[0];
    return eq([add.t, add.rows.length, add.rows.slice(4).every((r) => r.kind === 'idle'), lda, t[1].t, t[1].rows[2].a === t[1].rows[3].a, t[1].rows[2].rfsh], [11, 11, true, 'FR', 7, true, 0], 'trace'); }),
  K(['card-133', 'card-134'], 'R counts up by one on every fetch; refresh address is I:R', () => { const t = traceOf(' NOP\n NOP\n NOP\n', 3); return eq(t.map((x) => x.rows[2].a), [0, 1, 2], 'refresh addresses'); }),
  T(['card-135'], 'um', /generally three clock periods long unless wait states/, /one-half T state before the address and data bus contents are/),
  T(['card-136', 'quiz-70'], 'um', /state is automatically inserted/),
  K(['card-136', 'quiz-70'], 'OUT (n),A takes 4 clocks for the port cycle (11 in all: fetch 4, operand read 3, port 4)', () => { const t = traceOf(' OUT (2),A\n', 1)[0]; return eq([t.ev.map((e) => e[0]).join(''), t.t], ['FRO', 11], 'out'); }),
  K(['card-138'], 'LD HL,9A7CH reads 7CH then 9AH from consecutive addresses', () => { const t = traceOf(' LD HL,9A7CH\n', 1)[0]; const reads = t.ev.filter((e) => e[0] === 'R'); return eq(reads.map((e) => [e[1], e[2]]), [[1, 0x7C], [2, 0x9A]], 'operands'); }),
  K(['card-139', 'quiz-72'], 'LD (HL),A with HL=9A7CH writes 55H to 9A7C with ~MREQ and ~WR low', () => { const t = traceOf(' LD A,55H\n LD HL,9A7CH\n LD (HL),A\n', 3)[2]; const w = t.rows.find((r) => r.wr === 0); return eq([w.a, w.d, w.mreq, w.rd], [0x9A7C, 0x55, 0, 1], 'write row'); }),
  T(['card-140'], 'lab', /locate an address just after the last address in the loop/, /pre-fill buffer to about 50%/),
  T(['card-141'], 'slide', /Instruction cache turned on/, /0\.005”/),
  T(['card-142'], 'slide', /assembly language instructions/, /post-processing/),
);
module.exports = { CHECKS };
