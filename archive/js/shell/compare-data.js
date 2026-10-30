/* 68000 / Z80 side-by-side: pairs of programs that do the same job, one per processor, plus what differs and why.
   Each side names where its answer ends up ({ reg }); runPair() assembles and runs both on this site's CPU cores and returns
   the answers, code size and instruction counts. tests/compare-check.js runs every pair and requires equal answers, so a pair
   that is shown here is a pair that was executed. The loop pairs follow Lesson 5 slides 40-43 (FOR, DO/WHILE) and Lesson 4
   slide 16 (WHILE); the rest are the same everyday jobs on both machines. */
(function (root) {
  'use strict';
  const PAIRS = [
    {
      id: 'for', topic: 'Loops', title: 'FOR loop: count to a limit', lesson: 'L5, slide 42', expect: 45,
      idea: 'Sum 1 + 2 + ... + 9 with a counter that starts at 1 and stops when it equals 10. The test is at the top, so the body runs 9 times.',
      m68k: { guide: 'branches', reg: 'D2', src: `        ORG    $400
        MOVE.L #1,D0         * D0 is the counter
        MOVE.L #10,D1        * D1 holds the terminal value
        CLR.L  D2            * D2 is the running sum
for     CMP.B  D0,D1         * do the test (D1 - D0)
        BEQ    next_code     * are we done yet?
        ADD.L  D0,D2         * loop body
        ADDQ.L #1,D0         * increment the counter
        BRA    for           * go back
next_code
        SIMHALT
        END    $400
` },
      z80: { guide: 'branches', reg: 'D', src: `        .ORG 0100H
        LD B,1               ; B is the counter
        LD C,10              ; C holds the terminal value
        LD D,0               ; D is the running sum
FOR:    LD A,B
        CP C                 ; do the test (A - C)
        JR Z,NEXTCODE        ; are we done yet?
        LD A,D               ; loop body: the Z80 can only add into A
        ADD A,B
        LD D,A
        INC B                ; increment the counter
        JR FOR               ; go back
NEXTCODE:
        HALT
` },
      differences: [
        'The 68000 adds any data register to any other (`ADD.L D0,D2`); the Z80 adds only into the accumulator, so the body needs `LD A,D` / `ADD A,B` / `LD D,A`.',
        'The 68000 compares two registers directly (`CMP.B D0,D1`); the Z80 compares against A (`CP C`), so the counter is copied into A first.',
        '`BEQ` and `JR Z` both test the Zero flag the compare just set; `BRA` and `JR` are both unconditional relative jumps.',
      ],
    },
    {
      id: 'while', topic: 'Loops', title: 'WHILE loop: stop at an end address', lesson: 'L4, slide 16', expect: 31,
      idea: 'Add up the bytes of a table, testing "have I reached the end?" before each pass. The table is 3 1 4 1 5 9 2 6, so the sum is 31.',
      m68k: { guide: 'branches', reg: 'D2', src: `        ORG    $400
        LEA    table,A0      * pointer to the first byte
        LEA    tend,A1       * address just past the last byte
        CLR.L  D0
        CLR.L  D2            * running sum
while   CMPA.L A1,A0         * reached the end?
        BEQ    done
        MOVE.B (A0)+,D0      * body: read a byte, advance the pointer
        ADD.L  D0,D2
        BRA    while
done    SIMHALT
table   DC.B   3,1,4,1,5,9,2,6
tend    DC.B   0
        END    $400
` },
      z80: { guide: 'branches', reg: 'C', src: `        .ORG 0100H
        LD HL,TABLE          ; pointer to the first byte
        LD DE,TEND           ; address just past the last byte
        LD C,0               ; running sum
WHILE:  OR A                 ; clear carry
        SBC HL,DE            ; HL - DE: reached the end?
        JR Z,DONE
        ADD HL,DE            ; the compare destroyed HL: put it back
        LD A,C               ; body: read a byte, add it to the sum
        ADD A,[HL]
        LD C,A
        INC HL               ; advance the pointer
        JR WHILE
DONE:   HALT
TABLE:  .DB 3,1,4,1,5,9,2,6
TEND:   .DB 0
` },
      differences: [
        'Comparing two addresses is one instruction on the 68000 (`CMPA.L A1,A0`). The Z80 has no 16-bit compare, so it subtracts (`SBC HL,DE`) and then adds back (`ADD HL,DE`) to restore HL; `OR A` clears the carry first.',
        'The 68000 reads and advances in one instruction (`MOVE.B (A0)+,D0`, post-increment). On the Z80 the read and `INC HL` are separate.',
        '`MOVE` does not touch the accumulator; the Z80 has to bring the running sum into A to add (`LD A,C` / `ADD A,[HL]` / `LD C,A`).',
      ],
    },
    {
      id: 'dowhile', topic: 'Loops', title: 'DO/WHILE loop: body first, test after', lesson: 'L5, slide 43', expect: 4,
      idea: 'Call a subroutine, then test the next byte; repeat until it equals the marker 9. The data is 5 5 5 9, so the subroutine runs 4 times, always at least once.',
      m68k: { guide: 'stack', reg: 'D3', src: `        ORG    $400
        LEA    data,A2       * initialise the loop pointer
        CLR.L  D3            * D3 counts calls
test_loop
        JSR    subroutine    * the function call happens at least once
        CMPI.B #9,(A2)+      * compare the new value, then advance A2
        BNE    test_loop     * the test condition is still true
        SIMHALT
subroutine
        ADDQ.L #1,D3
        RTS
data    DC.B   5,5,5,9
        END    $400
` },
      z80: { guide: 'stack', reg: 'B', src: `        .ORG 0100H
        LD HL,DATA           ; initialise the loop pointer
        LD B,0               ; B counts calls
TESTLOOP:
        CALL SUBR            ; the function call happens at least once
        LD A,[HL]            ; compare the new value...
        INC HL               ; ...then advance HL (two steps)
        CP 9
        JR NZ,TESTLOOP       ; the test condition is still true
        HALT
SUBR:   INC B
        RET
DATA:   .DB 5,5,5,9
` },
      differences: [
        '`JSR` / `RTS` and `CALL` / `RET` do the same job: push the return address, jump, and pop it back. The 68000 stack grows down from A7; the Z80 from SP.',
        '`CMPI.B #9,(A2)+` compares and post-increments in one instruction; the Z80 needs `LD A,[HL]`, `INC HL`, `CP 9`.',
        'The test is at the bottom of both loops, which is what makes it DO/WHILE rather than WHILE.',
      ],
    },
    {
      id: 'countdown', topic: 'Loops', title: 'Counted loop: DBRA and DJNZ', lesson: 'L5 (loops); DBcc and DJNZ from the processor manuals', expect: 150,
      idea: 'Add five bytes (10 20 30 40 50 = 150) with the instruction each processor provides for counted loops.',
      m68k: { guide: 'branches', reg: 'D1', src: `        ORG    $400
        LEA    table,A0
        CLR.L  D1            * running sum
        MOVEQ  #4,D0         * count is N - 1: DBRA stops at -1
loop    ADD.B  (A0)+,D1
        DBRA   D0,loop       * D0 = D0 - 1; branch unless D0 is now -1
        SIMHALT
table   DC.B   10,20,30,40,50
        END    $400
` },
      z80: { guide: 'branches', reg: 'A', src: `        .ORG 0100H
        LD HL,TABLE
        XOR A                ; running sum in A
        LD B,5               ; count is N: DJNZ stops at 0
LOOP:   ADD A,[HL]
        INC HL
        DJNZ LOOP            ; B = B - 1; branch unless B is now 0
        HALT
TABLE:  .DB 10,20,30,40,50
` },
      differences: [
        '**Off by one.** `DBRA` stops when the counter reaches **−1**, so you load N − 1 (`MOVEQ #4,D0` for five passes). `DJNZ` stops at **0**, so you load N (`LD B,5`).',
        '`DBRA` works with any of D0-D7 and a 16-bit counter (65,536 passes). `DJNZ` is tied to register B and an 8-bit counter, where `LD B,0` gives 256 passes.',
        '`DBRA` is `DBF`: the full family `DBcc` also stops early when a condition is true. The Z80 has only the one `DJNZ`; conditional exits use a separate `JR cc`.',
        'On the Z80 the sum can live in A, which is also the accumulator that `ADD` needs; on the 68000 `ADD.B (A0)+,D1` adds memory straight into any D register.',
      ],
    },
    {
      id: 'max', topic: 'Decisions', title: 'If / else: the larger of two numbers', lesson: 'L5', expect: 200,
      idea: 'Put the larger of two unsigned bytes (130 and 200) in a register.',
      m68k: { guide: 'branches', reg: 'D0', src: `        ORG    $400
        MOVE.B #130,D0
        MOVE.B #200,D1
        CMP.B  D0,D1         * D1 - D0
        BLS    keep          * D1 <= D0 (unsigned): D0 is already the larger
        MOVE.B D1,D0
keep    SIMHALT
        END    $400
` },
      z80: { guide: 'branches', reg: 'A', src: `        .ORG 0100H
        LD A,130
        LD B,200
        CP B                 ; A - B
        JR NC,KEEP           ; A >= B (unsigned): A is already the larger
        LD A,B
KEEP:   HALT
` },
      differences: [
        'The 68000 has a branch for every comparison, signed and unsigned (`BHI`, `BLS`, `BGT`, `BLE`, ...). The Z80 has only carry and zero for unsigned compares (`NC`, `C`, `Z`, `NZ`); a signed compare takes extra work (see the Jumps guide).',
        'After `CMP.B D0,D1` the 68000 computes **D1 − D0** (destination minus source); after `CP B` the Z80 computes **A − B**. The operand order is reversed, so read the instruction rather than guessing.',
        'Both leave the compared registers unchanged; only the flags record the result.',
      ],
    },
    {
      id: 'stack', topic: 'Stack', title: 'The stack: swap two registers', lesson: 'L5', expect: 7,
      idea: 'Push two values, pop them back in the opposite order, and so swap them. The answer is the value that started in the second register.',
      m68k: { guide: 'stack', reg: 'D0', src: `        ORG    $400
        MOVE.L #3,D0
        MOVE.L #7,D1
        MOVE.L D0,-(A7)      * push D0
        MOVE.L D1,-(A7)      * push D1
        MOVE.L (A7)+,D0      * pop into D0 (gets 7)
        MOVE.L (A7)+,D1      * pop into D1 (gets 3)
        SIMHALT
        END    $400
` },
      z80: { guide: 'stack', reg: 'B', src: `        .ORG 0100H
        LD B,3               ; BC = 0300H
        LD D,7               ; DE = 0700H
        PUSH BC              ; push BC
        PUSH DE              ; push DE
        POP BC               ; pop into BC (gets 0700H)
        POP DE               ; pop into DE (gets 0300H)
        HALT
` },
      differences: [
        'The 68000 has no PUSH or POP: it pushes with **pre-decrement** (`-(A7)`) and pops with **post-increment** (`(A7)+`) on any `MOVE`. The Z80 has dedicated `PUSH` and `POP`, and only for 16-bit pairs.',
        'A Z80 push is always 16 bits (two bytes). A 68000 stack item is the size of the `MOVE` (byte, word or long).',
        'Any address register can be a 68000 stack pointer (A7 is the system one); the Z80 has one, SP.',
      ],
    },
    {
      id: 'endian', topic: 'Memory', title: 'Byte order: where does $1234 go?', lesson: 'L6, slide 25', expect: 18,
      idea: 'Store the 16-bit value 1234H, then read the byte at its first address. The 68000 puts the high byte first (big-endian, $12 = 18); the Z80 puts the low byte first (little-endian, $34 = 52), so the two answers differ on purpose.',
      m68k: { guide: 'memory', reg: 'D1', src: `        ORG    $400
        MOVE.W #$1234,$2000  * store a 16-bit word
        MOVE.B $2000,D1      * read the byte at the first address
        SIMHALT
        END    $400
` },
      z80: { guide: 'memory', reg: 'A', src: `        .ORG 0100H
        LD HL,1234H
        LD (2000H),HL        ; store a 16-bit value
        LD A,(2000H)         ; read the byte at the first address
        HALT
` },
      expectZ80: 52,
      differences: [
        '**Big-endian vs little-endian.** The 68000 stores the most significant byte at the lowest address, so the first byte is $12. The Z80 stores the least significant byte first, so the first byte is $34.',
        'Both orders are consistent inside one machine. It matters when you read a word as two bytes, load a table of words from a file, or connect a 16-bit device to the other processor.',
        '`LD HL,1234H` loads the pair with H = 12H and L = 34H on any Z80; the byte order only shows up in memory.',
      ],
    },
    {
      id: 'index', topic: 'Addressing', title: 'Indexed access: the fourth array element', lesson: 'L5', expect: 40,
      idea: 'Read element 3 (counting from 0) of the array 10 20 30 40 50 without moving the pointer.',
      m68k: { guide: 'modes', reg: 'D0', src: `        ORG    $400
        LEA    array,A0
        MOVE.B 3(A0),D0      * address register indirect with displacement
        SIMHALT
array   DC.B   10,20,30,40,50
        END    $400
` },
      z80: { guide: 'modes', reg: 'A', src: `        .ORG 0100H
        LD IX,ARRAY
        LD A,[IX+3]          ; indexed addressing: IX plus a displacement
        HALT
ARRAY:  .DB 10,20,30,40,50
` },
      differences: [
        'The 68000 can use any address register with a displacement (`3(A0)`) or a data register as a second index (`0(A0,D1)`). The Z80 has only IX and IY for indexing, with a signed 8-bit displacement (−128 to +127).',
        'An indexed Z80 instruction is longer and slower than the plain `(HL)` form, so use HL when you are stepping through data and IX when you need fixed offsets (a record or a stack frame).',
        'Neither changes the pointer: the displacement is added only for that access.',
      ],
    },
  ];

  const hex = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');
  const need = (name) => (typeof require !== 'undefined' ? require('../' + name) : null);
  function run68(side) {
    const A = root.Asm68K || need('m68k/asm.js'), C = root.CPU68K || need('m68k/cpu.js');
    const r = A.assemble(side.src); if (!r.ok) return { ok: false, error: r.errors.map((e) => e.msg).join('; ') };
    const cpu = new C.CPU(); let bytes = 0; r.image.forEach((seg) => { cpu.mem.set(seg.bytes, seg.addr); bytes += seg.bytes.length; });
    cpu.A[7] = 0x00FF0000; cpu.pc = r.start; cpu.run(200000);
    if (!/^SIMHALT/.test(cpu.halted || '')) return { ok: false, error: cpu.halted || 'did not halt' };
    const n = +/^D(\d)$/.exec(side.reg)[1];
    return { ok: true, value: cpu.D[n] & 0xFF, bytes, steps: cpu.steps, extra: '', where: side.reg };
  }
  function runZ80(side) {
    const A = root.AsmZ80 || need('z80/asm.js'), C = root.CPUZ80 || need('z80/cpu.js');
    const r = A.assemble(side.src); if (!r.ok) return { ok: false, error: r.errors.map((e) => e.msg).join('; ') };
    const cpu = new C.CPU(); cpu.mem.set(r.mem); cpu.pc = r.origin; cpu.sp = 0xF000;
    let n = 0; while (!cpu.halted && n < 200000) { cpu.step(); n++; }
    if (!cpu.halted) return { ok: false, error: 'did not halt' };
    return { ok: true, value: cpu[side.reg.toLowerCase()] & 0xFF, bytes: r.size, steps: n, extra: `${cpu.cycles} T-states`, where: side.reg };
  }
  const runPair = (p) => ({ m68k: run68(p.m68k), z80: runZ80(p.z80) });
  const api = { PAIRS, runPair, run68, runZ80, hex };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CompareData = api;
})(typeof window !== 'undefined' ? window : globalThis);
