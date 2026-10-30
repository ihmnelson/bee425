---
track: shared
title: Power planes and bypass capacitors
summary: Planes give low-impedance power; bypass capacitors store charge for fast switching edges.
needs: [pcb-workflow]
sources:
  - { type: slide, ref: "L2 s69", quote: "Bypass capacitors provide charge storage to supply current needs" }
  - { type: slide, ref: "L2 s69", quote: "Rule of thumb: 1 capacitor per 1-2 ICs" }
  - { type: slide, ref: "L2 s69", quote: "Inner two layers are for power and ground" }
checks:
  - type: choice
    prompt: "What is the **job of a bypass capacitor** placed near an IC's power pins?"
    options: ["Store charge to supply the sudden current of fast logic edges", "Convert AC to DC", "Set the clock frequency", "Isolate analog and digital grounds"]
    answer: 0
    explain: "A fast logic edge needs a large instantaneous current to charge the load capacitance. The bypass capacitor supplies that current locally and so reduces voltage spikes on the supply."
  - type: choice
    prompt: "The lecture's rule of thumb for bypass capacitors is about one capacitor per..."
    options: ["1 to 2 ICs", "10 ICs", "The whole board (just one)", "Every pin of every IC"]
    answer: 0
    explain: "Rule of thumb from the slide: 1 capacitor per 1-2 ICs."
  - type: choice
    prompt: "In a typical 4-layer microprocessor board, what do the **inner two layers** hold?"
    options: ["Power and ground planes", "The two signal layers", "The clock only", "Test points"]
    answer: 0
    explain: "The top and bottom layers carry signals; the inner two are the power and ground planes. The planes act as low-impedance sources and sinks and add capacitance (a low-pass effect) while lowering inductance."
card:
  front: "Why do boards use power and ground planes and bypass capacitors?"
  back: "Planes give low-impedance power and return paths, reduce overshoot and undershoot, add capacitance and lower inductance. Bypass capacitors (about 1 per 1-2 ICs) store charge for the current spikes of fast logic edges."
glossary:
  - { term: "Bypass (decoupling) capacitor", def: "A capacitor placed close to an IC's power pins that supplies the short bursts of current the IC draws when its outputs switch." }
---

## Learn

Many microprocessor designs use at least **4-layer boards**: the top and bottom layers carry signals and the **inner two layers are power and ground planes**.

- Planes are **low-impedance sources and sinks**, which minimises overshoot and undershoot on logic signals.
- They add capacitance (a low-pass effect) and lower inductance, which lowers voltage spikes.

Planes are not enough: logic switching also needs **filter and bypass capacitors**.

- A fast logic edge needs a **high instantaneous current** to charge the load capacitance.
- **Bypass capacitors store charge** locally to supply that current, so the supply does not sag or spike.
- The slide's rule of thumb: **1 capacitor per 1-2 ICs**. The picture shows 0.1 µF ceramic bypass capacitors (the slide's label reads "mf") and a 10 µF tantalum filter capacitor.

## Worked example

*A board has 9 logic ICs. How many bypass capacitors does the rule of thumb suggest?*

1. One capacitor per 1 to 2 ICs means between 9 / 2 = 4.5 and 9 / 1 = 9.
2. So roughly **5 to 9** bypass capacitors, each placed close to the power pins it serves.

## Try it

*Why does putting the bypass capacitor far from the IC reduce its usefulness?*

???

The capacitor is meant to supply the IC's current spikes right at the power pin. A long path to it adds inductance and resistance, so the spike is not supplied quickly and the supply voltage at the IC still sags or rings. (This placement point is standard practice rather than stated on the slide.)
