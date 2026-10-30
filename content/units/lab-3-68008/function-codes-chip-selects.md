---
track: shared
title: "Function codes and the GAL's chip selects"
summary: "FC0/FC1 tell program from data accesses; A15-A19 and ~AS make ~CSROM and ~CSRAM; ~RD and ~WR come from R/~W and ~AS."
needs: [m68008-board, memory-decoding.chip-select, buses-and-cells.active-low-negative-logic]
sources:
  - { type: handout, ref: "lab3 §VI", quote: "The address input signals A15-A19 are used to select RAM or ROM and together with the Address Strobe" }
  - { type: handout, ref: "lab3 §VI", quote: "The read (~RD) and write (~WR) signals are synthesized from the processor’s R/~W signal and ~AS" }
  - { type: handout, ref: "lab3 Appendix C", quote: "~CSRAM  = ASTR # !A15 # A16 # A17 # A18 # A19" }
  - { type: handout, ref: "lab3 Appendix C", quote: "OpFetch = !FC0 & FC1" }
checks:
  - type: choice
    prompt: "The GAL equation is `~CSRAM = ASTR # !A15 # A16 # A17 # A18 # A19` (# is OR, ! is NOT, ASTR is the active-low address strobe). When is ~CSRAM **low** (RAM selected)?"
    options: ["When ASTR is low (address valid), A15 = 1 and A16-A19 = 0", "When A15 = 0", "Whenever A19 = 1", "Always"]
    answer: 0
    explain: "An OR of terms is low only when every term is low: ASTR = 0, !A15 = 0 so A15 = 1, and A16-A19 = 0. That is the 8000H-FFFFH range. It is the negative-logic OR you studied: an OR of the *deasserting* conditions."
  - type: choice
    prompt: "Why are the **function codes** FC0 and FC1 useful?"
    options: ["They tell external logic what kind of cycle this is (program fetch versus data read or write)", "They set the clock", "They are the address", "They control the reset"]
    answer: 0
    explain: "The processor outputs a function code on every cycle. FC0 and FC1 distinguish fetches from program memory (ROM) and reads or writes to data memory (RAM). The GAL turns them into the positive-true signals Pfetch/OpFetch and DatFetch. FC2 (supervisor versus user) is not needed."
  - type: choice
    prompt: "How are **~RD and ~WR** produced?"
    options: ["From the processor's R/~W signal and ~AS: ~RD is low when ~AS is low and R/~W is high, ~WR when ~AS is low and R/~W is low", "Directly from the data bus", "From the clock", "From the supervisor"]
    answer: 0
    explain: "In the GAL: ~RD = ASTR # !RW and ~WR = ASTR # RW, so each is low only while the address strobe is asserted and the R/~W line has the matching level."
  - type: choice
    prompt: "A 20-bit address of $12345 is presented with ~AS asserted. Which chip select goes low?"
    options: ["Neither ~CSROM nor ~CSRAM: A16 = 1, so both equations stay high", "~CSROM", "~CSRAM", "Both"]
    answer: 0
    explain: "Both ROM and RAM equations include the terms A16-A19 as high-forcing terms, so any address with A16-A19 not all 0 selects neither ($12345 has A16 = 1). The ROM and RAM occupy only the first 64K."
card:
  front: "How does the GAL decode ROM, RAM, ~RD and ~WR?"
  back: "~CSROM low when ~AS asserted, A15 = 0 and A16-A19 = 0 (0000-7FFF). ~CSRAM low when ~AS asserted, A15 = 1 and A16-A19 = 0 (8000-FFFF). ~RD = ~AS asserted with R/~W = 1; ~WR = ~AS asserted with R/~W = 0. FC0/FC1 give OpFetch (program) and DatFetch (data)."
glossary:
  - { term: "Function code", def: "Outputs of the 68000 family that say what kind of bus cycle is happening (program or data, user or supervisor)." }
---

## Learn

The board uses a **GAL22V10B** to synthesise its control signals. The lab's equations (OR is `#`, AND is `&`, NOT is `!`; ASTR is the active-low ~AS) are:

```
OpFetch = !FC0 & FC1        (program fetch, "Pfetch")
DatFetch = FC0 & !FC1       (data read or write)
~RD    = ASTR # !RW
~WR    = ASTR # RW
~CSRAM = ASTR # !A15 # A16 # A17 # A18 # A19
~CSROM = ASTR # A15  # A16 # A17 # A18 # A19
```

Reading these: the outputs are **active low**, and an OR of terms is low only when **all** the terms are low. So:

- ~CSROM is low when ~AS is asserted, **A15 = 0** and **A16-A19 = 0**: addresses **0000-7FFF**.
- ~CSRAM is low when ~AS is asserted, **A15 = 1** and **A16-A19 = 0**: addresses **8000-FFFF**.
- ~RD is low while ~AS is asserted and R/~W is high (a read); ~WR is low while ~AS is asserted and R/~W is low (a write).

The 68008 outputs a **function code** on every cycle. Using only FC0 and FC1 the board can tell **program fetches** (ROM) from **data reads and writes** (RAM); FC2 would separate supervisor from user mode, which the lab does not need. Because the function codes are routed into the GAL rather than to the analyzer, you cannot measure when they are asserted directly: you see the GAL's Pfetch and Dfetch outputs, which can add up to 15 ns of delay.

## Worked example

*Which signals are active for a read of the byte at $9000?*

1. $9000 has A15 = 1 and A16-A19 = 0, so **~CSRAM** goes low while ~AS is asserted.
2. R/~W is high for a read, so **~RD** goes low too.
3. Since it is a data access, DatFetch (not OpFetch) is true.

## Try it

*Which signals are active for an op-code fetch from $0100?*

???

~CSROM (A15 = 0, A16-A19 = 0), ~RD (it is a read) and OpFetch / Pfetch (FC1 = 1, FC0 = 0).
