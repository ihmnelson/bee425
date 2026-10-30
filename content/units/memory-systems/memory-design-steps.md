---
track: shared
title: "Designing a memory system step by step"
summary: "Find the chips per page, the page size, the number of pages, then the page and offset bits and the address ranges."
needs: [memory-decoding.pages-and-offsets, memory-decoding.page-ranges]
sources:
  - { type: slide, ref: "L6 s293", quote: "Divide the total addressable memory space of the microprocessor into" }
  - { type: slide, ref: "L7 s310", quote: "Each page is comprised of 2 memory chip" }
  - { type: slide, ref: "L7 s311", quote: "Need 64 Mbyte/4 Mbyte = 16 pages of memory" }
  - { type: slide, ref: "L7 s311", quote: "Page 3 = $00C00000 - $00FFFFFF" }
checks:
  - gen: memory.designPages
  - gen: memory.designPages
  - type: choice
    prompt: "In the lecture's design example (32-bit data bus, 1M x 16 chips, 64 MB total), how many chips are in a page and how big is a page?"
    options: ["2 chips; 4 MB", "1 chip; 2 MB", "4 chips; 8 MB", "2 chips; 2 MB"]
    answer: 0
    explain: "A 32-bit bus with 16-bit chips needs 32/16 = 2 chips per page. Each 1M x 16 chip holds 2 MB, so a page is 4 MB. 64 MB / 4 MB = 16 pages."
  - type: choice
    prompt: "The lecture places 8 of the 16 pages in low memory starting at $00000000. What is the address range of page 3?"
    options: ["$00C00000 - $00FFFFFF", "$00300000 - $003FFFFF", "$00800000 - $00BFFFFF", "$01000000 - $013FFFFF"]
    answer: 0
    explain: "Each page is 4 MB = $400000. Page 3 starts at 3 x $400000 = $C00000 and ends at $FFFFFF (page 0 = $000000-$3FFFFF, page 1 = $400000-$7FFFFF, page 2 = $800000-$BFFFFF)."
card:
  front: "What are the steps to design a memory system?"
  back: "1. Divide the address space into pages sized by the chips (chips per page = bus width / chip width; page size = chips x chip size). 2. Split the address into offset (low) and page (high) bits. 3. Decide which pages are present and where. 4. Design the decoding logic so each page is addressed uniquely."
glossary: []
---

## Learn

The lecture's four steps:

1. **Divide the address space into pages**; the page size is set by the memory devices.
2. **Separate the low-order (offset) bits from the high-order (page) bits.**
3. **Decide which pages are present** and where they live.
4. **Design the decoding logic** to address each page uniquely.

Worked through in the lecture's example. The processor has a 32-bit data bus and (30 of) 32 address bits; the chips are 16-Mbit SRAMs organised **1M x 16**; the system needs **64 MB**, split equally between high and low memory, with the middle left for peripherals.

- **Step 1, page size.** A 32-bit bus needs 2 chips (16 bits each) per page. A 1M x 16 chip holds 2 MB, so a page is **4 MB**; 64 MB / 4 MB = **16 pages**.
- **Step 2, page and offset bits.** Each chip has 20 address bits (1M locations). The lecture counts the **offset as 20 bits of the chip address** and the **page as the other 10 bits** of the 30 processor address lines (the low two byte-address bits A0-A1 are not brought out for a 32-bit bus).
- **Step 3, page locations.** 8 pages in low memory: $00000000 to $01FFFFFF. 8 pages in high memory: $FE000000 to $FFFFFFFF. The pages are consecutive 4 MB blocks: page 0 = $00000000-$003FFFFF, page 1 = $00400000-$007FFFFF, page 2 = $00800000-$00BFFFFF, page 3 = $00C00000-$00FFFFFF, and so on.

## Worked example

*A 16-bit bus uses 512K x 8 chips. How big is a page, and how many pages are in 16 MB?*

1. Chips per page = 16 / 8 = 2.
2. Each chip = 512K x 8 bits = 512 KB, so a page = 2 x 512 KB = 1 MB.
3. 16 MB / 1 MB = **16 pages**. (This matches the lecture's 16-bit, 24-bit-address design with 1 MB pages.)

## Try it

*A 32-bit bus uses 2M x 8 chips. What is the page size in MB?*

???

Chips per page = 32 / 8 = 4. Each chip = 2 MB, so a page = **8 MB**.
