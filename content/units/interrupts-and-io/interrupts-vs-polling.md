---
track: shared
title: Interrupts versus polling
summary: An interrupt makes the processor run a service routine and then resume; polling makes the program ask each device in a loop.
needs: []
sources:
  - { type: handout, ref: "ch12 Interrupts", quote: "When asynchronous events, both internal and external to the processor, need to grab the attention of the processor, they do it by generating an interrupt." }
  - { type: handout, ref: "ch12 Interrupts", quote: "In a polled system, the computer periodically checks each event that might require servicing as part of its regular program code." }
  - { type: handout, ref: "ch12 Interrupts", quote: "A burglar alarm controller is a perfect example of a polled system." }
  - { type: handout, ref: "ch12 I/O ports", quote: "it takes 10 bits to transmit an 8-bit character, so 50K baud is really 5000 bytes per second of actual data flow" }
checks:
  - type: choice
    prompt: "What does an interrupt do to the program that is running?"
    options: ["It makes the processor run a service routine, then resume the program where it left off", "It restarts the program from its first instruction with the registers cleared", "It pauses the program until the user presses a key to continue", "It copies the program to a second processor and keeps running"]
    answer: 0
    explain: "An interrupt forces the processor to stop its normal execution and run an interrupt service routine (ISR). When the ISR completes, execution resumes where it left off. Restarting from the beginning is what RESET does."
  - type: choice
    prompt: "A burglar-alarm controller runs a continuous loop that checks every sensor in turn to see whether it has tripped. What is this structure called?"
    options: ["Polling, because the program asks each source in a loop", "Interrupt-driven, because each sensor calls its own service routine", "Direct memory access, because the sensors write into memory", "Exception handling, because each trip is a program fault"]
    answer: 0
    explain: "In a polled system the program itself checks each event source as part of its regular code. The reading calls the alarm controller a perfect example and the loop a polling loop."
  - type: choice
    prompt: "A dial-up modem at 50K baud sends 10 bits per 8-bit character, so about 5,000 characters per second. A 1 GHz computer averages one instruction per 2 clock pulses and polls the UART for the whole time one character is sent. About how many instructions could it have executed instead?"
    options: ["About 100,000", "About 5,000", "About 200,000", "About 1,000,000"]
    answer: 0
    explain: "One character takes 1/5000 s = 200 microseconds, which is 200,000 clock pulses at 1 GHz. At one instruction per 2 clocks that is about 100,000 instructions. (200,000 is the clock count, not the instruction count.)"
  - type: choice
    prompt: "When is polling still a sensible design?"
    options: ["When the application naturally fits a loop of checks, as in an alarm controller", "Never; an interrupt is always the better choice", "Only when the processor has no clock", "Only when events arrive faster than one per instruction"]
    answer: 0
    explain: "The reading says polling is still a very acceptable way to program a computer when the application lends itself to a polled structure. It wastes time when the processor could be doing other work between events."
card:
  front: "Interrupts versus polling: what is the difference and the cost of polling?"
  back: "Interrupt: an asynchronous event forces the processor to run an ISR, then resume. Polling: the program checks each device in a loop, so the processor does little else (waiting for a 5,000 characters-per-second UART at 1 GHz wastes about 100,000 instructions per character)."
glossary:
  - { term: "Interrupt", def: "An asynchronous event that makes the processor stop its normal program, run a service routine, and then resume." }
  - { term: "ISR", def: "Interrupt service routine: the code run in response to an interrupt." }
  - { term: "Polling", def: "Periodically checking each event source from the program's own loop instead of waiting for an interrupt." }
---

## Learn

The real world does not run at the processor's clock rate. Its events are **asynchronous**: a key press, a byte arriving at a serial port or a sensor trip can come at any moment and may be lost if not serviced in time. The processor has two ways to notice them.

**Interrupts.** The event raises an interrupt. The processor stops what it is doing, runs an **interrupt service routine (ISR)**, and then **returns to where it left off**. Think of a phone ringing during dinner: you answer, then go back to eating.

**Polling.** There is no ringer, so you pick up the phone every few seconds to see if anyone is there. In a computer the program **checks each device in a loop** (a *polling loop*). That is fine when the job is naturally a loop of checks, such as an alarm controller visiting each sensor, but the processor then does almost nothing else.

The cost is easy to see with a serial port. At 50K baud, 10 bits per character gives about **5,000 characters per second**. A 1 GHz processor spends **200,000 clock pulses** per character, which is about **100,000 instructions** at one instruction per two clocks, and a polling loop spends all of them asking "is it ready yet?".

## Worked example

*A UART delivers 1,200 characters per second. A 20 MHz processor needs 4 clock pulses per instruction on average. How many instructions pass between characters if the program only polls?*

1. Time per character = 1/1,200 s.
2. Clock pulses per character = 20,000,000 / 1,200 = **16,667**.
3. Instructions = 16,667 / 4 = **about 4,167**.

All of those are spent in the polling loop. With an interrupt, the same time is available for other work.

## Try it

*A sensor is read by polling. It produces a new value 400 times per second, and the processor runs 8 MHz at 2 clock pulses per instruction. How many instructions can run between two values?*

???

8,000,000 / 400 = 20,000 clock pulses per value, and 20,000 / 2 = **10,000 instructions**. A polling loop would burn nearly all of them waiting; an interrupt would let the program use them.
