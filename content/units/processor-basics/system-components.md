---
track: shared
title: Parts of a microprocessor system
summary: Core, memory interface, control interface, memory, I/O and glue logic.
needs: [functional-blocks]
sources:
  - { type: slide, ref: "L3 s122", quote: "Clocks, RESET, Interrupt controller" }
  - { type: slide, ref: "L3 s123", quote: "Random logic necessary to interface various functional blocks and devices" }
  - { type: slide, ref: "L3 s123", quote: "Can be read-mostly memory (FLASH)" }
checks:
  - type: choice
    prompt: "What is **glue logic**?"
    options: ["Random logic needed to interface the functional blocks and devices (NAND gates, PLDs, CPLDs, FPGAs)", "The firmware that boots the board", "The adhesive used on the PCB", "The clock distribution network"]
    answer: 0
    explain: "Glue logic is the random logic necessary to interface the various blocks. It can be ordinary gates such as quad NAND or hex NOT, or programmable logic (PLDs, CPLDs and FPGAs)."
  - type: choice
    prompt: "Which memory type is described as **read-mostly**?"
    options: ["Flash", "SRAM", "Mask ROM", "A register"]
    answer: 0
    explain: "The lecture lists RAM, ROM (read-only), flash (read-mostly) and synchronous burst-access dynamic RAM (SDRAM)."
  - type: choice
    prompt: "The **control interface** of a microprocessor system provides..."
    options: ["Clocks, RESET, the interrupt controller and other housekeeping", "The storage of programs", "The arithmetic", "Analog conversion"]
    answer: 0
    explain: "The core does comparisons, arithmetic and logic; the memory interface reads and writes memory; the control interface handles clocks, RESET, interrupts and other housekeeping."
card:
  front: "What are the parts of a microprocessor system?"
  back: "Microprocessor core (arithmetic, logic, registers), memory interface, control interface (clocks, RESET, interrupts), memory (RAM, ROM, flash, SDRAM), I/O (ASICs, timers, ports, converters) and glue logic."
glossary:
  - { term: "Glue logic", def: "Random logic that interfaces the functional blocks and devices of a system; gates or programmable logic." }
---

## Learn

A microprocessor system has these parts:

- **Microprocessor core**: all comparisons, arithmetic and logical operations; registers hold local data.
- **Memory interface**: reads instructions and data and writes new data.
- **Control interface**: clocks, RESET, the interrupt controller and other housekeeping.
- **Memory**: holds instructions, data and variables. It can be **RAM**, **ROM** (read-only), **flash** (read-mostly) or **SDRAM** (synchronous burst-access dynamic RAM).
- **I/O**: specific-function devices such as ASICs, timers, Bluetooth, LAN, I/O ports and A/D and D/A converters.
- **Glue logic**: random logic to interface the blocks: quad NAND or hex NOT gates, or PLDs, CPLDs and FPGAs.

## Worked example

*Classify each part of a small board: a 68000, an EPROM, a 74138 decoder, a UART and a reset button circuit.*

1. 68000: **microprocessor core** (with its memory and control interfaces).
2. EPROM: **memory**.
3. 74138 decoder: **glue logic** (it selects chips from address bits).
4. UART: **I/O**.
5. Reset circuit: part of the **control interface** (RESET).

## Try it

*Which part of the system would an FPGA that decodes addresses belong to?*

???

**Glue logic**: programmable logic that interfaces the other blocks.
