---
track: shared
title: "What makes an embedded system different, and how it gets built"
summary: "Dedicated, real-time, cost- and power-sensitive systems built with compile, assemble and link; performance failures are time-critical or time-sensitive."
needs: []
sources:
  - { type: slide, ref: "L11 s496", quote: "Have real-time performance constraints" }
  - { type: slide, ref: "L11 s496", quote: "Software failure can be life-threatening" }
  - { type: slide, ref: "L11 s499", quote: "Time critical failures: System won’t work at all" }
  - { type: slide, ref: "L11 s499", quote: "Time sensitive failures: System works, but not" }
checks:
  - type: choice
    prompt: "A system works but misses its performance specification. What kind of failure is this, in the lecture's terms?"
    options: ["A time-sensitive failure (it works, but not up to the requirements)", "A time-critical failure (it won't work at all)", "A power failure", "A compile error"]
    answer: 0
    explain: "Time-critical failures mean the system won't work at all; time-sensitive failures mean it works but not up to the requirements specification. Other failures include inadequate resources under full load, such as malloc errors, and rare low-duty-cycle failures (about once a week or less)."
  - type: choice
    prompt: "Which of these is a characteristic of an **embedded** system compared with a desktop?"
    options: ["Dedicated to a specific task, real-time constraints, cost sensitive, with fewer resources and often all code in ROM", "More memory than a desktop", "Always runs Windows", "No power limits"]
    answer: 0
    explain: "From the lecture: dedicated tasks; over 300 processor types; cost-sensitive; real-time constraints; used with an RTOS; software failure can be life-threatening; power limits; wide environmental range; fewer resources; code possibly in ROM; specialized tools; possibly on-chip debug resources."
  - type: choice
    prompt: "In the embedded software build flow, what does the **linker** produce from relocatable object modules?"
    options: ["An absolute object module (plus a link map) that a device programmer or target loads", "A source listing", "A C file", "A library directory"]
    answer: 0
    explain: "C/C++ sources go through the compiler and assembly through the assembler to relocatable object modules; the linker (with a linker command file and libraries) produces the absolute object module and the link map used by the target development system and device programmer."
card:
  front: "How do embedded systems differ, and what are the failure types?"
  back: "Dedicated, real-time, cost- and power-sensitive, fewer resources, often ROM, special tools. Build: compile/assemble to relocatable objects, link (with libraries) to an absolute module and link map. Failures: time-critical (won't work), time-sensitive (works but below spec), resource exhaustion (malloc), rare low-duty-cycle bugs."
glossary: []
---

## Learn

**Why embedded systems differ from desktops:** dedicated to a task or tasks; a rich variety of processors (over 300 types); cost-sensitive designs; **real-time performance constraints**; often used with a **real-time operating system (RTOS)**; **software failure can be life-threatening**; power-consumption limits; a wide environmental range; **fewer system resources**; code may all be in **ROM**; **specialized design tools**; possibly on-chip debug resources.

**Embedded software development.** C or C++ source goes through a **compiler** (with include files); assembly source through the **assembler**; both give **relocatable object modules** (an optional librarian makes a **user library**). The **linker** combines them with libraries under a linker command file and produces an **absolute object module** and a **link map**, which goes to the **device programmer** or the **target development system**.

**When are you done?** For many developers it is when the system seems to work and does not crash regularly. But if the performance does not meet requirements, how do you decide how to improve it? Two types of performance failure: **time-critical** (the system won't work at all) and **time-sensitive** (it works, but not to specification). Other failures: inadequate resources under full load (such as `malloc()` errors) and **low-duty-cycle failures** (about one per week or less), which are the hardest to catch.

**Hardware/software integration** starts when the hardware passes the smoke test and is turned over to the software team: load the image, validate the hardware against the software design, integrate, find the bugs, and test for performance and reliability.

## Worked example

*A motor controller misses a deadline once every few days. Which failure type is that, and why is it hard?*

1. It works most of the time, so it is a **time-sensitive** (or low-duty-cycle) failure rather than time-critical.
2. It is rare (low duty cycle), so a debugger that stops the system or an occasional glance will not see it.
3. You need a tool that records in real time and triggers on the event.

## Try it

*What does the linker's 'link map' tell you?*

???

Where each piece of the program landed in memory (addresses of functions, data and sections), which the debugger and trace tools use to show symbolic names for addresses.
