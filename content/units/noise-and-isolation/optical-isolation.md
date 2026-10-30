---
track: shared
title: "Optical isolation"
summary: "An LED and a phototransistor pass a signal with no electrical connection, breaking ground loops and surviving 1,000 V."
needs: ["hysteresis-debounce"]
sources:
  - { type: slide, ref: "L10 s472", quote: "Use a light emitting diode ( LED ) and a phototransistor to couple outside world to" }
  - { type: slide, ref: "L10 s472", quote: "Allows communication between systems running at different ground references" }
  - { type: slide, ref: "L10 s472", quote: "Can often have 1000 volts of isolation" }
  - { type: slide, ref: "L10 s472", quote: "Long cables can act like antennas" }
checks:
  - type: choice
    prompt: "How does an **optocoupler** pass a signal?"
    options: ["An LED lights a phototransistor: the coupling is light, with no physical electrical connection", "With a transformer only", "Through a shared ground", "With a capacitor"]
    answer: 0
    explain: "Light couples the circuits together, so the two sides can sit at different ground references (up to about 1,000 V of isolation)."
  - type: choice
    prompt: "Why would you isolate a circuit from the outside world?"
    options: ["Harsh environments (arc welders) make severe noise, long cables act as antennas, grounds may differ, and patient-contact medical instruments must be safe", "To make it slower", "To reduce cost", "To avoid using a power supply"]
    answer: 0
    explain: "Optical isolation protects computer circuitry from electrical noise and allows systems at different ground references to talk; it is also useful in medical instruments in contact with the patient."
  - type: choice
    prompt: "Gate A is a battery-powered thermostat biased at +1,000 V above ground; gate B, a heater switch, is ground referenced. How do you connect them?"
    options: ["Through an optocoupler: A's current amplifier sets the LED's on-current; the phototransistor pulls B's input low through a pull-up", "Wire them directly", "With a resistor", "With a diode"]
    answer: 0
    explain: "A direct connection would put 1,000 V on gate B. The LED side is referenced to A; the phototransistor side to earth ground with a pull-up resistor to Vcc."
card:
  front: "What is optical isolation and why use it?"
  back: "An LED and phototransistor couple a signal by light with no electrical connection: up to ~1000 V of isolation, different ground references, immunity to noise picked up by long cables (arc welding), patient safety in medical instruments."
glossary:
  - { term: "Optocoupler (optical isolator)", def: "An LED and phototransistor in one package that pass a signal by light, electrically isolating two circuits." }
---

## Learn

Embedded systems often work in **harsh environments**: electrical noise (an arc-welding machine) can overwhelm ordinary computer circuits, and **long cables act like antennas** that funnel electrical energy into the electronics. **Optical isolation** protects the computer circuitry: an **LED** and a **phototransistor** couple the outside world to the computer without a physical connection.

Benefits: communication between systems with **different ground references**, often **1,000 V** of isolation between ground references, and safety in **medical instruments** that touch the patient.

The lecture's problem: gate A (from a furnace thermostat, battery powered, biased +1,000 VDC above ground) must drive gate B (turns on a heater, ground referenced). A current amplifier on A's side sets the LED's on-current, and on B's side the phototransistor with a pull-up resistor makes the input to gate B.

## Worked example

*Why not connect gate A's output to gate B with a resistor?*

1. A's output sits 1,000 V above earth ground.
2. A direct connection would put that potential on B's input and destroy it.
3. The optocoupler passes only the on/off information as light.

## Try it

*Name two reasons to isolate an industrial sensor input.*

???

Noise immunity (long cables act as antennas, arc welders) and different ground references (and safety); an optocoupler gives about 1,000 V of isolation.
