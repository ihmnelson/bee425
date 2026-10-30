---
track: shared
title: "Bus width, byte write strobes and endianness"
summary: "Wider buses split a page into byte lanes, write strobes pick the bytes, and the lane layout fixes the endianness."
needs: [memory-design-steps]
sources:
  - { type: slide, ref: "L7 s322", quote: "Byte writes are controlled by asserting WR0 and WR1 independently" }
  - { type: slide, ref: "L7 s322", quote: "This architecture is Big Endian" }
  - { type: slide, ref: "L7 s326", quote: "Word operations may take place on addresses divisible by 2" }
  - { type: slide, ref: "L7 s326", quote: "The organization is Little Endian" }
  - { type: slide, ref: "L7 s322", quote: "All 16-bit wide reads and writes appear on even address boundaries" }
checks:
  - type: choice
    prompt: "In the lecture's 16-bit bus design, how is a **byte write** done?"
    options: ["Only one of WR0 or WR1 is asserted; for a word write both are asserted together", "Both strobes always", "A0 selects the byte on the chip", "There are no byte writes"]
    answer: 0
    explain: "A0 is implied and synthesised from WR0 and WR1: byte writes assert WR0 and WR1 independently, word writes assert them together."
  - type: choice
    prompt: "In the lecture's 16-bit big-endian design, which data lines carry the **even-addressed byte**?"
    options: ["D8-D15 (controlled by WR0)", "D0-D7 (controlled by WR0)", "D0-D7 (controlled by WR1)", "All 16 lines"]
    answer: 0
    explain: "Even-numbered bytes go to D8-D15 (WR0) and odd-numbered bytes to D0-D7 (WR1). That is big endian: the most significant byte of a word is at the lower address."
  - type: choice
    prompt: "In the lecture's 32-bit design, what are the alignment rules for byte, word and long word operations?"
    options: ["Byte: any address. Word: addresses divisible by 2. Long word: addresses divisible by 4", "All any address", "All divisible by 4", "Word: any. Long: divisible by 2"]
    answer: 0
    explain: "Byte operations may take place on any address boundary; words on addresses divisible by 2; long words on addresses divisible by 4. All reads are 32 bits wide and the processor selects the operand internally."
  - type: choice
    prompt: "The lecture's 32-bit bus design routes WR0 to D0-D7, WR1 to D8-D15, WR2 to D16-D23 and WR3 to D24-D31. Which endianness is that?"
    options: ["Little endian", "Big endian", "Neither", "It depends on the clock"]
    answer: 0
    explain: "The lowest address byte lane (WR0, D0-D7) is the least significant: little endian. The 16-bit example earlier sends even bytes to the upper lines, which is big endian."
card:
  front: "How do wider buses and byte strobes work, and what fixes the endianness?"
  back: "A page of N-bit data uses one chip per byte lane. Separate write strobes (WR0, WR1, ...) select which lanes are written: byte write = one strobe, word = a pair, long = all four. The low address bits (A0, A1) are implied by the strobes. Which byte lane gets which address decides big or little endian. Alignment: words on even addresses, longs on multiples of 4."
glossary:
  - { term: "Big endian", def: "The most significant byte of a multi-byte value is stored at the lowest address (68000)." }
  - { term: "Little endian", def: "The least significant byte is stored at the lowest address (Z80, and the lecture's 32-bit design)." }
---

## Learn

When the data bus is wider than a byte, each page is built from **several byte-wide chips side by side** (**lanes**), one per byte of the bus. Reading always fetches the whole bus width, but writing a single byte needs **separate write strobes**.

**16-bit bus (24-bit address).** A page holds 128 KB in two 64 KB chips. **A0 is implied** and synthesised from **WR0 and WR1**; the address lines to the chips start at A1. All 16-bit reads and writes appear on even addresses (00000, 00002, ...). **Byte writes** assert WR0 or WR1 alone; **word writes** assert both. This design is **big endian**: WR0 controls D8-D15, WR1 controls D0-D7; even-numbered bytes go to D8-D15 and odd-numbered bytes to D0-D7.

**32-bit bus.** A0 and A1 are implied, and WR0 to WR3 synthesise the byte address on writes: a byte write uses one strobe, a word write pairs them (WR0,WR1 and WR2,WR3) and a long word write asserts all four. **Byte operations may be at any address; words at addresses divisible by 2; long words at addresses divisible by 4.** All reads are 32 bits wide, and the operand is selected inside the processor. The lecture's organisation is **little endian**: WR0 to D0-D7, WR1 to D8-D15, WR2 to D16-D23, WR3 to D24-D31.

In the lecture's 16-bit design with a 24-bit address, the page/offset boundary does not line up with a hex digit boundary, so write the addresses in binary.

## Worked example

*A 16-bit big-endian design writes the single byte at address $00005 (odd). Which strobe and which lines?*

1. Odd-numbered bytes go to **D0-D7**, controlled by **WR1**.
2. Only WR1 is asserted; WR0 stays inactive so the even byte at $00004 is untouched.
3. A word write to $00004 would assert both.

## Try it

*Why can't a 16-bit design with no separate write strobes write a single byte safely?*

???

A write would put data on all 16 lines into both chips, **overwriting the neighbouring byte** in the pair. Separate strobes (WR0/WR1) let the system write only the lane that holds the byte.
