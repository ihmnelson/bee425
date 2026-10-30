---
track: shared
title: Clock distribution and clock skew
summary: Clock edges arrive at different times at different parts; skew eats timing margin.
needs: [pcb-workflow]
sources:
  - { type: slide, ref: "L2 s72", quote: "Clock skew effectively reduce the timing margins" }
  - { type: slide, ref: "L2 s72", quote: "In most designs, the clock signal touches almost every component in the design" }
  - { type: slide, ref: "L2 s72", quote: "Characterizing the clock should be the first thing done after the board passes the smoke test" }
checks:
  - type: choice
    prompt: "What is **clock skew**?"
    options: ["Differences in when the same clock edge arrives at different components, caused by path lengths and propagation delays", "A clock that runs slower over time", "A clock with unequal high and low times", "Noise riding on the clock"]
    answer: 0
    explain: "Skew is the time difference in arrival of clock edges due to different path lengths and propagation delays through the circuitry. It is not duty cycle (unequal high/low) and not noise."
  - type: choice
    prompt: "What does clock skew do to a synchronous design?"
    options: ["Reduces the timing margins", "Increases the clock frequency", "Lowers power use", "Removes the need for bypass capacitors"]
    answer: 0
    explain: "Skew means parts do not see the edge at the same moment, so some of the time that was supposed to be spare is lost: it reduces the timing margins."
  - type: choice
    prompt: "Why must the designer worry about skew when clocks are **buffered**?"
    options: ["Each buffer adds propagation delay, so branches can differ", "Buffers stop the clock", "Buffers double the frequency", "Buffers remove ringing"]
    answer: 0
    explain: "The designer must be concerned with the skew associated with the propagation delay through the buffering device. The slide contrasts a skewed distribution with a non-skewed one."
card:
  front: "Define clock skew and say why it matters."
  back: "Time differences in the arrival of the clock edges at different parts, due to different path lengths and propagation delays (for example through buffers). It reduces timing margins."
glossary:
  - { term: "Clock skew", def: "Time differences in the arrival of clock edges due to different path lengths and propagation delays through the circuitry." }
---

## Learn

In most designs the **clock touches almost every component**, so it is the most heavily loaded signal and drives the most capacitance. It must be well controlled, noise-free and laid out carefully.

If the clock is **buffered** to drive all those loads, each buffer adds a **propagation delay**, and paths of different length add delay too. The result is **clock skew**: the same edge reaches different components at different times. Skew **reduces the timing margins**, because the time available between edges is shared with the arrival difference.

Good practice from the lecture: keep the distribution balanced (same buffers, similar path lengths for each branch), and **characterize the clock first** once the board passes the smoke test.

## Worked example

*A 20 ns clock period feeds two chips. The clock reaches chip A after 2 ns and chip B after 5 ns. What is the skew, and how much of the period is it?*

1. Skew = 5 ns - 2 ns = **3 ns**.
2. As a share of the period: 3 / 20 = **15%**.
3. That 3 ns is time the signals launched by A and captured by B cannot use, so the timing margin falls by 3 ns.

## Try it

*Two buffered clock branches have propagation delays of 4.0 ns and 4.6 ns. What is the skew?*

???

4.6 ns - 4.0 ns = **0.6 ns**. Matching the buffers and path lengths would bring this toward zero.
