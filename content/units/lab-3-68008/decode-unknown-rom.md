---
track: shared
title: "Decoding an unknown ROM from a trace"
summary: "Filter out the extraneous bus cycles, follow loops and subroutines with clever triggers, then describe the whole algorithm, not each instruction."
needs: [prefetch-queue, la-measurements, program-control.m68k-stack-subroutines]
sources:
  - { type: handout, ref: "lab3 §XII", quote: "You will not receive any points for describing what each 68000 instruction is doing by itself" }
  - { type: handout, ref: "lab3 §XIII", quote: "Once you see loops or looping instructions it is wrong to report every iteration of the loop" }
  - { type: handout, ref: "lab3 §XIII", quote: "Set the logic analyzer to trigger at an address after just slight past the last memory address that you observed in the loop" }
  - { type: handout, ref: "lab3 §XIII", quote: "If you see the BSR or JSR instruction, that’s the red flag that the program is going off to a subroutine" }
checks:
  - type: choice
    prompt: "A trace fills the analyzer buffer entirely with a **loop**. How do you find what comes after it?"
    options: ["Trigger on an address just past the loop's last address, with the trigger point 10-20% into the buffer to see the last iterations", "Make the buffer bigger", "Reset the board", "Count every iteration"]
    answer: 0
    explain: "Set the trigger to an address slightly past the last address seen in the loop; when the program leaves the loop it hits the address and refills the buffer. Place the trigger point about 10%-20% in so you capture the last loop iterations too."
  - type: choice
    prompt: "You see a **BSR** or **JSR**. What does the handout advise?"
    options: ["Note its address and trigger on the instruction after it, to see what happens when the subroutine returns", "Ignore it", "Stop the trace", "Report every call"]
    answer: 0
    explain: "A BSR or JSR is the red flag that the program leaves for a subroutine, which may itself loop many times. Trigger when it returns, typically at the next address after the call."
  - type: choice
    prompt: "What do you write in the report about the unknown ROM?"
    options: ["A short paragraph on what the whole algorithm does (for example fills memory with a constant), plus the disassembled source file", "A line per instruction", "Only the hex dump", "Nothing"]
    answer: 0
    explain: "No points for explaining each instruction by itself: each chip contains an algorithm that does a task, and you must say what that task is. Also include the filtered spreadsheet, the disassembly and a bibliography."
  - type: choice
    prompt: "After you think you have the program flow, what is the next step?"
    options: ["Run it in the EASy68K simulator (it simulates program execution, not bus activity), and take more traces if it seems incomplete", "Submit it", "Rewrite it in Z80", "Burn a new ROM"]
    answer: 0
    explain: "Use the simulator to understand the program; remember it does not simulate bus activity. If the program seems incomplete it probably is, and you should take more traces with different trigger conditions."
card:
  front: "How do you decode an unknown ROM on the logic analyzer?"
  back: "Capture from RESET in state mode; filter the extraneous bus cycles (prefetches, writes out of order) into a clean instruction list in a spreadsheet; for loops, trigger just past the last loop address (trigger point 10-20% in); for BSR/JSR, trigger at the return address; disassemble; verify in EASy68K; report the overall task of the algorithm, not instruction-by-instruction."
glossary: []
---

## Learn

The last part of Lab 3 repeats the detective work of Lab 2 with a **mystery ROM** from the instructor, using the analyzer in **state mode** (sampling with the processor's clock). A good first trigger is to capture the processor as it begins to run from **RESET** (a high-to-low transition on this board).

Method:

1. **Review the Prefetch Rev 3 ROM** first, all the way to where it branches back to the start, so you know what prefetch effects look like.
2. **Filter** the trace (for example in Excel) to remove extraneous bus cycles, leaving the instruction stream.
3. **Loops:** do not list every iteration. Count the loop's instructions, then take another trace set to trigger at an address **just past the loop's last address**; set the trigger point **10-20%** into the buffer to see the final iterations as it exits.
4. **Subroutines:** `BSR` or `JSR` is the flag. Note the call address and trigger when it returns (usually the next address).
5. **Verify** in the EASy68K simulator, which simulates program execution but **not bus activity**. If the program looks incomplete, it probably is: take more traces.
6. **Report** a short paragraph on what the program does as a whole (for instance, "fills a region of RAM with a constant", "sets all of memory to zero") and an assembly source file. There are **no points for describing each instruction** by itself.

Deliverables include the answer to "Why is the maximum resolution +/- 2 ns?", the completed timing table, a screen capture of a timing diagram, the filtered spreadsheet, the disassembly, the description and source, and a bibliography. Also say what you thought of the lab and suggest improvements.

## Worked example

*A filtered trace shows `MOVE.B D1,(A0)+` followed by `CMPA.L A1,A0` and `BNE` back, repeating until A0 = A1. What is the algorithm?*

1. The loop writes D1 to successive bytes, advancing the pointer, until the pointer reaches the end address.
2. So the algorithm is **filling a block of memory (from A0 to A1) with the value in D1**.
3. You would state that in one sentence, not list the three instructions.

## Try it

*A trace buffer is full of the same six instructions at addresses $1020-$102A. Where should you set the trigger?*

???

At an address just past the loop's last instruction, for example **$102C or later**, with the trigger point 10-20% into the buffer; when the program leaves the loop it hits that address and refills the buffer with what comes next.
