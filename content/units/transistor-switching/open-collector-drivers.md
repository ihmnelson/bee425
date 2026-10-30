---
track: shared
title: "Open-collector outputs, drivers and sinking current"
summary: "An open-collector output only pulls low; it needs a pull-up, can sink real current, and snubber diodes protect against inductive spikes."
needs: [choosing-transistor, buses-and-cells.bus-contention-tristate]
sources:
  - { type: slide, ref: "L8 s357", quote: "Usually can sink more current than source" }
  - { type: slide, ref: "L8 s372", quote: "Suppose we take any digital logic gate and then add an NPN transistor to" }
  - { type: slide, ref: "L8 s373", quote: "Outputs can provide 500 mA of current and hold off 50V" }
  - { type: slide, ref: "L8 s373", quote: "Solenoids and relays generate large inductive spikes and require diodes (snubbers)" }
  - { type: slide, ref: "L8 s375", quote: "The external load resistor is called a pull-up" }
checks:
  - type: choice
    prompt: "What is the difference between a **source** and a **sink** output?"
    options: ["Source: current flows out of the output through the load to ground. Sink: current flows into the output from the load and goes to ground inside the output", "They are identical", "Source is for AC", "Sink is only for LEDs"]
    answer: 0
    explain: "An output can supply current to a load (source) or receive it from the load (sink). The capabilities usually differ: an output can typically sink more current than it can source."
  - type: choice
    prompt: "An open-collector output must have a **pull-up resistor**. Why?"
    options: ["When the output transistor is off the output floats; the resistor pulls it up to the supply (it may be a different voltage than the gate's Vcc)", "To protect the gate", "To speed up the falling edge", "To reduce power"]
    answer: 0
    explain: "The output can only pull low. The external load resistor pulls the output up to the power supply voltage when the transistor is off; its value forms the Thévenin series resistance of the off state, and the supply need not equal the gate's Vcc."
  - type: choice
    prompt: "What is a **snubber diode** for?"
    options: ["It is placed across an inductive load (solenoid or relay) to limit the voltage spike when the current is switched off", "It speeds the transistor", "It lowers the supply voltage", "It indicates power"]
    answer: 0
    explain: "A diode in parallel with an inductance limits the swing of voltage spikes. The ULN2003's seven power drivers include them."
  - type: choice
    prompt: "A **ULN2003** provides 500 mA per output and holds off 50 V. How do you drive a **1 A** load with it?"
    options: ["Connect several outputs in parallel (and their inputs together) for more current capability", "It cannot", "Use a bigger resistor", "Raise the input voltage"]
    answer: 0
    explain: "The lecture notes that you can parallel several outputs for more current capability (the question: a 1 A load would use at least two, and preferably more for margin)."
card:
  front: "What is an open-collector driver and how do you use it?"
  back: "A logic gate with an NPN on the output: it only pulls low (sinks current). Needs a pull-up resistor to a positive voltage (can differ from the gate's Vcc). Power drivers such as the ULN2003 (7 drivers, 500 mA, 50 V, 5 V-logic inputs, with snubber diodes) switch relays, solenoids and LEDs; parallel outputs for more current."
glossary:
  - { term: "Pull-up resistor", def: "A resistor from an open-collector output to a positive voltage that makes the line high when the output transistor is off." }
  - { term: "Snubber diode", def: "A diode across an inductive load that limits the voltage spike when the current is interrupted." }
---

## Learn

**Sourcing and sinking.** An output can **source** current (current flows from the output through the load to ground) or **sink** it (current flows into the output from the load and goes to ground in the output). The two capabilities differ: usually an output can **sink more than it can source**, and the output impedances are different. The current *source* supplies current to the circuit (the power supply is one); the current *sink* accepts the return current (the ground bus is one).

**Open-collector (OC) gates.** Take any digital gate and add an NPN transistor on the output (a TI 7406, for instance). The output only pulls low: it **sinks current**. It needs a **pull-up resistor** to a positive supply, which need not be the gate's own Vcc. When the transistor is off the output looks like a Thévenin equivalent with series resistance equal to the pull-up.

**Open-collector drivers.** High-current devices need wider, thicker PC-board traces on the board. **Solenoids and relays generate large inductive spikes and need snubber diodes**; other voltages may need local DC-DC converters; high voltages need care to protect the low-voltage circuitry. The **ULN2003** has **7 power drivers** in one package (with snubber diodes), **inputs compatible with 5 V logic**, **outputs of 500 mA that hold off 50 V**, and parallel outputs for more current. As an LED driver, the load is connected from the supply through the LED and resistor into the **collector**, so power is applied by *sinking*; brightness is controlled by a pulse stream instead of DC.

## Worked example

*A 12 V relay coil draws 80 mA. Can one ULN2003 output drive it, and what else is needed?*

1. 80 mA is well under 500 mA, and 12 V is under 50 V, so yes.
2. The coil is inductive: the ULN2003's built-in snubber diode (connected to the supply) handles the turn-off spike.
3. The coil connects between the 12 V supply and the output; the input is driven by a 5 V logic pin (it sinks the coil current).

## Try it

*Why can an open-collector gate with a 12 V pull-up drive a 12 V device from a 5 V system?*

???

The output transistor only pulls low, and the pull-up goes to whatever supply the load needs (up to the transistor's voltage rating); the gate's own 5 V Vcc is not involved in the high level.
