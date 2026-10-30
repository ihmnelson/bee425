---
track: shared
title: "The 68008 experiment board"
summary: "An 8 MHz 68008 with 32K ROM at 0000-7FFF and 32K RAM at 8000-FFFF, a reset supervisor and a GAL that generates the controls."
needs: [memory-decoding.pages-and-offsets]
sources:
  - { type: handout, ref: "lab3 §VI", quote: "8 MHz 68008 microprocessor in a 48-pin Dual Inline Plastic (DIP) package" }
  - { type: handout, ref: "lab3 §VI", quote: "32K x 8 ROM memory occupying the address range from 0000H through 7FFFH" }
  - { type: handout, ref: "lab3 §VI", quote: "DS1232 uP system supervisor which generates a clean RESET signal" }
  - { type: handout, ref: "lab3 Appendix B", quote: "The 68008 is identical to the 68000 with these exceptions" }
  - { type: own, ref: "the page and address-range arithmetic in the worked example" }
checks:
  - type: choice
    prompt: "On the lab's 68008 board, which address range holds the **RAM**?"
    options: ["8000H through FFFFH (32K x 8, a 62256)", "0000H through 7FFFH", "10000H through 17FFFH", "The whole 1 MB"]
    answer: 0
    explain: "ROM (27C256, 32K x 8) is at 0000H-7FFFH and RAM (62256, 32K x 8) at 8000H-FFFFH. A15 chooses between them when A16-A19 are 0."
  - type: choice
    prompt: "How is the **68008** different from the 68000?"
    options: ["8-bit data bus D0-D7 with one ~DS strobe instead of ~UDS/~LDS, and address lines A0-A19 instead of A1-A23", "A 32-bit data bus", "It has no address strobe", "It runs a different instruction set"]
    answer: 0
    explain: "The 68008 has D0-D7, ~DS in place of ~UDS and ~LDS, and A0-A19 (1 MB) versus the 68000's A1-A23. Internally it is a full 32-bit processor with the same instruction set and the same timing relationships at a given clock frequency."
  - type: choice
    prompt: "How much memory can the 68008's address lines A0-A19 reach?"
    options: ["1 MB (2^20 bytes)", "16 MB", "64 KB", "512 KB"]
    answer: 0
    explain: "20 address lines reach 2^20 = 1,048,576 bytes. The handout compares it with the Z80 (its 16 address lines reach 64 KB; the handout's wording of '16 Kbyte' is a slip)."
  - type: choice
    prompt: "What does the **DS1232 supervisor chip** do on the board?"
    options: ["Generates a clean RESET to the processor (and both reset polarities)", "Holds the program", "Decodes the addresses", "Generates the clock"]
    answer: 0
    explain: "The DS1232 uP system supervisor gives a clean reset. It provides both polarities of RESET: the 68008 needs ~RESET and the GAL22V10 and logic analyzer use the positive RESET."
card:
  front: "Describe the 68008 lab board."
  back: "8 MHz 68008 (48-pin DIP, 8-bit data bus, A0-A19 = 1 MB); 32K x 8 ROM (27C256) at 0000-7FFF; 32K x 8 RAM (62256) at 8000-FFFF; 8 MHz oscillator; DS1232 supervisor for RESET; GAL22V10 PLD that makes chip selects, ~RD/~WR and a wait-state generator."
glossary:
  - { term: "68008", def: "An 8-bit-bus version of the 68000: a full 32-bit processor internally, with a byte-wide external data bus, ~DS, and A0-A19." }
---

## Learn

Lab 3 studies the **MC68008**, the 8-bit-bus version of the 68000: internally a full **32-bit** processor, externally only an 8-bit data bus. Motorola designed it for low-cost systems that still needed compatibility with the 68000 family. It is a good lab processor because the LogicPort logic analyzer has only **34 channels**, and the 8-bit bus keeps the number of signals to watch manageable.

The board:

- **8 MHz 68008** in a 48-pin DIP (8 more pins than the Z80); **A16-A19** give it **1 MB** of address space.
- **32K x 8 ROM** (27C256) at **0000H-7FFFH**.
- **32K x 8 RAM** (62256) at **8000H-FFFFH**.
- **8 MHz crystal oscillator**.
- **DS1232 supervisor**, which generates a clean RESET (both polarities).
- **GAL22V10** programmable logic device, which makes the memory-interface control signals and a variable wait-state generator.

Differences from the 68000 (Appendix B): the 68008 has ~DS in place of ~UDS and ~LDS; address lines **A0-A19** instead of A1-A23; and data lines **D0-D7** instead of D0-D15. For a given clock frequency the timing relationships are identical.

## Worked example

*Which chip does the address $9ABC select?*

1. $9ABC = 1001 1010 1011 1100: A15 = 1 and A16-A19 = 0 (it is below $10000).
2. A15 = 1 selects the **RAM** (8000H-FFFFH).
3. Address $1234 has A15 = 0, so it is in the **ROM**.

## Try it

*How many pages does this memory have, and how big is each?*

???

The two chips are 32 KB each, so there are **2 pages of 32 KB**, with one page bit (A15) and 15 offset bits (A0-A14). It is the same page/offset split you learned in memory decoding.
