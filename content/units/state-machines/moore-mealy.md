---
track: shared
title: Moore and Mealy machines
summary: In a Moore machine the output depends only on the state; in a Mealy machine it also depends on the current input.
needs: [finite-state-acceptor]
sources:
  - { type: handout, ref: "fsm Moore and Mealy Machines", quote: "This means that the outputs of a Moore machine change only upon clock signals, and the outputs are determined by the state." }
  - { type: handout, ref: "fsm Moore and Mealy Machines", quote: "If you think of a Moore machine in terms of a transition diagram, the outputs are associated with the nodes of the graph." }
  - { type: handout, ref: "fsm Moore and Mealy Machines", quote: "the outputs of a Mealy machine can change independent of the clock" }
  - { type: handout, ref: "fsm Moore and Mealy Machines", quote: "some functions can be implemented with fewer states using Mealy machines" }
checks:
  - type: choice
    prompt: "In a Moore machine, what determines the output?"
    options: ["Only the present state", "The present state and the present input", "Only the present input", "Only the clock edge"]
    answer: 0
    explain: "The output function maps the state onto the output alphabet. Because the state register changes only on the clock, a Moore machine's outputs change only on clock signals."
  - type: choice
    prompt: "In a state transition diagram, where are the outputs of a Mealy machine drawn?"
    options: ["On the edges (transitions)", "On the nodes (states)", "Inside the state register", "In the clock line"]
    answer: 0
    explain: "A Mealy output depends on the state and the input, so it is attached to the transition. A Moore output is attached to the node."
  - type: choice
    prompt: "An input of a Mealy machine changes in the middle of a clock period. What can happen to its output?"
    options: ["The output can change at once, without waiting for the clock", "The output waits for the next clock edge", "The machine ignores the change until reset", "The state changes immediately"]
    answer: 0
    explain: "The Mealy output is computed from both the state and the input, so a change of input can change the output independently of the clock, even though the state itself changes only on the clock."
  - type: choice
    prompt: "What is a benefit of a Mealy machine, and what is its risk?"
    options: ["Some functions need fewer states, but the outputs can change at any time", "It always uses fewer gates, and its outputs are glitch-free", "Its outputs are clocked, but it needs more states", "It needs no state register, but it is slower"]
    answer: 0
    explain: "Putting outputs on the transitions lets some functions be built with fewer states. The disadvantage is that outputs can change whenever the inputs do, so they may glitch between clock edges."
card:
  front: "Moore versus Mealy machines."
  back: "Moore: output = function of the state only (outputs on nodes, change only with the clock). Mealy: output = function of state and input (outputs on edges, can change without the clock); can need fewer states but outputs can change at any time."
glossary:
  - { term: "Moore machine", def: "A finite state machine whose output depends only on the present state." }
  - { term: "Mealy machine", def: "A finite state machine whose output depends on the present state and the present input." }
---

## Learn

Both models store the state in a **state register** that changes on the clock, and both compute the next state with combinational logic from the inputs and the present state. They differ in how the **output** is made.

- **Moore:** output = f(state). The output logic sees only the state register, so outputs change **only on clock signals**. In the diagram the outputs sit on the **nodes**.
- **Mealy:** output = f(state, input). The outputs sit on the **edges** and can change **independently of the clock** whenever an input changes.

Because a Mealy output can depend on the transition, **some functions need fewer states**; the price is that outputs can change at any time, which can cause glitches.

## Worked example

*A detector must output 1 while its input has just been 1 two cycles in a row. Which model needs fewer states?*

1. **Mealy:** two states ("last input 0" and "last input 1"). The output is 1 on the edge taken when the state is "last input 1" and the input is 1.
2. **Moore:** the output must come from the state alone, so you also need a state meaning "saw 1, 1": three states.

The Mealy version needs one fewer state, but its output can change in the middle of a clock period if the input does.

## Try it

*Which model has outputs that change only on a clock edge?*

???

The **Moore** machine. Its outputs come from the state register, which changes only when the clock signals it.
