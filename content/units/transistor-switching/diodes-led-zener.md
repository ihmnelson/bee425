---
track: shared
title: "Diodes: rectifier, Zener and LED"
summary: "A diode conducts above about 0.6 V forward; a Zener conducts in reverse at a set voltage; an LED needs a series resistor."
needs: []
sources:
  - { type: slide, ref: "L8 s343", quote: "Anode must be biased approximately 600 mV higher than the cathode for" }
  - { type: slide, ref: "L8 s344", quote: "When reverse voltage reaches a certain value, diode will suddenly go into" }
  - { type: slide, ref: "L8 s346", quote: "Forward voltage typically 1-4 V" }
  - { type: slide, ref: "L8 s343", quote: "1 KΩ resistor limits current" }
checks:
  - gen: led.resistor
  - gen: led.resistor
  - type: choice
    prompt: "How far above the cathode must a standard silicon diode's **anode** be before it conducts?"
    options: ["About 600 mV", "About 5 V", "About 50 mV", "Exactly 0 V"]
    answer: 0
    explain: "The anode must be biased approximately 600 mV higher than the cathode for current to flow. Current flows only in the positive direction (anode to cathode)."
  - type: choice
    prompt: "What property does a **Zener diode** use to make a stable reference voltage?"
    options: ["Reverse breakdown (avalanche): at a certain reverse voltage it suddenly conducts", "Forward conduction at 0.6 V", "Light emission", "Its capacitance"]
    answer: 0
    explain: "A Zener takes advantage of reverse breakdown; when the reverse voltage reaches a set value the diode conducts and holds that voltage. A series resistor (1 kΩ on the slide) is needed to limit the current."
  - type: choice
    prompt: "Why must every diode and LED in these circuits have a **series resistor**?"
    options: ["To limit the current, since a conducting diode's voltage is almost fixed", "To raise the voltage", "To make it emit more light", "To block DC"]
    answer: 0
    explain: "Once a diode conducts, its voltage barely changes, so without a resistor the current is limited only by the source and the diode would be damaged. The resistor sets the current."
card:
  front: "Rectifier, Zener and LED: what does each do and what do you check?"
  back: "Rectifier: passes current anode to cathode when the anode is about 0.6 V higher; check forward current rating and reverse breakdown voltage. Zener: conducts in reverse at a set voltage, a stable reference (needs a series resistor). LED: emits light with forward current; forward voltage 1-4 V; brightness set by current; R = (Vsupply - Vf) / I."
glossary:
  - { term: "Zener diode", def: "A diode designed to conduct in reverse at a particular voltage, used as a voltage reference." }
---

## Learn

The lecture gives a **no-theory, just-circuits** review of diodes and transistors, because technical interviews test practical circuit skills.

- **Rectifier (standard) diode**: controls the direction of current flow; conducts only anode to cathode, once the anode is about **600 mV** above the cathode. Consider the forward current rating (power dissipated in the diode) and the reverse breakdown voltage. A resistor limits the current (1 kΩ in the figure).
- **Zener diode**: uses **reverse breakdown (avalanche mode)**: when the reverse voltage reaches a set value it suddenly conducts. Zener-based references can be stable to parts per million; real reference parts contain more than the Zener (such as temperature compensation). It needs a series resistor.
- **LED**: emits light when forward current flows; different semiconductor properties give different colours. **Forward voltage is typically 1-4 V**; light output depends on forward current; power dissipated depends on forward voltage times current. LEDs are long-lived and efficient.

**LED resistor:** R = (V_supply - V_f) / I_f.

## Worked example

*A red LED (Vf = 2 V) should run at 10 mA from a 5 V pin. Resistor?*

1. Drop across the resistor = 5 - 2 = 3 V.
2. R = 3 V / 10 mA = **300 Ω**.
3. Use the nearest standard value (330 Ω gives about 9 mA).

## Try it

*Why does the Zener reference circuit on the slide need a 1 kΩ resistor?*

???

Once the Zener conducts, its voltage is fixed, so the resistor sets the current from the supply (V_supply minus the Zener voltage, divided by R) and keeps the Zener within its power rating.
