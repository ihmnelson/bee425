---
track: z80
title: The Z80's memory map and paging
summary: A 16-bit address space (64 KB) uses the same page logic, and a paging register reaches 1 MB.
needs: [pages-and-offsets, page-ranges]
sources:
  - { type: slide, ref: "L7 s301", quote: "can address a 1Mbyte address space by swapping between one of 16" }
  - { type: slide, ref: "L7 s304", quote: "Value between 0000 and 1111 sent to special register selects current page" }
checks:
  - type: choice
    prompt: "A Z80 has a 16-bit address bus. How many **64 KB pages** does it need to reach **1 MB**?"
    options: ["16", "4", "8", "64"]
    answer: 0
    explain: "1 MB / 64 KB = 16 pages. The slide selects one of them by writing a value from 0000 to 1111 to a special register."
  - type: choice
    prompt: "How does the processor tell the hardware **which** of the 16 pages to switch in?"
    options: ["It writes the page number to a special register (a memory or I/O location)", "It sets address lines A16-A19 on the bus", "It runs the clock faster", "It reads the page from the disk"]
    answer: 0
    explain: "The Z80 has no address lines above A15, so the page number is written to a special register whose output feeds the page decoder. Writing to it swaps the page."
card:
  front: "How does an 8-bit Z80 with a 16-bit address bus reach 1 MB?"
  back: "Paging: sixteen 64 KB pages; a value 0-15 written to a special register selects which page is switched in."
glossary:
  - { term: "Paging (hardware)", def: "Using a special register to swap different memory pages into a small address space. Not the same as virtual addresses." }
bridge:
  to: memory-decoding.m68k-memory-map
  same: "Page bits go to a decoder that picks one page; offset bits go to the chips; ~CS must be low and the address must be valid."
  different: "The Z80 has only 16 address lines (64 KB), not 24 (16 MB). To use more memory, a page number written to a special register supplies the missing page bits."
  why: "The 68000's page bits are simply the high address lines A15-A23. The Z80 has no lines above A15, so the extra 'address bits' come from a register the program writes."
---

## Learn

In the 68000 lesson you split a 24-bit address into offset and page bits. The Z80 has the same idea but only **16 address lines**, so its whole address space is 2^16 = **64 KB** ($0000-$FFFF). A 64 KB memory needs no page bits at all if you use one 64K x 8 chip.

When a Z80 system needs **more** memory than 64 KB, it uses **hardware paging**: the processor writes a **page number** to a special memory or I/O location (a register). That register's output drives the page decoder, which switches one of several 64 KB chips onto the bus.

The lecture's example reaches **1 MB** with **16 pages of 64 KB**. A value from 0000 to 1111 in the register (a 4-to-16 decoder) selects the current page. Hardware paging is **not** virtual memory.

Code that switches pages lives at the **top** of each page: it writes the new page number, then jumps to the start of the next page.

## Worked example

*How many bits wide must the page register be to select among 16 pages?*

1. 16 pages = 2^4, so the register needs **4 bits** (values 0000-1111).
2. A 4-to-16 decoder turns those 4 bits into 16 chip selects, one per 64 KB chip.
3. The Z80 still only drives A0-A15 itself, so every page uses those 16 lines as offset bits.

## Try it

*A Z80 system has eight 64 KB chips selected by a paging register. How many bits does the register need, and how much memory is that in total?*

???

8 pages = 2^3, so **3 bits**. Total = 8 x 64 KB = **512 KB**.
