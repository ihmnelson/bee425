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

  /* ---------------- Homework 3 ---------------- */
  const H3_1 = `* HW3 problem 1: add two longwords
        ORG   $1000
start   MOVE.L  $A300,D0     * first longword
        ADD.L   $A304,D0     * + second longword
        MOVE.L  D0,$A308     * store the sum
        SIMHALT
        ORG   $A300          * test data (not part of the answer)
        DC.L  $00012345,$00054321
        END   start
`;
  const H3_2 = `* HW3 problem 2: first occurrence of $AA55 (on a word boundary)
* Result: A2 = address of the match (0 if there is none)
start_addr EQU $00002000
end_addr   EQU $00002020     * first address NOT searched
pattern    EQU $AA55
        ORG   $1000
start   LEA     start_addr,A0  * A0 walks the block
        LEA     end_addr,A1    * A1 = limit (never read)
        MOVE.W  #pattern,D0    * the word we want
        SUBA.L  A2,A2          * A2 = 0 means "not found yet"
loop    CMPA.L  A1,A0          * A0 - A1: reached the end?
        BHS     done           * unsigned >= : yes, give up
        CMP.W   (A0)+,D0       * D0 - word, then A0 += 2
        BNE     loop           * not it, try the next word
        LEA     -2(A0),A2      * A0 is one word past the match
done    SIMHALT
        ORG   $2000            * test data
        DC.W  $1234,$55AA,$AA55,$0000,$AA55,$FFFF,$AA55,$0001
        DC.W  $0000,$0000,$0000,$0000,$0000,$0000,$0000,$0000
        END   start
`;
  const H3_3 = `* HW3 problem 3 (signed reading): smallest byte, $80 = -128 is the smallest possible
* Result: D0.B
start_addr EQU $00003000
end_addr   EQU $0000300C     * first address NOT searched
        ORG   $1000
start   LEA     start_addr,A0
        LEA     end_addr,A1
        MOVE.B  #$7F,D0        * start with the LARGEST signed byte (+127)
loop    CMPA.L  A1,A0
        BHS     done
        MOVE.B  (A0)+,D1       * next byte
        CMP.B   D0,D1          * D1 - D0
        BGT     loop           * signed D1 > D0: not smaller, skip
        MOVE.B  D1,D0          * smaller (or equal): remember it
        BRA     loop
done    SIMHALT
        ORG   $3000            * test data
        DC.B  5,$7F,$FF,$20,$80,9,0,1,2,3,4,6
        END   start
`;
  const H3_4 = `* HW3 problem 3 (unsigned reading): smallest byte, $00 is the smallest possible
* Result: D0.B
start_addr EQU $00003000
end_addr   EQU $0000300C
        ORG   $1000
start   LEA     start_addr,A0
        LEA     end_addr,A1
        MOVE.B  #$FF,D0        * start with the LARGEST unsigned byte (255)
loop    CMPA.L  A1,A0
        BHS     done
        MOVE.B  (A0)+,D1
        CMP.B   D0,D1          * D1 - D0
        BHI     loop           * unsigned D1 > D0: not smaller, skip
        MOVE.B  D1,D0
        BRA     loop
done    SIMHALT
        ORG   $3000
        DC.B  5,$7F,$FF,$20,$80,9,3,1,2,3,4,6
        END   start
`;
  const H3_SKEL = {
    1: `* Problem 1: add the longwords at $A300 and $A304; store the sum at $A308
        ORG   $1000
start
* your code goes here

        SIMHALT
        END   start
`,
    2: `* Problem 2: find the first $AA55 word. Result: A2 = its address (0 if none)
* The checker puts the block at $2000..$201F; keep these equates.
start_addr EQU $00002000
end_addr   EQU $00002020     * first address NOT searched
pattern    EQU $AA55
        ORG   $1000
start
* your code goes here

        SIMHALT
        END   start
`,
    3: `* Problem 3 (signed): smallest byte, result in D0.B ($80 = -128 is the smallest)
* The checker puts 12 bytes at $3000..$300B; keep these equates.
start_addr EQU $00003000
end_addr   EQU $0000300C     * first address NOT searched
        ORG   $1000
start
* your code goes here

        SIMHALT
        END   start
`,
    4: `* Problem 3 (unsigned): smallest byte, result in D0.B ($00 is the smallest)
start_addr EQU $00003000
end_addr   EQU $0000300C     * first address NOT searched
        ORG   $1000
start
* your code goes here

        SIMHALT
        END   start
`,
  };
  const b2 = (x) => x.toString(16).toUpperCase().padStart(2, '0');
  const long = (cpu, a) => ((cpu.mem[a] << 24) | (cpu.mem[a + 1] << 16) | (cpu.mem[a + 2] << 8) | cpu.mem[a + 3]) >>> 0;
  const H3_CHECKS = {
    1(source) {
      const sets = [[0x12345, 0x54321], [0xFFFFFFFF, 1], [0x80000000, 0x80000001], [rnd(0x7FFFFFFF), rnd(0x7FFFFFFF)]];
      const out = [];
      for (const [a, b] of sets) {
        const lb = (x) => [x >>> 24, (x >>> 16) & 255, (x >>> 8) & 255, x & 255];
        const l = runWith(source, [[0xA300, lb(a).concat(lb(b))], [0xA308, [0xEE, 0xEE, 0xEE, 0xEE]]]); if (l.error) return { error: l.error };
        const want = (a + b) >>> 0, got = long(l.cpu, 0xA308);
        out.push({ name: `longwords ${hx(a, 8)}, ${hx(b, 8)}`, want: hx(want, 8), got: hx(got, 8), ok: got === want });
      }
      return { results: out };
    },
    2(source) {
      const out = [];
      for (let t = 0; t < 4; t++) {
        const w = Array.from({ length: 16 }, () => { let x; do { x = rnd(65536); } while (x === 0xAA55); return x; });
        const first = t === 1 ? -1 : t === 0 ? 2 : 1 + rnd(13);
        if (first >= 0) { w[first] = 0xAA55; if (t >= 2) w[first + 1] = 0xAA55; } // a second copy: must return the FIRST
        else w[0] = 0x55AA;                                                          // byte-swapped decoy only
        const bytes = w.flatMap((x) => [x >> 8, x & 255]);
        const l = runWith(source, [[0x2000, bytes], [0x2020, [0xAA, 0x55]]]); if (l.error) return { error: l.error }; // an $AA55 just past the end must not be found
        const want = first < 0 ? 0 : 0x2000 + 2 * first, got = l.cpu.A[2] >>> 0;
        out.push({ name: first < 0 ? 'no $AA55 in the block (one just past the end)' : `$AA55 first at word ${first}${t >= 2 ? ' (and again right after it)' : ''}`, want: 'A2 = ' + hx(want, 8), got: 'A2 = ' + hx(got, 8), ok: got === want });
      }
      return { results: out };
    },
  };
  function minByte(signed) {
    return (source) => {
      const sets = [[5, 0x7F, 0xFF, 0x20, 0x80, 9, 0, 1, 2, 3, 4, 6], [0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F],
        [0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6, 0xF5, 0xF4], Array.from({ length: 12 }, () => rnd(256)), Array.from({ length: 12 }, () => rnd(256))];
      const out = [];
      for (const d of sets) {
        const l = runWith(source, [[0x3000, d], [0x300C, [0x00, 0x80]]]); if (l.error) return { error: l.error };
        const want = signed ? d.reduce((a, b) => ((a << 24 >> 24) <= (b << 24 >> 24) ? a : b)) : Math.min(...d), got = l.cpu.D[0] & 255;
        out.push({ name: d.map(b2).join(' '), want: 'D0.B = ' + b2(want), got: 'D0.B = ' + b2(got), ok: got === want });
      }
      return { results: out };
    };
  }
  H3_CHECKS[3] = minByte(true); H3_CHECKS[4] = minByte(false);

  const HW3 = {
    id: 'hw3', title: 'Homework 3', due: 'Thursday, October 29 (no credit)',
    intro: 'Three small 68K programs: add two longwords, search a block for a word, and find the smallest byte. The last one is where signed versus unsigned branches bite, so it is split into the two readings of the handout. Solve each yourself first; the checker runs your program on several data sets. The program you write is the kind of problem the exams ask.',
    note: 'The handout header still says "Spring Quarter 2024" and problem 3 refers to a "problem #4" that does not exist: it is a recycled handout. The handout also does not say where the results go, so each problem here fixes a convention (see the problem text).',
    problems: [
      {
        n: 1, title: 'Add two longwords', src: H3_1, check: 1, skel: H3_SKEL[1], checkFn: H3_CHECKS[1],
        ask: 'Write a short 68K program that adds the longword at memory location $A300 and the longword at $A304 and stores the result at $A308. (The handout writes $000A300 and $0000A304; the leading zeros do not change the address.)',
        concepts: [['Absolute addressing', '#/guide/modes'], ['Operand sizes', '#/guide/programmers-model'], ['Big-endian bytes', '#/guide/memory'], ['ADD and flags', '#/guide/numbers']],
        hints: [
          'A longword is 4 bytes. The first one occupies $A300-$A303, the second $A304-$A307, so $A308 is the next free slot.',
          'Use `.L` on every instruction. A `.W` or `.B` would touch only part of the value.',
          'You need one data register: load the first value, add the second from memory, store the sum.',
          'Remember the 68000 can do `ADD.L <memory>,D0` directly, so you do not need to load the second value into its own register first.',
        ],
        walkthrough: [
          ['Read the spec', 'Two 32-bit values at $A300 and $A304, answer at $A308. Everything is a longword, so every instruction ends in `.L`.'],
          ['Three instructions', '`MOVE.L $A300,D0` / `ADD.L $A304,D0` / `MOVE.L D0,$A308`. The addresses are written as absolute addresses; the assembler uses the long form automatically because $A300 does not fit in a positive 16-bit value.'],
          ['Why `.L` matters', 'The 68000 is big-endian, so a `.W` access at $A300 reads the HIGH half of the longword, not the low half. `ADD.W` here would add the wrong halves and leave the upper half of D0 alone.'],
          ['Overflow', 'The sum is 32 bits. $FFFFFFFF + 1 wraps to $00000000 with the carry (C and X) flag set. The problem does not ask you to detect that.'],
          ['Test it', 'Put `DC.L $00012345,$00054321` at $A300 (`ORG $A300`). The sum $00066666 should appear at $A308 as the bytes 00 06 66 66.'],
        ],
        verified: 'Run on this site\'s 68000 emulator and checked against four data sets including $FFFFFFFF + 1 (wraps to 0). Not run on the real EASy68K.',
        solutions: [{ title: 'Three instructions', code: H3_1 }], trace: { src: H3_1 },
      },
      {
        n: 2, title: 'Search a block for $AA55', src: H3_2, check: 2, skel: H3_SKEL[2], checkFn: H3_CHECKS[2],
        ask: 'Write a 68K program that searches a block of memory for the first occurrence of the 16-bit word $AA55. The word sits on an even (word-boundary) address. Use EQU for the start and end addresses so the block can be any size. Convention used here: when you find it, leave its address in A2.',
        concepts: [['Loops and CMPA', '#/guide/branches'], ['Post-increment', '#/guide/modes'], ['EQU', '#/guide/syntax'], ['Condition codes', '#/guide/instructions']],
        hints: [
          'Reuse the shape of the lecture\'s zeroing loop: a pointer in A0, a limit in A1, a compare at the top, and a branch back at the bottom.',
          'Load the pattern into a data register once: `MOVE.W #pattern,D0`. Then `CMP.W (A0)+,D0` compares it with the next word and steps A0 by 2.',
          'After `CMP.W (A0)+,D0` matches, A0 already points one word PAST the match. How do you get the match address back? `LEA -2(A0),A2`.',
          'Step by two bytes per word, not one. That is automatic with `.W` and post-increment, and it keeps you on even addresses (a word access at an odd address is an address error on the 68000).',
          'The end address is not searched (it is the first address past the block), exactly as in the zeroing example.',
        ],
        walkthrough: [
          ['Plan', 'A0 = start, A1 = end, D0 = $AA55. Loop: if A0 has reached A1, stop; otherwise compare the word at A0 with D0; if equal we are done, if not move on.'],
          ['The loop test', '`CMPA.L A1,A0` computes A0 - A1. `BHS done` branches when A0 >= A1 (unsigned), i.e. the whole block has been searched. Addresses are unsigned, so use the unsigned branch (BHS = BCC).'],
          ['The compare', '`CMP.W (A0)+,D0` computes D0 - (A0) and then adds 2 to A0. `BNE loop` keeps going while they differ. Post-increment happens even when the compare fails, which is what makes the loop advance without a separate ADDQ.'],
          ['Off by one word', 'On a match A0 is already past it, so the address of the match is A0 - 2: `LEA -2(A0),A2`.'],
          ['First occurrence', 'The loop stops at the first match, so later copies are never examined. The checker puts a second $AA55 after the first one to make sure you return the earlier address.'],
          ['Not found', 'The handout does not say what to do. This solution clears A2 first, so A2 = 0 means "no match". Always say what your program returns when the search fails.'],
        ],
        verified: 'Run on this site\'s 68000 emulator against four data sets (a match early in the block, no match at all with a byte-swapped $55AA decoy and an $AA55 just past the end, and two cases with a second copy right after the first). Not run on the real EASy68K.',
        solutions: [{ title: 'Pointer loop with CMP.W (A0)+', code: H3_2 }], trace: { src: H3_2 },
      },
      {
        n: 3, title: 'Smallest byte (signed reading)', src: H3_3, check: 3, skel: H3_SKEL[3], checkFn: H3_CHECKS[3],
        ask: 'Write a 68K program that finds the smallest byte in a block of memory, treating bytes as SIGNED numbers (so $80 = -128 is the smallest possible and $7F = +127 the largest). Convention used here: the answer goes in D0.B.',
        concepts: [['Signed and unsigned branches', '#/guide/branches'], ['CMP and the flags', '#/guide/instructions'], ['Two\'s complement', '#/guide/numbers'], ['Loops and CMPA', '#/guide/branches']],
        hints: [
          'Keep a "smallest so far" in D0 and compare every byte with it. What should D0 start as so that the first real byte always wins?',
          'Start with the largest value a signed byte can hold: $7F (+127). Any byte is then smaller or equal.',
          '`CMP.B D0,D1` computes D1 - D0. Use the table in the handout: for signed "D1 > D0" the branch is BGT, so `BGT loop` means "this byte is not smaller, skip it".',
          'Do not use BHI/BLS/BCC/BCS for signed data. They compare as unsigned numbers and would call $FF (-1) larger than $7F.',
        ],
        walkthrough: [
          ['Two ways to read a byte', 'The same bits are different numbers: $80 is 128 unsigned or -128 signed. "Smallest" depends on which, so the branch you pick must match.'],
          ['The starting value', 'Initialise with the largest value so nothing is rejected wrongly: $7F for signed, $FF for unsigned. (The alternative is to load the first byte of the block into D0.)'],
          ['The compare', '`CMP.B D0,D1` subtracts D0 from D1 and sets the flags. After it, `BGT` is "D1 greater than D0, signed" (Z clear and N = V). Skip when greater; otherwise replace D0.'],
          ['Why not BHI?', 'BHI is the UNSIGNED "greater than". With signed data $FF (-1) would be treated as 255 and be skipped as "bigger", so the program would never pick -1 over +5. The handout says it used BHI, which actually finds the smallest UNSIGNED byte; problem 3b (unsigned) is that version.'],
          ['Equal bytes', 'Replacing D0 when the byte is equal does nothing harmful, so `BGT` (strictly greater) is fine.'],
          ['The loop test', 'Same as problem 2: `CMPA.L A1,A0` then `BHS done` (addresses are unsigned).'],
        ],
        verified: 'Run on this site\'s 68000 emulator against five data sets (including $80, $7F, all-equal and all-negative blocks). Not run on the real EASy68K.',
        solutions: [{ title: 'Signed: start at $7F, skip with BGT', code: H3_3 }], trace: { src: H3_3 },
      },
      {
        n: 4, title: 'Smallest byte (unsigned reading)', src: H3_4, check: 4, skel: H3_SKEL[4], checkFn: H3_CHECKS[4],
        ask: 'The same task with bytes read as UNSIGNED numbers ($00 is the smallest possible, $FF = 255 the largest). This is the version the handout\'s hint (BHI) points to. Answer in D0.B.',
        concepts: [['Signed and unsigned branches', '#/guide/branches'], ['CMP and the flags', '#/guide/instructions'], ['Loops and CMPA', '#/guide/branches']],
        hints: [
          'Only two things change from the signed version: the starting value and the branch.',
          'Start with the largest unsigned byte, $FF.',
          'Use the unsigned "greater than": BHI. The table says D1 > D0 unsigned is BHI after `CMP D0,D1`.',
        ],
        walkthrough: [
          ['What changes', 'Start value $7F becomes $FF, and `BGT` becomes `BHI`. Nothing else.'],
          ['The unsigned branches', 'After `CMP D0,D1`: D1 < D0 is BCS (also written BLO), D1 <= D0 is BLS, D1 > D0 is BHI, D1 >= D0 is BCC (BHS). They look at the carry flag (and Z), not at N and V.'],
          ['The Motorola naming quirk', 'The signed set is BLT/BLE/BGT/BGE. The unsigned set is BCS/BLS/BHI/BCC. The names are not symmetrical; the processor is. This is the table in the handout.'],
          ['Compare the two answers', 'On the same data $7F $FF $80 the signed minimum is $80 (-128) and the unsigned minimum is $7F (127). Run both versions and see.'],
        ],
        verified: 'Run on this site\'s 68000 emulator against five data sets. Not run on the real EASy68K.',
        solutions: [{ title: 'Unsigned: start at $FF, skip with BHI', code: H3_4 }], trace: { src: H3_4 },
      },
    ],
  };
  const HWS = { hw2: HW2, hw3: HW3 };

  if (root.EXAMPLES_68K && !root.EXAMPLES_68K.some((e) => e.name.startsWith('Homework 2'))) root.EXAMPLES_68K.push({ name: 'Homework 2, problem 1 (program from the handout)', src: P1_SRC });
  HW2.id = 'hw2';
  const api = { HW2, HW3, HWS, SKELETON, CHECKS, trace, runWith, load, P1_SRC };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Homework = api;
})(typeof window !== 'undefined' ? window : globalThis);
