---
title: "Instructor's midterm practice problems"
source: "BEE425F26 Midterm exam practice questions.pdf, supplied by the instructor. The instructor also asks questions that are not on this list."
problems:
  - n: 1
    title: "Power trace width at liquid-nitrogen temperature"
    concepts: [pcb-design.trace-resistance]
    prompt: |
      The resistivity of copper is not constant; assume rho(T) = 5.67 x 10^-9 T + 1.58 x 10^-8 ohm-cm, with T in kelvin.
      A circuit on a spacecraft runs at about the temperature of liquid nitrogen, **77 K**. Its power trace must carry **8 A**, is **4 in** long, and the copper is **0.002 in** thick.
      How wide must the trace be so that the voltage drop is **no more than 100 mV**?
    solution: |
      1. **Resistivity at 77 K:** rho = 5.67e-9 x 77 + 1.58e-8 = 4.366e-7 + 1.58e-8 = **4.524 x 10^-7 ohm-cm**. (Check: at 293 K the formula gives 1.677e-6, matching the 1.68e-6 in the problem.)
      2. **Allowed resistance:** R = V / I = 0.1 V / 8 A = **0.0125 ohm**.
      3. **Length in cm:** 4 in x 2.54 = 10.16 cm. **Thickness in cm:** 0.002 in x 2.54 = 0.00508 cm.
      4. **Area:** R = rho L / A, so A = rho L / R = 4.524e-7 x 10.16 / 0.0125 = **3.677 x 10^-4 cm^2**.
      5. **Width:** W = A / thickness = 3.677e-4 / 0.00508 = 0.0724 cm = **0.0285 in, about 28.5 mil**.
      At room temperature the same trace would need a wider trace (the copper is about 3.7 times more resistive), so cold copper lets the trace be narrower.
  - n: 2
    title: "True or false"
    concepts: [processor-basics.bus-types, clocks-and-pulses.time-and-frequency, clocks-and-pulses.duty-cycle, buses-and-cells.active-low-negative-logic, buses-and-cells.address-space-alignment, memory-decoding.address-lines]
    prompt: |
      Say whether each statement is true or false, and why.
    parts:
      - label: a
        prompt: "Of the three major busses of a microprocessor, only the address bus is bidirectional."
        answer: "False"
        explain: "The address bus is unidirectional (processor to memory). The data bus is the bidirectional one."
      - label: b
        prompt: "A clock signal whose period measures 2 nanoseconds will have a frequency of 50 GHz."
        answer: "False"
        explain: "f = 1 / 2 ns = 500 MHz. (A 1 ns period is 1 GHz.)"
      - label: c
        prompt: "The Z80 instruction LD C,00 and the 68K instruction CLR.B D5 are functionally identical."
        answer: "Mostly true, with a caveat"
        explain: "Both put zero into an 8-bit register (a different register on each). They are not identical in every effect: CLR.B sets Z and clears N, V and C, while LD C,0 leaves the Z80 flags unchanged (both verified by running them). If the question means 'clear an 8-bit register', say true; if it means 'identical in all effects', say false and give the flag difference."
      - label: d
        prompt: "A clock pulse is said to have a 50% duty cycle if the time the clock signal is low is 1/2 of the time the clock signal is high."
        answer: "False"
        explain: "50% duty cycle means the high time equals the low time. If low is half of high the duty cycle is 2 / (2 + 1) = 66.7%."
      - label: e
        prompt: "The NOR gate is the negative logic equivalent of the positive logic OR gate."
        answer: "False"
        explain: "The negative-logic equivalent of OR is AND (OR gates become AND gates in negative logic). NOR is OR followed by an inversion."
      - label: f
        prompt: "The 68000 microprocessor is capable of addressing 16,777,216 bytes of memory."
        answer: "True"
        explain: "24 address lines give 2^24 = 16,777,216 bytes (16 MB)."
      - label: g
        prompt: "Of the three major busses in a microprocessor, only the data bus is completely bidirectional."
        answer: "True"
        explain: "The address bus is one way, and the control bus is a mix of inputs, outputs and bidirectional signals."
      - label: h
        prompt: "30 address lines are required for a 1 GByte deep memory circuit."
        answer: "True"
        explain: "1 GB = 2^30 bytes, so 30 address lines."
    programs:
      - cpu: m68k
        name: "CLR.B sets Z and clears N V C (problem 2c)"
        source: |
          * program
                  ORG     $1000
          START   MOVE.B  #1,D5
                  CLR.B   D5
                  SIMHALT
                  END     START
        expect:
          regs: { D5: 0 }
          flags: { Z: 1, N: 0, V: 0, C: 0 }
      - cpu: z80
        name: "LD C,0 leaves the Z80 flags unchanged (problem 2c)"
        source: |
          ; program
                  .ORG 0100H
          START:  LD A,1
                  OR A
                  LD C,0
                  HALT
                  .END
        expect:
          regs: { c: 0, f: 0 }
  - n: 3
    title: "Memory system with 256K x 4 chips"
    concepts: [memory-decoding.chip-organization, memory-decoding.pages-and-offsets, memory-decoding.page-ranges, memory-systems.memory-design-steps]
    prompt: |
      A microprocessor has a **24-bit address bus** and an **8-bit data bus**. Build a memory system from **1 Mbit static RAM chips organised as 256K x 4**, **fully populated**.

      - **a.** How many RAM chips are on each page?
      - **b.** How many RAM chips are needed to fully populate the memory space?
      - **c.** Which address bits are the offset bits and which are the page bits?
      - **d.** How many memory pages do we need?
      - **e.** What is the address range (hex) of the first four pages?
    parts:
      - label: a
        prompt: "Chips per page"
        answer: "2"
        explain: "8-bit bus / 4-bit chips = 2 chips side by side."
      - label: b
        prompt: "Chips for the whole memory space"
        answer: "128"
        explain: "A page holds 256K x 8 bits = 256 KB. 16 MB / 256 KB = 64 pages, and 64 x 2 chips = 128 chips."
      - label: c
        prompt: "Offset and page bits"
        answer: "Offset A0-A17; page A18-A23"
        explain: "256K = 2^18 locations per chip, so 18 offset bits (A0-A17). The remaining 24 - 18 = 6 lines (A18-A23) are the page bits."
      - label: d
        prompt: "Number of pages"
        answer: "64"
        explain: "6 page bits give 2^6 = 64 pages."
      - label: e
        prompt: "First four page ranges"
        answer: "$000000-$03FFFF, $040000-$07FFFF, $080000-$0BFFFF, $0C0000-$0FFFFF"
        explain: "Each page is 256 KB = $40000. Page n starts at n x $40000 and ends at start + $3FFFF."
  - n: 4
    title: "Clock skew, split ground planes and bypass capacitors"
    concepts: [pcb-design.clock-skew, pcb-design.ground-management, pcb-design.power-planes-bypass]
    prompt: |
      Briefly discuss each term and how it applies to a microprocessor-based system.

      - **a.** Clock skew
      - **b.** Split, or multiple ground planes
      - **c.** Bypass capacitors
    parts:
      - label: a
        prompt: "Clock skew"
        answer: "Differences in when the same clock edge arrives at different parts"
        explain: "Time differences in the arrival of clock edges due to different path lengths and propagation delays through the circuitry (for example through clock buffers). In a microprocessor system the clock touches almost every component, so skew reduces timing margins; keep clock distribution balanced and characterise the clock first after the board passes the smoke test."
      - label: b
        prompt: "Split or multiple ground planes"
        answer: "Separate analog and digital grounds, joined at one point"
        explain: "Digital circuits are noisy (switching current spikes) while analog circuits measuring small signals need a quiet ground, so separate or isolated planes keep digital return currents from creating noise on analog signals. Join the planes at only one point: more connections create ground loops (noise, 60 Hz hum, oscillations)."
      - label: c
        prompt: "Bypass capacitors"
        answer: "Local charge storage for fast logic edges"
        explain: "A fast logic edge needs a high instantaneous current to charge the load capacitance. Bypass capacitors store charge close to the ICs to supply it, reducing voltage spikes on the supply. Rule of thumb: about one per 1-2 ICs (0.1 uF ceramic), with a larger filter capacitor (10 uF) on the board."
  - n: 5
    title: "Pairing 68K and Z80 instructions"
    concepts: [assembly-programs.z80-load, assembly-programs.m68k-move, program-control.z80-jumps-and-calls, programmers-model.m68k-flags]
    prompt: |
      Pair each 68K instruction with the Z80 instruction that does the same thing (an operand may differ), and write a sentence saying what each pair does.
      **68000:** `BEQ label`, `CMP.B D0,D1`, `MOVE.B #$55,D7`, `MOVE.B D1,$0000FF35`, `MOVE.B D6,D5`

      **Z80:** `LD [0A3E7H],A`, `JR Z,foo`, `LD C,0A4H`, `LD B,A`, `CP D`
    parts:
      - label: "1"
        prompt: "BEQ label"
        answer: "JR Z,foo"
        explain: "Both branch to the label if the Zero flag is set (relative branch/jump)."
      - label: "2"
        prompt: "CMP.B D0,D1"
        answer: "CP D"
        explain: "Both subtract and set the flags without storing the result. The 68000 compares two data registers; the Z80 compares register D with the accumulator A."
      - label: "3"
        prompt: "MOVE.B #$55,D7"
        answer: "LD C,0A4H"
        explain: "Both load an immediate byte into a register (the value and the register differ: $55 into D7 versus A4H into C)."
      - label: "4"
        prompt: "MOVE.B D1,$0000FF35"
        answer: "LD [0A3E7H],A"
        explain: "Both store a byte from a register to an absolute memory address. On the Z80 only A can use absolute addressing."
      - label: "5"
        prompt: "MOVE.B D6,D5"
        answer: "LD B,A"
        explain: "Both copy a byte from one register to another. The 68000 writes the source first (D6 to D5); the Z80 writes the destination first (A to B)."
  - n: 6
    title: "Hand assembly"
    concepts: [assembly-programs.m68k-instruction-words, addressing-modes.m68k-effective-address, addressing-modes.m68k-absolute-immediate]
    prompt: |
      Hand assemble these 68K instructions and give the result as a series of hexadecimal words. (Example: `NOP` = $4E71.) You will need to look up the instructions.

      - **a.** `MOVE.W #$3400,(A3)+`
      - **b.** `ADD.B D6,$A4578A04`
      - **c.** `EOR.L D3,D6`
      - **d.** `SWAP D6`
      - **e.** `CLR.W $AD459BC0`
    encodings:
      - { cpu: m68k, asm: "MOVE.W #$3400,(A3)+", hex: "36FC 3400" }
      - { cpu: m68k, asm: "ADD.B D6,$A4578A04", hex: "DD39 A457 8A04" }
      - { cpu: m68k, asm: "EOR.L D3,D6", hex: "B786" }
      - { cpu: m68k, asm: "SWAP D6", hex: "4846" }
      - { cpu: m68k, asm: "CLR.W $AD459BC0", hex: "4279 AD45 9BC0" }
    parts:
      - label: a
        prompt: "MOVE.W #$3400,(A3)+"
        answer: "$36FC $3400"
        explain: "MOVE format 00 | size | dest reg | dest mode | src mode | src reg. Size word = 11; destination register A3 = 011, destination mode (An)+ = 011; source mode 111, register 100 (immediate). 0011 011 011 111 100 = $36FC, then the immediate word $3400."
      - label: b
        prompt: "ADD.B D6,$A4578A04"
        answer: "$DD39 $A457 $8A04"
        explain: "ADD format 1101 | register | opmode | EA. Register D6 = 110; opmode 100 means byte, Dn is the source and the effective address is the destination; EA = absolute long (mode 111, register 001). 1101 110 100 111 001 = $DD39, then the long address $A457 $8A04."
      - label: c
        prompt: "EOR.L D3,D6"
        answer: "$B786"
        explain: "EOR format 1011 | Dn | opmode | EA. Dn = D3 = 011; opmode 110 means long with the EA as destination; EA = D6 (mode 000, register 110). 1011 011 110 000 110 = $B786."
      - label: d
        prompt: "SWAP D6"
        answer: "$4846"
        explain: "SWAP is $4840 plus the register number: $4840 + 6 = $4846."
      - label: e
        prompt: "CLR.W $AD459BC0"
        answer: "$4279 $AD45 $9BC0"
        explain: "CLR format 0100 0010 | size | EA. Size word = 01; EA = absolute long (mode 111, register 001). 0100 0010 01 111 001 = $4279, then the long address $AD45 $9BC0."
  - n: 7
    title: "Count the 1 bits in a longword"
    concepts: [program-control.m68k-loops-and-ifs, program-control.m68k-compare-and-flags, addressing-modes.m68k-register-direct]
    prompt: |
      Write a 68K program that counts the number of 1 bits in a longword stored at memory location **$00002000**. Hint: consider the LSL instruction and think how you might use the carry bit. Do not destroy the number in memory: move the longword to a register first, then count.
    solution: |
      Shift the register left one bit at a time. LSL moves the top bit into the **carry flag**, so after each shift the carry says whether that bit was a 1. Repeat 32 times and count the carries.

      ```
              ORG     $1000
      START   MOVE.L  $00002000,D0     * copy the longword; memory is untouched
              CLR.L   D1               * D1 = number of 1 bits
              MOVE.W  #32,D2           * 32 bits to examine
      loop    LSL.L   #1,D0            * top bit goes into C
              BCC     skip             * C = 0: bit was 0, nothing to count
              ADDQ.B  #1,D1            * C = 1: count it
      skip    SUBQ.W  #1,D2
              BNE     loop
              SIMHALT
              END     START
      ```

      A shorter alternative uses the extend flag: with `CLR.L D3` first, replace the test and add with `ADDX.L D3,D1` (it adds zero plus the extend/carry bit), looping with `DBRA`.

      Both versions were run on the 68000 core: for the longword $F0F0A5C3 they leave **16** in D1, for $FFFFFFFF they give 32, for $00000000 they give 0, and for $80000001 they give 2.
    programs:
      - cpu: m68k
        name: "count 1 bits, loop version, $F0F0A5C3"
        source: |
          * program
                  ORG     $1000
          START   MOVE.L  $00002000,D0
                  CLR.L   D1
                  MOVE.W  #32,D2
          loop    LSL.L   #1,D0
                  BCC     skip
                  ADDQ.B  #1,D1
          skip    SUBQ.W  #1,D2
                  BNE     loop
                  SIMHALT
                  END     START
        expect:
          preload: { 8192: [0xF0, 0xF0, 0xA5, 0xC3] }
          regs: { D1: 16 }
          mem: { 8192: [0xF0, 0xF0, 0xA5, 0xC3] }
      - cpu: m68k
        name: "count 1 bits, loop version, $80000001"
        source: |
          * program
                  ORG     $1000
          START   MOVE.L  $00002000,D0
                  CLR.L   D1
                  MOVE.W  #32,D2
          loop    LSL.L   #1,D0
                  BCC     skip
                  ADDQ.B  #1,D1
          skip    SUBQ.W  #1,D2
                  BNE     loop
                  SIMHALT
                  END     START
        expect:
          preload: { 8192: [0x80, 0x00, 0x00, 0x01] }
          regs: { D1: 2 }
      - cpu: m68k
        name: "count 1 bits, ADDX version, $F0F0A5C3"
        source: |
          * program
                  ORG     $1000
          START   MOVE.L  $00002000,D0
                  CLR.L   D1
                  CLR.L   D3
                  MOVEQ   #31,D2
          loop    LSL.L   #1,D0
                  ADDX.L  D3,D1
                  DBRA    D2,loop
                  SIMHALT
                  END     START
        expect:
          preload: { 8192: [0xF0, 0xF0, 0xA5, 0xC3] }
          regs: { D1: 16 }
---

Practice problems provided by the instructor for the BEE 425 Fall 2026 midterm.
