---
track: shared
title: "Handling lab equipment: ESD, ROMs, cables and power"
summary: "Ground yourself, keep ROMs in conductive foam, never force a bent pin, and unplug by supporting the connector."
needs: []
sources:
  - { type: handout, ref: "lab3 §VIII", quote: "Always keep the Read Only Memory (ROM) chips in their conductive foam" }
  - { type: handout, ref: "lab3 §VIII", quote: "Always ground yourself" }
  - { type: handout, ref: "lab3 §VIII", quote: "all of the pins remain at the same voltage" }
  - { type: handout, ref: "lab3 §VIII", quote: "DO NOT GRAB THE CABLE AND PULL" }
checks:
  - type: choice
    prompt: "Why are ROM chips kept in **conductive foam**?"
    options: ["It keeps all the pins at the same voltage so static electricity cannot zap one pin", "To keep them cool", "To keep them dry", "To protect the foam"]
    answer: 0
    explain: "The conductive foam makes sure all pins stay at the same voltage. Static electricity cannot zap a pin when the part is stored in foam. Integrated circuits are sensitive to static electricity."
  - type: choice
    prompt: "You find a **bent pin** on a chip or socket. What should you do?"
    options: ["Do not force it; tell the instructor", "Push it in harder", "Bend it back with pliers and insert it", "Use a different cable"]
    answer: 0
    explain: "A bent pin will not insert into the ZIF socket: do not try to force it, notify the instructor. A bent pin in the analyzer's socket would destroy the analyzer."
  - type: choice
    prompt: "How do you remove the **ribbon cable** or the **power plug**?"
    options: ["Support the connector and work it straight out; for the power plug, gently lift the white tab and hold the plastic housing, never pull the wire", "Pull on the cable", "Twist one end out", "Cut it"]
    answer: 0
    explain: "Pulling the cable without supporting the connector, pulling one end out, or plugging into a socket with a bent pin are the three common ways to ruin it. For the power plug, pry the white tab away with a fingernail and lift by the housing."
  - type: choice
    prompt: "What precaution applies to **power polarity**?"
    options: ["Check the polarity before powering the board: students who blow up experiment boards do not, as a rule, receive good grades", "Polarity does not matter", "Use any plug", "Reverse it on purpose"]
    answer: 0
    explain: "The 3-pin power plug is keyed so it only fits one way, but you must still pay attention to polarity before applying power."
card:
  front: "What are the lab handling rules?"
  back: "Ground yourself (wrist strap or touch the bench ground plate); keep ROMs in conductive foam; never force a bent pin (tell the instructor); remove cables by supporting the connector and working it straight out; never pull the power cable by the wire; check polarity; power the analyzer before the board."
glossary:
  - { term: "ESD", def: "Electrostatic discharge: static electricity that can destroy integrated circuits." }
---

## Learn

Modern digital circuits are small, fast, and **easily damaged**. The handout's rules:

- **Static.** ICs are sensitive to static electricity: always **ground yourself** (wrist strap to a grounded point, or touch the bench ground plate periodically and whenever you return to the bench).
- **ROMs** stay in their **conductive foam**, which holds all pins at the same voltage; hold a chip by its short sides until it is time to insert it into the **ZIF** (zero-insertion-force) socket.
- **Bent pins:** it is easy to bend an IC pin. A bent pin will not seat in the ZIF socket: **do not force it**, tell the instructor. Inspect the analyzer's and board's sockets before plugging in a cable; a bent pin in the analyzer socket can destroy the analyzer.
- **Ribbon cable:** support the plastic header and work it straight out. Do not pull on the cable or one end of the header. The board's ejector ears make removal easier.
- **Power plug:** keyed so it fits only one way; **never pull the wire**; lift the white tab with a fingernail and lift the plug by its housing.
- **Order:** analyzer on first, board second; board off first.

## Worked example

*You are about to plug in the 40-pin cable and the socket looks odd on one corner. What do you do?*

1. Stop and inspect the socket for a bent pin.
2. If you see one, do not force the cable: tell the instructor.
3. A bent pin in the analyzer can destroy it, which is a far larger cost than a short delay.

## Try it

*Why touch the bench ground plate frequently, even with a wrist strap on?*

???

The handout suggests periodically touching the ground plate (or using the strap) so you never build up enough static charge to damage a chip; a charge builds up whenever you move around.
