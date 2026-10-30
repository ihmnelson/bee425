---
track: shared
title: Address range of each page
summary: Pages are equal consecutive blocks; page n starts at n times the page size.
needs: [pages-and-offsets]
sources:
  - { type: slide, ref: "L6 s290", quote: "each page must cover" }
checks:
  - gen: memory.pageRange
  - gen: memory.pageRange
  - type: choice
    prompt: "A 20-bit address space is split into **4 equal pages**. What is the **first address of page 2**?"
    options: ["$80000", "$40000", "$C0000", "$20000"]
    answer: 0
    explain: "Each page covers 1/4 of $100000 = $40000 addresses. Page 2 starts at 2 x $40000 = $80000 and ends at $BFFFF."
card:
  front: "Pages are 2^k addresses each. Where does page n start, and where does it end?"
  back: "Start = n x 2^k. End = start + 2^k - 1 (one before the next page)."
glossary: []
---

## Learn

Pages sit one after another with no gaps, and each is the same size. So:

> **start of page n = n x page size  |  end of page n = start + page size - 1**

For the lecture's 20-bit example with four 256K pages, the whole space is $00000-$FFFFF, so each page covers 1/4 of it:

| Page | Page bits (A19 A18) | Range |
|---|---|---|
| 0 | 00 | $00000 - $3FFFF |
| 1 | 01 | $40000 - $7FFFF |
| 2 | 10 | $80000 - $BFFFF |
| 3 | 11 | $C0000 - $FFFFF |

Notice the page bits are the **top two bits of every address** in that page, and the offset bits run from all zeros (start) to all ones (end). That is why the end of a page always looks like the start of the next one minus 1.

## Worked example

*Memory on a 24-bit address bus is built in 64K pages. What is the range of page 5?*

1. A page is 64K = 2^16 = $10000 addresses.
2. Start = 5 x $10000 = **$050000**.
3. End = $050000 + $10000 - 1 = **$05FFFF**.

## Try it

*In a 20-bit space with 128K pages, what is the range of page 3?*

???

128K = 2^17 = $20000. Start = 3 x $20000 = **$60000**. End = $60000 + $20000 - 1 = **$7FFFF**.
