/* Labs: what each lab taught, as exam preparation. The lectures say exams ask lab questions.
   Content comes from the Lab 1 (Rev 5) and Lab 2 (Rev 10) handouts. Datasheet values the handouts ask you to look up are NOT quoted here.
   Same shape as START.LESSONS (see start.js). Calculations are marked (calc). */
(function (root) {
  'use strict';
  const LABS = [
    {
      id: 'lab1-analyzer', title: 'Lab 1: using a logic analyzer', lecture: 'Lab 1', mins: 15, needs: 'Numbers and buses lessons.',
      goal: 'Say what a logic analyzer does, the difference between timing and state mode, and how a trigger pattern is set.',
      md: `## What it is

A **logic analyzer** is to digital systems what an oscilloscope is to analog ones. Instead of showing a voltage as it moves, it records many digital signals (the lab's LogicPort samples **32 signals plus 2 clocks, at up to 500 MHz**) and shows each as 0 or 1 over time. It can also **group** signals, so that eight data lines are shown as one hex number.

You connect it with a 40-wire probe cable: eight data lines (D0 to D7, D7 the most significant), a clock input, and **a ground wire connected to the board's ground**. The analyzer is powered from the PC's USB port, so it shares the PC's ground; the handout warns that mismatched grounds can damage the analyzer, the PC or the board.

## Timing mode and state mode

| | Timing mode | State mode |
|---|---|---|
| Sample clock | The analyzer's own internal clock | The **circuit's** clock (external) |
| You set | Sample rate (the lab used 500 MHz) | Which clock edge to sample on |
| Shows | When things change, so you can measure delays | The sequence of values, one per clock |
| Lab use | Measure propagation delay | List the sequence of states |

In state mode you must choose the clock edge carefully. The flip-flops in the circuit change on the **rising** edge, so right after that edge the outputs are still changing. The Lab 1 handout asks whether you should acquire data while the outputs are changing and leaves the choice to you; the **Lab 2 handout uses the falling edge** of CLK1 for state mode.

**Resolution (calc).** At 500 MHz the analyzer takes a sample every 1 / 500 MHz = 2 ns, so that is the finest delay it can resolve.

## Triggers

A **trigger** tells the analyzer when to stop watching and keep a capture. In the lab you set a **pattern** by clicking each bit between 1, 0 and X (don't care). To trigger on **E5h**: E = 1110 and 5 = 0101, so D7..D0 = 1 1 1 0 0 1 0 1.

The **pre-trigger buffer** sets how much of the capture is from *before* the trigger (the lab used 1% in state mode and about 10% in timing mode). Times before the trigger are shown as negative and after it as positive.

> **Why triggers matter:** a logic analyzer has limited memory. Without a trigger you capture whatever happens to be on the wires; with one you capture the moment you care about.

## Exporting

Captures can be exported as a **CSV file** and opened in Excel, which is how the lab's deliverable listing was produced.`,
      check: [
        ['What is the main difference between timing mode and state mode?', 'Timing mode samples with the analyzer\'s own internal clock (so you see when signals change); state mode samples with the circuit\'s external clock (so you see one value per clock).'],
        ['Why connect the analyzer\'s ground wire to the board?', 'So both share a common reference; without it the readings are meaningless, and mismatched grounds can damage equipment.'],
        ['What bit pattern (D7 to D0) triggers on E5h?', '1110 0101.'],
        ['The analyzer samples at 500 MHz. What is the smallest time step it can show?', '1 / 500 MHz = 2 ns.'],
        ['What does the pre-trigger buffer control?', 'How much of the stored capture comes from before the trigger event.'],
      ],
      next: {},
    },
    {
      id: 'lab1-prng', title: 'Lab 1: the pseudorandom number generator', lecture: 'Lab 1', mins: 15, needs: 'Lab 1: using a logic analyzer.',
      goal: 'Explain how the shift-register and XOR circuit makes a pseudorandom sequence, and how the lab measured its length and delay.',
      md: `## The circuit

The lab's circuit is a **pseudorandom number generator**: D-type flip-flops arranged as a **shift register**, with **XOR gates** feeding back into the stages. On each clock edge the register shifts, and the XOR gates mix some of the bits to make new ones. The result looks random but is fully determined by the circuit and its starting state, so it eventually **repeats**: that is why it is "pseudo" random.

The Logisim design in the lab: **twelve D flip-flops and eight XOR gates**; the XOR inputs come from the Q or ~Q outputs of the flip-flops, and one XOR output feeds the first flip-flop. The hardware board's output to the analyzer is an **8-bit byte**, which gives 256 possible values.

## XOR with several inputs

A two-input XOR is true when the inputs *differ*. With more inputs, the practical rule (and the lab's) is that the output is true when an **odd number** of inputs are true. It is built as a cascade: f(a, b, c) = c XOR (a XOR b). This makes it a **parity generator**.

## Length of the sequence

Counting states by hand is slow, so the lab used Logisim's logging and the analyzer's state list. In general, a register of N flip-flops has at most 2^N states (calc). The sequence ends when it returns to a state it has been in before. A good result in the handout is **over 100 non-repeating states**.

## The delay measurement

In timing mode, cursor A goes on a rising clock edge and cursor B on the first point where the data is stable. The difference is the **propagation delay from clock to stable data**. The handout then asks you to compare it with the datasheet delays of the two chips used: the **74LS175 (quad D flip-flop)** and the **74LS86 (quad two-input XOR)**. The measured delay should roughly be the flip-flop's clock-to-output delay plus the XOR gate delay (calc). The handout asks you to look up those numbers; none are quoted here.

> **A fact that is true of any XOR feedback shift register** (general knowledge, not from the handout): the all-zeros state feeds back zeros, so it stays all zeros forever. Such circuits must never be allowed to start there.`,
      check: [
        ['Why is the sequence called pseudorandom?', 'It looks random, but it is fully determined by the circuit and eventually repeats.'],
        ['When is a three-input XOR output true?', 'When an odd number of its inputs are true (it acts as a parity generator).'],
        ['How many flip-flops and XOR gates did the lab\'s Logisim design use?', 'Twelve D flip-flops and eight XOR gates.'],
        ['How do you measure the propagation delay on the analyzer?', 'In timing mode, put cursor A on a rising clock edge and cursor B where the data first becomes stable; read the time difference.'],
        ['Which two chips\' datasheets did the lab ask you to compare with the measured delay?', 'The 74LS175 (quad D flip-flop) and the 74LS86 (quad two-input XOR).'],
      ],
      next: {},
    },
    {
      id: 'lab2-buscycle', title: 'Lab 2: the Z80 bus cycle', lecture: 'Lab 2', mins: 20, needs: 'Buses and tri-state outputs.',
      goal: 'Describe the Z80 op-code fetch (M1) cycle in T-states and say which signals show that it is happening.',
      md: `## Why this lab exists

You cannot single-step a program that controls something in real time, such as an engine's spark plugs: stopping it changes its behaviour. To find a fault that appears only at full speed you must **watch the software and hardware as they run in real time**, which is what a logic analyzer does. The handout chose the Z80 because there is **no ambiguity between what the analyzer shows and what the processor is doing**: modern processors have caches and prefetch queues that make a trace hard to read. (It says the 68008 in Lab 3 has a **two-word prefetch queue**, so the order instructions are fetched and executed can differ.)

## The op-code fetch (M1) cycle

An **op-code fetch** reads the first byte of an instruction. It takes **4 clock periods, T1 to T4**. It is also called the **M1 cycle** because the processor asserts the **~M1** pin low at the start of T1.

At a 4 MHz clock, one period (one T-state) is 250 ns, so the fetch takes 4 x 250 ns = **1 microsecond**.

| Time | What happens |
|---|---|
| Start of T1 | The address appears on the 16 address lines; ~M1 goes low |
| Falling edge of T1 | **~MREQ** and **~RD** go low |
| T2 | Memory puts the data on the data lines |
| Rising edge of T3 | The Z80 **reads the op-code** |
| T3, T4 | The processor decodes the instruction |

- **~MREQ** says "this is a memory operation, not an I/O operation"; **~RD** says it is a read. Once ~MREQ is low the address is stable, so memory can safely respond.
- On the analyzer, look for the line where **~M1, ~RD and ~MREQ are all low**: that is an op-code fetch with a stable address.

## Other memory reads and writes

A memory read or write that is not an op-code fetch is **3 clock cycles** long, not 4, because no decoding is needed: 3 x 250 ns = 750 ns at 4 MHz (calc).

> The handout says you can ignore the refresh part of M1 and the WAIT signal for this lab.`,
      check: [
        ['Why can\'t you single-step a real-time system to find an intermittent fault?', 'Stopping it changes its behaviour; the fault only appears when the hardware and software run at full speed.'],
        ['How many T-states is an op-code fetch, and how long at 4 MHz?', '4 T-states; each is 250 ns, so 1 microsecond.'],
        ['Which three signals are low together during an op-code fetch?', '~M1, ~MREQ and ~RD.'],
        ['When does the Z80 actually read the op-code?', 'On the rising edge of the clock in T3.'],
        ['How long is an ordinary memory read or write, and why shorter than an op-code fetch?', '3 T-states (750 ns at 4 MHz); no instruction decoding is needed.'],
      ],
      next: { z80: 'bus' },
    },
    {
      id: 'lab2-board', title: 'Lab 2: the Z80 board and reading a trace', lecture: 'Lab 2', mins: 15, needs: 'Lab 2: the Z80 bus cycle.',
      goal: 'Give the board\'s memory map and parts, and explain how to disassemble a program from the bus signals.',
      md: `## The board

| Part | Role |
|---|---|
| 4 MHz Z80A | The processor (40-pin DIP) |
| 27C256 EPROM, 32K x 8 | Program memory at **0000H to 7FFFH** |
| 62256 RAM, 32K x 8 | Data memory at **8000H to FFFFH** |
| 4 MHz crystal oscillator | The clock |
| DS1232 supervisor | Generates a clean **RESET** for the Z80 |
| 74LS00 quad NAND | "**Glue logic**" that ties the memory selects together |

(calc) 32K = 2^15 bytes, so each memory needs 15 address lines, and the top address line A15 chooses between them: A15 = 0 for the EPROM, A15 = 1 for the RAM.

The board is a **four-layer** design: power and ground are the two inner layers, so there are no thick power traces getting in the way of routing, and traces are 10 mil trace and space (1 mil = 0.001 inch). The 40-pin connector to the analyzer is not needed to make the board work; it is there for **design for testability**, so you can connect the analyzer with one cable instead of 40 clips.

On power-up the seven-segment display shows a start-up sequence (it spells b-E-E-4-2-5), a quick check that the board works.

## The Lab 2 measurements

- **State mode** samples on the **falling edge of CLK1**.
- **Timing mode** at first: with a 4 MHz clock, the handout suggests an analyzer clock of **50 to 100 MHz**. Then set it to the maximum, **500 MHz**, to measure the ~M1 and ~MREQ edges against the clock (30 points in the handout): how long after a clock edge they go active and inactive, and whether that falls between the published **Min and Max** for the Z80A.
- The handout asks why the timing resolution is limited to **+/- 2 ns**. (calc) A 500 MHz sample clock takes a sample every 2 ns, so an edge can only be placed to within one sample.

## Triggering on the first instruction after reset

The Z80 comes out of reset and starts executing at address **0000H**. To capture that: use ~MREQ to qualify the address (you can also use ~RESET going high and ~M1), so the trigger is the **first instruction fetch** after reset. Procedure: hold the board's RESET button down, press the analyzer's single acquisition button, wait for the "buffer prefill complete, waiting for trigger" message, then release RESET.

The trace is **raw bus cycle data**, not a decoded instruction listing; you match it by hand against the assembler's **list file** (source to machine code). The Intel Hex file is the industry-standard format used to program the EPROM.

## Reading a trace (the 80% of the lab)

The aim is to **design a debug strategy** that uses the analyzer to **disassemble the bus cycles**: from the signals, work out which instructions ran and where the data went.

1. Trigger on or look for the ~M1, ~MREQ, ~RD low rows: each is an op-code fetch.
2. Read the **address** to see where in memory the instruction is, and the **data** to get the op-code byte.
3. Look up that op-code in the instruction set to know what instruction it is and how many more bytes it has.
4. The following 3-cycle reads and writes are that instruction's operands and data.

The Z80 pages of this site have a **Bus trace** tab in the sandbox that draws these signals for a program you assemble, which is good practice for this.`,
      check: [
        ['What address ranges do the EPROM and the RAM occupy?', 'EPROM 0000H to 7FFFH; RAM 8000H to FFFFH.'],
        ['What is the DS1232 for?', 'It is a supervisor that generates a clean RESET for the Z80.'],
        ['Which address line separates the EPROM from the RAM?', 'A15: 0 selects the EPROM, 1 selects the RAM. (32K needs 15 lines, A14 to A0.)'],
        ['Why does the board have a 40-pin connector that the circuit does not need?', 'Design for testability: one cable connects the logic analyzer instead of 40 individual clips.'],
        ['Where does the Z80 start executing after reset, and how do you trigger on it?', 'At address 0000H. Qualify the address with ~MREQ (optionally ~RESET going high and ~M1) so the trigger is the first instruction fetch; hold RESET while arming the analyzer, then release it.'],
        ['Why is the timing measurement resolution +/- 2 ns?', 'At 500 MHz the analyzer takes a sample every 2 ns, so an edge can only be placed to within one sample.'],
        ['How do you spot an instruction fetch in a trace?', 'The row where ~M1, ~MREQ and ~RD are all low; the address shows where it is and the data bus carries the op-code.'],
      ],
      next: { z80: 'bus' },
    },
  ];
  if (root.START) root.START.LABS = LABS;
  if (typeof module !== 'undefined' && module.exports) module.exports = LABS;
})(typeof window !== 'undefined' ? window : globalThis);
