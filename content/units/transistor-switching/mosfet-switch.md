---
track: shared
title: "MOSFETs as switches"
summary: "A MOSFET is a voltage-controlled resistor: N-type switches a rail-referenced load directly from a pin; P-type needs a level shifter."
needs: [bjt-switch-model]
sources:
  - { type: slide, ref: "L8 s381", quote: "The MOSFET (P-type or N-type) is a voltage-controlled resistor" }
  - { type: slide, ref: "L8 s383", quote: "Load is referenced to the positive rail, Vcc, and not ground!" }
  - { type: slide, ref: "L8 s382", quote: "Need to use a transistor to level-shift the gate" }
  - { type: slide, ref: "L8 s386", quote: "Static sensitive" }
checks:
  - type: choice
    prompt: "What controls a MOSFET, compared with a BJT?"
    options: ["The gate voltage (VGS) controls the channel resistance; a BJT is controlled by base current", "The gate current", "The drain voltage", "The clock"]
    answer: 0
    explain: "A MOSFET is a voltage-controlled resistor with almost infinite input resistance (but significant input capacitance); the channel resistance can vary over 10 orders of magnitude from fully on to fully off."
  - type: choice
    prompt: "With an **N-type MOSFET** driven from an I/O pin, where is the load connected?"
    options: ["Between the positive rail and the drain (the load is referenced to Vcc, not ground)", "From the drain to ground", "In the gate", "Across the pin"]
    answer: 0
    explain: "As long as the MOSFET is fully turned on at the pin's high level (5 V or 3.3 V), the circuit works, with the load referenced to the positive rail."
  - type: choice
    prompt: "Why is driving a **P-type MOSFET** from a 3.3 V pin harder?"
    options: ["Its gate voltage is referenced to the positive rail, so with a high rail the pin cannot pull the gate low enough; a transistor (and Zener) level-shifts the gate", "It needs a negative supply", "It has no gate", "It only works at 0 V"]
    answer: 0
    explain: "The P-type MOSFET turns on when VGS is negative relative to the source (the rail). The lecture's circuit uses an NPN transistor, rated for the rail voltage, with a 5 V Zener so VGS = -5 V when the NPN conducts."
  - type: choice
    prompt: "Which is a **disadvantage** of power MOSFETs, according to the lecture?"
    options: ["Static sensitive (needs careful handling), possibly more expensive, and gate capacitance may limit speed", "They need large base resistors", "Low current rating", "They cannot be driven from logic"]
    answer: 0
    explain: "The logic-level power MOSFET shown has 6 mΩ minimum resistance, 100 A and 100 W, and connects directly to a microcontroller pin with no bias resistors, but it is static sensitive, possibly more expensive than an NPN power transistor, and its gate capacitance may limit speed."
card:
  front: "How do N- and P-type MOSFETs work as switches?"
  back: "A MOSFET is a voltage-controlled resistor (gate-source voltage sets the channel resistance; gate draws almost no current). N-type: load to the positive rail, gate driven directly if fully on at the pin's high level. P-type: load to ground but gate referenced to the rail, so a transistor and Zener level-shift the gate. Logic-level power MOSFETs need no base resistor; they are static sensitive and have gate capacitance."
glossary:
  - { term: "MOSFET", def: "Metal-oxide-silicon field-effect transistor: a voltage-controlled resistor between source and drain, with an insulated gate." }
---

## Learn

The **MOSFET** (P-type or N-type) is a **voltage-controlled resistor** with almost infinite input resistance but significant input capacitance. VGS sets the channel resistance rDS, which can vary over about 10 orders of magnitude between fully on and fully off.

- **N-type:** drive it from an I/O pin as long as it is fully on at the pin's high voltage (5 V or 3.3 V). The **load is referenced to the positive rail**, not ground. NPN and N-type devices switch loads referenced to the supply rail.
- **P-type:** same behaviour with reversed polarities; it can drive a **ground-referenced load**, but VGS is referenced to the **positive rail**, so a transistor is needed to **level-shift the gate**. The lecture's circuit uses an NPN (rated for the rail voltage) and a **5 V Zener**: when the NPN turns on, the Zener conducts and VGS = -5 V, turning the MOSFET on. (The lecture's own comment: "It may not be optimal, but it should work".)
- **Logic-level power MOSFET data sheet:** operates from logic levels, minimum resistance **6 milliohms**, maximum current **100 A**, **100 W**; the microcontroller pin connects **directly** to the gate with no bias resistors. Downsides: **static sensitive**, possibly more expensive than a comparable NPN, and **gate capacitance** may limit speed.

## Worked example

*A MOSFET with rDS(on) = 6 mΩ carries 20 A. Power dissipated?*

1. P = I^2 x R = 20^2 x 0.006 = **2.4 W**.
2. That is why MOSFETs run cool compared with a BJT at 0.4 V x 20 A = 8 W.
3. (Heat sinking is still worth checking.)

## Try it

*A load must be switched on the ground side (the load's other end at the positive rail). Which type of MOSFET?*

???

An **N-type**: with the load from the rail to the drain, and the source at ground, the pin can drive the gate directly.
