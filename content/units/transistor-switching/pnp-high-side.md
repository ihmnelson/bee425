---
track: shared
title: "PNP transistors and ground-referenced loads"
summary: "A PNP (or P-type) switches a ground-referenced load; its base is pulled low by an open-collector gate or an NPN."
needs: [open-collector-drivers, darlington-sziklai]
sources:
  - { type: slide, ref: "L8 s388", quote: "It is often advantageous for the load to be" }
  - { type: slide, ref: "L8 s389", quote: "we need to sink current from the base of the PNP transistor to" }
  - { type: slide, ref: "L8 s391", quote: "NPN and N-type devices will switch a load that is" }
  - { type: own, ref: "the base-resistor sizing for the PNP/7406 example (the lecture poses it as a question)" }
checks:
  - type: choice
    prompt: "Which loads do **PNP and P-type** devices switch, compared with NPN and N-type?"
    options: ["PNP/P-type switch a ground-referenced load (but need a more complex drive circuit); NPN/N-type switch a load referenced to the supply rail", "The same loads", "Only AC loads", "PNP switches nothing"]
    answer: 0
    explain: "NPN and N-type devices switch a load referenced to the power supply rail; PNP and P-type devices switch a load that is ground referenced, but require a more complex circuit to drive the base or gate."
  - type: choice
    prompt: "How do you turn a **PNP transistor** on from a 5 V microcontroller whose rail is 30 V?"
    options: ["Sink current from its base to ground with an open-collector gate or an NPN transistor (through a base resistor)", "Apply 5 V to the base directly", "Connect the base to 30 V", "Use a capacitor"]
    answer: 0
    explain: "A PNP turns on when current leaves its base. The pin cannot pull the base to within 0.6 V of a 30 V emitter on its own, so an open-collector gate (such as a 7406) or an NPN, which can hold off the high voltage, sinks the base current."
  - type: choice
    prompt: "A PNP with β = 50 switches a 60 Ω load from 30 V. About what base current is needed to saturate it?"
    options: ["About 10 mA (0.5 A / 50)", "About 1 mA", "About 500 mA", "About 100 µA"]
    answer: 0
    explain: "Load current = about 30 V / 60 Ω = 0.5 A, so IB = 0.5 / 50 = 10 mA. The base resistor Rx then drops about 30 - 0.6 - 0.4 = 29 V at 10 mA, roughly 2.9 kΩ; round down to 2.7 kΩ."
card:
  front: "How do you use a PNP transistor as a switch?"
  back: "Emitter to the positive rail, collector to a ground-referenced load. Current flows into the emitter and out of the base and collector; base current is i/β. Turn it on by sinking base current to ground through Rx with an open-collector gate or NPN that can withstand the rail voltage. Size Rx as (Vrail - 0.6 - Vol) / (Iload / β)."
glossary: []
---

## Learn

PNP transistors work with opposite polarity: current **enters the emitter** and exits through the base and collector. The voltage across the load is now **referenced to ground**, often an advantage over a pull-down from the positive rail.

To drive one from a microcontroller you must **sink current from the base to ground** (the opposite of an NPN). The pin cannot do that alone when the rail is high, so use an **NPN transistor or an open-collector gate** to deal with the high-voltage issue. The lecture's example: a **7406 OC gate**, PNP with β = 50, rail 30 V, load 60 Ω, asks for a good base resistor Rx.

Our own working: load current about 30 V / 60 Ω = 0.5 A (slightly less with saturation drop); base current = 0.5 A / 50 = **10 mA**; Rx drops about 30 - 0.6 (Veb) - 0.4 (gate low) = 29 V, so Rx = 29 V / 10 mA = **2.9 kΩ**, choose **2.7 kΩ** for margin (the 7406 must hold off 30 V and sink 10 mA).

**Summary of transistors as switches.** BJT: base-current controlled, current-gain β, saturate by injecting enough current. MOSFET: gate-voltage controlled, raise VGS until rDS is as low as it can go. NPN and N-type switch loads referenced to the rail; PNP and P-type switch ground-referenced loads but need a more complex drive.

## Worked example

*Which one would you use to switch a load whose other end is grounded: NPN or PNP?*

1. A load already tied to ground needs the switch on the supply side (high side).
2. An NPN's emitter would sit above ground by the load voltage, so the drive would have to exceed the rail.
3. A **PNP** (emitter at the rail) is the natural fit, driven by an OC gate that pulls its base down.

## Try it

*In the PNP circuit, what is the emitter current if the collector current is i?*

???

The emitter current is the sum, **i + i/β**: the collector current plus the base current that also leaves the transistor.
