---
track: shared
title: Address, data and control buses
summary: The address bus is one-way, the data bus is two-way, and the control bus is a mix.
needs: [memory-decoding.address-lines]
sources:
  - { type: slide, ref: "L3 s110", quote: "Unidirectional: All signals go from the processor to memory" }
  - { type: slide, ref: "L3 s110", quote: "Bidirectional: Data may travel to or from microprocessor and memory" }
  - { type: slide, ref: "L3 s110", quote: "Heterogeneous: Signals have different functions" }
checks:
  - type: choice
    prompt: "True or false: **only the address bus** of a microprocessor is bidirectional."
    options: ["False. The address bus is unidirectional; the data bus is the bidirectional one", "True", "False. All three buses are unidirectional", "True, but only on the 68000"]
    answer: 0
    explain: "The address bus is unidirectional (every address signal goes from the processor to memory). The data bus is bidirectional because data travels both to and from memory. The control bus mixes outputs, inputs and bidirectional signals."
  - type: choice
    prompt: "True or false: of the three major buses, **only the data bus is completely bidirectional**."
    options: ["True", "False. The address bus is also bidirectional", "False. The control bus is completely bidirectional", "False. No bus is bidirectional"]
    answer: 0
    explain: "The address bus is one-way and the control bus is a collection of different signals (some outputs, some inputs, some either), so only the data bus is entirely bidirectional."
  - type: choice
    prompt: "Which of these is a **status and control** signal?"
    options: ["RESET", "A0", "D7", "The address bus"]
    answer: 0
    explain: "The slide lists RESET, INTERRUPT, READ, WRITE and ADDRESS VALID as examples of control and housekeeping signals. A0 is an address line and D7 a data line."
  - type: choice
    prompt: "Why is a **tri-state or bidirectional** data bus needed but not an address bus?"
    options: ["Data flows both ways, while addresses only go out from the processor", "Addresses are longer", "Data is slower", "Addresses are only used in the 68000"]
    answer: 0
    explain: "A read brings data in and a write sends data out over the same lines; an address always comes from the processor."
card:
  front: "Which of the three buses are unidirectional, bidirectional, or mixed?"
  back: "Address bus: unidirectional (processor to memory). Data bus: bidirectional. Status and control bus: heterogeneous, with different signals (RESET, INTERRUPT, READ, WRITE, ADDRESS VALID) that may be input, output or both."
glossary:
  - { term: "Data bus", def: "The lines that carry the information written to, or read from, memory or I/O; bidirectional." }
  - { term: "Status and control bus", def: "Control and housekeeping signals with different functions, which may be input, output or both." }
---

## Learn

Every microprocessor has three groups of signals, plus clock, power and ground:

| Bus | Carries | Direction |
|---|---|---|
| **Address bus** (A0 to An, with 10 <= n <= 35) | Which memory or I/O location is wanted; addressable memory = 2^n bytes | **Unidirectional**: all signals go from the processor to memory |
| **Data bus** (D0 to Dn, with 4 <= n <= 255) | The information written to or read from memory or I/O | **Bidirectional**: data may travel to or from the processor |
| **Status and control bus** | Control and "housekeeping" signals such as RESET, INTERRUPT, READ, WRITE, ADDRESS VALID | **Heterogeneous**: signals have different functions, and may be input, output or both |

So the address bus is the only strictly one-way bus; the data bus is **completely bidirectional**; the control bus is a **mix**.

## Worked example

*A processor has a 24-bit address bus and an 8-bit data bus. How many lines are in each bus, and how many bytes can it address?*

1. Address bus: 24 lines, A0 to A23.
2. Data bus: 8 lines, D0 to D7.
3. Addressable memory = 2^24 = **16,777,216 bytes (16 MB)**. The data width does not change that.

## Try it

*A signal called ~WR goes from the processor to the memory only. Which bus does it belong to, and is it input or output?*

???

It is a **control** signal (a write strobe) and an **output** of the processor.
