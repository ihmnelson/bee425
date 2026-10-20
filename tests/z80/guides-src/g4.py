# -*- coding: utf-8 -*-
import json, re, sys, os, subprocess
from g1 import G
import g3
_HERE = os.path.dirname(os.path.abspath(__file__))
_tables = json.loads(subprocess.check_output(['node', os.path.join(_HERE, 'bus-tables.js')]).decode())
for _g in G:
    for _k, _v in _tables.items(): _g['md'] = _g['md'].replace('@@' + _k + '@@', _v)

def T(term, d, lesson, cat): return dict(term=term, def_=d, lesson=lesson, cat=cat)
GL = [
 T('Accumulator (A)', 'The 8-bit register that is one operand and the destination of Z80 arithmetic and logic instructions.', 'L3', 'CPU'),
 T('Address bus', 'Unidirectional lines from the CPU that say which memory location or port is being accessed. The Z80 has 16 (A0–A15).', 'L3', 'Hardware'),
 T('ALU', 'Arithmetic and logic unit: performs the adds, subtracts, ANDs, ORs and shifts and produces the flags.', 'L3', 'CPU'),
 T('Alternate registers', "The second register set A', F', B', C', D', E', H', L', swapped with EX AF,AF' and EXX.", 'L3', 'Z80'),
 T('Assembler', 'A program that translates assembly source into machine code, two passes over the text.', 'L4', 'Tools'),
 T('Assembler directive', 'A line that instructs the assembler (ORG, EQU, DB...) and generates no instruction. Also called a pseudo-op.', 'L4', 'Tools'),
 T('Base resistor', 'The series resistor between an I/O pin and a transistor base; sets IB = (V − 0.6)/R.', 'L8', 'Transistors'),
 T('BCD', 'Binary-coded decimal: one decimal digit per 4-bit nibble. DAA corrects the result of adding or subtracting BCD bytes.', 'L3', 'Numbers'),
 T('Beta (β)', 'Forward current gain of a BJT, IC/IB. Varies widely; design with the minimum.', 'L8', 'Transistors'),
 T('Big-endian', 'Most significant byte at the lowest address (68000).', 'L6', 'Memory'),
 T('BIT', 'Z80 instruction that tests one bit of a register or memory byte, setting Z if the bit is 0.', 'UM0080', 'Instructions'),
 T('Breakpoint', 'A marked instruction where the simulator stops so you can inspect the state.', 'L4', 'Tools'),
 T('Bus contention', 'Two outputs driving a shared line at once with opposite levels; solved with tri-state or open-collector outputs.', 'L6', 'Hardware'),
 T('CALL', 'Pushes the return address and jumps to a subroutine. CALL cc,nn is the conditional form.', 'L5', 'Control'),
 T('Carry (C)', 'Flag: carry out of bit 7 on addition, borrow on subtraction, or the bit shifted out by a rotate.', 'L3', 'Flags'),
 T('CISC', 'Complex Instruction Set Computer: many instructions and modes, variable length (Z80, 68000, x86).', 'L3', 'CPU'),
 T('Condition code (cc)', 'One of NZ, Z, NC, C, PO, PE, P, M: tests a flag for JP, CALL and RET (JR accepts only NZ, Z, NC, C).', 'L5', 'Control'),
 T('CP', 'Compare: computes A − operand, sets the flags and discards the result.', 'L4', 'Instructions'),
 T('DAA', 'Decimal adjust accumulator: fixes A after BCD addition or subtraction using H, C and N.', 'UM0080', 'Instructions'),
 T('Data bus', 'Bidirectional lines carrying the data; 8 bits on the Z80.', 'L3', 'Hardware'),
 T('Decoder (74x138)', 'A 3-to-8 line decoder used to turn high address bits into one chip select.', 'L7', 'Hardware'),
 T('Destination', 'The operand that receives the result. On the Z80 it is written first.', 'L4', 'Tools'),
 T('DJNZ', 'Decrement B and jump relative if it is not zero: the Z80 loop instruction.', 'UM0080', 'Instructions'),
 T('DRAM', 'Dynamic RAM: one transistor and a capacitor per bit; dense but needs refresh and RAS/CAS addressing.', 'L6', 'Memory'),
 T('Effective address', 'The address the CPU finally uses to reach an operand after applying the addressing mode.', 'L5', 'Addressing'),
 T('EI / DI', 'Enable / disable maskable interrupts (EI takes effect after the following instruction).', 'UM0080', 'Control'),
 T('EQU', 'Directive that gives a symbol a value; generates no code.', 'L4', 'Tools'),
 T('Extended addressing', 'The operand address is the 16-bit value following the opcode, as in LD A,(1234H).', 'L5', 'Addressing'),
 T('EXX', "Instruction that swaps BC, DE and HL with BC', DE' and HL'.", 'UM0080', 'Instructions'),
 T('Flag register (F)', 'Holds S, Z, H, P/V, N and C, set by arithmetic and logic instructions.', 'L3', 'CPU'),
 T('Half carry (H)', 'Flag: carry from bit 3 into bit 4; used by DAA.', 'L3', 'Flags'),
 T('HALT', 'Instruction that stops execution (the CPU idles) until an interrupt or reset.', 'UM0080', 'Instructions'),
 T('Hi-Z', 'High-impedance: the third state of a tri-state output, electrically disconnected from the bus.', 'L6', 'Hardware'),
 T('I register', 'Interrupt-vector register; the high byte of the interrupt table address in mode 2.', 'L3', 'Z80'),
 T('Immediate addressing', 'The operand is a constant that follows the opcode, as in LD C,55H.', 'L5', 'Addressing'),
 T('Index register (IX, IY)', '16-bit register used with a signed displacement: (IX+d).', 'L3', 'Z80'),
 T('Indexed addressing', 'Effective address = IX or IY + displacement.', 'L5', 'Addressing'),
 T('Instruction set simulator', 'A program that executes object code as if it were the target CPU, so programs can be stepped without hardware.', 'L5', 'Tools'),
 T('Interrupt', 'An event that makes the CPU save PC and run a service routine. The Z80 has INT (maskable, modes 0–2) and NMI.', 'L5', 'Control'),
 T('Interrupt mode', 'IM 0: the device supplies an instruction. IM 1: jump to 0038H. IM 2: vector table indexed by the I register and a device byte.', 'UM0080', 'Control'),
 T('IORQ', 'Z80 output that marks an I/O port access (as opposed to ~MREQ for memory).', 'UM0080', 'Hardware'),
 T('JP / JR', 'Jump to an absolute address / jump relative with a signed 8-bit offset.', 'L5', 'Control'),
 T('Label', 'A name for an address, defined by writing it at the start of a line.', 'L4', 'Tools'),
 T('LD', 'The Z80 load (copy) instruction; destination first.', 'L4', 'Instructions'),
 T('LDIR', 'Block copy: (DE) ← (HL), HL++, DE++, BC−−, repeat until BC = 0.', 'UM0080', 'Instructions'),
 T('Listing', 'Assembler output showing each line with its address and generated bytes.', 'L4', 'Tools'),
 T('Little-endian', 'Least significant byte at the lowest address (Z80, x86).', 'L6', 'Memory'),
 T('M1 cycle', 'The opcode-fetch machine cycle (4 T-states on the Z80), flagged by ~M1.', 'UM0080', 'Hardware'),
 T('Machine code', 'The binary instructions the CPU executes.', 'L4', 'CPU'),
 T('Memory-mapped I/O', 'Devices that appear at memory addresses and are accessed with ordinary load and store instructions.', 'L7', 'Memory'),
 T('Mnemonic', 'The human-readable name of an instruction (LD, ADD, JP...).', 'L4', 'Tools'),
 T('Negative (S)', 'The Z80 sign flag: a copy of bit 7 of the result.', 'L3', 'Flags'),
 T('NMI', 'Non-maskable interrupt; cannot be disabled; vector 0066H; return with RETN.', 'UM0080', 'Control'),
 T('NOP', 'No operation; machine code 00H; 4 T-states.', 'L4', 'Instructions'),
 T('Offset bits', 'Low address bits that select a location inside a memory chip or page.', 'L6', 'Hardware'),
 T('Opcode', 'The first byte of a Z80 instruction; says what to do and how many operand bytes follow.', 'L4', 'CPU'),
 T('Open collector', 'An output that can only pull low; needs a pull-up resistor to go high. Slow rising edges.', 'L6', 'Hardware'),
 T('Operand', 'The data an instruction works on (a noun); the operation is the verb.', 'L4', 'Tools'),
 T('ORG', 'Directive that sets the address where following code or data is placed.', 'L4', 'Tools'),
 T('Overflow (V)', 'Flag (shared with parity as P/V) set when a signed result does not fit in the operand size.', 'L3', 'Flags'),
 T('P/V flag', 'Overflow after arithmetic, parity after logic instructions and rotates.', 'L3', 'Flags'),
 T('Page', 'The block of address space covered by one memory chip (or group of chips); chosen by the page bits.', 'L6', 'Memory'),
 T('Page bits', 'High address bits fed to the decoder to choose a page.', 'L6', 'Hardware'),
 T('Paging', 'Mapping different physical memories into a small address space by writing to a page-select register.', 'L7', 'Memory'),
 T('Parity', 'Whether a byte has an even or odd number of 1 bits; the Z80 keeps it in the P/V flag after logic instructions.', 'L3', 'Flags'),
 T('Pointer', 'A register or memory location whose value is an address.', 'L5', 'Addressing'),
 T('Port', 'One of the 256 I/O addresses reached with IN and OUT.', 'UM0080', 'Hardware'),
 T('Prefix byte', 'CBH, DDH, EDH or FDH: opens an extra page of opcodes (bit operations, IX, extended, IY).', 'UM0080', 'CPU'),
 T('Program counter (PC)', 'Register holding the address of the next instruction.', 'L3', 'CPU'),
 T('Pseudo-op', 'Another name for an assembler directive.', 'L4', 'Tools'),
 T('PUSH / POP', 'Store a register pair on the stack / load it back; SP moves by two.', 'L3', 'Instructions'),
 T('R register', '7-bit refresh counter that increments on every opcode fetch.', 'L3', 'Z80'),
 T('Register indirect addressing', 'A register pair holds the address of the operand: LD A,(HL).', 'L5', 'Addressing'),
 T('Relative addressing', 'A signed offset from the next instruction, used by JR and DJNZ.', 'L5', 'Addressing'),
 T('RET / RETI / RETN', 'Return from subroutine / maskable interrupt / non-maskable interrupt.', 'L5', 'Control'),
 T('RISC', 'Reduced Instruction Set Computer: few instructions and modes, fixed length, load/store architecture (e.g. ARM).', 'L3', 'CPU'),
 T('RST', 'One-byte call to 00H, 08H ... 38H in page zero.', 'UM0080', 'Instructions'),
 T('Saturation', 'A transistor driven so hard that the collector voltage stops falling (roughly 0.2–0.4 V; the lecture uses 0.4 V); acts as a closed switch.', 'L8', 'Transistors'),
 T('Sign extension', 'Copying the sign bit into the upper bits to widen a signed value (e.g. 80H → 0FF80H).', 'L5', 'Numbers'),
 T('Sinking / sourcing', 'Current flowing into an output pin (sink) or out of it (source).', 'L8', 'Transistors'),
 T('SRAM', 'Static RAM: bit stored by cross-coupled inverters (6 transistors); fast, no refresh.', 'L6', 'Memory'),
 T('Stack', 'LIFO memory region used for return addresses, saved registers and locals. Grows toward lower addresses on the Z80.', 'L5', 'Control'),
 T('Stack pointer (SP)', 'Register pointing at the top of the stack.', 'L3', 'CPU'),
 T('Subroutine', 'A reusable block of code called with CALL and ended with RET; the equivalent of a C function.', 'L5', 'Control'),
 T('Symbol table', 'Assembler output mapping each label to its value.', 'L4', 'Tools'),
 T('T-state', 'One clock period. Instruction times are counted in T-states (NOP = 4, LD A,(nn) = 13).', 'UM0080', 'Hardware'),
 T('Tri-state', 'Output with three states: 0, 1 and Hi-Z, enabling bus sharing.', 'L6', 'Hardware'),
 T("Two's complement", 'Signed number representation: negate by complementing all bits and adding 1.', 'L3', 'Numbers'),
 T('VBE', 'Base-emitter voltage of a conducting BJT, about 0.6 V.', 'L8', 'Transistors'),
 T('von Neumann architecture', 'One memory space for both instructions and data (the Z80 and 68000).', 'L3', 'CPU'),
 T('Wait state', 'An extra clock cycle added to a memory access so slow memory can keep up (the Z80 ~WAIT input).', 'L7', 'Memory'),
 T('Zero (Z)', 'Flag set when the result is zero (all bits 0).', 'L3', 'Flags'),
]
GL.sort(key=lambda t: t['term'].lower())

SEE = {
 'cpu': ['numbers', 'model'], 'numbers': ['model', 'branches'], 'model': ['modes', 'instructions'], 'machine-code': ['modes', 'instructions'],
 'syntax': ['oshonsoft', 'instructions', 'branches'], 'instructions': ['modes', 'branches'], 'modes': ['instructions', 'stack'],
 'branches': ['numbers', 'stack'], 'stack': ['branches', 'syntax'], 'memory': ['cpu', 'bus-trace', 'vs68k'], 'bus-trace': ['memory', 'oshonsoft', 'syntax'], 'transistor': ['memory'],
 'oshonsoft': ['syntax', 'machine-code', 'errata'], 'vs68k': ['model', 'instructions'], 'errata': ['instructions', 'syntax'],
}
DECK_GUIDE = dict(bus='bus-trace', cpu='model', num='numbers', dirs='syntax', inst='instructions', modes='modes', flow='branches', hw='memory', io='transistor', sim='oshonsoft', m68='vs68k')
CAT_GUIDE = dict(Addressing='modes', Flags='numbers', CPU='model', Tools='syntax', Instructions='instructions', Control='branches', Hardware='memory', Memory='memory', Transistors='transistor', Numbers='numbers', Z80='model')
REFS = [
 dict(title='Zilog Z80 CPU User Manual (UM0080)', url='https://www.zilog.com/docs/z80/um0080.pdf', note='The authoritative instruction set, flags, timing and interrupt reference.'),
 dict(title='Oshonsoft Z80 Simulator IDE', url='http://www.oshonsoft.com/z80.html', note='The simulator used in the course lab (Windows, trial version).'),
 dict(title='Oshonsoft Z80 help topics', url='http://www.oshonsoft.com/z80helptopics.php', note='Assembler directives, number formats and menu reference.'),
 dict(title='Oshonsoft Z80 Getting Started', url='http://www.oshonsoft.com/z80gettingstarted.php', note='Example programs, ports and the simulation workflow.'),
 dict(title='SingleStepTests/z80', url='https://github.com/SingleStepTests/z80', note='Per-instruction hardware-derived test vectors (MIT licensed) used to verify this site\'s CPU core.'),
 dict(title='Z80 instruction set (clrhome.org table)', url='https://clrhome.org/table/', note='A handy opcode table with flags and timings.'),
]

def esc_tpl(s):  # escape for a JS template literal
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

out = []
out.append("""/* Written guides and glossary for Z80 Quest. Content follows BEE 425 Lessons 3-8, the Zilog Z80 CPU User Manual (UM0080)
   and the Oshonsoft Z80 help pages; each guide notes its source. GENERATED from tests/guides-src (see README); edit the sources.
   Authoring format is a tiny markdown subset rendered by QUEST_GUIDES.render(). */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\\*\\*([^*]+)\\*\\*/g, '<b>$1</b>').split(/(<code>.*?<\\/code>)/).map((seg, i) => (i % 2 ? seg : seg.replace(/(^|[^*\\w])\\*([^*\\n]+)\\*(?![*\\w])/g, '$1<em>$2</em>'))).join('');
""")
# reuse the renderer from the 68K site verbatim
import os
HERE = os.path.dirname(os.path.abspath(__file__))
out.append(open(os.path.join(HERE, 'render.js.txt'), encoding='utf8').read())
out.append('  const GUIDES = [\n')
for g in G:
    out.append("    { id: %s, title: %s, lesson: %s, icon: %s, practice: %s, summary: %s, md: `%s\n` },\n\n" % (
        json.dumps(g['id']), json.dumps(g['title'], ensure_ascii=False), json.dumps(g['lesson']), json.dumps(g['icon'], ensure_ascii=False),
        json.dumps(g['practice'], ensure_ascii=False), json.dumps(g['summary'], ensure_ascii=False), esc_tpl(g['md'])))
out.append('  ];\n\n  const G = (term, def, lesson, cat) => ({ term, def, lesson, cat });\n  const GLOSSARY = [\n')
for t in GL:
    out.append("    G(%s, %s, %s, %s),\n" % (json.dumps(t['term'], ensure_ascii=False), json.dumps(t['def_'], ensure_ascii=False), json.dumps(t['lesson']), json.dumps(t['cat'])))
out.append("  ];\n\n")
out.append("  const SEE = %s;\n" % json.dumps(SEE))
out.append("  const DECK_GUIDE = %s;\n" % json.dumps(DECK_GUIDE))
out.append("  const CAT_GUIDE = %s;\n" % json.dumps(CAT_GUIDE))
out.append("  const REFS = %s;\n" % json.dumps(REFS, ensure_ascii=False, indent=2))
out.append("""  const api = { GUIDES, GLOSSARY, render, SEE, DECK_GUIDE, CAT_GUIDE, REFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QUEST_GUIDES = api;
})(typeof window !== 'undefined' ? window : globalThis);
""")
dest = os.path.join(HERE, '..', '..', '..', 'js', 'z80', 'guides.js')
open(dest, 'w', encoding='utf8').write(''.join(out))
print('guides:', len(G), 'glossary:', len(GL))
