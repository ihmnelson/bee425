---
track: shared
title: "Moore's law and process geometry"
summary: "Transistor counts double about every 18 months; finer processes give higher speed, lower power and more function."
needs: []
sources:
  - { type: slide, ref: "L1 s41", quote: "Moore’s Law roughly states that the number of transistors on an integrated circuit will double" }
  - { type: slide, ref: "L1 s42", quote: "Finer processes mean higher speeds, lower power and" }
  - { type: slide, ref: "L1 s42", quote: "AMD Ryzen 9 uses 7nm CMOS FinFET technology" }
  - { type: slide, ref: "L1 s42", quote: "Atmel AVR microcontrollers (Arduino) use 180 nm processes" }
checks:
  - gen: trends.moore
  - gen: trends.moore
  - type: choice
    prompt: "What does **Moore's law** say, in the lecture's wording?"
    options: ["The number of transistors on an integrated circuit roughly doubles about every 18 months", "Clock speeds double every year", "Memory prices halve every 6 months", "Power use doubles every 18 months"]
    answer: 0
    explain: "Moore's Law roughly states that the number of transistors on an integrated circuit will double approximately every 18 months. It was first predicted by Intel founder Gordon Moore."
  - type: choice
    prompt: "What do **finer manufacturing processes** (smaller geometry) give?"
    options: ["Higher speeds, lower power and more functionality on one chip", "Larger chips", "Slower clocks", "Fewer transistors"]
    answer: 0
    explain: "Finer processes mean higher speeds, lower power and more functionality on a single IC. The lecture contrasts 7 nm for a Ryzen 9 with 180 nm for the Arduino's AVR."
card:
  front: "State Moore's law and how process geometry has changed."
  back: "Transistors per IC double roughly every 18 months (Gordon Moore). Mainstream processes now run from 2 to 130 nm; a Ryzen 9 uses 7 nm CMOS FinFET, Arduino's AVR uses 180 nm, and the 68000 used 3.6 µm. Finer processes give higher speed, lower power and more function."
glossary:
  - { term: "Moore's law", def: "The observation that the number of transistors on an integrated circuit doubles about every 18 months." }
---

## Learn

**Moore's law** (first predicted by Intel's founder Gordon Moore) roughly states that the number of transistors on an integrated circuit **doubles approximately every 18 months**. DRAM capacity followed the same curve through DRAM, SDRAM, DDR, DDR2, DDR3, DDR4 and DDR5.

Today's mainstream IC processes use **2 to 130 nanometres** (0.002 to 0.13 micron). The lecture's reference points:

- **AMD Ryzen 9**: 7 nm CMOS FinFET.
- **Atmel AVR microcontrollers (Arduino)**: 180 nm.
- **Motorola 68000** (Lesson 3): 3.6 µm = 3,600 nm.

**Finer processes mean higher speeds, lower power and more functionality** on a single chip. Multiple cores are the new trend (clock frequencies above 20 GHz are doubtful). Device physicists once predicted current technology would break down at 9 nm geometries.

## Worked example

*A chip has 10 million transistors. How many 18-month doublings take place in 6 years, and what is the count?*

1. 6 years = 72 months = 72 / 18 = **4 doublings**.
2. Count = 10 million x 2^4 = **160 million** transistors.

## Try it

*Roughly how many times smaller is a 7 nm process than the 68000's 3.6 µm process?*

???

3,600 nm / 7 nm = about **514**, so around 500 times smaller (the Lesson 3 slide gives about 500).
