---
track: shared
title: "The memory map and decoding regions with a 3-to-8 decoder"
summary: "A 74x138 splits the address space into eight regions; the 68000's vector table sits at address 0."
needs: [memory-decoding.chip-select, buses-and-cells.address-space-alignment]
sources:
  - { type: slide, ref: "L7 s333", quote: "Processor begins execution from an address stored in the Exception Vector" }
  - { type: slide, ref: "L7 s333", quote: "Stack address is assigned in Exception Vector Table" }
  - { type: slide, ref: "L7 s335", quote: "74XX138 family has been a popular memory decoder for many years" }
  - { type: slide, ref: "L7 s335", quote: "Three ENABLE inputs, EN1, ~EN2, ~EN3 must all be true for outputs" }
checks:
  - type: choice
    prompt: "How does a **74x138** decoder split a 24-bit, 16 MB address space into regions?"
    options: ["Three address bits (A21-A23) select one of 8 regions of 2 MB each", "Four bits select 16 regions", "Two bits select 4 regions", "It does not split memory"]
    answer: 0
    explain: "A 3:8 decoder decodes three address lines: A23-A21 choose one of 8 regions, each 2^21 bytes = 2 MB."
  - type: choice
    prompt: "The lecture asks: with only a **second 74x138**, how do you decode **16 regions**?"
    options: ["Use one more address bit (A20) to choose which decoder is enabled, giving 16 outputs of 1 MB each", "Connect the outputs in series", "Use two bits more and a gate", "It cannot be done"]
    answer: 0
    explain: "Each 138 provides 8 outputs. Use another address bit to enable one decoder or the other through the enable inputs; with 4 bits (A20-A23) in total, you get 16 regions of 1 MB."
  - type: choice
    prompt: "Where does the 68000 get its **starting program address and stack address** on reset?"
    options: ["From the exception vector table at the bottom of memory", "From the keyboard", "From a fixed ROM at the top", "From the stack"]
    answer: 0
    explain: "The processor begins execution from an address stored in the exception vector table, and the stack address is also assigned there (first two long words, as in the 68008 listing's two ORG statements)."
  - type: choice
    prompt: "A 74x138 has three enable inputs, EN1, ~EN2 and ~EN3. When do its outputs become active?"
    options: ["Only when all three enables are true", "When any enable is true", "When EN1 is false", "Always"]
    answer: 0
    explain: "All three enables must be true for the outputs to become active. The 68000's address strobe (~AS) is true when the address is valid and can drive one of them."
card:
  front: "How do you decode the address space into regions, and what is in the 68000 memory map?"
  back: "A 74x138 (3:8) with its enables (including address strobe ~AS) splits the space into 8 regions (8 x 2 MB for 16 MB); a second 138 plus one more address bit gives 16. The 68000 memory map has the exception vector table at address 0 (initial stack and start address), ROM, peripherals and empty space, then RAM."
glossary:
  - { term: "74x138", def: "A 3-to-8 line decoder with three enable inputs; a popular chip for decoding memory regions." }
  - { term: "Exception vector table", def: "The table at the bottom of the 68000's memory holding the initial stack pointer, the start address and the exception handler addresses." }
---

## Learn

**The memory map of a typical 68K system** has a ROM area containing the **exception vector table** (addresses $000000-$00001F, then program space from $000020), a region for **peripherals and empty space**, and RAM. The processor begins execution from an address stored in the vector table, and the **stack address is assigned there too**.

**Interfacing to memory** is usually the most involved part of the design, because it depends on the algorithms, performance, feature set and cost, which in turn drive memory density, speed, depth, width, type and the need for ROM reprogramming.

**Address space decoding.** The lecture's simple scheme predefines **8 regions of 2 MB** each, any of which can be RAM, ROM or I/O, using a **3:8 decoder**:

- The **74XX138** family has been a popular memory decoder for many years.
- Its three enables (EN1, ~EN2, ~EN3) must all be true for the outputs to become active; the 68000's **address strobe (~AS)** is true when the address is valid.
- A23, A22, A21 select one of 8 outputs, each a region of 2^21 = 2 MB.

**Question from the lecture:** with just a second 138 and another address bit, extend this to **16 regions**: let A20 decide which of the two decoders is enabled, so four bits (A23-A20) select one of 16 regions of 1 MB each.

## Worked example

*Which region does address $5A0000 fall in with the 8 x 2 MB decoder?*

1. A23-A21 are the top three bits of the 24-bit address: $5A0000 = 0101 1010 0000 ... so A23-A21 = 010.
2. 010 = region **2** (the third 2 MB region, $400000-$5FFFFF).
3. The decoder asserts output 2.

## Try it

*With 16 regions of 1 MB, which region number holds $5A0000?*

???

The top four bits (A23-A20) of $5A0000 are 0101 = region **5** ($500000-$5FFFFF).
