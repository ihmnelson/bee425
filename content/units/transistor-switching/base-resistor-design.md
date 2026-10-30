---
track: shared
title: "Choosing the base resistor"
summary: "Size the base current for the worst-case (minimum) beta so the transistor reaches saturation."
needs: [bjt-switch-model]
sources:
  - { type: slide, ref: "L8 s355", quote: "Never apply a voltage tothe" }
  - { type: slide, ref: "L8 s355", quote: "You would choose the resistance assuming β = 75" }
  - { type: slide, ref: "L8 s356", quote: "Closest standard value = 3.3 KΩ" }
  - { type: slide, ref: "L8 s362", quote: "Safest design rule is to be conservative and assume the worst case value" }
checks:
  - gen: bjt.baseResistor
  - gen: bjt.baseResistor
  - type: choice
    prompt: "A transistor's beta is specified as 75 to 200. Which value do you use to size the base resistor?"
    options: ["75, the minimum, so there is enough base current in the worst case", "200, the maximum", "The average", "Any value"]
    answer: 0
    explain: "Choose a value that will supply the correct amount of current for worst-case conditions: assume β = 75. Beta varies with temperature, collector current and between devices (min/max can differ by 3 times)."
  - type: choice
    prompt: "In the lecture's example (5 V pin, 100 mA load, β = 75), the calculated resistor is 3.38 kΩ. Which standard value is chosen, and why?"
    options: ["3.3 kΩ, the next standard value below, giving slightly more base current", "3.9 kΩ", "10 kΩ", "1 MΩ"]
    answer: 0
    explain: "Base current = 100 mA / 75 = 1.3 mA; R = (5 - 0.6) / 1.3 mA = 3.38 kΩ. The closest standard value 3.3 kΩ is a bit lower, which gives slightly more base current than needed (safe)."
  - type: choice
    prompt: "The I/O pin can supply only 1 mA but the transistor needs more base current. What does the lecture suggest asking?"
    options: ["Add a second transistor (a Darlington pair) or use a MOSFET, since the base current is too small for one transistor", "Use a larger resistor", "Use two I/O pins in series", "Nothing can be done"]
    answer: 0
    explain: "If one transistor needs more base current than the pin can give, boost the current with a second transistor (Darlington or compound pair) or use a voltage-controlled MOSFET, which needs almost no gate current."
card:
  front: "How do you pick the base resistor for a switching NPN?"
  back: "Ib = Ic / βmin. R = (V_IO - 0.6) / Ib. Use the minimum beta (worst case) and round the resistor down to a standard value so there is a little more base current. Never connect a base without a resistor."
glossary: []
---

## Learn

The lecture's recipe: choose the resistance that supplies the correct base current in the **worst case**. With β specified as a range, **use the minimum**.

1. Required base current: **IB = IC / βmin**.
2. The resistor drops the rest of the I/O voltage: **R = (V_IO - 0.6 V) / IB**.
3. Choose a standard value (rounding down gives more margin).

Worked in the lecture: a 5 V pin, a 100 mA collector current and 75 <= β <= 200. IB = 100 mA / 75 = 1.3 mA, R = 4.4 V / 1.3 mA = 3.38 kΩ, so use **3.3 kΩ**.

Why the minimum? **Beta is not a constant.** For the 2N2222A it changes by a factor of 2 as collector current varies from 0.1 mA to 10 mA, and the min/max values at 150 mA differ by 3 times; it also varies with temperature and between devices of the same type. The safest design rule is to be conservative and assume the worst case.

## Worked example

*A 3.3 V pin must drive 50 mA; βmin = 100. Find R.*

1. IB = 50 mA / 100 = 0.5 mA.
2. R = (3.3 - 0.6) / 0.5 mA = 2.7 V / 0.5 mA = **5.4 kΩ**.
3. Standard value: 4.7 kΩ (more margin) or 5.1 kΩ.

## Try it

*What happens to the collector current if you pick R using β = 200 and the actual β is 75?*

???

The base current is too small, IC = β x IB falls short of the load current, the transistor does not saturate, and the collector voltage is higher than designed (with a lot of power dissipated in the transistor).
