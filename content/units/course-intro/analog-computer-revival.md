---
track: shared
title: Why analog computers vanished and why they are being revisited
summary: An analog computer is a physical system obeying the same equations as the problem; digital won on programmability and precision, and analog may return as an efficient hybrid.
needs: [analog-computers]
sources:
  - { type: handout, ref: "tsividis Not Your Fathers Analog Computer", quote: "An analog computer is a physical system configured so that it is governed by equations identical to the ones you want to solve." }
  - { type: handout, ref: "tsividis Not Your Fathers Analog Computer", quote: "Essentially, they were too hard to design, build, operate, and maintain." }
  - { type: handout, ref: "tsividis Not Your Fathers Analog Computer", quote: "Each time a digital circuit switches, it consumes energy." }
  - { type: handout, ref: "tsividis Not Your Fathers Analog Computer", quote: "No clock was used" }
  - { type: handout, ref: "tsividis Not Your Fathers Analog Computer", quote: "speedups of a factor of 10 or so were easily achievable" }
checks:
  - type: choice
    prompt: "How does an analog computer solve a problem?"
    options: ["It is a physical system governed by the same equations as the problem; you set initial conditions and let it evolve", "It converts the problem to binary and steps through an algorithm", "It looks up the answer in a table stored in memory", "It guesses an answer and refines it with a clock"]
    answer: 0
    explain: "An analog computer is configured so that its physics matches the equations to be solved. The reading's simple example is a hose and a bucket doing integration: the water in the bucket is the answer."
  - type: choice
    prompt: "Why did analog and hybrid computers disappear in the 1970s?"
    options: ["They were hard to build and run, while digital offered programmability and precision", "They were less accurate at addition than slide rules were", "NASA banned them after the Apollo missions ended", "They needed more transistors than any digital design"]
    answer: 0
    explain: "They needed specially trained staff and could not be integrated on a large scale, while digital computers offered straightforward programmability, ease of storage, high precision and any problem size given enough time, and improved with MOS integrated circuits."
  - type: choice
    prompt: "Why might analog computing return for scientific equations?"
    options: ["Digital switching burns energy, while analog evolves continuously with no clock", "Analog computers are exactly accurate and need no digital partner", "Analog circuits no longer use any transistors at all", "Digital computers cannot store numbers above 32 bits"]
    answer: 0
    explain: "Each digital switch consumes energy, and difficult differential equations need extremely fine time steps. The analog chip had no clock, with voltages and currents evolving continuously."
  - type: choice
    prompt: "The single-chip analog computer solved differential equations to within a few percent. How was that limited accuracy handled when it was too crude?"
    options: ["The approximate result was passed to a digital computer for refinement, giving roughly 10 times speed-up and energy saving", "The result was thrown away and the problem was solved again digitally from scratch", "The chip was run again at a lower voltage", "The error was removed by adding more analog integrators"]
    answer: 0
    explain: "A digital computer starting from a very good initial guess finishes much faster. This hybrid uses analog for fast, low-energy approximation and digital for programming, storage and high precision."
card:
  front: "Why did analog computers disappear and why might they return?"
  back: "Analog computer = a physical system governed by the same equations as the problem. They vanished because they were hard to build, operate and maintain and digital offered programmability, storage and precision. They may return as hybrids: analog gives a fast, low-energy approximation (within a few percent, no clock), digital refines it (about 10x speed-up and energy saving)."
glossary:
  - { term: "Hybrid computer", def: "A computer combining analog circuits for fast, low-energy approximation with digital circuits for programming, storage and precision." }
---

## Learn

An **analog computer** is a physical system set up so that **the same equations govern it as govern the problem**. You impose the initial conditions, let its variables evolve in time, and read the answer. A hose filling a bucket is an integrator.

Early machines were mechanical (wheels and gears, tide predictors, the differential analyzer); from the 1940s there were **electronic** ones, used for missile and aircraft simulation and NASA's Mercury, Gemini and Apollo programs. They faded for two reasons:

- they were **complex, quirky and needed specially trained personnel**;
- digital computers offered **programmability, algorithmic operation, ease of storage, high precision and any size of problem**, and rode the rapid improvement of MOS integrated circuits.

Today the digital approach has a cost: **every switching transistor consumes energy**, and solving hard differential equations needs extremely **fine time steps**, hence enormous numbers of calculations. A modern single-chip analog computer works with **no clock**, continuously, and gives answers **within a few percent**. Passing that answer to a digital computer as an initial guess gave **speed-ups of about 10 times** with similar energy savings. The hybrid keeps the best of both: analog for fast, approximate work; digital for programming, storage and precision.

## Worked example

*An analog chip solves a differential equation to within 3% in 1 ms using 1 mJ. A digital solver from scratch needs 10 ms and 10 mJ for the precise answer. If the analog answer lets the digital solver finish in 1 ms and 1 mJ, what are the hybrid's time and energy? (Illustrative numbers, not from the article.)*

1. Time: 1 ms (analog) + 1 ms (digital refinement) = **2 ms**, five times faster than 10 ms.
2. Energy: 1 mJ + 1 mJ = **2 mJ**, five times less than 10 mJ.
3. The article's reported speed-up for the real chips was about 10 times.

## Try it

*Why can an analog computer not simply replace a digital one for every task, even if it is faster?*

???

Its accuracy is limited (a few percent here), and it lacks the easy programmability, storage and high precision of digital machines, which is why the practical design is a hybrid.
