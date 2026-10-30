---
track: shared
title: "Watchdog timers"
summary: "A timer that must be retriggered regularly; if the software hangs it resets the processor."
needs: ["optical-isolation"]
sources:
  - { type: slide, ref: "L10 s474", quote: "Watchdog timer monitors the computer operation and will issue a RESET or NMI" }
  - { type: slide, ref: "L10 s474", quote: "Watchdog timer depends upon the code executing in a loop with a predictable loop" }
  - { type: slide, ref: "L10 s474", quote: "Computer hasn’t issued a reset pulse to the timer in designated time interval" }
  - { type: slide, ref: "L10 s474", quote: "Should you connect the watchdog timer output to the RESET input or to the" }
checks:
  - type: choice
    prompt: "What does a **watchdog timer** do?"
    options: ["Monitors the system: if the software does not retrigger it within the set time (or the supply goes out of range) it issues RESET or NMI", "Counts instructions", "Measures power", "Debounces switches"]
    answer: 0
    explain: "It guarantees the processor will not lock up: a software glitch cannot cause a disaster because the watchdog resets the system when the program stops 'kicking' it."
  - type: choice
    prompt: "What does the software have to do for the watchdog to work?"
    options: ["Run in a loop with a predictable cycle time and write the retrigger output bit regularly", "Never use interrupts", "Disable the clock", "Nothing"]
    answer: 0
    explain: "The watchdog depends on code that executes in a loop with a predictable loop time, which retriggers the timer through an output port bit."
  - type: choice
    prompt: "The lecture asks: connect the watchdog to RESET or to NMI? What is the sound answer?"
    options: ["RESET: a hung processor may have corrupted state or be stuck with interrupts masked or in a bad handler, so only a full reset reliably restores it (NMI can be taken only if the processor still runs its vector table)", "NMI always", "Neither", "Either, they are identical"]
    answer: 0
    explain: "This is our own analysis of the lecture's question, not the slide's answer: after a software fault the processor may be in an unknown state, and an NMI handler relies on the very software and stack that may be corrupt. RESET puts the machine in a known state. (An NMI is sometimes used first to log the fault, then reset.)"
card:
  front: "What is a watchdog timer?"
  back: "A timer that must be retriggered (by an output bit from the main loop) within a set time, otherwise it issues RESET or NMI; it also resets on supply-voltage faults. It depends on code with a predictable loop time and guarantees that a malfunction cannot leave the processor locked up offline. RESET is the more reliable output."
glossary:
  - { term: "Watchdog timer", def: "A hardware timer that resets the processor if it is not periodically retriggered by the software." }
---

## Learn

Industrial and mission-critical embedded systems cannot be allowed to fail because of software faults. A **watchdog timer** monitors the operation of the computer and issues a **RESET or NMI** when:

- the power-supply voltage goes out of range, or
- the computer has not issued a **retrigger pulse** to the timer within the designated time.

It depends on the code **executing in a loop with a predictable cycle time** that writes the retrigger bit (an output port bit) each time around. It **guarantees that the processor will not lock up** and go offline whatever caused the malfunction.

The lecture asks whether to connect the output to **RESET or NMI**. The slides do not answer; our analysis is that RESET is more reliable because a malfunctioning processor may have corrupt state, so a software NMI handler cannot be trusted.

## Worked example

*The main loop takes 10 ms and kicks the watchdog every pass. The timeout is 100 ms. What happens if the code hangs in an endless loop?*

1. No retrigger arrives.
2. After 100 ms the watchdog times out and asserts RESET.
3. The system restarts in a known state instead of staying dead.

## Try it

*Why must the timeout be longer than the main loop time?*

???

If the timeout were shorter than the loop, the watchdog would reset a healthy system before the code had a chance to retrigger it.
