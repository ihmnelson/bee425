---
track: shared
title: "Hardware versus software cost analysis"
summary: "Fixed costs dominate at low volume and unit costs at high volume; compare totals and risks before choosing."
needs: ["hw-sw-partitioning"]
sources:
  - { type: slide, ref: "L10 s492", quote: "Amortized tool costs" }
  - { type: slide, ref: "L10 s493", quote: "$3,525,000" }
  - { type: slide, ref: "L10 s494", quote: "30% probability that ASIC will require a second pass through" }
  - { type: slide, ref: "L10 s494", quote: "Consumer Electronics Show is in 4 months" }
checks:
  - gen: conv.costTotal
  - gen: conv.costTotal
  - type: choice
    prompt: "In the lecture's example, an ASIC has $525,000 of development, foundry and tool costs and a unit cost of $14 at 1,000 units. What is the **cost per device**?"
    options: ["$539 per device ($539,000 total)", "$14", "$525", "$300"]
    answer: 0
    explain: "Hardware at 1,000 units: $525,000 + $14,000 = $539,000, so $539 per device. At 500,000 units (unit cost $6): $525,000 + $3,000,000 = $3,525,000, or $7.05 per device (the slide prints the $525,000 as $1.05 per device, which is the NRE share alone)."
  - type: choice
    prompt: "In the example the software solution costs $300,000 to develop. How do the totals compare at 1,000 and at 500,000 units?"
    options: ["At both volumes software totals $300,000, while hardware is $539,000 at 1,000 and $3,525,000 at 500,000", "Hardware is cheaper at both", "They are equal", "Software costs more at high volume"]
    answer: 0
    explain: "The software solution has no per-unit cost in the example, so total cost is flat; hardware's per-unit cost grows with volume. The decision also depends on performance and selling price."
card:
  front: "How do you compare the cost of hardware and software solutions?"
  back: "Total = fixed development (NRE, tools, engineering) + unit cost x volume; per device = total / volume. Hardware: $525,000 NRE + $14/unit (1,000 units: $539,000) or $6/unit (500,000 units: $3,525,000). Software: $300,000 flat. Then weigh price (4 ppm at $139 versus 1 ppm at $89) and risk (30% ASIC respin $200K + 2 months; software overruns about 3 months)."
glossary: []
---

## Learn

The lecture's example adds an **ASIC** to an embedded system:

| | 1,000 units/yr | 500,000 units/yr |
|---|---|---|
| Cost per ASIC | $14.00 | $6.00 |
| Part total | $14,000 | $3,000,000 |
| Development (2 engineer-years) | $300,000 | $300,000 |
| NRE foundry charges | $200,000 | $200,000 |
| Amortised tools | $25,000 | $25,000 |
| Fixed total | $525,000 | $525,000 |

Hardware totals: **$539,000** at 1,000 units and **$3,525,000** at 500,000. The **software** solution costs $300,000 to develop at either volume (about $300 per device at 1,000 units, $0.60 at 500,000).

Then the business questions: the ink-jet printer with the hardware solution prints **4** pages per minute and sells for **$139**; the software solution prints **1** page per minute and sells for **$89**. Risks: a **30%** chance the ASIC needs a second foundry pass (**$200,000 and 2 months**); software teams averaged a **3-month overrun** on the last 4 projects; the **Consumer Electronics Show is in 4 months**. There is no formula answer: you weigh cost, volume, performance, price and schedule risk.

(Slide note: the slide prints the ASIC's fixed cost spread over volume as $525 and $1.05 per device; those are the fixed costs only: $525,000/1,000 and $525,000/500,000.)

## Worked example

*At what volume would hardware and software total the same, if software is $300,000 flat and hardware is $525,000 plus $6 per unit?*

1. $300,000 = $525,000 + $6 x V has no positive solution: software is already cheaper at every volume in this model.
2. Hardware only wins on performance and price, not on cost.
3. A model where software has a per-unit cost (a bigger processor) would give a break-even volume.

## Try it

*Why is 'cost per device' misleading when comparing the two?*

???

It divides all costs by volume, hiding that fixed costs are a big risk at low volume; the per-device number changes with volume, so compare totals at the volumes you really expect.
