---
track: shared
title: "SRAM versus DRAM"
summary: "SRAM holds a bit by feedback in 5-6 transistors; DRAM stores charge on a capacitor with 1 transistor and must be refreshed."
needs: [buses-and-cells.sram-cell]
sources:
  - { type: slide, ref: "L7 s327", quote: "DRAM technology uses 1 transistor per cell" }
  - { type: slide, ref: "L7 s327", quote: "Charge leaks out of the capacitor and must be" }
  - { type: slide, ref: "L7 s327", quote: "Works well for fast, local storage ( cache )" }
checks:
  - type: choice
    prompt: "Which statement correctly contrasts **SRAM and DRAM**?"
    options: ["SRAM uses 5-6 transistors per bit and holds its state by feedback; DRAM uses 1 transistor and a capacitor and must be refreshed", "DRAM uses more transistors than SRAM", "SRAM must be refreshed; DRAM need not be", "Both are identical"]
    answer: 0
    explain: "SRAM is derived from the D flip-flop (feedback), needs 5 or 6 transistors per bit, and has a simple interface. DRAM stores charge in a small capacitor with 1 transistor per cell, so it is denser, but the charge leaks and must be periodically rewritten."
  - type: choice
    prompt: "Where is **SRAM** typically used, and where is **DRAM**?"
    options: ["SRAM for fast local storage such as cache; DRAM for high-density main memory", "DRAM for cache, SRAM for main memory", "Both only for cache", "Both only for main memory"]
    answer: 0
    explain: "SRAM works well for fast local storage (cache). Today's high-density memory is DRAM-based."
  - type: choice
    prompt: "In a DRAM cell, what does the stored **charge** represent?"
    options: ["The amount of charge in the capacitor determines whether the bit is 1 or 0", "The address", "The refresh count", "The chip select"]
    answer: 0
    explain: "The amount of charge stored in the capacitor determines whether the output is a 1 or a 0. It leaks out, which is why refresh is needed."
card:
  front: "Compare SRAM and DRAM."
  back: "SRAM: feedback (flip-flop) cell, 5-6 transistors/bit, no refresh, simple interface, fast: used for cache. DRAM: 1 transistor + capacitor/bit, much denser and cheaper per bit, charge leaks so it must be refreshed (~every 10 ms), complex interface (row/column addressing)."
glossary:
  - { term: "DRAM", def: "Dynamic RAM: one transistor and a small capacitor per bit; the charge leaks and must be refreshed." }
---

## Learn

Up to now the lecture considered only **static RAM**: derived from the D flip-flop, using feedback to hold 0 or 1, with a simple processor interface. Real SRAM needs **5 or 6 transistors per bit**, which suits fast local storage such as **cache**.

Today's **high-density memory is DRAM**: **one transistor per cell** plus a small **capacitor**. The amount of charge in the capacitor says whether the bit is a 1 or 0. But **charge leaks out** and must be periodically **re-written (refreshed)**.

| | SRAM | DRAM |
|---|---|---|
| Cell | flip-flop (feedback) | 1 transistor + capacitor |
| Transistors per bit | 5-6 | 1 |
| Refresh | not needed | required (about every 10 ms) |
| Interface | simple | row/column addressing, RAS/CAS |
| Typical use | cache, fast local storage | main memory |

## Worked example

*Compare the transistor count for 1 Mbit of each (cells only).*

1. SRAM at 6T: 1,048,576 x 6 = 6,291,456 transistors.
2. DRAM at 1T: 1,048,576 transistors (plus capacitors).
3. DRAM is about **6 times** denser in transistors, which is why main memory is DRAM.

## Try it

*Why does reading or writing a DRAM cell also refresh it?*

???

Accessing a row recharges (rewrites) the capacitors in that row, so a read or write restores the charge. The lecture says reading and writing "recharges" the cell; the trouble is guaranteeing that every cell is accessed in time, which is why a refresh scheme (RAS cycles) is needed.
