---
track: shared
title: "~DTACK and wait states"
summary: "The processor samples ~DTACK in S4; if it is high, S4 and S5 repeat. The jumper adds 0 to 3 wait states, each one clock period."
needs: [m68008-board, memory-systems.memory-timing]
sources:
  - { type: handout, ref: "lab3 §VI", quote: "If ~DTACK is low, the bus cycle completes through state S7" }
  - { type: handout, ref: "lab3 §VI", quote: "If ~DTACK is high, then S4 and S5 repeat until ~DTACK goes low" }
  - { type: handout, ref: "lab3 §VI", quote: "provide up to three additional WAIT states" }
  - { type: own, ref: "a 68000-family bus cycle is 8 states (S0-S7) of half a clock period each, so 4 clock periods; a wait state adds one more clock period (S4+S5)" }
checks:
  - gen: lab.waitStates
  - gen: lab.waitStates
  - type: choice
    prompt: "At which point does the 68008 look at **~DTACK**?"
    options: ["On the falling clock edge in state S4: low completes the cycle through S7; high repeats S4 and S5", "At reset only", "On the rising edge of S0", "After S7"]
    answer: 0
    explain: "The state of ~DTACK is sampled on the falling edge of the clock in state S4. If ~DTACK is low the bus cycle completes through S7; if high, S4 and S5 repeat until it goes low."
  - type: choice
    prompt: "What does moving the **jumper from position A to position D** do on the lab board?"
    options: ["Delays ~DTACK so the bus cycle gets 3 extra wait states", "Changes the clock frequency", "Swaps ROM and RAM", "Disables the processor"]
    answer: 0
    explain: "The GAL contains a shift register of three D flip-flops that delays ~DTACK. Position A connects ~AS directly to ~DTACK (0 wait states); each position outward adds one more S4-S5 cycle, up to three."
  - type: choice
    prompt: "What happens to the width of ~AS in a bus cycle when you add a wait state?"
    options: ["It lengthens by one clock period (125 ns at 8 MHz)", "It shortens", "It does not change", "It doubles regardless of the number of wait states"]
    answer: 0
    explain: "~AS stays asserted for the whole bus cycle, so each wait state stretches it by one clock period. At 8 MHz one period is 125 ns. The lab asks you to measure ~AS for each jumper position and relate it to the system clock."
card:
  front: "How do wait states work on the 68000 family?"
  back: "A bus cycle is states S0-S7 (4 clock periods). ~DTACK is sampled on the falling edge in S4: low completes the cycle (to S7); high repeats S4 and S5 (one more clock period) until ~DTACK is low. The lab board's GAL shift register delays ~DTACK to give 0-3 wait states, selected by a jumper. At 8 MHz a period is 125 ns."
glossary:
  - { term: "~DTACK", def: "Data Transfer Acknowledge: an input to the 68000 family that tells the processor the memory has responded; until it is asserted the processor inserts wait states." }
  - { term: "Wait state", def: "An extra clock period inserted in a bus cycle to give a slow memory more time." }
---

## Learn

**Synchronous timing** (the Z80's) needs no acknowledgement; the 68000 family is **asynchronous**: the memory system tells the processor when it is ready by asserting **~DTACK** (Data Transfer Acknowledge).

- The state of ~DTACK is **sampled on the falling edge of the clock in state S4**.
- If ~DTACK is **low**, the bus cycle **completes through state S7**.
- If ~DTACK is **high**, **S4 and S5 repeat** until ~DTACK goes low.

On the lab board the GAL22V10B contains a **shift register of three D flip-flops** that generates delayed copies of ~DTACK. The **jumper** selects how many: connecting ~AS directly to ~DTACK (position A, nearest the 68008) gives **0 wait states**; positions B, C and D give **1, 2 and 3 additional S4-S5 cycles**.

Timing arithmetic (our own calculation from the state names): a bus cycle is eight states S0-S7, each half a clock period, so it is **4 clock periods** long; each wait state adds **one more clock period**. At the lab's **8 MHz** the period is **125 ns**, so a normal cycle is 500 ns and each wait state adds 125 ns. You will see this directly as the width of ~AS increasing in the logic-analyzer measurement.

## Worked example

*At 8 MHz, how long is one bus cycle with the jumper in position C (2 wait states)?*

1. Clock period = 1000 / 8 = 125 ns.
2. Cycle = (4 + 2) x 125 = **750 ns**.
3. ~AS is asserted for most of it, so you would measure roughly that long for the width (less the setup before ~AS).

## Try it

*Which jumper position gives the **longest** ~AS, and what is the relation of the interval to the clock?*

???

Position **D** (3 wait states). Each position's interval differs from its neighbour's by exactly **one clock period** (125 ns at 8 MHz), which is the lab's question: the ~AS duration grows in whole clock periods.
