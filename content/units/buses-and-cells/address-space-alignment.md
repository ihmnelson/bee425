---
track: shared
title: "Address space, alignment and data path width"
summary: "Address lines set the address space (not the installed memory); words and long words sit on even and multiple-of-4 boundaries."
needs: [memory-decoding.address-lines]
sources:
  - { type: slide, ref: "L6 s272", quote: "Size of the address space doesn’t mean that you have that much memory" }
  - { type: slide, ref: "L6 s273", quote: "Memory is always referred to in terms of 8-bit wide bytes" }
  - { type: slide, ref: "L6 s274", quote: "MC68000: 32-bit internal/16-bit external" }
  - { type: slide, ref: "L6 s274", quote: "Double the bus width, increase performance by up to 4X" }
checks:
  - type: choice
    prompt: "A 68000 has 24 address lines. What does that say about its installed memory?"
    options: ["Only its capability: it can address 16,777,216 locations, but that much memory need not be fitted", "It always has 16 MB installed", "It has 24 MB", "It has 24 chips"]
    answer: 0
    explain: "The size of the address space does not mean you have that much memory; it only means the capability exists to access it directly."
  - type: choice
    prompt: "Which of these is a valid **long word** address in the lecture's convention?"
    options: ["$0008", "$0006", "$0001", "$0002"]
    answer: 0
    explain: "Long words (32 bits, four bytes) usually sit on boundaries divisible by 4: $0000, $0004, $0008... Words sit on even addresses ($0000, $0002...), and 64-bit doubles on multiples of 8."
  - type: choice
    prompt: "The 68000 has a 32-bit internal and a **16-bit external** data path. What is the benefit of the narrower external bus?"
    options: ["Narrower memory is more economical", "It makes the processor faster", "It doubles the address space", "It removes alignment rules"]
    answer: 0
    explain: "Internal and external paths may differ: narrower memory is cheaper (68000: 32/16; 80C188: 16/8). The lecture's rule of thumb is that doubling the bus width can raise performance by up to 4X."
  - type: choice
    prompt: "A processor has 32 address lines. How many byte addresses, and what is the address range in hex?"
    options: ["4,294,967,296; $00000000 to $FFFFFFFF", "65,536; $0000 to $FFFF", "2^31; $0 to $7FFFFFFF", "32 million"]
    answer: 0
    explain: "2^32 = 4,294,967,296 locations, addressed from 0 to 2^32 - 1 = $FFFFFFFF. Memory is always counted in 8-bit bytes."
card:
  front: "What is address space, and what alignment rules apply?"
  back: "Address space = 2^n bytes for n address lines (capability, not installed memory). Memory is addressed in bytes. Words (16 bit) usually on even addresses, long words on multiples of 4, doubles on multiples of 8. Internal and external data paths can differ (68000: 32 internal, 16 external)."
glossary:
  - { term: "Address space", def: "The amount of memory a processor can address directly, set by its number of address lines." }
---

## Learn

The **address space** is the amount of accessible memory: it can vary from 1 KB for a simple microcontroller to over 60 GB in high-performance processors. **The size of the address space does not mean you have that much memory.** Examples from the lecture:

| Processor | Address lines | Locations |
|---|---|---|
| Simple microcontroller | 10 (A0-A9) | 1,024 (2^10) |
| Generic 8-bit | 16 (A0-A15) | 65,536 (2^16) |
| 68000 | 24 (A0-A23) | 16,777,216 (2^24) |
| i486 | 32 (A0-A31) | 4,294,967,296 (2^32) |
| Ryzen | 36 (A0-A35) | 68,719,476,736 |

**Memory is always counted in 8-bit bytes**, so the address range is 0 to 2^n - 1. Wider values occupy several bytes and usually sit on aligned addresses:

- 16-bit **word**: even addresses ($0000, $0002, ... $FFFE).
- 32-bit **long**: multiples of 4 ($0000, $0004, ... $FFFC).
- 64-bit **double**: multiples of 8.

**Data path width** predicts performance and functionality: 4 or 8 bits for appliances and modems, 16 for industrial controllers and automotive, 32 for telecomm and laser printers, 64 for PCs and workstations. Internal and external paths can differ: the **MC68000 is 32-bit internal and 16-bit external**, the 80C188 is 16 internal and 8 external. An 8-bit processor can do everything a 64-bit one can, only slower; doubling the bus width increases performance by up to 4X as a rule of thumb.

## Worked example

*Is a word access at address $1003 aligned?*

1. A word must be on an even address.
2. $1003 is odd, so it is **not aligned**.
3. Word accesses are expected on even boundaries, so the address is not valid for a word access in the lecture's convention (use a byte access, or align the data).

## Try it

*How many address lines does a 1 MB address space need?*

???

1 MB = 2^20 bytes, so **20** address lines (A0-A19).
