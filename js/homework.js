/* Homework 2 helper: problems, hints, walkthroughs, verified solutions, a live tracer and a program checker.
   The reference solutions were also run on a real EASy68K simulator (results recorded in each problem's `verified`). */
(function (root) {
  'use strict';
  const A = root.Asm68K || require('./asm.js'), C = root.CPU68K || require('./cpu.js');
  const hx = (v, w) => '$' + (v >>> 0).toString(16).toUpperCase().padStart(w, '0');

  /* ---------------- the handout program (problem 1) ---------------- */
  const P1_SRC = `*-----------------------------------------------------------
* Homework 2, problem 1: type this in yourself (don't paste), then single-step it
*-----------------------------------------------------------
addr1 EQU $4000
addr2 EQU $4001
data2 EQU $A7FF
data3 EQU $5555
data4 EQU $0000
data5 EQU 4678
data6 EQU %01001111
data7 EQU %00010111
        ORG   $1000
start   MOVE.W  #data2,D0    * Load D0
        MOVE.B  #data6,D1    * Load D1
        MOVE.B  #data7,D2    * load D2
        MOVE.W  #data3,D3    * load D3
        MOVEA.W #addr1,A0    * load address register
        MOVE.B  D1,(A0)+     * transfer byte to memory
        MOVE.B  D2,(A0)+     * transfer second byte
        MOVEA.W #addr1,A1    * load address
        AND.W   D3,(A1)      * logical AND on the word at $4000
        SIMHALT              * the handout loops with BRA start; we stop here instead
        END   start
`;

  const P2_A = `* Problem 2, straight-line version
        ORG   $1000
start   MOVE.W  $A300,D0     * first word
        ADD.W   $A302,D0     * + second word
        ADD.W   $A304,D0     * + third word
        MOVE.W  D0,$A308     * store the sum
        SIMHALT
        ORG   $A300          * test data (not part of the answer)
        DC.W  $1111,$2222,$3333
        END   start
`;
  const P2_B = `* Problem 2, pointer + loop version (easy to extend to more words)
        ORG   $1000
start   LEA     $A300,A0     * A0 -> first word
        CLR.W   D0           * running sum
        MOVEQ   #2,D1        * three words: count - 1 for DBRA
sum     ADD.W   (A0)+,D0     * add a word, step A0 by 2
        DBRA    D1,sum       * repeat 3 times
        MOVE.W  D0,2(A0)     * A0 is now $A306, so the answer goes at $A308
        SIMHALT
        ORG   $A300
        DC.W  $1111,$2222,$3333
        END   start
`;
  const P3_A = `* Problem 3, swap from both ends
        ORG   $1000
start   LEA     $100000,A0   * A0 -> first byte
        LEA     $100009,A1   * A1 -> last byte
        MOVEQ   #4,D1        * 5 swaps (DBRA counts 4..0)
swap    MOVE.B  (A0),D0      * save the front byte
        MOVE.B  (A1),(A0)+   * back byte to the front, advance front pointer
        MOVE.B  D0,(A1)      * saved front byte to the back
        SUBQ.L  #1,A1        * move the back pointer down
        DBRA    D1,swap
        SIMHALT
        ORG   $100000        * test data
        DC.B  1,2,3,4,5,6,7,8,9,10
        END   start
`;
  const P3_B = `* Problem 3, use the stack: push all ten, pop them back in reverse
        ORG   $1000
start   LEA     $100000,A0
        MOVE.W  #9,D0        * ten bytes
push    MOVE.B  (A0)+,-(SP)  * push (a byte push moves SP by 2 on a 68000)
        DBRA    D0,push
        LEA     $100000,A0
        MOVE.W  #9,D0
pop     MOVE.B  (SP)+,(A0)+  * last pushed comes out first
        DBRA    D0,pop
        SIMHALT
        ORG   $100000
        DC.B  1,2,3,4,5,6,7,8,9,10
        END   start
`;
  const P4_A = `* Problem 4: the zeroing loop, now filling with $55AA55AA
st_addr  EQU   $00002000
End_addr EQU   $00002010     * short block so you can single-step it
        ORG    $1000
START   LEA      st_addr,A0   * A0 = start of block
        LEA      End_addr,A1  * A1 = limit (never written)
        MOVE.L   #$55AA55AA,D0 * the pattern, loaded once
clr_loop CMPA.L  A1,A0        * reached the end?
        BEQ      done
        MOVE.L   D0,(A0)+     * was CLR.L (A0)+ ; store the pattern, advance 4 bytes
        BRA      clr_loop
done    SIMHALT
        END      START
`;
  const P4_B = `* Problem 4, the one-instruction change: CLR.L becomes MOVE.L #pattern
st_addr  EQU   $00002000
End_addr EQU   $00002010
        ORG    $1000
START   LEA      st_addr,A0
        LEA      End_addr,A1
clr_loop CMPA.L  A1,A0
        BEQ      done
        MOVE.L   #$55AA55AA,(A0)+   * was CLR.L (A0)+
        BRA      clr_loop
done    SIMHALT
        END      START
`;

  const SKELETON = {
    2: `* Problem 2: add the words at $A300, $A302, $A304; store the sum at $A308
        ORG   $1000
start
* your code goes here

        SIMHALT
        END   start
`,
    3: `* Problem 3: reverse the 10 bytes at $100000
        ORG   $1000
start
* your code goes here

        SIMHALT
        END   start
`,
    4: `* Problem 4: fill $2000..$200F with $55AA55AA (paste the lecture program here, then change it)
st_addr  EQU   $00002000
End_addr EQU   $00002010
        ORG    $1000
START
* your code goes here

        SIMHALT
        END    START
`,
  };

  /* ---------------- running and checking ---------------- */
  function load(source) {
    const r = A.assemble(source);
    if (!r.ok) return { error: 'Assembly errors:\n' + r.errors.slice(0, 5).map((e) => `  line ${e.line}: ${e.msg}`).join('\n') };
    const cpu = new C.CPU(); for (const seg of r.image) cpu.mem.set(seg.bytes, seg.addr);
    cpu.A[7] = 0x01000000; cpu.ssp = 0x01000000; cpu.pc = r.start;
    return { cpu, r };
  }
  function runWith(source, preload, maxSteps) {
    const l = load(source); if (l.error) return l;
    for (const [addr, bytes] of preload || []) l.cpu.mem.set(bytes, addr);
    l.cpu.run(maxSteps || 200000);
    if (!l.cpu.halted) return { error: `The program did not stop after ${(maxSteps || 200000).toLocaleString()} instructions (an infinite loop?). End it with SIMHALT.` };
    if (!/^(SIMHALT|TRAP|STOP)/.test(l.cpu.halted)) return { error: l.cpu.halted };
    return l;
  }
  const word = (cpu, a) => (cpu.mem[a] << 8) | cpu.mem[a + 1];
  const rnd = (n) => Math.floor(Math.random() * n);

  const CHECKS = {
    1(source) { // returns the computed answer
      const l = runWith(source); if (l.error) return l; return { value: word(l.cpu, 0x4000), cpu: l.cpu };
    },
    2(source) {
      const sets = [[0x1111, 0x2222, 0x3333], [0xFFFF, 0x0001, 0x0000], [0x8000, 0x8000, 0x0001], [rnd(65536), rnd(65536), rnd(65536)]];
      const out = [];
      for (const w of sets) {
        const pre = [[0xA300, w.flatMap((x) => [x >> 8, x & 255])], [0xA308, [0xEE, 0xEE]]];
        const l = runWith(source, pre); const want = w.reduce((a, b) => a + b, 0) & 0xFFFF;
        if (l.error) return { error: l.error };
        const got = word(l.cpu, 0xA308);
        out.push({ name: `words ${w.map((x) => hx(x, 4)).join(', ')}`, want: hx(want, 4), got: hx(got, 4), ok: got === want });
      }
      return { results: out };
    },
    3(source) {
      const out = [];
      for (let t = 0; t < 3; t++) {
        const data = Array.from({ length: 10 }, (_, i) => (t === 0 ? i + 1 : 1 + rnd(255)));
        const pre = [[0x0FFFFE, [0xEE, 0xEE]], [0x100000, data], [0x10000A, [0xEE, 0xEE]]];
        const l = runWith(source, pre); if (l.error) return { error: l.error };
        const got = Array.from(l.cpu.mem.slice(0x100000, 0x10000A)), want = data.slice().reverse();
        const intact = l.cpu.mem[0x0FFFFE] === 0xEE && l.cpu.mem[0x0FFFFF] === 0xEE && l.cpu.mem[0x10000A] === 0xEE && l.cpu.mem[0x10000B] === 0xEE;
        out.push({ name: `bytes ${data.map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`, want: want.map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join(' ') + ' (neighbours untouched)', got: got.map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join(' ') + (intact ? '' : ' (you wrote outside the 10 bytes!)'), ok: got.join() === want.join() && intact });
      }
      return { results: out };
    },
    4(source) {
      const l = runWith(source, [[0x2000, new Array(64).fill(0)]]); if (l.error) return { error: l.error };
      const pat = [0x55, 0xAA, 0x55, 0xAA]; let n = 0; while (n < 0x1000 && l.cpu.mem[0x2000 + n] === pat[n % 4]) n++;
      const ok = n >= 16 && n % 4 === 0;
      return { results: [{ name: 'first 16 bytes at $2000', want: '55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA 55 AA', got: Array.from(l.cpu.mem.slice(0x2000, 0x2010)).map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join(' '), ok: Array.from(l.cpu.mem.slice(0x2000, 0x2010)).every((b, i) => b === pat[i % 4]) },
        { name: 'where the pattern ends', want: 'a multiple of 4 bytes, at least 16', got: `${n} bytes filled (next address ${hx(0x2000 + n, 4)})`, ok }] };
    },
  };

  /* ---------------- live tracer ---------------- */
  function trace(source, preload, limit) {
    const l = load(source); if (l.error) return { error: l.error };
    const { cpu, r } = l; for (const [addr, bytes] of preload || []) cpu.mem.set(bytes, addr);
    const rows = []; limit = limit || 40; let steps = 0;
    const lineAt = new Map(); r.listing.forEach((e) => { if (e.words && e.addr != null) lineAt.set(e.addr, e); });
    while (!cpu.halted && steps < 5000) {
      const e = lineAt.get(cpu.pc); const sn = cpu.snapshot(); const wrote = []; cpu.onWrite = (a, sz) => { for (let i = 0; i < sz; i++) wrote.push(a + i); };
      cpu.step(); cpu.onWrite = null; steps++;
      const ch = [];
      for (let i = 0; i < 8; i++) { if (cpu.D[i] !== sn.D[i]) ch.push(`D${i} = ${hx(cpu.D[i], 8)}`); if (cpu.A[i] !== sn.A[i] && i < 7) ch.push(`A${i} = ${hx(cpu.A[i], 8)}`); }
      if (cpu.A[7] !== sn.A[7]) ch.push(`SP = ${hx(cpu.A[7], 8)}`);
      const sr = cpu.getSR() & 31; if (sr !== (sn.sr & 31)) ch.push(`XNZVC = ${sr.toString(2).padStart(5, '0')}`);
      if (wrote.length) { const u = [...new Set(wrote)].sort((a, b) => a - b); const groups = []; for (const a of u) { const g = groups[groups.length - 1]; if (g && a === g.end + 1) { g.end = a; g.b.push(cpu.mem[a]); } else groups.push({ start: a, end: a, b: [cpu.mem[a]] }); } groups.forEach((g) => ch.push(`[${hx(g.start, 4)}] = ${g.b.map((x) => x.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`)); }
      rows.push({ n: steps, text: e ? e.text.trim().replace(/\s+/g, ' ') : '?', changes: ch });
    }
    const shown = rows.length > limit ? [...rows.slice(0, limit - 4), { skip: rows.length - limit }, ...rows.slice(-4)] : rows;
    return { rows: shown, total: rows.length, cpu };
  }

  /* ---------------- the assignment ---------------- */
  const HW2 = {
    id: 'hw2', title: 'Homework 2', due: 'Thursday, October 22 (no credit)',
    intro: 'Get the 68K tools running, then write four small programs: read what a program leaves in memory, sum three words, reverse ten bytes, and turn the lecture\'s zeroing loop into a fill loop. Everything below runs on the emulator in this site; use the real EASy68K as well if you want the full workflow.',
    problems: [
      {
        n: 1, title: 'Run the sample program and read memory', src: P1_SRC, check: 1,
        ask: 'Type in the handout\'s ten-instruction program, assemble it, single-step it, and report the WORD value at memory location $4000 just before it loops back to the start.',
        concepts: [['Immediate addressing', '#/guide/modes'], ['Post-increment', '#/guide/modes'], ['Using EASy68K', '#/guide/workflow'], ['Big-endian bytes', '#/guide/memory'], ['AND and flags', '#/guide/instructions']],
        hints: [
          'Work out what each register holds before the memory instructions run. Remember the equates: `data6` is binary and `data7` is binary too. Convert both to hex.',
          'Instructions 6 and 7 are byte stores through A0 with post-increment. Where do the two bytes land, and in which order?',
          'The 68000 is big-endian: the byte at the lower address is the high byte of a word. So the word at $4000 right after the two stores is (first byte)(second byte).',
          'The last instruction ANDs that word with D3 = $5555 and writes the result back to $4000. AND each nibble.',
        ],
        walkthrough: [
          ['Equates', '`EQU` just gives names to numbers; they generate no code. `data6 = %01001111 = $4F`, `data7 = %00010111 = $17`, `data3 = $5555`. `data4`, `data5` and `addr2` are never used.'],
          ['Registers', 'D0 = $A7FF (never used again), D1 = $4F (low byte only), D2 = $17, D3 = $5555. `MOVEA.W #addr1,A0` puts $4000 in A0.'],
          ['Two byte stores', '`MOVE.B D1,(A0)+` writes $4F to $4000 and bumps A0 to $4001. `MOVE.B D2,(A0)+` writes $17 to $4001 and bumps A0 to $4002.'],
          ['The word', 'Memory now reads 4F 17 at $4000-$4001. As a big-endian word that is $4F17.'],
          ['The AND', '`AND.W D3,(A1)` with A1 = $4000: $4F17 AND $5555 = $4515. Nibble by nibble: 4&5=4, F&5=5, 1&5=1, 7&5=5.'],
          ['What you see', 'The simulator\'s memory window shows bytes: 45 15 at $4000. The word value is **$4515**.'],
        ],
        verified: 'Run on the real EASy68K simulator: the word at $4000 is $4515 (bytes 45 15), with D0-D3 = $0000A7FF, $0000004F, $00000017, $00005555.',
        solutions: [{ title: 'Answer', code: null }],
        trace: { src: P1_SRC },
      },
      {
        n: 2, title: 'Add three words from memory', src: P2_A, check: 2, skeleton: 2,
        ask: 'Write a short program that adds the word values stored from $0000A300 through $0000A304 and stores the result at $0000A308.',
        concepts: [['Absolute addressing', '#/guide/modes'], ['Pointers and (An)+', '#/guide/modes'], ['ADD and flags', '#/guide/numbers'], ['Word size .W', '#/guide/programmers-model']],
        hints: [
          '"A300 through A304" are word values: words live at $A300, $A302 and $A304 (each takes two bytes), so there are three of them.',
          'Load the first into a data register, then ADD the others to it. Keep every operation `.W`.',
          'You can name the addresses directly (`$A300`) or point an address register at $A300 and use `(A0)+`.',
          'Store the answer with `MOVE.W D0,$A308`. Watch the size: a `.B` or `.L` here would be wrong.',
        ],
        walkthrough: [
          ['Read the spec carefully', 'Three 16-bit values at $A300, $A302, $A304. The answer is also a word, at $A308 (the slot at $A306 is deliberately skipped).'],
          ['Straight-line plan', '`MOVE.W $A300,D0` / `ADD.W $A302,D0` / `ADD.W $A304,D0` / `MOVE.W D0,$A308`. Four instructions.'],
          ['Gotcha: short absolute addresses', '$A300 is above $7FFF. A 16-bit "short" absolute address is sign-extended, so `($A300).W` would mean $FFFFA300, the wrong place. EASy68K picks the long form for you when the value does not fit, but never force `.W` on an address like this.'],
          ['Pointer plan', 'Or: `LEA $A300,A0`, then `MOVE.W (A0)+,D0`, `ADD.W (A0)+,D0`, `ADD.W (A0),D0`, and store with `MOVE.W D0,4(A0)`. A loop with `DBRA` generalises it to any count.'],
          ['Overflow', 'The sum is limited to 16 bits. $FFFF + $0001 wraps to $0000 and sets the C flag. The assignment does not ask you to detect that, but it is worth knowing.'],
        ],
        verified: 'Both versions below were run on the real EASy68K with words $1111, $2222, $3333: the word at $A308 is $6666.',
        solutions: [{ title: 'Straight-line version', code: P2_A }, { title: 'Pointer and loop version', code: P2_B }],
        trace: { src: P2_A },
      },
      {
        n: 3, title: 'Reverse ten bytes in place', src: P3_A, check: 3, skeleton: 3,
        ask: 'Write a short program that reverses the order of the 10 bytes stored in memory starting at $00100000.',
        concepts: [['Address registers as pointers', '#/guide/modes'], ['Loops with DBRA/SUBQ', '#/guide/branches'], ['The stack', '#/guide/stack'], ['LEA', '#/guide/instructions']],
        hints: [
          'Reversing means byte 0 swaps with byte 9, byte 1 with byte 8, and so on. How many swaps for ten bytes?',
          'Use two pointers: A0 walks forward from $100000, A1 walks backward from $100009 (the last byte, not $10000A).',
          'To swap you need a temporary: a data register holds one byte while the other moves.',
          'There is no `(An)-` mode. To walk backward, use `SUBQ.L #1,A1` (or `-(A1)` when you read before using).',
          'Alternative idea: the stack is last-in, first-out. Push all ten bytes, then pop them back into memory.',
        ],
        walkthrough: [
          ['Count the swaps', 'Ten bytes means five pairs: (0,9) (1,8) (2,7) (3,6) (4,5). Five iterations, and no middle byte because ten is even.'],
          ['Set up two pointers', '`LEA $100000,A0` and `LEA $100009,A1`. Off-by-one trap: ten bytes starting at $100000 end at $100009.'],
          ['One swap', '`MOVE.B (A0),D0` saves the front byte. `MOVE.B (A1),(A0)+` copies the back byte to the front and advances the front pointer. `MOVE.B D0,(A1)` writes the saved byte to the back. `SUBQ.L #1,A1` moves the back pointer down.'],
          ['The loop', '`MOVEQ #4,D1` and `DBRA D1,swap`. DBRA decrements D1 and branches until it reaches -1, so a start of 4 gives five passes.'],
          ['Stack version', 'Push with `MOVE.B (A0)+,-(SP)`, pop with `MOVE.B (SP)+,(A0)+`. LIFO order reverses the data. A byte push through A7 moves SP by 2 (the stack stays word-aligned), but pushes and pops match, so SP ends where it started.'],
          ['Test it', 'Put 01 02 ... 0A at $100000 (the examples use `DC.B` after `ORG $100000`) and check the memory window afterwards: 0A 09 ... 01.'],
        ],
        verified: 'Both versions below were run on the real EASy68K: bytes 01..0A at $100000 end as 0A 09 08 07 06 05 04 03 02 01, and the stack pointer is back where it started.',
        solutions: [{ title: 'Swap from both ends', code: P3_A }, { title: 'Using the stack', code: P3_B }],
        trace: { src: P3_A },
      },
      {
        n: 4, title: 'Fill memory instead of zeroing it', src: P4_A, check: 4, skeleton: 4,
        ask: 'Take the lecture\'s "Zeroing a block of memory: a complete program" and change it to fill memory with the longword pattern $55AA55AA. (Set the end address to $2010 so it only loops a few times.)',
        concepts: [['The zeroing example', '#/guide/branches'], ['CLR vs MOVE', '#/guide/instructions'], ['CMPA and BEQ', '#/guide/branches'], ['EQU', '#/guide/syntax']],
        hints: [
          'Find the instruction that writes zero. What does `CLR.L (A0)+` do, and which instruction can write any value to `(A0)+`?',
          '`MOVE.L #$55AA55AA,(A0)+` stores the pattern and advances A0 by 4, exactly like the CLR did.',
          'Optionally load the pattern into a data register once and use `MOVE.L D0,(A0)+`; it avoids refetching the immediate every pass.',
          'With `End_addr EQU $00002010`, how many times does the loop run? The end address itself is never written.',
        ],
        walkthrough: [
          ['What the original does', 'A0 starts at the block start, A1 holds the end. Each pass compares them (`CMPA.L A1,A0`), exits when equal (`BEQ done`), clears a long and advances A0 by 4 (`CLR.L (A0)+`), then jumps back.'],
          ['The one change', 'Replace `CLR.L (A0)+` with `MOVE.L #$55AA55AA,(A0)+`. Nothing else in the loop needs to change.'],
          ['Slightly better', 'Load the pattern once: `MOVE.L #$55AA55AA,D0` before the loop, then `MOVE.L D0,(A0)+` inside it.'],
          ['Loop count', 'From $2000 to $2010 is 16 bytes, so 4 longs, so 4 passes. The loop test happens at the top, so a fifth compare finds A0 = A1 and exits.'],
          ['What memory shows', 'Bytes at $2000-$200F read 55 AA 55 AA repeated, because the long word is stored big-endian. $2010 is untouched.'],
          ['Why the end-address trick helps', 'With the original $3000 end address the loop would run 1,024 times. Shortening it lets you step through every iteration.'],
        ],
        verified: 'Both versions below were run on the real EASy68K: $2000-$200F contain 55AA55AA four times and $2010 is unchanged.',
        solutions: [{ title: 'Pattern kept in D0', code: P4_A }, { title: 'The one-instruction change', code: P4_B }],
        trace: { src: P4_A, preload: [[0x2000, new Array(24).fill(0)]] },
      },
      {
        n: 5, title: 'Extra problem: a caption', src: null, check: null,
        ask: 'A caption contest for a painting (witty, EE/CS-flavoured). Nothing to compute here: send your best one to your instructor.',
        concepts: [], hints: [], walkthrough: [['Nothing to solve', 'This one is for fun and has no code. The site has nothing to add beyond: be funny about your favourite addressing mode.']], verified: '', solutions: [], trace: null,
      },
    ],
  };

  if (root.EXAMPLES_68K && !root.EXAMPLES_68K.some((e) => e.name.startsWith('Homework 2'))) root.EXAMPLES_68K.push({ name: 'Homework 2, problem 1 (program from the handout)', src: P1_SRC });
  const api = { HW2, SKELETON, CHECKS, trace, runWith, load, P1_SRC };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Homework = api;
})(typeof window !== 'undefined' ? window : globalThis);
