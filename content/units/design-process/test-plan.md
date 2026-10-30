---
track: shared
title: "A test plan for a new board"
summary: "Inspect the raw board, check Vcc-to-ground resistance, inspect the loaded board, then power up with a current limit."
needs: [design-phases]
sources:
  - { type: slide, ref: "L1 s56", quote: "Create a test plan and keep a lab notebook" }
  - { type: slide, ref: "L1 s56", quote: "Expected ∞" }
  - { type: slide, ref: "L1 s57", quote: "Apply power with current limit or series resistor" }
checks:
  - type: choice
    prompt: "Before powering a **raw board**, you measure the resistance between **Vcc and ground**. What do you expect, and what does a low value mean?"
    options: ["Expected infinity (open); a low reading means a short circuit", "Expected 0; low is fine", "Expected 1 kΩ", "It does not matter"]
    answer: 0
    explain: "The test plan's expected value is infinity. A short between Vcc and ground would destroy parts when power is applied, so find it first."
  - type: choice
    prompt: "How should power first be applied to a newly loaded board?"
    options: ["With a current limit or a series resistor, watching for odors and heat", "Straight from a wall wart at full current", "With the clock disabled", "With the parts removed"]
    answer: 0
    explain: "Turn-on: measure Vcc-ground resistance, apply power with a current limit or series resistor, check for odors and heat, then measure the supply voltages."
  - type: choice
    prompt: "Which item is on the **loaded board** inspection list?"
    options: ["Are all IC pins in the sockets, ICs oriented correctly and leads soldered with no solder bridges?", "Is the logo centred?", "Is the firmware compiled?", "Is the schematic printed?"]
    answer: 0
    explain: "Loaded-board checks: parts located and aligned, IC pins in sockets and orientation, leads soldered, no solder bridges, no residual flux, components seated."
  - type: choice
    prompt: "Why keep a **lab notebook** with the test plan?"
    options: ["Turn-on and debug is the hardest phase for a new engineer; recording each step saves time and avoids repeating mistakes", "It is required by the vendor", "It replaces the schematic", "It is only for the instructor"]
    answer: 0
    explain: "The lecture: for a student or new engineer the most difficult phase is turn-on and debug; the best practice is to create a test plan and keep a lab notebook. It may seem a waste of time but is worth its weight in time saved."
card:
  front: "Outline the bring-up test plan for a new board."
  back: "1 Raw board: inspect against the design; ohmmeter Vcc to ground should be infinite. 2 Loaded board: parts aligned, ICs in sockets and oriented, leads soldered, no bridges, no flux. 3 Turn-on without inputs: recheck Vcc-ground, apply power with a current limit or series resistor, look for odors and heat, measure supply voltages. Keep a lab notebook."
glossary: []
---

## Learn

For a student or new engineer, **turn-on and debug** is the most difficult phase. Best practice: **make a test plan and keep a lab notebook**. The lecture's outline:

1. **Raw board:** inspect it against the design; with an ohmmeter measure the resistance between **Vcc and ground** (expected **infinite**).
2. **Loaded board:** parts properly located and aligned; all IC pins in the sockets and ICs correctly oriented; all leads soldered; **no solder bridges** between pins; no residual flux; components seated properly.
3. **Board turn-on (no external inputs):** measure Vcc-to-ground resistance (is it a short?); **apply power with a current limit or a series resistor**; any odors? any heat?; measure the supply voltages (is Vcc correct?).
4. And so forth, step by step.

It may look like a waste of time, but it is worth its weight in time saved, and it impresses your peers.

## Worked example

*After loading the board, the ohmmeter reads 3 Ω between Vcc and ground. What do you do?*

1. That is far from infinity: there is probably a **short** (a solder bridge, a reversed capacitor or a mis-oriented IC).
2. Do **not** apply power. Inspect the board for bridges and orientation, and find the short.
3. Re-measure; only continue to the current-limited power-up when the reading is acceptable.

## Try it

*Why apply power through a current limit the first time?*

???

If there is a fault the limited current prevents it from destroying parts or the board, and you can notice heat or smell before damage is done.
