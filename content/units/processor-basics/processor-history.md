---
track: shared
title: Where the 68000 and Z80 came from
summary: The Z80 (1976, Zilog) and the 68000 (1979, Motorola) and why the course uses both.
needs: [cisc-vs-risc]
sources:
  - { type: slide, ref: "L3 s126", quote: "The 68000 was formerly introduced in 1979 using 3.6 µm" }
  - { type: slide, ref: "L3 s127", quote: "Federico Faggin and 11 other Intel employees split off" }
  - { type: slide, ref: "L3 s125", quote: "Z80: 8-bit CISC architecture" }
checks:
  - type: choice
    prompt: "Which company designed the **Z80**, and what was it compatible with?"
    options: ["Zilog; it was code compatible with the Intel 8080", "Motorola; it was compatible with the 6800", "Intel; compatible with the 8086", "IBM; compatible with RISC"]
    answer: 0
    explain: "Federico Faggin and 11 other Intel employees left to found Zilog. The Z80 was a high-performance, code-compatible version of the Intel 8080: faster, cheaper and with more instructions."
  - type: choice
    prompt: "Which processor did **IBM choose** for the IBM PC, according to the lecture?"
    options: ["The 8088 (16-bit)", "The 68000", "The Z80", "The 6809"]
    answer: 0
    explain: "IBM chose the 8088. The 68K was not ready, nor was the Z8000."
  - type: choice
    prompt: "How wide are the processors, and what is each classified as?"
    options: ["68000: 8-16-32 bit CISC. Z80: 8-bit CISC", "68000: 8-bit RISC. Z80: 32-bit CISC", "Both 32-bit RISC", "Both 16-bit CISC"]
    answer: 0
    explain: "The lecture calls the 68K an 8-16-32 bit CISC architecture and the Z80 an 8-bit CISC architecture."
card:
  front: "When and by whom were the Z80 and 68000 introduced?"
  back: "Z80: Zilog (founded by Federico Faggin and other Intel staff), introduced in summer 1976, 8-bit, code-compatible with the 8080. 68000: Motorola, introduced in 1979 on a 3.6 µm process, 8-16-32 bit CISC, 16 MHz."
glossary: []
---

## Learn

**Z80**
- Designed by Zilog, started by Federico Faggin and 11 other Intel employees. A faster, cheaper, **code-compatible** improvement on the Intel 8080 with more instructions.
- Designed for the embedded market but powered the home-computer revolution (for example the TRS-80).
- **4 µm** process, **8,500 transistors**, originally **2.5 MHz** and later up to 10 MHz; licensed to many other companies. Introduced in the summer of 1976 and still in use.
- **8-bit CISC.** Simple bus operation that is easy to watch with a logic analyzer; its assembly language is trickier than the 68K's.

**68000**
- Development began in 1976 as a 32-bit architecture to replace the 8-bit 6800. Formally introduced in **1979** on a **3.6 µm** process, with a **16 MHz** clock.
- IBM chose the 8088 for the PC because the 68K (and the Z8000) was not ready; the 68K took over UNIX workstations and the Apple Macintosh, and evolved into the 68010 to 68060, ColdFire and the 683XX.
- **8-16-32 bit CISC**; assembly is straightforward, bus operation is more complicated than the Z80's.

The course uses both because they contrast well: the 68000 for a clean, easy instruction set; the Z80 for its simple, visible bus.

## Worked example

*Compare the process geometry of the 68000 to a modern 7 nm process.*

1. 68000: 3.6 µm = 3,600 nm.
2. 3,600 / 7 = about **514**, so modern geometry is roughly 500 times smaller (the slide says about 500).

## Try it

*A modern chip runs at 4.8 GHz and the 68000 at 16 MHz. How many times faster is the modern clock?*

???

4,800 MHz / 16 MHz = **300 times** faster (the slide gives the same figure).
