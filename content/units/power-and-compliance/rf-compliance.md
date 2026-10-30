---
track: shared
title: "RF emissions and compliance engineering"
summary: "RF emission limits are a major hurdle; design suppression in with slower edges, short clock lines, guard traces and ferrites."
needs: ["cmos-power"]
sources:
  - { type: slide, ref: "L10 s480", quote: "RF emission limits are one of the most difficult engineering hurdles for designers" }
  - { type: slide, ref: "L10 s480", quote: "RF suppression should be designed-in, rather than fixed later" }
  - { type: slide, ref: "L10 s480", quote: "Use spread-spectrum clock oscillators" }
  - { type: slide, ref: "L10 s480", quote: "Run at the slowest acceptable clock speed" }
checks:
  - type: choice
    prompt: "When should RF suppression be handled?"
    options: ["Designed in from the start, not fixed later", "After the product ships", "Only if tested and failed", "Never"]
    answer: 0
    explain: "The lecture: RF emission limits are among the hardest hurdles; RF suppression should be designed in rather than fixed later."
  - type: choice
    prompt: "Which of these reduces emissions, according to the lecture?"
    options: ["Spread-spectrum clocks, avoiding current loops, shielding or guarding clock lines, short clock and bus runs, slower logic families, ferrite cores, slowest acceptable clock, sleep modes", "Faster edges and longer clock lines", "Switching power supplies everywhere", "A single large ground loop"]
    answer: 0
    explain: "Also: microcontrollers and ASICs where possible, shield locally rather than the whole chassis, avoid switching supplies, terminate long traces in their characteristic impedance, and reverse-engineer products that have solved the problem."
  - type: choice
    prompt: "Why do slower logic families (ALS rather than FCT) help emissions?"
    options: ["Faster logic edges put more energy at high frequencies; use the slowest edge rate the timing allows", "They use more power", "They are more accurate", "They have more pins"]
    answer: 0
    explain: "Avoid logic with fast edges: ALS is preferable to FCT if the propagation delays are acceptable."
card:
  front: "List ways to reduce RF emissions."
  back: "Spread-spectrum clocks; avoid current loops; shield or guard-trace clock lines on inner layers; keep clock and bus lines short; slower logic families; use microcontrollers/ASICs; ferrite cores on cables; shield locally; avoid switching supplies; slowest acceptable clock; sleep modes; terminate long traces."
glossary:
  - { term: "RF", def: "Radio frequency." }
---

## Learn

**Compliance** is a design-in issue: **RF emission limits are one of the most difficult engineering hurdles**, and suppression should be **designed in rather than fixed later**. Techniques are usually handed down from experienced designers (companies hire consultants or send engineers to classes). The lecture's list:

- spread-spectrum clock oscillators (spread the RF energy over a range of frequencies),
- avoid current loops,
- shield the clock lines on inner layers or run parallel guard traces,
- avoid long clock lines and long bus runs,
- avoid fast logic edges (ALS preferable to FCT if the delays allow),
- use microcontrollers and ASICs where possible,
- ferrite suppression cores on cables,
- shield locally rather than the whole chassis,
- avoid switching power supplies,
- run at the **slowest acceptable clock speed**,
- use processors with **sleep modes**,
- terminate long traces in their characteristic impedance,
- reverse engineer products that have solved the problem.

## Worked example

*A board's clock harmonics fail an emissions test at 144 MHz. Which two changes from the list are cheapest to try first?*

1. Slow the edges or the clock if timing margin allows (slowest acceptable clock, ALS instead of FCT).
2. Shorten, guard or terminate the clock trace.
3. A ferrite on the cable is next.

## Try it

*Why are emissions harder to fix after the board is built?*

???

The causes are layout choices (loops, clock routing, layer stack) that need a new board to change; only add-ons such as ferrites and shielding remain.
