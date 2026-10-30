---
track: shared
title: Memory chip organisation
summary: A chip is "depth x width"; chips side by side make up the data bus width.
needs: [address-lines]
sources:
  - { type: slide, ref: "L6 s284", quote: "How many total devices will we need?" }
  - { type: slide, ref: "L6 s288", quote: "Each page has 2 memory chips" }
checks:
  - type: choice
    prompt: "How many bits does a **256K x 4** chip store in total?"
    options: ["1 Mbit", "256 Kbit", "4 Mbit", "1 Mbyte"]
    answer: 0
    explain: "256K locations x 4 bits = 1,048,576 bits = 1 Mbit. (A 256K x 8 chip would be 2 Mbit, or 256 KB.)"
  - gen: memory.chipsPerPage
  - gen: memory.chipsPerPage
card:
  front: "A system has an N-bit data bus and uses chips w bits wide. How many chips are in one page?"
  back: "N / w. Each chip supplies w of the N data bits, so a page needs N / w chips side by side."
glossary:
  - { term: "Memory organisation (depth x width)", def: "How a chip's bits are arranged: 256K x 4 means 256K locations of 4 bits each." }
---

## Learn

A memory chip is described by two numbers: **how many locations** it has (depth) and **how many bits each location holds** (width). A **256K x 4** chip has 256K locations of 4 bits, which is 1 Mbit.

The processor's data bus is wider than most chips. A chip only supplies its own width, so chips are placed **side by side** and all selected together; each supplies a slice of the data bus. That group of chips, all answering the same address, is one **page**.

> **Chips per page = data bus width / chip width**

Different chips can build the same memory. For 1 MB on an 8-bit bus the lecture compares four chips: 1M x 1, 512K x 2, 256K x 4 and 128K x 8. All of them use the **same total number of chips** (8) because the total number of bits is the same. Only the number of pages changes (1, 2, 4 and 8), and so does how many chips sit in each.

## Worked example

*An 8-bit processor uses 256K x 4 chips. How many chips are in one page, and how many in 1 MB?*

1. Each chip supplies 4 bits, the bus needs 8, so a page needs 8 / 4 = **2 chips**.
2. A 256K x 4 chip holds 256K x 4 bits = 128 KB. 1 MB / 128 KB = 8 chips.
3. 8 chips / 2 per page = 4 pages. This matches the lecture's table: 256K x 4 gives 4 pages.

## Try it

*A 16-bit data bus uses 64K x 8 chips. How many chips are in one page?*

???

16 / 8 = **2 chips** per page, one for the high byte and one for the low byte.
