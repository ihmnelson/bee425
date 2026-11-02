---
track: shared
title: The S-R latch, characteristic tables and state diagrams
summary: A sequential circuit's output depends on its state; a characteristic table or a state transition diagram describes how it changes.
needs: []
sources:
  - { type: handout, ref: "fsm The S-R Latch", quote: "The input S=R=1 is not allowed" }
  - { type: handout, ref: "fsm The S-R Latch", quote: "Q+ represents the next state." }
  - { type: handout, ref: "fsm The S-R Latch", quote: "A state transition diagram is a directed graph. Nodes represent states and directed edges represent transitions." }
  - { type: handout, ref: "fsm The S-R Latch", quote: "Valid inputs that do not cause transitions are represented by edges that return to the same state." }
checks:
  - type: choice
    prompt: "Why is a truth table not enough to describe a sequential circuit such as an S-R latch?"
    options: ["The output depends on the stored state as well as the inputs", "A sequential circuit has no inputs to list in a table", "The outputs of a latch change only on the falling clock edge", "A sequential circuit always has more than eight inputs"]
    answer: 0
    explain: "A combinational circuit's output follows its inputs, so a truth table works. A latch remembers: with S = R = 0 the output could be 0 or 1 depending on what it held before, so the present state must be one of the table's inputs."
  - type: choice
    prompt: "An S-R latch currently holds Q = 1. Inputs S = 0 and R = 1 are applied. What is the next state Q+?"
    options: ["0, because R resets the latch", "1, because the latch already holds a 1", "Undefined, because both inputs differ", "Whatever S was before"]
    answer: 0
    explain: "From the characteristic table: Q = 1, S = 0, R = 1 gives Q+ = 0. Asserting R momentarily puts the latch into the reset state."
  - type: choice
    prompt: "An S-R latch has Q = 0 and S = R = 0 is applied. What does the state transition diagram show for this input?"
    options: ["An edge from state 0 back to state 0", "An edge from state 0 to state 1", "No edge, because the input is not allowed", "An edge to an undefined third state"]
    answer: 0
    explain: "Valid inputs that cause no change are drawn as edges that return to the same state. Only S = R = 1 is left out, because it is not a valid input."
  - type: choice
    prompt: "In a state transition diagram, what do the nodes and the edges represent?"
    options: ["Nodes are states; directed edges are transitions labelled by the inputs that cause them", "Nodes are inputs; edges are the states between them", "Nodes are outputs; edges are clock pulses", "Nodes are gates; edges are wires"]
    answer: 0
    explain: "A state transition diagram is a directed graph: each node is a state and each directed edge a transition labelled with the input values that cause it."
card:
  front: "How do you describe the behaviour of an S-R latch?"
  back: "By its characteristic table (present state Q and inputs S, R give next state Q+; S=R=1 is undefined) or a state transition diagram (nodes = states 0 and 1; edges labelled with the S,R inputs, including edges back to the same state)."
glossary:
  - { term: "Characteristic table", def: "A truth-table-like table with the present state as an input and the next state (Q+) as the output." }
  - { term: "State transition diagram", def: "A directed graph whose nodes are states and whose edges are transitions labelled by the inputs that cause them." }
---

## Learn

A truth table models a **combinational** circuit: change an input and the output follows. A **sequential** circuit has memory, so its output depends on the inputs *and* on its **state**. The simplest example is the **S-R latch**: a pulse on S sets Q to 1, a pulse on R resets Q to 0, and with both inputs 0 it holds. **S = R = 1 is not allowed**; the behaviour is undefined.

Two ways to describe it:

- A **characteristic table** is a truth table in which the present state Q is one of the inputs and the next state **Q+** is the output. It grows large when there are many states or inputs.
- A **state transition diagram** is a directed graph: **nodes are states, directed edges are transitions** labelled by the inputs (S, R) that cause them. Inputs that cause no change are edges that loop back to the same state.

| Q | S | R | Q+ |
|---|---|---|----|
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

(The two rows with S = R = 1 are undefined.)

## Worked example

*Start at Q = 0 and apply the input sequence (S,R) = 10, 00, 01, 00. What is Q after each input?*

1. 10 sets the latch: **Q = 1**.
2. 00 holds: **Q = 1**.
3. 01 resets: **Q = 0**.
4. 00 holds: **Q = 0**.

The same input 00 gave different outputs (1, then 0) because the state differed, which is why a plain truth table cannot describe the latch.

## Try it

*Start at Q = 1 and apply (S,R) = 00, 10, 01. What is Q after the last input?*

???

00 holds (Q = 1), 10 sets (Q = 1), 01 resets, so the final Q is **0**.
