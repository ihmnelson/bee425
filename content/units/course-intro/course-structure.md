---
track: shared
title: "How BEE 425 is organised and graded"
summary: "Six topic areas; labs, exams and the project each count 25%; homework is not graded but exam questions come from it and from the labs."
needs: []
sources:
  - { type: slide, ref: "L1 s25", quote: "Homework assignments = Not graded" }
  - { type: slide, ref: "L1 s12", quote: "Expect to see lab-based questions on your exams" }
  - { type: slide, ref: "L1 s28", quote: "Everything is fair game" }
  - { type: slide, ref: "L1 s29", quote: "Part 1: Architecture of a microprocessor" }
checks:
  - type: choice
    prompt: "According to the grading rubric in Lesson 1, which of these is **not graded**?"
    options: ["Homework assignments", "The three lab experiments", "The midterm exam", "The design project"]
    answer: 0
    explain: "Homework is not graded. The three labs, the midterm, the final and the design project are each 25% of the grade, plus up to an additional 5% for class participation."
  - type: choice
    prompt: "Why does the instructor say you should still do the homework and labs?"
    options: ["The exams test what you did or did not do in them, and exam problems resemble homework problems", "Homework and lab scores are averaged in and can replace a poor exam score", "The labs cover the only material that the exams are allowed to test", "The instructor curves exam scores by how many labs were handed in"]
    answer: 0
    explain: "Exams test your knowledge of what you did in the labs and on your homework, and the instructor asks lab questions on exams. Studying his solutions is not a substitute for solving the problems yourself."
  - type: choice
    prompt: "What does the instructor say about what can be on the test?"
    options: ["Anything from the lectures, homework, labs or assigned reading", "Only material that was shown on the lecture slides", "Only problems that already appeared on the homework sets", "Only topics covered in the most recent lecture before the exam"]
    answer: 0
    explain: "The lecture material, homework, lab experiments and other assigned reading are the roadmap, and the answer to 'will it be on the test' is that everything is fair game."
card:
  front: "What are the six parts of the course and how is it graded?"
  back: "Part 0 basics (PCB design, clocks, project), 1 architecture, 2 assembly language, 3 memory design, 4 I/O design and control, 5 system design issues, 6 design tools. Grading: homework not graded; 3 labs 25%, midterm 25%, final 25%, project 25%, participation +5%. Exams cover homework, labs and lectures; everything is fair game."
glossary: []
---

## Learn

BEE 425 is an introductory, **hardware-centric** course on designing, operating, programming and debugging electronic systems that use microprocessors as the control element. The course material runs in these parts:

| Part | Topics |
|---|---|
| 0 Basics | Course introduction, designing a microprocessor system, PCB design, project overview, pulses and clocks |
| 1 Architecture | Components of a microprocessor, CISC and RISC, hardware view and programmer's model of the 68K and Z80 |
| 2 Assembly language | Software view of the architecture, program structure, instruction set simulators, executable code, addressing modes, loops, subroutines |
| 3 Memory (intro to I/O) | Memory design, buses and tri-state, addressing and expansion, paging |
| 4 I/O design and control | Transistors as switches, open collector, A/D and D/A, parallel and serial ports, analog issues |
| 5 System design issues | Power management, processor selection, compliance engineering, partitioning |
| 6 Design tools | Time permitting |

**Grading** (Lesson 1 rubric): homework **not graded**; three lab experiments **25%**; midterm **25%**; final **25%**; design project **25%**; class participation an additional **5%**. All labs must be completed to receive credit.

**The exams** test what you did (or did not do) in the labs and homework: "expect to see lab-based questions on your exams", and exam problems "will not be very different than homework problems". Studying solutions is not a substitute for solving problems yourself. The lectures, reading, labs and homework are complementary, and **everything is fair game**.

(The syllabus on Canvas is the authority for dates and policies; this is a summary of what the first lecture says.)

## Worked example

*A friend plans to skip the labs because 'they barely count'. What is wrong with the plan?*

1. Labs are 25% of the grade, and all of them must be completed for credit in the course.
2. The exams, which are half of the grade, ask lab questions.
3. So skipping a lab costs both the lab points and exam points.

## Try it

*Which parts of the grade are the exams?*

???

The midterm (25%) and the final (25%): together half of the course grade.
