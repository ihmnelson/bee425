---
track: m68k
title: The 68000's memory map
summary: A 24-bit address space (16 MB) split into pages, the same way as any other processor.
needs: [pages-and-offsets, page-ranges]
sources:
  - { type: slide, ref: "L7 s294", quote: "Suppose that our total memory size is 16 MB" }
  - { type: carried, ref: "v1 site, 68000 guide 'Memory, buses and address decoding' (audited in v1 against the M68000 Programmer's Reference Manual)", note: "24 address lines on the 68000 itself; not re-read here" }
checks:
  - type: choice
    prompt: "A 24-bit address space is built from **32K pages**. How many **page-select lines** are there?"
    options: ["9", "15", "24", "512"]
    answer: 0
    explain: "A 32K page needs 15 offset bits (A0-A14). 24 - 15 = 9 page bits (A15-A23), which select one of 2^9 = 512 pages. 512 is the number of pages, not the number of lines."
  - type: choice
    prompt: "How many bytes is a 24-bit address space?"
    options: ["16,777,216", "1,048,576", "65,536", "4,294,967,296"]
    answer: 0
    explain: "2^24 = 16,777,216 bytes = 16 MB."
card:
  front: "The 68000 has a 24-bit address space. In 32K pages, which lines are offset and page bits?"
  back: "A0-A14 offset (15 bits), A15-A23 page (9 bits), 512 pages."
glossary: []
---

## Learn

Everything you just learned applies unchanged to the 68000. Its address space is **24 bits**, **16 MB** ($000000-$FFFFFF), which is exactly the lecture's example: 16 MB in **32K pages** gives **A0-A14 as offset bits** and **A15-A23 as page bits**, 2^9 = **512 pages**.

The 68000's data bus is 16 bits wide, so a page is built from chips that together supply 16 bits (for example two 8-bit-wide chips side by side).

## Worked example

*Where does a page at $FF8000-$FFFFFF sit in a 24-bit space with 32K pages?*

1. 32K = $8000. The last page starts at $1000000 - $8000 = **$FF8000**.
2. That is page number $1FF (all nine page bits A15-A23 equal 1).
3. The page's NAND needs no inverters at all: every page bit must be 1.

## Try it

*A 68000 board uses 64K pages. How many page bits, and how many pages in the whole space?*

???

64K = 2^16, so 16 offset bits (A0-A15), **8 page bits** (A16-A23), 2^8 = **256 pages**.
