---
track: shared
title: "The BJT as a current-controlled switch"
summary: "A small base current controls a larger collector current by the factor beta; in digital systems it is used as a switch."
needs: [diodes-led-zener]
sources:
  - { type: slide, ref: "L8 s348", quote: "The I/O (input/output) pins of a typical microcontroller can safely output 1 mA to 20" }
  - { type: slide, ref: "L8 s349", quote: "In digital systems we almost always use the transistor as a switching" }
  - { type: slide, ref: "L8 s353", quote: "The NPN (or PNP ) transistor is a current-controlled" }
  - { type: slide, ref: "L8 s353", quote: "β can range in value from 10 to 10,000" }
checks:
  - type: choice
    prompt: "Why use a **discrete transistor** with a microcontroller pin?"
    options: ["The pin can safely give only 1-20 mA at 3.3-5 V, but the load may need hundreds of amps or 1000 V", "Pins have no voltage", "Transistors are cheaper than wire", "Microcontrollers cannot output logic"]
    answer: 0
    explain: "The I/O pins of a typical microcontroller can safely output 1 mA to 20 mA at 3.3 V to 5 V; loads can need hundreds of amperes at 1000 V or more, so the pin controls a transistor that switches the load."
  - type: choice
    prompt: "In a BJT, how are the three currents related?"
    options: ["IC = β x IB and IE = IC + IB", "IC = IB + β", "IE = IC - IB", "IB = β x IC"]
    answer: 0
    explain: "The collector current is the base current multiplied by β (the current gain, hFE), and the emitter current is the sum of the collector and base currents."
  - type: choice
    prompt: "What is the **base-emitter junction** like, and what voltage is dropped across it?"
    options: ["A forward-biased diode; Vbe is about 0.6 V", "An open circuit; 0 V", "A short; 5 V", "A resistor; 1 kΩ"]
    answer: 0
    explain: "The base-emitter junction looks like a forward-biased diode with a drop of approximately 0.6 V (Vbe). The I/O voltage must exceed that for base current to flow."
  - type: choice
    prompt: "In which **two modes** can a transistor be used, and which does digital design use?"
    options: ["Linear (amplifier) and switching (cutoff or saturation); digital systems almost always use switching", "Only linear", "AC and DC; DC", "Fast and slow; slow"]
    answer: 0
    explain: "In linear mode the output varies over a narrow region and is a multiple of the input. In switching mode the input either cuts off all current (cutoff) or drives the transistor until the output current cannot go higher (saturation)."
card:
  front: "How does an NPN BJT work as a switch?"
  back: "A current-controlled current source: IC = β x IB, IE = IC + IB, with Vbe about 0.6 V. β (hFE) ranges widely (10 to 10,000). Used in switching mode (cutoff or saturation) in digital systems so a 1-20 mA pin can control large loads."
glossary:
  - { term: "β (hFE)", def: "The current gain of a transistor: collector current divided by base current." }
---

## Learn

A microcontroller pin cannot drive big loads, so we use a **transistor**. There are two families, each with two polarities: **bipolar junction transistors (BJT)**, NPN or PNP, and **field-effect transistors (FET)**, N-type or P-type (the lecture ignores the junction-FET versus MOSFET distinction; N- and P-type MOSFETs together make CMOS logic).

**Two modes:** *linear* (output proportional to input: amplifiers) and *switching* (cutoff or saturation). Digital systems almost always use the switching mode.

**The NPN BJT is a current-controlled current source.** Current injected into the base flows through the emitter to ground; the base-emitter junction looks like a forward-biased diode with **Vbe about 0.6 V**. The collector current is **IC = β x IB**, where β (also the forward current transfer ratio **hFE**) can range from 10 to 10,000 or more, and **IE = IC + IB**.

The control source is almost always a **voltage output from an I/O port** (3.3-5 V at 1-10 mA, sometimes more), which must exceed Vbe. **Never apply a voltage to the base of a BJT without a current-limiting resistor.**

## Worked example

*A transistor has β = 100 and a base current of 440 µA. What is the collector current?*

1. IC = β x IB = 100 x 440 µA = **44 mA**.
2. IE = IC + IB = 44.44 mA.
3. (This is the lecture's 5 V, 10 kΩ example: (5 - 0.6) / 10 kΩ = 440 µA.)

## Try it

*Why can't you connect an I/O pin straight to the base?*

???

The base looks like a diode to ground; a voltage source would push far too much current through it, likely burning out the I/O pin. A series resistor sets the base current.
