---
track: shared
title: Microprocessor versus microcontroller
summary: A microprocessor needs support circuitry; a microcontroller has the peripherals on the same chip.
needs: []
sources:
  - { type: slide, ref: "L3 s106", quote: "requires additional support circuitry to function" }
  - { type: slide, ref: "L3 s106", quote: "A microprocessor plus additional peripheral support devices integrated into a single package" }
  - { type: slide, ref: "L3 s107", quote: "Functional blocks are located on the Printed Circuit Board" }
checks:
  - type: choice
    prompt: "Which statement best separates a **microcontroller** from a microprocessor?"
    options: ["A microcontroller integrates peripherals (serial ports, timers, A/D) with the processor in one package", "A microcontroller is always faster", "A microprocessor has no memory interface", "A microcontroller cannot run programs"]
    answer: 0
    explain: "A microprocessor is the CPU alone and needs additional support circuitry. A microcontroller is a microprocessor plus peripheral devices (ports, timers, converters, and so on) in a single package."
  - type: choice
    prompt: "Which of these is a **microprocessor** (not a microcontroller) from the lecture's examples?"
    options: ["MC68000", "Arduino", "TIVA TM4C123", "Raspberry Pi Pico"]
    answer: 0
    explain: "The lecture lists MC68000, Z80, RISC-V and ARM cores as microprocessors; Arduino, Raspberry Pi and TIVA are microcontrollers."
  - type: choice
    prompt: "In a microprocessor-based system, where do the program memory, data storage, I/O and timers sit?"
    options: ["On the printed circuit board, outside the processor", "Inside the processor's silicon", "Only in software", "In the power supply"]
    answer: 0
    explain: "In a microprocessor-based system those functional blocks are on the PCB; in a microcontroller they are integrated with the processor core on the chip."
card:
  front: "Microprocessor versus microcontroller?"
  back: "Microprocessor: the CPU only; memory, I/O and timers are separate chips on the PCB. Microcontroller: a microprocessor core plus peripherals (serial/parallel ports, timers, A/D and D/A, and so on) integrated in one package."
glossary:
  - { term: "Microcontroller", def: "A microprocessor plus peripheral support devices integrated into a single package." }
---

## Learn

A **microprocessor** is an integrated circuit that forms the central processing unit of a computer or embedded controller, but **requires additional support circuitry** to function. Examples in the lecture: the MC68000, Z80, RISC-V, and the ARM cores inside the FPGA on a DE-1 SoC board.

A **microcontroller** is a microprocessor **plus peripheral support devices integrated into one package**. The peripherals can include serial and parallel ports, Ethernet, A/D and D/A converters, interval and watchdog timers, event counters, a real-time clock, and other local processors. Examples: Arduino, Raspberry Pi, TIVA.

The difference is where the blocks live. In a microprocessor system, program memory, data storage, serial and parallel I/O, timers and converters are **on the printed circuit board**. In a microcontroller they are **integrated with the processor core on the silicon chip**.

## Worked example

*You need a processor with a UART, a timer and 256 KB of flash in one package. Microprocessor or microcontroller?*

1. A UART (serial port), timer and on-chip flash are exactly the peripherals the lecture lists for a microcontroller.
2. A bare microprocessor would need each of them as a separate chip or circuit on the PCB.
3. So choose a **microcontroller**, such as the TIVA TM4C123 that the lecture describes (256 KB of flash, 8 UARTs and a number of timers).

## Try it

*A design uses an MC68000 with a separate ROM, RAM and serial chip. Which kind of system is that?*

???

A **microprocessor-based system**: the processor core is separate and the memory and I/O are other chips on the board.
