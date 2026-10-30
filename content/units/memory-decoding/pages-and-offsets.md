---
track: shared
title: Pages, offset bits and page bits
summary: Low address bits go straight to the chips (offset); high bits go to a decoder (page).
needs: [address-lines, chip-organization]
sources:
  - { type: slide, ref: "L7 s294", quote: "Use the upper order address bits" }
  - { type: slide, ref: "L6 s284", quote: "Does the total number of devices change" }
checks:
  - type: choice
    prompt: "In a paged memory system, which address lines go **directly to the address pins of the memory chips**?"
    options: ["The low-order (offset) bits", "The high-order (page) bits", "All of them, through a decoder", "None; the chips have no address pins"]
    answer: 0
    explain: "The offset bits pick a location inside the page, so every chip in the page sees them. The high page bits go to the decoder, which chooses which page's chips are switched on."
  - gen: memory.pageLayout
  - gen: memory.pageLayout
card:
  front: "A memory page is built from chips holding 2^k locations. Which address lines are offset bits and which are page bits?"
  back: "Offset = A0 to A(k-1), wired to the chips. Page = the remaining high lines, wired to the decoder. Pages = 2^(page bits)."
glossary:
  - { term: "Offset bits", def: "The low address lines that select a location inside one page; they connect straight to the chips' address pins." }
  - { term: "Page bits", def: "The high address lines that select which page is active; they feed the decoder that drives the chip selects." }
---

## Learn

A **page** is the block of addresses that one set of chips covers. The processor's address is split in two:

- **Offset bits** (the low lines, from A0 up): choose a location **inside** the page. They go straight to the address pins of every chip in the page.
- **Page bits** (the remaining high lines): choose **which page**. They go to the decoder logic, along with the processor's address-valid signal, to switch on exactly one page.

The number of offset bits is set by the chip depth: a chip with 2^k locations needs k offset bits. Everything left over is a page bit.

> **Offset bits = log2(chip depth)  |  Page bits = address lines - offset bits  |  Pages = 2^(page bits)**

The lecture's example: 16 MB of memory (24 address lines) in 32K pages. A 32K page needs 15 offset bits (2^15 = 32,768), so **A0-A14 are offset bits** and **A15-A23** (9 lines) are page bits: 2^9 = **512 pages**.

## Worked example

*A processor has a 20-bit address bus and uses 256K x 4 chips on an 8-bit data bus. Find the offset bits, page bits, pages and chips.*

1. 256K = 2^18, so **18 offset bits**: A0-A17.
2. 20 - 18 = **2 page bits**: A18-A19.
3. 2^2 = **4 pages**.
4. Each page needs 8 / 4 = 2 chips, so 4 x 2 = **8 chips**.

This is the 256K x 4 row of the lecture's table: 4 pages, page bits A18-A19, offset A0-A17.

## Try it

*A processor has a 24-bit address bus and an 8-bit data bus, with 512K x 8 chips, fully populated. How many offset bits, page bits, pages and chips?*

???

512K = 2^19, so **19 offset bits** (A0-A18). 24 - 19 = **5 page bits** (A19-A23). 2^5 = **32 pages**. 8 / 8 = 1 chip per page, so **32 chips**.
