---
track: shared
title: Address lines and memory size
summary: n address lines reach 2^n locations; hex digits count the lines in fours.
needs: []
sources:
  - { type: slide, ref: "L7 s294", quote: "total memory size is 16 MB" }
  - { type: slide, ref: "L6 s290", quote: "In hex this is 0x00000 through 0xFFFFF" }
checks:
  - type: choice
    prompt: "What is the **highest address** on a processor with a 16-bit address bus?"
    options: ["$FFFF", "$10000", "$7FFF", "$FFFFF"]
    answer: 0
    explain: "16 lines mean 16 bits, all ones: $FFFF (65,535). $10000 is one past the end, so it needs a 17th line."
  - gen: memory.addressBytes
  - type: choice
    prompt: "How many hex digits does it take to write any address on a **20-bit** address bus?"
    options: ["4", "5", "6", "20"]
    answer: 1
    explain: "One hex digit is 4 bits, so 20 bits take 20 / 4 = 5 digits: $00000 to $FFFFF."
card:
  front: "How many different addresses do n address lines reach?"
  back: "2^n. For example 20 lines reach 2^20 = 1,048,576 locations (1 MB of bytes)."
glossary:
  - { term: "Address bus", def: "The set of lines the processor uses to say which memory location it wants; it only carries information away from the processor." }
---

## Learn

Memory is a long row of numbered locations. The **address** is the number of the location the processor wants.
Each **address line** carries one bit of that number, so **n lines can name 2^n different locations**.

| Address lines | Locations | Size | Highest address |
|---|---|---|---|
| 10 | 1,024 | 1 KB | $3FF |
| 16 | 65,536 | 64 KB | $FFFF |
| 20 | 1,048,576 | 1 MB | $FFFFF |
| 24 | 16,777,216 | 16 MB | $FFFFFF |

Each added line **doubles** the memory the processor can reach. Hex is handy here because one hex digit is exactly 4 bits, so the number of hex digits in an address is the number of lines divided by 4.

## Worked example

*How many bytes can a 20-line address bus reach, and what is the highest address?*

1. Locations = 2^20. Since 2^10 = 1,024 (1K), 2^20 = 1K x 1K = **1,048,576 bytes = 1 MB**.
2. The highest address is all 20 bits set to 1.
3. 20 bits = 5 hex digits, so the highest address is **$FFFFF**, and the lowest is $00000.

## Try it

*A processor has 12 address lines. How many locations can it reach, and what is the highest address in hex?*

???

2^12 = 4,096 locations (4 KB). 12 bits = 3 hex digits, so the highest address is **$FFF**.
