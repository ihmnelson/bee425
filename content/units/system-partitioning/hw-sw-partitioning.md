---
track: shared
title: "Hardware versus software partitioning"
summary: "Dedicated hardware is fast, inflexible and costly; software is slower, flexible and cheaper; the decision is iterative."
needs: ["design-spec-stakeholders"]
sources:
  - { type: slide, ref: "L10 s487", quote: "Partitioning the design: Deciding what goes in hardware and what is" }
  - { type: slide, ref: "L10 s488", quote: "Hardware is fast, but adds real cost to each product shipped" }
  - { type: slide, ref: "L10 s489", quote: "Dedicated hardware is fast, inflexible and expensive" }
  - { type: slide, ref: "L10 s490", quote: "Only 50% of ASIC’s work the first time" }
  - { type: slide, ref: "L10 s491", quote: "Bugs are easily dealt with, even in the field!" }
checks:
  - type: choice
    prompt: "Which description of the three implementation styles is right?"
    options: ["Dedicated hardware: fast, inflexible, expensive. Reconfigurable hardware: fast, flexible, more expensive. Software: slower, more flexible, cheaper", "Dedicated hardware: slow, flexible, cheap. Reconfigurable hardware: slow, inflexible. Software: fast, inflexible, expensive", "All three styles are equal in speed and flexibility, differing only in cost", "Software is the fastest and the most expensive; dedicated hardware the slowest and cheapest"]
    answer: 0
    explain: "This is the 'duality' slide: partitioning is usually dictated by speed and cost, and the laser-printer example splits data formatting, mechanical control, error handling and the laser engine between the two."
  - type: choice
    prompt: "Which is a pro of a hardware solution?"
    options: ["It can be 10x, 100x or more faster, with a simpler processor and less software", "It is easy to change in the field after shipping", "It needs no up-front NRE or tooling cost", "It uses only cheap, widely available tools"]
    answer: 0
    explain: "Hardware PROs: big speed-ups, less processor complexity, less software design time. CONs: bill-of-materials cost, circuit complexity (power, board space, RFI), NRE of about $100K, about a 3-month cycle, little margin for error (only 50% of ASICs work the first time), IP royalties, tools at $50K-$100K per seat."
  - type: choice
    prompt: "Which is a pro of a software solution?"
    options: ["No extra parts or power, field-fixable bugs, cheap tools, insensitive to volume", "It is always faster than a hardware implementation", "It needs no development time or schedule planning", "It carries no schedule risk, because code cannot run late"]
    answer: 0
    explain: "Software CONs: much lower performance, so a bigger processor, more memory and power; an RTOS may be needed (royalties); schedule uncertainty and a larger team add cost."
  - type: choice
    prompt: "Why is the hardware/software partitioning decision iterative?"
    options: ["Mistakes here give an inferior product, so you may repartition several times during design", "It never changes once the first review is done", "The compiler sets the partition after the code is written", "Marketing fixes the partition at the start of the project"]
    answer: 0
    explain: "EEs lean toward hardware and software developers toward software; the right split emerges by iterating."
card:
  front: "How do you decide what goes in hardware and what in software?"
  back: "Hardware: fast (10x-100x), simpler processor, but BOM cost, complexity, NRE ~$100K, ~3 months, ASIC 50% first-pass success, royalties, costly tools. Software: no BOM impact, fixable in the field, cheap tools, volume-independent, but slower, needs more processor/memory/power, schedule risk. Decide by speed and cost; iterate."
glossary:
  - { term: "Partitioning", def: "Deciding which parts of an algorithm are implemented in hardware and which in software." }
  - { term: "NRE", def: "Non-recurring engineering: one-time development cost." }
---

## Learn

**Partitioning** is deciding what goes in hardware and what in software. Embedded processors closely link them, so a significant effort goes into splitting the algorithm; mistakes here can produce an inferior product, and the process is **iterative**. Hardware people lean toward hardware, software people toward software.

**Hardware is fast but adds real cost to each product; software is slow but very flexible**, and its real cost (development time, performance) is often hidden.

| | Hardware | Software |
|---|---|---|
| Speed | 10x, 100x or more | much lower |
| Per-unit cost | adds to the BOM, power, board space, RFI | none |
| Up-front cost | NRE about $100K, tools $50K-$100K per seat | cheap tools |
| Schedule | about 3 months | less certain |
| Risk | only 50% of ASICs work first time; royalties | bugs fixable even in the field |
| Volume | cost spread over volume | insensitive to volume |

The lecture's example is a laser printer engine: data formatting, mechanical control, laser control and error handling around the algorithm.

## Worked example

*A function must run 50 times faster than the CPU can manage. Hardware or software?*

1. 50x is beyond what software can reach without a much bigger processor.
2. Dedicated hardware (an ASIC or FPGA block) gives 10-100x.
3. Then check the cost, NRE and risk against volume (next lesson concept).

## Try it

*Name one reason a team might prefer software even if hardware would be faster.*

???

Software can be fixed in the field, costs nothing in the bill of materials and has cheaper tools; hardware has NRE, schedule and first-pass-success risk.
