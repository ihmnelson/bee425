---
track: shared
title: "Homework 4, problem 4: 16 pages from two 74XX138 decoders"
summary: "Shift A, B, C down to A20-A22 on both chips and use A23 to enable one chip or the other."
needs: ["memory-decoding.chip-select", "memory-systems.memory-map-decoders"]
sources:
  - { type: handout, ref: "hw4 P4", quote: "With only the addition of a second 74XX138" }
  - { type: handout, ref: "hw4 P4", quote: "expand the decoding to 16 pages of memory" }
  - { type: handout, ref: "hw4 P4", quote: "Assume a processor with 24" }
  - { type: own, ref: "the 74x138 enables (G1 high, G2A and G2B low) are the standard device behaviour; wiring is our design (calc)" }
checks:
  - type: choice
    prompt: "A 74LS138 decoder has inputs A, B, C driven by A21, A22, A23 and ~AS on ~EN2. With 24 address lines, how many pages does it select, and how big is each?"
    figure: {"src": "hw4/decoder-74ls138.png", "alt": "A 68000 processor connected to a 74LS138 3-to-8 decoder: A21, A22 and A23 go to inputs A, B and C, ~AS goes to ~EN2, EN1 is tied to Vcc and ~EN3 to ground, and outputs Y0-Y7 are ~CS0 to ~CS7", "caption": "Homework 4, problem 4: one 74LS138 gives 8 pages (inputs A21-A23)"}
    options: ["8 pages of 2 MB", "8 pages of 1 MB", "16 pages of 1 MB", "8 pages of 16 MB"]
    answer: 0
    explain: "Three page bits (A21-A23) give 2^3 = 8 pages. A21 as the lowest page bit means A0-A20 are offset, so each page is 2^21 = 2 MB (8 x 2 MB = 16 MB)."
  - type: choice
    prompt: "To decode 16 pages of the same 16 MB space with one more 74XX138, which four lines become the page bits?"
    options: ["A20-A23", "A19-A22", "A21-A24", "A16-A19"]
    answer: 0
    explain: "16 pages = 4 page bits, and the page bits are the top lines of the 24-bit address: A20-A23. Pages are now 2^20 = 1 MB."
  - type: choice
    prompt: "Both 138s get A20, A21, A22 on inputs A, B, C. How is A23 wired so exactly one 138 is enabled at a time?"
    options: ["To ~EN3 of the first 138 and EN1 of the second", "To ~EN3 of both 138s", "To EN1 of both 138s", "To input C of the second 138 only"]
    answer: 0
    explain: "A 74138 is on when EN1 = 1 and ~EN2 = ~EN3 = 0. The first chip needs A23 = 0, so A23 goes to its active-low ~EN3. The second needs A23 = 1, so A23 goes to its active-high EN1 (with its ~EN3 tied low). That needs no extra gate."
  - type: choice
    prompt: "In the 16-page circuit both decoders have ~AS on ~EN2. What does that guarantee?"
    options: ["No page is selected until the address is valid", "Both decoders are always enabled together", "The lower 20 address lines are decoded", "The first decoder drives pages 8-15"]
    answer: 0
    explain: "~EN2 is active low, so a high ~AS holds a decoder off. Using ~AS on both chips means no page is selected until the processor says the address is valid."
  - type: choice
    prompt: "With A23 = 1, A22 = 0, A21 = 1, A20 = 1 and ~AS low, which output goes low?"
    options: ["Y3 of the second 138 (page 11)", "Y3 of the first 138 (page 3)", "Y6 of the second 138 (page 14)", "Y5 of the first 138 (page 5)"]
    answer: 0
    explain: "A23 = 1 enables the second chip. Its inputs C B A = A22 A21 A20 = 0 1 1 = 3, so Y3 goes low. The page number is A23-A20 = 1011 = 11."
card:
  front: "Homework 4, P4: how do you expand one 74XX138 (A21-A23, 8 pages) to 16 pages with a second 138 and no other gates?"
  back: "Use page bits A20-A23. Both chips: A, B, C = A20, A21, A22 and ~EN2 = ~AS. A23 goes to ~EN3 of chip 1 (pages 0-7, A23 = 0) and to EN1 of chip 2 (pages 8-15, A23 = 1), with chip 2's ~EN3 tied low and chip 1's EN1 tied high. Each page is now 1 MB."
glossary:
  - { term: "74XX138", def: "A 3-to-8 line decoder with three enable inputs (EN1 active high, ~EN2 and ~EN3 active low) and eight active-low outputs Y0-Y7. XX is the logic family (LS, ALS, F, FCT, ACT); the logic is the same." }
---

## Learn

**Problem 4** starts from a 68000 circuit in which a 74LS138 turns A21, A22, A23 into eight chip selects, ~AS qualifying the decode (EN1 = Vcc, ~EN3 = ground). On a 24-line address bus this is 8 pages of 2 MB. The task: expand to **16 pages** using **only a second 74XX138** and no other gates.

A 74XX138 is enabled only when **EN1 = 1, ~EN2 = 0 and ~EN3 = 0**; then input ABC (A = LSB) pulls exactly one of Y0-Y7 low. Four page bits are needed, so the pages shrink to 1 MB (A0-A19 offset) and the page lines are **A20-A23**:

| Pin | Chip 1 (pages 0-7) | Chip 2 (pages 8-15) |
|---|---|---|
| A, B, C | A20, A21, A22 | A20, A21, A22 |
| ~EN2 | ~AS | ~AS |
| ~EN3 | **A23** (on when A23 = 0) | ground |
| EN1 | Vcc | **A23** (on when A23 = 1) |
| Outputs | Y0-Y7 = ~CS0-~CS7 | Y0-Y7 = ~CS8-~CS15 |

So A23 is both the enable for one chip and, through the active-high versus active-low enable pins, the inverse enable for the other. The enables do the work an inverter and a gate would have done.

## Worked example

*Which chip select goes low for the address $C80000?*

1. $C80000 = 1100 1000 0000 0000 0000 0000, so A23 A22 A21 A20 = 1 1 0 0.
2. A23 = 1 selects chip 2; C B A = A22 A21 A20 = 1 0 0 = 4, so Y4 is low.
3. That is page 8 + 4 = **12** (~CS12), since $C = 12.

## Try it

*Why can't the first 138 simply keep EN1 = Vcc and ~EN3 = ground as in the 8-page circuit?*

???

Then it would be enabled for every address regardless of A23, so pages 0-7 and 8-15 would both be selected at once (bus contention). A23 must switch it off when A23 = 1.
