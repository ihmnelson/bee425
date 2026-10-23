/* Pack description for the Z80: the strings and options the shared shell needs (see js/shell/app.js). */
window.PACK_UI = {
  id: 'z80', slug: 'z80', name: 'Z80', fullName: 'Zilog Z80', chip: 'Z80', icon: '',
  projects: { key: 'qz80.projects.v1', ext: 'asm', label: 'Z80' },
  tagline: 'Registers A, HL, IX, PUSH/POP, LD and friends, Oshonsoft-style sandbox with exact T-states.',
  hero: {
    title: 'Z80 assembly',
    lede: 'Topics follow lectures 3 to 8, and the sandbox mirrors the Oshonsoft Z80 Simulator IDE used in the lab.',
    buttons: [['#/guide/oshonsoft', 'Oshonsoft guide', '']],
  },
  topicGames: { cpu: ['flags'], num: ['numbers'], dirs: ['bugs', 'sorter'], inst: ['tracer', 'flags'], modes: ['modes'], flow: ['branch', 'sorter'], hw: ['hardware'], bus: [], io: ['hardware'], sim: [], m68: [] },
  topicSandbox: ['dirs', 'inst', 'modes', 'flow', 'bus', 'sim'],
  guideGroups: [['Foundations', ['cpu', 'numbers', 'model']], ['Writing programs', ['machine-code', 'syntax', 'instructions', 'modes', 'branches', 'stack']], ['Hardware', ['memory', 'bus-trace', 'transistor']], ['Tools and reference', ['oshonsoft', 'vs68k', 'errata']]],
  arcade: [
    ['tracer', '🧮', 'Register Tracer', 'Run code in your head. Results come from a real Z80 simulator.', 'L4-5'],
    ['flags', '🚩', 'Flag Flipper', 'Set the S Z H P/V N C flags after ADD, SUB, CP...', 'L3, L5'],
    ['branch', '🔀', 'Branch Oracle', 'After a CP, which conditions (NZ, C, M...) are true?', 'L5'],
    ['modes', '🎯', 'Mode Match', 'Name the addressing mode of an operand.', 'L5'],
    ['bugs', '🐛', 'Bug Hunt', 'Spot the illegal or mistaken line.', 'L4-5'],
    ['sorter', '🧩', 'Program Sorter', 'Put real lecture programs back in order.', 'L4-5'],
    ['numbers', '🥷', 'Number Ninja', 'Hex, binary, decimal and two\'s complement.', 'L3'],
    ['hardware', '🧱', 'Hardware Lab', 'Address lines, page decoding, base resistors.', 'L6-8'],
    ['blitz', '⚡', 'Quiz Blitz', 'Timed multiple choice across all topics.', 'all'],
  ],
  twin: { pack: 'm68k', name: '68000', guides: { model: 'programmers-model', vs68k: 'z80', oshonsoft: 'workflow', 'bus-trace': null } },
  compareTopics: { cpu: 'for', inst: 'max', modes: 'index', flow: 'for', hw: 'endian', m68: 'for' },
  navExtra: [],
  guidesButtons: [['#/guide/oshonsoft', 'Oshonsoft IDE guide']],
  examples: () => window.EXAMPLES_Z80,
  readIntro: 'What does each line actually do? Type any Z80 line for a plain-English breakdown, or open a lecture program and read it line by line.',
  readAnatomy: `<pre class="code"><span class="kw">LABEL:</span>   <span class="kw">OPCODE</span>  <span class="kw">DEST</span>,<span class="kw">SOURCE</span>    <span class="cm">; COMMENT</span>
loop:    ADD     A,[HL]          <span class="cm">; add the byte at (HL) to A</span></pre>
        <p class="lede" style="margin:0">Label: a name for the address, optional, ending in a colon. Opcode: what to do. Operands: comma-separated; for two-operand instructions the <b>destination comes first and the source last</b> (the opposite of the 68K). Brackets or parentheses mean "the memory at that address". Comment: after <code>;</code>.</p>`,
  readDefault: '        LD A,[HL]',
  readButtons: [['#/guide/instructions', 'Instruction reference'], ['#/guide/modes', 'Addressing modes'], ['#/guide/branches', 'Jumps']],
  colorize: (l) => l.replace(/(;.*)$/, '<span class="cm">$1</span>').replace(/(\b[0-9][0-9A-F]*H\b|\b[01]+B\b|\b\d+\b|\$[0-9A-F]+|%[01]+)(?![^<]*>)/g, '<span class="num">$1</span>'),
  demo: {
    src: `        LD B,5
        XOR A
LOOP:   ADD A,B
        DJNZ LOOP
        HALT
`,
    make() {
      const r = AsmZ80.assemble(this.src), cpu = new CPUZ80.CPU(), at = {};
      cpu.mem.set(r.mem); cpu.pc = r.origin; r.listing.forEach((l) => { if (l.inst) at[l.addr] = l.line; });
      return {
        step() { if (!cpu.halted) cpu.step(); }, done: () => cpu.halted,
        line: () => at[cpu.halted ? cpu.pc - 1 : cpu.pc],
        regs: () => [['A', cpu.a, 2], ['B', cpu.b, 2], ['PC', cpu.pc, 4]],
        flags: () => `Z ${cpu.f >> 6 & 1}  C ${cpu.f & 1}`,
        count: () => `${cpu.cycles} T-states`,
      };
    },
  },
  auditFile: 'tests/z80/data/audit.js',
  testsIntro: `<p class="lede"><b>In short:</b> the Z80 simulator passes 1.6 million single-instruction tests derived from real hardware, the assembler agrees with an independent disassembler, and the content was checked against the lecture slides, Zilog's manual and Oshonsoft's help pages. It has not been compared with the Oshonsoft program itself, so small differences in that tool's behaviour are possible. Details follow.</p><p class="lede">What was checked, how, and what is still unverified. The simulator is an independent implementation written from Zilog's manual; it was tested against hardware-derived data and real tools, not against the Oshonsoft IDE (which was not available).</p>
      <div class="panel"><h3>Simulator and assembler verification</h3><ul>
        <li><b>CPU core:</b> run against the <a href="https://github.com/SingleStepTests/z80" target="_blank" rel="noopener">SingleStepTests/z80</a> vectors (MIT licence): 1,604 files &times; 1,000 cases = <b>1,604,000 single-instruction tests</b> covering every documented and undocumented opcode. Each test compares all registers, the alternate set, flags including the undocumented bits 3 and 5, the internal WZ register, memory, port accesses and the <b>exact T-state count</b>. Result: <b>0 failures</b> (<code>node tests/z80/oracle/vectors.js &lt;path to z80/v1&gt;</code>).</li>
        <li><b>Assembler:</b> every opcode byte sequence was disassembled by <code>z80dasm</code> (a real, independent disassembler); its text was assembled by this site's assembler and the bytes compared: <b>1,250 instruction forms, 0 mismatches</b> (538 undefined opcode sequences skipped). Run <code>node tests/z80/oracle/asmcheck.js</code>. The assembler also reproduces the test example printed in the Oshonsoft help.</li>
        <li><b>Disassembler:</b> every opcode sequence is disassembled and re-assembled: 1,788 sequences, 0 mismatches (132 alternate encodings of the same instruction).</li>
        <li><b>Example programs:</b> all 12 bundled programs assemble and finish with the expected registers, memory and terminal output (<code>node tests/z80/run-examples.js</code>).</li>
        <li><b>Content:</b> every Bug Hunt group, every Program Sorter order and the question generators are executed on the CPU core (<code>node tests/z80/check-content.js</code>).</li>
        <li>This page does not re-run those tests in your browser.</li></ul></div>
      <div class="panel" style="margin-top:12px"><h3>What is not verified</h3><ul>
        <li><b>Oshonsoft behaviour.</b> The IDE is trial software for Windows and was not run. Syntax follows its published help pages and the lecture slides. Things that could differ: whether labels are case-sensitive, exactly which bracket forms it accepts, and error message wording.</li>
        <li><b>Hardware quirks not modelled:</b> bus timing below the instruction level, ~WAIT states, DMA, and the NMOS-only behaviours that the vectors do not cover.</li></ul></div>`,
};
