---
track: shared
title: Selecting a page with chip-select logic
summary: ~CS goes low only when the address is valid and the page bits match; a NAND with inverters does it.
needs: [pages-and-offsets, page-ranges]
sources:
  - { type: slide, ref: "L7 s294", quote: "~CS goes low" }
  - { type: slide, ref: "L7 s297", quote: "1 1010 0100" }
  - { type: slide, ref: "L6 s286", quote: "The chips are disabled until the address is valid" }
checks:
  - gen: memory.zerosInPage
  - gen: memory.zerosInPage
  - type: choice
    prompt: "Why must the address-valid signal be one of the inputs to the page-select logic?"
    options: ["So no chip is selected while the address lines are still settling", "To lower the power the chips use", "To give each chip a different clock", "To make the offset bits larger"]
    answer: 0
    explain: "Until the processor says the address is valid, the lines can hold garbage; without the qualifier a page could be selected, and read or written, at the wrong time. The lecture notes the chips are disabled until the address is valid."
  - type: choice
    prompt: "A NAND gate has these inputs: **A23, A22, /A21, A20, /A19, /A18, A17, /A16, /A15** (a slash means the line is inverted first), plus address-valid. Which page does it select?"
    options: ["$1A4", "$1B4", "$0E5", "$14A"]
    answer: 0
    explain: "The NAND goes low when all inputs are 1. So A23, A22, A20, A17 must be 1 and A21, A19, A18, A16, A15 must be 0: 1 1 0 1 0 0 1 0 0 = 1 1010 0100 = $1A4."
card:
  front: "How does a NAND gate select one page, and which address lines need inverters?"
  back: "NAND output is low only if every input is 1. Feed it the page bits plus address-valid; invert every page bit that must be 0 for that page."
glossary:
  - { term: "Chip select (~CS)", def: "An active-low input that switches a chip on; with it high the chip ignores the bus." }
---

## Learn

A chip with its **chip select (~CS)** high ignores the bus. To select a page, ~CS must go **low** for every chip in that page and stay high for all others. It should go low only when **both** are true:

1. the processor says the **address is valid** (the lecture calls the signal ~ADDRVAL; the chips are disabled until the address is valid), and
2. the **page bits equal this page's number**.

A **NAND** gate does this naturally. Its output is low only when **all** inputs are 1. So wire in every page bit and the address-valid signal, and put an **inverter** in front of each page bit that must be **0** for this page.

The lecture's example is the page at **$1A4**. In binary that is 1 1010 0100, which spread over A23-A15 is:

| A23 | A22 | A21 | A20 | A19 | A18 | A17 | A16 | A15 |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 0 |

The zeros (A21, A19, A18, A16, A15) get inverters; the ones (A23, A22, A20, A17) go straight in.

A decoder chip does the same job for **all** pages at once: with 2 page bits, a 2-to-4 decoder with active-low outputs drives one ~CS line per page.

## Worked example

*Design the NAND select for page 5 when there are 4 page bits.*

1. 5 in 4-bit binary is **0101**.
2. Bits that must be 1: the second and last. They go straight in.
3. Bits that must be 0: the first and third. They get **2 inverters**.
4. Add address-valid as one more input. The output goes to ~CS of every chip in page 5.

## Try it

*Which page does a NAND select when the page bits are inverted as follows: /P3, P2, /P1, P0 (four page bits, P3 is the top)?*

???

Inverted lines must be 0 and the others 1: P3 = 0, P2 = 1, P1 = 0, P0 = 1, so 0101 = **page 5**.
