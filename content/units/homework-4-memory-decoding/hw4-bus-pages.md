---
track: shared
title: "Homework 4, problem 2: chips, pages and decoder for a 32-bit processor"
summary: "A 32-bit processor with A2-A31 and 2M x 8 chips: 2048 chips in 512 pages; page lines are A23-A31."
needs: ["memory-decoding.pages-and-offsets", "memory-decoding.chip-select", "memory-systems.bus-width-endianness"]
sources:
  - { type: handout, ref: "hw4 P2", quote: "How many total chips are needed to completely fill the address space" }
  - { type: handout, ref: "hw4 P2", quote: "How many pages of memory are there in this system?" }
  - { type: handout, ref: "hw4 P2", quote: "memory at page 0, page 1, page 2 and the last page of memory" }
  - { type: own, ref: "pin counts read from the two figures in the handout; chip and page counts are our calculation (calc)" }
checks:
  - type: choice
    prompt: "A processor has address pins A2 to A31, a 32-bit data bus D0-D31 and byte enables ~WE0 to ~WE3 (they replace A0 and A1). How much memory can it address?"
    figure: {"src": "hw4/processor-ab32x32.png", "alt": "Pin diagram of the AB32X32 microprocessor: data lines D0-D31 on the left and bottom, address lines A2-A31 on the right and bottom, and control pins ~WE0 to ~WE3, ~ADVL and ~RD on top", "caption": "Homework 4, problem 2: the AB32X32 processor (A2-A31, D0-D31, ~WE0-~WE3, ~ADVL, ~RD)"}
    options: ["4 GB: 2^30 words of 4 bytes", "1 GB: 2^30 bytes", "16 MB: 2^24 bytes", "2 GB: 2^31 bytes"]
    answer: 0
    explain: "A2-A31 is 30 address lines, so 2^30 words. Each word is 4 bytes (the byte enables take the place of A0 and A1), giving 2^32 bytes = 4 GB."
  - type: choice
    prompt: "A memory chip is 2M x 8 (16 Mbit, address pins A0-A20, 8 data pins). How many of these chips fill a 4 GB, 32-bit-wide address space?"
    options: ["2048", "512", "1024", "4096"]
    answer: 0
    explain: "4 GB / 2 MB per chip = 2048 chips. Equivalently: 4 chips side by side make one 32-bit word-wide row (2M x 32 = 8 MB), and there are 512 such rows."
  - type: choice
    prompt: "Each page is one row of four 2M x 8 chips, one chip per byte lane. How many pages does the 4 GB space contain?"
    options: ["512", "2048", "256", "1024"]
    answer: 0
    explain: "A page holds 2^21 words (the chip depth). 2^30 words / 2^21 words per page = 2^9 = 512 pages."
  - type: choice
    prompt: "The chips' address pins A0-A20 connect to processor lines A2-A22. Which processor lines become the page bits that feed the decoder?"
    options: ["A23-A31", "A22-A31", "A21-A31", "A2-A22"]
    answer: 0
    explain: "A2-A22 are the 21 offset lines wired to every chip. The remaining A23-A31 are 9 page bits, and 2^9 = 512 pages."
  - type: choice
    prompt: "In the decoder for pages 0, 1, 2 and the last page, which values of A31 A30 ... A23 select page 2?"
    options: ["0 0 0 0 0 0 0 1 0", "0 0 0 0 0 0 0 0 1", "1 1 1 1 1 1 1 1 0", "0 0 0 0 0 0 1 0 0"]
    answer: 0
    explain: "Page 2 = 2 in 9-bit binary = 000000010. Page 1 would be 000000001, and the last page (511) is all ones: 111111111."
  - type: choice
    prompt: "All four chips in a page share one ~CE from the decoder, but each gets its own byte enable (~WE0, ~WE1, ~WE2, ~WE3). Why?"
    options: ["So a byte or halfword write changes only the chips in the selected byte lanes", "Because each chip is a different page", "To make the four chips act as one larger chip", "Because ~WE is the same signal as ~CE"]
    answer: 0
    explain: "The whole row must be enabled for any access to that page, but only the lanes being written should see a write strobe. Each ~WEn goes to the chip on data lines D(8n)-D(8n+7)."
card:
  front: "Homework 4, P2: a 32-bit processor with A2-A31 and 2M x 8 chips. How many chips, pages, and which lines are page bits?"
  back: "Address space 2^30 words x 4 bytes = 4 GB. A page = 4 chips (one per byte lane) = 2^21 words (8 MB). Pages = 2^30 / 2^21 = 512; chips = 512 x 4 = 2048. Chip A0-A20 connect to processor A2-A22; page bits A23-A31 feed the decoder (page 0 = 000000000, last page = 111111111) together with address-valid."
glossary: []
---

## Learn

**Problem 2** shows a 16 Mbit static RAM (2M x 8, address pins A0-A20, ~CE, ~OE, ~WE) and a processor, the AB32X32, whose pins matter for three questions: how many chips fill the space, how many pages there are, and how to decode pages 0, 1, 2 and the last page.

Reading the processor figure:

- Address pins **A2-A31** (30 lines). A0 and A1 are not brought out; the four **byte enables ~WE0-~WE3** cover them.
- Data pins **D0-D31**, so every access moves up to 4 bytes.
- Other control pins: ~ADVL (address valid) and ~RD. The pins marked DC are "don't care" and ignored.

The answers:

1. **Space**: 2^30 words x 4 bytes = 2^32 bytes = **4 GB**.
2. **Chips**: a 32-bit word needs 4 byte-wide chips side by side. 4 GB / 2 MB = **2048 chips**.
3. **Pages**: one page is the row of four chips, 2^21 words (8 MB). 2^30 / 2^21 = **512 pages**.
4. **Wiring**: chip A0-A20 to processor **A2-A22**; page bits are **A23-A31** (9 lines).
5. **Decoder**: four ~CE outputs, each low only when ~ADVL is active and A31-A23 match: page 0 = 000000000, page 1 = 000000001, page 2 = 000000010, last page (511) = 111111111. Each ~CE goes to all four chips in its page; ~WE0-3 go to the matching lane's chip and ~RD to every chip's ~OE.

## Worked example

*A processor has address lines A2-A25 and a 32-bit data bus, and uses 1M x 8 chips (A0-A19). How many chips and pages?*

1. Words: 2^24 (24 address lines), so 2^24 x 4 bytes = 64 MB.
2. Page = 2^20 words x 4 lanes = 4 chips (4 MB).
3. Pages = 2^24 / 2^20 = **16**; chips = 16 x 4 = **64**.
4. Page bits: chip A0-A19 connect to A2-A21, so the page lines are A22-A25 (4 lines, 2^4 = 16).

## Try it

*Which address pattern selects the last page if there are 512 pages?*

???

All nine page bits are ones: A31-A23 = **1 1 1 1 1 1 1 1 1** (page 511, the top 8 MB of the space).
