---
track: shared
title: Flow charts for assembly programs
summary: Rectangles for operations, diamonds for decisions, arrows for flow; draw it before you code.
needs: [machine-and-assembly]
sources:
  - { type: slide, ref: "L4 s190", quote: "Use a rectangle to represent a distinct operation" }
  - { type: slide, ref: "L4 s190", quote: "Use a diamond to represent a decision point" }
  - { type: slide, ref: "L4 s190", quote: "Flow charts are your friend" }
checks:
  - type: choice
    prompt: "Which flow chart symbol represents a **decision** (such as testing a condition)?"
    options: ["A diamond", "A rectangle", "An arrow", "A circle"]
    answer: 0
    explain: "A diamond is a decision point (program flow control); a rectangle is a distinct operation (one or many instructions); arrows show the direction of flow."
  - type: choice
    prompt: "A decision diamond in an assembly flow chart usually becomes which pair of instructions?"
    options: ["A compare or test followed by a conditional branch", "Two MOVE instructions", "A label and a comment", "An ORG and an END"]
    answer: 0
    explain: "A test (for example CMP) sets the flags, and a conditional branch (for example BEQ or BGE) chooses the next path."
  - type: choice
    prompt: "When should the flow chart be drawn?"
    options: ["Before coding, to plan the program", "After the program works", "Never for assembly", "Only for high-level languages"]
    answer: 0
    explain: "Flow charts are especially useful for assembly programs (less so for high-level languages). The lecture notes students tend to code first and chart afterward, but a flow chart saves time and prevents avoidable errors."
card:
  front: "What do flow chart shapes mean, and when do you draw one?"
  back: "Rectangle: a distinct operation (one or many instructions). Diamond: a decision. Arrow: direction of flow. Draw it before coding an assembly program."
glossary: []
---

## Learn

A flow chart is a useful way to plan an **assembly** language program (it is typically not used for high-level languages). The symbols:

- **Rectangle**: a distinct operation; it may be one instruction, several or many, and generally means "do something".
- **Diamond**: a **decision point** (program flow control). It has two exits, TRUE and FALSE.
- **Arrow**: the direction of program flow.

Students tend to write the program and then draw the chart; the lecture says to draw it first. Flow charts save time and prevent avoidable errors, and one is **required** for the homework.

The lecture's "largest of four bytes" chart reads: get the first and second numbers; if 1 >= 2 save 1, else save 2; get the third; if 3 >= saved keep saved, else save 3; and so on, then quit.

## Worked example

*Chart a loop that clears memory from START to END.*

1. Rectangle: set the pointer to START.
2. Diamond: pointer = END? If yes, go to Done.
3. If no, rectangle: clear the location and advance the pointer, then arrow back to the diamond.
4. This is the WHILE-loop shape the lecture uses.

## Try it

*Which shape would you draw for `CMP.B D1,D0` followed by `BGE NEXT1`?*

???

A **diamond** (the comparison and branch form one decision: D0 >= D1 or not).
