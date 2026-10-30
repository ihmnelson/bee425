---
track: shared
title: "The Z80 experiment board and handling the ROM"
summary: "4 MHz Z80A, 32K EPROM at 0000-7FFF, 32K RAM at 8000-FFFF, supervisor reset and glue logic; the ZIF socket and conductive foam."
needs: ["memory-decoding.pages-and-offsets"]
sources:
  - { type: handout, ref: "lab2 VI", quote: "4 MHz Z80A microprocessor in a 40-pin Dual Inline Plastic (DIP) package" }
  - { type: handout, ref: "lab2 VI", quote: "32K x 8 EPROM memory (27C256) occupying the address range from 0000H through 7FFFH" }
  - { type: handout, ref: "lab2 VI", quote: "Quad, 2-input NAND gate (74LS00) for tying it all together" }
  - { type: handout, ref: "lab2 VI", quote: "This called “designing for testability”" }
  - { type: handout, ref: "lab2 I", quote: "the notch in the EPROM" }
checks:
  - type: choice
    prompt: "Where are the Z80 board's **ROM and RAM**?"
    options: ["EPROM (27C256) at 0000H-7FFFH and RAM (62256) at 8000H-FFFFH", "RAM at 0000H, ROM at 8000H", "ROM only", "Both at 0000H"]
    answer: 0
    explain: "Both are 32K x 8, so one address bit (A15) selects between them: the Z80 starts executing at 0000H after reset, which is in the EPROM. The 74LS00 NAND gate is the glue logic."
  - type: choice
    prompt: "Why is a 40-pin connector put on the board (it is not needed functionally)?"
    options: ["To make connecting the logic analyzer easy: designing for testability", "To power the board", "For the display", "To hold the ROM"]
    answer: 0
    explain: "Connecting 40 individual grabber clips (as in Lab 1) would be difficult; the 40-pin connector matches the analyzer's connector. This is 'designing for testability'."
  - type: choice
    prompt: "How do you insert the EPROM into the **ZIF socket**?"
    options: ["Power off, lever up, notch toward the 40-pin edge connector, check for bent pins, insert, then rotate the lever to lock; hold the chip by the long sides and keep it in conductive foam otherwise", "Power on, push hard", "Notch away from the connector", "Bend the pins to fit"]
    answer: 0
    explain: "Lever vertical opens the socket fingers; the notch (between pins 1 and 28) faces the 40-pin edge connector; do not try to fix bent pins; keep the EPROM in anti-static foam, ground yourself, and check the EPROM/FLASH jumper settings."
  - type: choice
    prompt: "What does the **wake-up EPROM** do at power on?"
    options: ["Lights the display segments in turn, or shows b-E-E-4-2-5, so you can verify the board works", "Runs the unknown program", "Resets the analyzer", "Nothing"]
    answer: 0
    explain: "The EPROM labelled 'BEE 425 Z80 Lab Display Wake-up' is a quick check; before running the unknown code remove power, open the ZIF lever, and replace it with the instructor's EPROM."
card:
  front: "Describe the Z80 lab board."
  back: "4 MHz Z80A (40-pin DIP); 32K x 8 EPROM (27C256) 0000-7FFF; 32K x 8 RAM (62256) 8000-FFFF; 4 MHz oscillator; DS1232 supervisor for a clean RESET; 74LS00 glue logic; 40-pin analyzer connector (designing for testability); 4-layer board (power and ground inner layers, 10 mil trace and space). EPROM in a ZIF socket, notch toward the connector, kept in conductive foam."
glossary:
  - { term: "ZIF socket", def: "Zero-insertion-force socket: a lever opens the contacts so a chip can be inserted without force." }
---

## Learn

**The board** (2.5 x 3.8 in, a standard ExpressPCB size, **4 layers** with power and ground as the inner layers, 10 mil trace and space; red traces mostly north-south on the top, green east-west on the bottom, vias joining them):

1. **4 MHz Z80A** in a 40-pin DIP.
2. **32K x 8 EPROM (27C256)** at **0000H-7FFFH**.
3. **32K x 8 RAM (62256)** at **8000H-FFFFH**.
4. **4 MHz crystal oscillator**.
5. **DS1232 supervisor** generating a clean RESET.
6. **74LS00** quad two-input NAND for **glue logic**.

The **40-pin connector** matches the analyzer's (**designing for testability**). EPROM or FLASH parts both fit (two jumpers set the type; FLASH is no longer used because it was more easily damaged).

**Handling:** keep memory chips in **conductive foam**, ground yourself, check pins are straight, notch toward the edge connector, lever up to insert and rotate to lock; power polarity matters; do not pull the power plug by the wires.

## Worked example

*Which chip does the Z80 fetch its first instruction from, and why?*

1. After RESET the Z80 starts at 0000H.
2. 0000H has A15 = 0, which selects the EPROM.
3. So the first instruction comes from the ROM, which is why a ROM sits at address 0.

## Try it

*Why does the lab say to remove power before changing the EPROM?*

???

Inserting or removing a chip while powered can damage it (and the board); static is also a risk, which is why you ground yourself and keep chips in foam.
