---
track: shared
title: Finite state machines and the vending-machine acceptor
summary: A finite state machine has finitely many states, inputs and a transition function; an acceptor has final states that output true.
needs: [sr-latch-state-diagram]
sources:
  - { type: handout, ref: "fsm State Machines", quote: "Finite state machines are state machines whose state variables, inputs, and outputs can be enumerated." }
  - { type: handout, ref: "fsm State Machines", quote: "A final state that produces an output of true is called an accepting state." }
  - { type: handout, ref: "fsm Finite State Acceptors", quote: "A customer can deposit two nickels or a dime to unlock the dispensing mechanism." }
  - { type: handout, ref: "fsm Moore and Mealy Machines", quote: "A state transition diagram with 2n nodes requires an n-bit state register." }
checks:
  - type: choice
    prompt: "What makes a state machine a finite state machine?"
    options: ["Its states, inputs and outputs can be enumerated", "It has exactly two states", "It has no inputs and runs forever", "It can be built only from S-R latches"]
    answer: 0
    explain: "A finite state machine is a state machine whose state variables, inputs and outputs form finite sets, such as a traffic signal. It can be implemented directly with digital logic."
  - type: choice
    prompt: "A vending machine unlocks when it has received 10 cents, using nickels (5c) and dimes (10c). Starting at S0 with nothing deposited, which input sequences reach the unlocked state?"
    options: ["One dime, or two nickels", "Only two nickels", "One nickel, or one dime", "Only one dime"]
    answer: 0
    explain: "A dime goes straight from S0 to the unlocked (accepting) state. A nickel goes to S1, and a second nickel goes from S1 to unlocked."
  - type: choice
    prompt: "In the same machine, what is the state S1 after one nickel, and why is it needed?"
    options: ["It remembers that 5 cents has been deposited", "It is the accepting state that unlocks the item", "It is the start state before any coin", "It holds the item that has been dispensed"]
    answer: 0
    explain: "S1 is an intermediate state: the machine must remember that one nickel is already in, so that a second nickel (not a first) completes the sale."
  - type: choice
    prompt: "A finite state machine has 12 states. What is the minimum number of bits in its state register?"
    options: ["4 bits", "3 bits", "6 bits", "12 bits"]
    answer: 0
    explain: "A diagram with 2^n nodes needs an n-bit state register, so 12 states need at least 4 bits (2^3 = 8 is too few, 2^4 = 16 is enough)."
card:
  front: "What is a finite state acceptor? Give the vending-machine example."
  back: "A finite state machine with final (accepting) states that output true. Vending machine for a 10c item: S0 --nickel--> S1 --nickel--> unlocked; S0 --dime--> unlocked. A machine with 2^n states needs an n-bit state register."
glossary:
  - { term: "Finite state machine", def: "A machine whose states, inputs and outputs are finite sets, with a transition function mapping state and input to the next state." }
  - { term: "Accepting state", def: "A final state of a finite state acceptor that produces the output true." }
---

## Learn

A **state machine** takes a sequence of inputs; each input produces a new state (from the input and the previous state) and an output. It is a **finite state machine (FSM)** when the states, inputs and outputs can all be listed. Traffic signals and vending machines are typical.

A formal definition is M = (Q, V, t, q0): a finite set of states Q, an input alphabet V, a transition function t and a start state q0. Adding **final states** gives a **finite state acceptor**: a final state that outputs true is an **accepting state**.

**Vending machine example (10-cent item).** Start state S0 (no money). A dime moves straight to the *unlocked* accepting state. A nickel moves to S1 (5 cents remembered); a second nickel then reaches *unlocked*. The model leaves out details (pennies, the unlocking hardware, returning to the start), which a real design would need.

In hardware, a **state register** stores the state and combinational logic computes the next state. A diagram with **2^n nodes needs an n-bit state register**.

## Worked example

*Change the price to 15 cents, still accepting only nickels and dimes. How many states are needed, and how many state-register bits?*

1. Amounts that can be held before unlocking: 0c, 5c, 10c. Together with the *unlocked* state that is **4 states**.
2. 4 = 2^2, so a **2-bit** state register is enough.

## Try it

*For the 10-cent machine, which state does the input sequence nickel, nickel, dime lead to, assuming the machine returns to S0 after unlocking?*

???

The two nickels reach *unlocked* (the item is dispensed and the machine returns to S0). The dime then moves S0 straight to *unlocked* again, so the sequence ends in the **unlocked** state a second time.
