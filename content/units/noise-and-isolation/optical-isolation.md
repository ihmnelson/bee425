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
    prompt: "How does an optocoupler pass a signal?"
    options: ["An LED lights a phototransistor, so the coupling is light with no electrical connection", "A small transformer couples the two sides magnetically", "A shared ground wire carries the signal across", "A capacitor passes the signal edges between the sides"]
    answer: 0
    explain: "Light couples the circuits together, so the two sides can sit at different ground references (up to about 1,000 V of isolation)."
  - type: choice
    prompt: "Why would you isolate a circuit from the outside world?"
    options: ["To break ground loops and block noise, as with arc welders, long cables and patient contact", "To make the circuit run slower and so use less power", "To avoid needing a power supply on the output side", "To cut the cost of the circuit board"]
    answer: 0
    explain: "Optical isolation protects computer circuitry from electrical noise and allows systems at different ground references to talk; it is also useful in medical instruments in contact with the patient."
  - type: choice
    prompt: "Gate A is a battery-powered thermostat at +1,000 V above ground and gate B is a ground-referenced heater switch. How do you connect them?"
    options: ["An optocoupler: A drives the LED, the phototransistor pulls B's input low", "Wire them directly together, since both are logic gates", "Join them with a resistor to limit the current", "Join them with a diode so current flows one way"]
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
