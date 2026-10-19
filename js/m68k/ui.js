/* Pack description for the 68000: the strings and options the shared shell needs (see js/shell/app.js). */
window.PACK_UI = {
  id: 'm68k', slug: '68k', name: '68000', fullName: 'Motorola 68000', chip: '68K', icon: '🟢',
  projects: { key: 'q68k.projects.v1', ext: 'X68', label: '68K' },
  tagline: 'Registers D0-D7 and A0-A7, MOVE and friends, EASy68K-compatible sandbox, Homework 2.',
  hero: {
    title: 'Learn 68000 assembly by playing.',
    lede: 'Flashcards with spaced repetition, a built-in 68K simulator that makes endless practice problems, and quick arcade drills, all drawn from your Lesson 3&ndash;8 slides.',
    buttons: [['#/guides', 'Guides', ''], ['#/homework', 'Homework 2', ''], ['#/sandbox', 'Open sandbox', '']],
  },
  arcade: [
    ['tracer', '🧮', 'Register Tracer', 'Run code in your head. Results come from a real 68K simulator.', 'L4-5'],
    ['flags', '🚩', 'Flag Flipper', 'Set the X N Z V C flags after ADD, SUB, CMP...', 'L3, L5'],
    ['branch', '🔀', 'Branch Oracle', 'After a CMP, which Bcc instructions fire?', 'L5'],
    ['modes', '🎯', 'Mode Match', 'Name the addressing mode of an operand.', 'L5'],
    ['bugs', '🐛', 'Bug Hunt', 'Spot the illegal or mistaken line.', 'L4-5'],
    ['sorter', '🧩', 'Program Sorter', 'Put real lecture programs back in order.', 'L4-5'],
    ['numbers', '🥷', 'Number Ninja', 'Hex, binary, decimal and two\'s complement.', 'L3'],
    ['hardware', '🧱', 'Hardware Lab', 'Address lines, page decoding, base resistors.', 'L6-8'],
    ['blitz', '⚡', 'Quiz Blitz', 'Timed multiple choice across every world.', 'all'],
  ],
  navExtra: [{ href: '#/homework', name: 'homework', label: 'Homework' }],
  guidesButtons: [['#/homework', '📝 Homework 2 walkthrough']],
  examples: () => window.EXAMPLES_68K,
  readIntro: 'What does each line actually do? Type any 68K line for a plain-English breakdown, or open a lecture program and read it line by line.',
  readAnatomy: `<pre class="code"><span class="kw">LABEL</span>    <span class="kw">OPCODE</span>.<span class="kw">SIZE</span> <span class="kw">OPERAND1</span>,<span class="kw">OPERAND2</span>  <span class="cm">* COMMENT</span>
loop     ADD.B   (A0)+,D1        <span class="cm">* add a byte, advance the pointer</span></pre>
        <p class="lede" style="margin:0">Label: starts in column 1 (optional). Opcode: what to do. Size: <code>.B</code> byte, <code>.W</code> word, <code>.L</code> long. Operands: comma-separated, no spaces; for two-operand instructions the <b>source comes first and the destination last</b>. Comment: after <code>*</code> or <code>;</code>.</p>`,
  readDefault: '        MOVE.B (A0)+,D1',
  readButtons: [['#/guide/instructions', '📖 Instruction reference'], ['#/guide/modes', '📖 Addressing modes'], ['#/guide/branches', '📖 Branches']],
  colorize: (l) => l.replace(/(\*.*|;.*)$/, '<span class="cm">$1</span>').replace(/(#?[$%]?\b[0-9A-F]+\b)(?![^<]*>)/g, (m) => (/^#?[$%]/.test(m) ? `<span class="num">${m}</span>` : m)),
  auditFile: 'tests/m68k/data/audit.js',
  testsIntro: `<p class="lede">Every flashcard, quiz question, glossary term and guide section was checked against the lecture slides, Motorola's M68000 Programmer's Reference Manual, the EASy68K documentation, and a real EASy68K assembler/simulator built locally and used as an oracle. Items found wrong were corrected on this site (see <a href="#/guide/errata">Slide errata</a>).</p>
      <div class="panel"><h3>Emulator verification</h3><ul>
        <li>The assembler reproduces the lecture's published list file byte for byte, and all bundled example programs assemble to the same machine code and finish in the same state as the real EASy68K.</li>
        <li>A differential fuzzer (<code>tests/m68k/oracle/fuzz.js</code>) generates random instructions, assembles and runs each in both the real EASy68K and this site's assembler and CPU, and compares machine code, registers, flags and memory. Known, intentional differences: MULS/DIVU flag handling, BCD N/V flags, CHK exception frames (see Slide errata).</li>
        <li>This page does not yet re-run those vectors inside your browser; that is on the roadmap.</li></ul></div>`,
};
