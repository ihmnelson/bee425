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
    prompt: "What does a watchdog timer do?"
    options: ["If the software does not retrigger it in time, it issues RESET or NMI", "It counts the instructions executed and reports a total", "It measures the supply power the board consumes", "It debounces the switches that feed the processor"]
    answer: 0
    explain: "It guarantees the processor will not lock up: a software glitch cannot cause a disaster because the watchdog resets the system when the program stops 'kicking' it."
  - type: choice
    prompt: "What does the software have to do for the watchdog to work?"
    options: ["Run in a loop with a predictable cycle time and write the retrigger bit regularly", "Never use interrupts, since they disturb the retrigger", "Disable the clock whenever the watchdog fires", "Nothing: the watchdog works on its own"]
    answer: 0
    explain: "The watchdog depends on code that executes in a loop with a predictable loop time, which retriggers the timer through an output port bit."
  - type: choice
    prompt: "Should a watchdog timer be connected to RESET or to NMI?"
    options: ["RESET: a hung processor may have interrupts masked, so only a reset restores it", "NMI: it saves the state and lets the program carry on", "Neither: the watchdog should only light a fault lamp", "Either: they both restore the processor identically"]
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
