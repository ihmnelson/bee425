---
track: shared
title: "Software is not an afterthought"
summary: "Plan the software with the hardware; modular code and test stubs let you start before the hardware is done."
needs: [design-phases]
sources:
  - { type: slide, ref: "L1 s52", quote: "Don’t consider the software to be an afterthought" }
  - { type: slide, ref: "L1 s52", quote: "Software is a notorious time-suck" }
  - { type: slide, ref: "L1 s52", quote: "Write a function that returns a representative hardware" }
checks:
  - type: choice
    prompt: "A teammate says 'I can't start the software until the hardware is done'. What does the lecture answer?"
    options: ["That is not true: write modular test software that looks like hardware to your program", "They are right", "Buy more hardware", "Skip the software"]
    answer: 0
    explain: "If you plan the software modularly you can write test code that looks like hardware. Example: write a function that returns a representative hardware value for an A/D read and let the rest of your code process it."
  - type: choice
    prompt: "You found **driver code on the internet**. What does the lecture say?"
    options: ["You still must understand how it works", "Use it without reading it", "Never use internet code", "Rewrite it in assembly"]
    answer: 0
    explain: "Even if you found driver code on the internet, you had better understand how it works."
  - type: choice
    prompt: "What language do **Arduinos** speak, according to the lecture?"
    options: ["A dialect of C++, not Java", "Java", "Python", "Pascal"]
    answer: 0
    explain: "Arduinos speak a dialect of C++, not Java. If you haven't learned C or C++, you are in for a crash course."
card:
  front: "How should you treat software in a hardware project?"
  back: "Plan it from the start (it is a notorious time-sink). Write it modularly with stub functions returning representative hardware values so you can test before the hardware exists. Understand any driver code you borrow. Arduino code is a C++ dialect."
glossary: []
---

## Learn

Designing an embedded system needs **software and hardware that work together**. Do not treat the software as an afterthought:

- Software is a **notorious time-suck**; without planning, the hardware will not work because of buggy software.
- Even code you found online must be **understood**.
- "I can't start the software until the hardware is done" is false. If the software is modular you can write **test software that looks like hardware** to your program. Example: reading an A/D converter: write a function that returns a representative value, and let the rest of the code process it; swap in the real read later.
- Arduinos use a dialect of **C++**, not Java.

## Worked example

*Your temperature controller's firmware must read an ADC that does not exist yet. How do you start?*

1. Define `read_adc()` returning a 10-bit count.
2. For now make it return a fixed, or scripted, value such as 512.
3. Write and test the filtering and control code against it; replace the stub with the real driver when the board arrives.

## Try it

*Why is that approach better than waiting for the board?*

???

You find software bugs before hardware bugs can hide them, and when the hardware arrives only the small driver function changes, so the schedule is shorter and the code is already tested.
