---
track: shared
title: "Choosing the right transistor"
summary: "Check cut-off voltage, current, power and speed; derate to half of the maximum ratings."
needs: [saturation]
sources:
  - { type: slide, ref: "L8 s369", quote: "Must choose a transistor with sufficiently high cut-off voltage" }
  - { type: slide, ref: "L8 s369", quote: "the power dissipated in the transistor equals 0.4V x current" }
  - { type: slide, ref: "L8 s371", quote: "A safe operating value usually equals ½ of the maximum rating" }
  - { type: slide, ref: "L8 s368", quote: "Maximum power dissipation" }
checks:
  - type: choice
    prompt: "A 100 V supply switches a load. Which collector-emitter voltage rating does the lecture suggest?"
    options: ["About 200 V: when off, the collector sees the full supply, so pick twice the supply as a margin", "100 V exactly", "5 V", "Any rating"]
    answer: 0
    explain: "When the transistor is off the collector voltage equals the supply, so choose a high enough cut-off voltage; for a 100 V supply consider a 200 V maximum. Rule of thumb: a safe operating value is about half the maximum rating."
  - type: choice
    prompt: "A load draws **10 A**. What transistor current rating and power capability does the lecture say you need?"
    options: ["A 20 A transistor able to dissipate 4 W (0.4 V x 10 A)", "A 10 A transistor with no heat", "A 5 A transistor", "Only a 4 W rating"]
    answer: 0
    explain: "Half-rating rule: a 20 A transistor for a 10 A load. On-state power = 0.4 V x 10 A = 4 W, which may need a heat sink (or fan)."
  - type: choice
    prompt: "Which of these is **not** on the lecture's list of things to look for in a transistor?"
    options: ["The colour of the package", "Linear or switching type", "Value of β (a range, depends on temperature and IC)", "Maximum collector voltage, current and power"]
    answer: 0
    explain: "The list: type (linear or switching), β (range, temperature- and current-dependent), maximum collector voltage when off, maximum collector current, maximum power dissipation, and the packaging."
card:
  front: "What do you check when choosing a switching transistor?"
  back: "Type (switching), β range, max collector voltage (cut-off, with margin: 200 V for a 100 V supply), max current (20 A for a 10 A load), power (0.4 V x I when on; heat sink if needed), package and switching speed. Operate at about half of any maximum rating and assume the minimum β."
glossary: []
---

## Learn

Things to look for in a transistor data sheet: **linear or switching type; value of β** (a range depending on temperature and collector current); **maximum collector voltage** (transistor off); **maximum collector current**; **maximum power dissipation**; and the **package**.

- **Off:** the collector sits at the supply, so choose a high enough cut-off voltage. For a 100 V supply, consider a **200 V** maximum.
- **On:** the transistor dissipates about **0.4 V x I**. A **10 A** load needs a **20 A** transistor and the ability to dissipate **4 W**, which may mean a heat sink, a fan or both. (Contrast: an AMD Ryzen dissipates 105 W and needs a large heat sink.)
- **Rules of thumb:** a safe operating value is usually **half the maximum rating**; assume the **worst-case (minimum) β**.
- Switching speed matters only at higher speeds.

**Summary of design:** set the base current with a series resistor so that β x IB guarantees IC x RL > Vcc (the transistor saturates), and choose a transistor with the right type, current, power and speed.

## Worked example

*A 24 V motor draws 3 A. What ratings do you look for?*

1. Voltage: at least 2 x 24 = 48 V collector cut-off (use 60 V or more).
2. Current: 2 x 3 = 6 A or more.
3. Power when on: 0.4 V x 3 A = 1.2 W, so check the package and maybe use a heat sink.

## Try it

*Why not pick a transistor whose maximum current equals the load current?*

???

Operating at the limit leaves no margin for supply tolerance, temperature or surges; the lecture's rule is to operate at about half the maximum rating.
