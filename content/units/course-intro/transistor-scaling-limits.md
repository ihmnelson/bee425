---
track: shared
title: Why shrinking transistors got hard (leakage, Dennard scaling, 3-D devices)
summary: Smaller CMOS transistors leak more current when off, which ended ideal scaling and pushed designers to new structures.
needs: [moores-law]
sources:
  - { type: handout, ref: "tt60 Transistor Turns 60", quote: "The transistor was invented by scientists William Shockley, John Bardeen and Walter Brattain" }
  - { type: handout, ref: "ttw Transistor Wars", quote: "the biennial doubling in transistor density" }
  - { type: handout, ref: "ttw Transistor Wars", quote: "The smaller you make a CMOS transistor, the more current it leaks" }
  - { type: handout, ref: "ttw Transistor Wars", quote: "steadily reducing gate length, gate insulator thickness, and other feature dimensions could simultaneously improve switching speed, power consumption, and transistor density" }
  - { type: handout, ref: "ttw Transistor Wars", quote: "By 2001, the leakage power was fast approaching the amount of power needed to switch a transistor" }
  - { type: handout, ref: "ttw Transistor Wars", quote: "The other scheme is to turn this channel on its side, popping it out of the transistor plane to create a 3-D device." }
checks:
  - type: choice
    prompt: "Why does a smaller CMOS transistor leak more current when it is switched off?"
    options: ["With the source and drain closer, the gate has weaker control over the channel, so current sneaks through", "A shorter gate has more resistance, which heats the channel", "The gate oxide grows thicker as the device shrinks", "Smaller transistors need a higher supply voltage to turn off"]
    answer: 0
    explain: "As the source-to-drain distance shrinks, the gate's control over the channel weakens. Current passes through the part of the channel farthest from the gate and through the substrate below."
  - type: choice
    prompt: "What did Dennard's scaling rules promise, and what had happened by 2001?"
    options: ["Better speed, power and density together; leakage neared the switching power", "Higher speed but more power; leakage had disappeared", "Fixed density with doubled speed; leakage tracked voltage", "Half the cost per shrink; leakage had stayed constant"]
    answer: 0
    explain: "Steadily reducing gate length, insulator thickness and other dimensions was supposed to improve switching speed, power and density together. But voltage could not be reduced as engineers expected, and by 2001 leakage power was nearly as large as the power needed for switching, so a chip would use the same energy whether or not it was in use."
  - type: choice
    prompt: "Which two approaches are used to restore the gate's control over the channel?"
    options: ["A thin channel built on insulator, or a channel turned into a 3-D device", "A thicker substrate, or a higher drain voltage", "A longer channel, or a lower clock rate", "A bigger die, or more metal layers"]
    answer: 0
    explain: "One approach thins the channel by building it on an insulator (ultrathin-body silicon-on-insulator); the other turns it on its side into a 3-D device. Both aim to remove the excess silicon through which leakage flows."
  - type: choice
    prompt: "One source quotes Moore's law as a doubling about every 18 months, another as a biennial doubling. What should you conclude?"
    options: ["Sources quote the period differently; the trend, not the exact period, is the point", "One of the statements must be wrong and can be ignored", "The period depends on the processor family used", "Moore's law refers to clock speed in one source and transistors in the other"]
    answer: 0
    explain: "Moore's 1965 prediction is commonly quoted as a doubling every two years, and often as about 18 months. For this course use the lecture's wording, but know that the reading says biennial."
card:
  front: "Why did transistor scaling get hard?"
  back: "Smaller CMOS transistors leak more when off because the gate loses control of the channel. Dennard scaling (shrink everything for better speed, power, density) stopped working; by 2001 leakage was nearly the switching power. Fixes: thin channel on insulator (UTB SOI) or a 3-D channel (Intel 2011). Moore's law quoted as every 18 months or two years."
glossary:
  - { term: "Dennard scaling", def: "The 1974 rule set: shrink gate length, insulator thickness and other dimensions together to improve speed, power and density at once." }
---

## Learn

The transistor was invented at Bell Labs in 1947 by Bardeen and Brattain (Shockley followed with the more manufacturable junction type), and it has shrunk ever since. Moore's law (the doubling of transistor density) is quoted as every two years or about 18 months.

**Why it got hard.** The smaller a CMOS transistor, the more current it **leaks when switched off**: the gate's control over the channel weakens as source and drain come close, and current sneaks through the channel far from the gate and through the substrate.

**Dennard scaling** (IBM, 1974) said shrinking gate length, insulator thickness and other dimensions together would raise speed, cut power and raise density at once. In practice voltage could not be lowered as hoped, because leakage forced a high drain voltage for fast switching. By **2001 leakage power was nearly the power needed to switch**, which would make a chip use the same energy idle or busy.

**Fixes** (the industry's "ways to buy Moore's law more years"): strained silicon (2003), a hafnium oxide gate insulator (2007), and then a new structure that gives the gate better control: a **very thin silicon channel on insulator** (UTB SOI) or a channel **turned on its side into a 3-D device** (Intel's 2011 announcement).

## Worked example

*A chip's leakage power is 10% of its switching power at one node. If leakage doubles with every shrink while switching power stays constant, after how many shrinks is leakage equal to switching power? (Illustrative numbers, not from the reading.)*

1. 10% x 2 = 20% after one shrink, 40% after two, 80% after three, **160% after four**.
2. After three shrinks it is still 80% of switching power; it passes switching power at the **fourth** shrink.
3. This is the pattern the reading describes by 2001: leakage close to switching power, motivating new structures.

## Try it

*Name the two causes in the reading's explanation of why leakage increases as the source-drain distance shrinks.*

???

The gate has **weaker control of the channel**, so current flows through the part of the channel farthest from the gate, and **through the underlying silicon substrate**.
