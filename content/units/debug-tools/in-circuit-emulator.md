---
track: shared
title: "The in-circuit emulator: run control, overlay memory and real-time trace"
summary: "The premier tool: absolute control of the processor, substitute memory with attributes, and a built-in trace analyzer."
needs: [debug-monitor-rom-emulator, logic-analyzer-tool]
sources:
  - { type: slide, ref: "L11 s520", quote: "ICE provides absolute control of the processor under all conditions" }
  - { type: slide, ref: "L11 s522", quote: "Guarded ( break on write )" }
  - { type: slide, ref: "L11 s526", quote: "Important to understand that the processor isn’t stopped" }
  - { type: slide, ref: "L11 s530", quote: "Dedicated logic analyzer within the emulator" }
  - { type: slide, ref: "L11 s541", quote: "Can be extremely expensive ( ~ $20K )" }
checks:
  - type: choice
    prompt: "Which three functions does an ICE integrate?"
    options: ["Run control, overlay memory and real-time trace", "Compiler, linker and loader", "Clock, reset and power", "Source, listing and library"]
    answer: 0
    explain: "The ICE integrates run control (peek/poke, registers, single step, breakpoints, disassemble, download), overlay memory (substitute memory mapped anywhere), and real-time trace (a dedicated logic analyzer with symbolic triggers)."
  - type: choice
    prompt: "What is **overlay memory** and what attributes can regions have?"
    options: ["Emulator memory that replaces (overlays) target memory in mapped blocks; attributes include ROM (no writes), guarded (break on write), code or data space, shared (simulated I/O)", "Extra cache", "A copy of the ROM on disk", "Virtual memory"]
    answer: 0
    explain: "Overlay memory saves programming ROMs. It can be mapped in blocks anywhere in the address space (for example in 16K blocks by a very-high-speed mapper RAM), interspersed with target memory, with attributes such as RAM, ROM, GUARDED, NO-MEMORY and coverage."
  - type: choice
    prompt: "How does ICE **run control** stop the processor, and why does it work with unstable target hardware?"
    options: ["A BREAK signal forces an NMI; target NMI and buffers are blocked, shadow ROM with the debug monitor is mapped in, and the processor runs the monitor from emulator memory", "It stops the clock", "It removes power", "It resets the target"]
    answer: 0
    explain: "The processor is not stopped: it executes a debug monitor in emulation 'background' ROM, with the target NMI blocked and the target data buffers disabled, saves its context and waits for commands in a mailbox. The target's state does not matter, so control is guaranteed."
  - type: choice
    prompt: "What are the **disadvantages** of an ICE?"
    options: ["Expensive (about $20K), a new emulator for each new processor, fragile, hard to connect to surface-mount parts, and cached activity is hard or impossible to see", "It cannot trace", "It cannot single step", "It needs no maintenance"]
    answer: 0
    explain: "The ICE is not always cost-effective, is viewed as a complex and fragile instrument, lags early silicon, cannot easily track microcontroller variants, and is hard to connect to surface-mount packages (500-pin BGAs on 0.009 in centres); it is also not the tool of choice for high-level code design."
card:
  front: "What is an ICE and what are its pros and cons?"
  back: "An in-circuit emulator replaces the processor and gives (1) run control with absolute control even when the target is broken (BREAK -> NMI -> shadow monitor in emulator ROM), (2) overlay memory mapped over target memory with ROM/guarded/code/data attributes, (3) real-time trace with symbolic triggers and break on complex sequences. Cons: ~$20K, per-processor, fragile, packages, caches."
glossary:
  - { term: "ICE", def: "In-circuit emulator: a tool that replaces the target processor and gives run control, overlay memory and real-time trace." }
  - { term: "Overlay memory", def: "Emulator memory that substitutes for target memory in mapped regions, with attributes such as ROM or guarded." }
---

## Learn

When a debug monitor cannot work (the processor-to-memory interface is dead, code runs wild, rare events must be seen, or the monitor perturbs the system), the **in-circuit emulator (ICE)** provides **absolute control of the processor under all conditions**. It integrates three things:

1. **Run control** (like a debug kernel): peek/poke memory, modify registers, single step, breakpoints, disassemble, download code. A **BREAK** signal (from the user, an illegal access, a trace event or a breakpoint) forces an **NMI**; the target NMI and data buffers are blocked, emulator ROM is mapped in, the monitor saves the context and loops waiting for commands in a **mailbox**. **The processor isn't stopped**; it is running the monitor from shadow memory.
2. **Overlay memory:** substitute memory mapped in blocks anywhere in the address space (a high-speed mapper RAM selects emulator or target memory), with attributes: **ROM** (no writes), **guarded** (break on write), code or data space, shared (simulated I/O), no-memory, coverage.
3. **Real-time trace:** a **dedicated logic analyzer** inside the emulator with symbolic triggering (using file formats and the link map), linked to hardware breakpoints; records processor pins at the right clock phase; post-processing disassembles and shows C/C++ source lines with the assembly.

Vendors include Hitex, Microtek, SofTec, Lauterbach, Nohau and iSystems. The **ideal emulator** would be non-intrusive (no loading or propagation delay), available with first silicon, compatible with all compilers, rugged, easy and inexpensive.

**Pros:** control is guaranteed independent of target hardware; overlay memory permits tracing code that would run from ROM; traces program flow and filters prefetches. **Cons:** about **$20K**, costly for a team, a new emulator per processor, complex and fragile, availability lags silicon, cannot easily track microcontroller variants, **hard to connect to surface-mount parts** (500-pin BGA, 0.009 in centres), viewing cached activity is difficult or impossible, and it is not the tool for high-level code design.

## Worked example

*A target's ROM is blank and its RAM faulty. Can an ICE still start debugging?*

1. The ICE's run-control monitor and overlay memory are in the emulator, not the target.
2. So the processor can execute from emulator memory even with no working target memory.
3. This is the ICE's advantage over a debug monitor.

## Try it

*Why does the ICE block the target system's NMI during a break?*

???

The break uses the NMI to enter the emulator's monitor; a real NMI from the target would interfere with that entry, so it is blocked while the debug monitor runs.
