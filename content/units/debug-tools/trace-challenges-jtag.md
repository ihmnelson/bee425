---
track: shared
title: "Trace headaches, bond-out chips, BDM and JTAG"
summary: "Prefetch and caches hide program flow from bus traces; chip vendors added on-chip debug (BDM, JTAG) so one low-cost tool works."
needs: [in-circuit-emulator, lab-3-68008.prefetch-queue]
sources:
  - { type: slide, ref: "L11 s537", quote: "Headache #1 - Prefetch Queues" }
  - { type: slide, ref: "L11 s537", quote: "A special version of a commercial part" }
  - { type: slide, ref: "L11 s545", quote: "JTAG was originally developed as a board test methodology to replace" }
  - { type: slide, ref: "L11 s549", quote: "JTAG has basically become the defacto standard for on-chip debug" }
checks:
  - type: choice
    prompt: "Which two features of processors cause the **biggest trouble for real-time bus trace**?"
    options: ["Prefetch queues and caches", "Wide data buses and fast clocks", "Low power and small size", "Wait states and reset"]
    answer: 0
    explain: "Instruction and data caches and prefetch queues make the bus activity differ from the program flow. The limit of usefulness is when both possible branch destinations are inside the cache."
  - type: choice
    prompt: "What is a **bond-out chip**?"
    options: ["A special version of a part that brings extra internal signals out to pins so external tools can see more of the processor", "A chip with no pins", "A faster version of the chip", "A chip with a heat sink"]
    answer: 0
    explain: "Examples of solutions: Intel's bond-out chips, Motorola's instruction-flow status bits, AMD's traceable cache (a lockstep slave outputs the program counter, bypassing the cache), National's program-counter bond-out. They are costly in small volumes and can lock out competing tools."
  - type: choice
    prompt: "What was **JTAG** originally for, and how has it become a debug interface?"
    options: ["A board test method linking all device outputs into one serial bit chain (replacing bed-of-nails testers); adding internal debug registers makes a standard N-wire on-chip debug interface", "A power supply standard", "A bus standard", "A compiler"]
    answer: 0
    explain: "JTAG (IEEE 1149.1) strings every device's boundary cells into a long shift register so outputs can be observed or driven. By linking internal registers into the loop and adding debug registers it became the de facto on-chip debug standard: one low-cost tool supports any JTAG-compatible device."
  - type: choice
    prompt: "What is a **drawback** of JTAG debugging?"
    options: ["It can be slow: bus cycles must be built by shifting every bit, and loops can be about 10,000 bits long", "It is expensive (> $20K)", "It needs a chassis", "It works only for CISC"]
    answer: 0
    explain: "Debug capability depends on the debug core's features; JTAG loops are hand crafted for each core (a re-spin creates new loops). It lends itself to RISC processors and ASIC cores, and typical tools cost under $1,000."
card:
  front: "How did chip makers address debugging when ICEs became impractical?"
  back: "Prefetch and cache hide program flow from external traces; bond-out chips and traceable caches expose it but are costly. Vendors instead put debug logic on the chip: Freescale BDM (the 'wiggler', mostly replaced), JTAG IEEE 1149.1 (originally board test) used as an N-wire debug interface: one cheap tool for many chips, slower, loops hand-crafted."
glossary:
  - { term: "JTAG", def: "Joint Test Action Group, IEEE 1149.1: a serial boundary-scan standard for board test, extended into the standard on-chip debug interface." }
  - { term: "Bond-out chip", def: "A special version of a part that brings extra internal signals to I/O pins so external instruments can see inside the processor." }
---

## Learn

**Trace system headaches:** (1) **prefetch queues** and (2) **cached processors**: the pins no longer show what the program does. The limit of usefulness is when **both possible branch destinations are within the cache**. This is exactly the effect you saw in Lab 3's trace.

**Solutions:** dedicate on-chip resources for real-time trace. Intel: **bond-out chips**; Motorola: **instruction-flow status bits**; AMD: **traceable cache**; National: **program counter bond-out**. A *bond-out chip* is a special version of a commercial part that brings extra internal signals to pins. AMD's 29K ran **two processors in lockstep**: the slave outputs the program counter on its address bus, bypassing the cache, so tools can track the real PC. Bond-outs are costly in small volumes, and when the chip vendor is also the tool vendor they can lock out competitors (the "scorched earth" approach behind the 1992-1994 Intel/AMD lawsuit); generally not practised except by Texas Instruments. The significance of the address of a **non-sequential fetch** is that it tells the tool where a branch went, which is what the cache hides.

**Chip vendors to the rescue:** "without development tools they can't sell microprocessors." They dedicate silicon to **external debug support**: Freescale **BDM**, **JTAG** and **Nexus**; AMD and Intel JTAG; ARM modified JTAG; MIPS **EJTAG**. Run control and limited breakpoints are inside the chip and accessed through a serial port: **N-wire debug interfaces**.

- **BDM** ("the wiggler"): Freescale standard, used on ColdFire, mostly replaced by JTAG.
- **JTAG (IEEE 1149.1):** developed for **board test**, replacing "bed of nails" testers: all outputs on the board form one long serial bit chain (hundreds to thousands of bits), each cell sniffing an output; it shows stuck, shorted or open nodes. Link internal registers into the loop, make them drivable, add debug registers: an on-chip debug core. **Pros:** de facto standard, one low-cost tool (under $100 to $1,000) for any JTAG device, the method of choice for ASIC cores, suits RISC. **Cons:** slow (bus cycles built by shifting bits, loops up to about 10,000 bits), loops hand crafted and rebuilt when the core is re-spun, not good for tool vendors.

## Worked example

*Why might a trace show an instruction that never executed?*

1. A prefetch queue fetches the next instruction early, even before a branch is resolved.
2. If the branch is taken, the prefetched instruction is discarded.
3. A bus trace sees the fetch but cannot know it was discarded: a headache the on-chip trace features were added to cure.

## Try it

*Why is a JTAG debug tool much cheaper than an ICE?*

???

The debug logic is built into the chip, so the tool only talks a standard serial protocol to it. An ICE has to replace the processor and provide its own memory and trace hardware for each processor.
