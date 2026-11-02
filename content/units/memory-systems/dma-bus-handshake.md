---
track: shared
title: Direct memory access and the bus handshake
summary: A peripheral requests the bus, the processor grants it and idles, and the peripheral moves a whole block without the processor handling each byte.
needs: ["buses-and-cells.bus-contention-tristate"]
sources:
  - { type: handout, ref: "ch6 Direct Memory Access", quote: "Since the bus is the only path in and out of the system, conflicts will arise" }
  - { type: handout, ref: "ch6 Direct Memory Access", quote: "The peripheral device requests control of the bus from the processor by asserting the BUS REQUEST (/BUSREQ) signal input on the processor." }
  - { type: handout, ref: "ch6 Direct Memory Access", quote: "A handshake is simply an action that expects a response to indicate the action was accepted." }
  - { type: handout, ref: "ch6 Direct Memory Access", quote: "Processor then idles, or continues to process data internally in cache, until BUSREQ signal goes away" }
checks:
  - type: choice
    prompt: "Why is DMA more efficient than having the processor fetch a disk's 512 bytes one byte at a time?"
    options: ["The device takes over the bus and moves the whole block in one burst while the processor idles", "The disk drive is faster than the processor and needs no bus", "The processor copies each byte faster when the bus is idle", "DMA removes the need for memory"]
    answer: 0
    explain: "With DMA the peripheral takes control of memory and writes all its data in one burst. Without it, the processor handles each byte through a request-and-reply for all 512 bytes."
  - type: choice
    prompt: "Which signal does a peripheral assert to ask the processor for the bus, and what does the processor answer with?"
    options: ["BUS REQUEST; the processor replies with BUS GRANT", "BUS GRANT; the processor replies with BUS REQUEST", "RESET; the processor replies with a clock pulse", "NMI; the processor replies with an interrupt acknowledge"]
    answer: 0
    explain: "The peripheral asserts /BUSREQ. When the processor completes the present instruction cycle and no higher-level interrupts are pending, it sends /BUSGRA (bus grant)."
  - type: choice
    prompt: "While a DMA transfer owns the bus, what is the processor's connection to the external bus?"
    options: ["Tri-stated, so the processor idles or runs from its cache", "Driving the address lines to zero", "Driving the data lines high", "Disconnected from the power supply"]
    answer: 0
    explain: "The processor places its memory interface in a tri-state condition and waits for the peripheral to release the bus. Two devices driving the same lines at once would be bus contention."
  - type: choice
    prompt: "When does a processor grant the bus?"
    options: ["After it finishes the current instruction cycle and no higher-level interrupt is pending", "Immediately, even in the middle of a bus cycle", "Only when RESET is asserted", "Only after the peripheral has sent all of its data"]
    answer: 0
    explain: "The grant waits for the present instruction cycle to complete and for any higher-priority interrupts to be served, so a bus cycle is never cut in half."
card:
  front: "How does a DMA transfer work (the handshake)?"
  back: "Peripheral asserts BUS REQUEST; the processor finishes its current cycle (no higher interrupt pending), tri-states its bus and sends BUS GRANT; the peripheral moves the block directly to or from memory; when BUSREQ goes away the processor takes the bus back."
glossary:
  - { term: "DMA", def: "Direct memory access: a peripheral takes over the bus and transfers a block to or from memory while the processor idles." }
  - { term: "Handshake", def: "An action that expects a response to show the action was accepted, such as BUS REQUEST then BUS GRANT." }
---

## Learn

The processor, memory and peripherals share the same buses, so a disk drive with data for memory competes with the processor for the only path. Two ways to move 512 bytes:

1. **Through the processor:** the processor asks for byte after byte, 512 request-and-reply exchanges.
2. **DMA:** the peripheral asks for the bus once and moves the whole block itself.

The **handshake**:

1. The peripheral asserts **BUS REQUEST (/BUSREQ)**.
2. The processor finishes its present instruction cycle (and any pending higher-level interrupt) and sends **BUS GRANT**, tri-stating its memory interface.
3. The peripheral writes or reads memory directly, in one burst.
4. When the peripheral drops /BUSREQ, the processor takes the bus back.

While it waits, the processor **idles or continues from its internal cache**, so with large on-chip caches it loses almost nothing.

## Worked example

*Count the messages the processor and a disk exchange to move a 512-byte block in each of the reading's two scenarios (a calculation from the scenarios, not a figure from the reading).*

1. Through the processor: every byte needs a request ("gimme the next one") and a reply ("here it is"), so about 2 x 512 = **1,024** messages.
2. With DMA: one **bus request**, one **bus grant** and one **bus acknowledge** set it up, the disk writes all 512 bytes in a burst, and it signals that it is off the bus: **a handful of messages**.
3. The saving grows with the block size, and during the burst the processor can run from its cache.

## Try it

*Put these in order: bus grant, bus request, data transferred, processor takes the bus back.*

???

**Bus request, bus grant, data transferred, processor takes the bus back.**
