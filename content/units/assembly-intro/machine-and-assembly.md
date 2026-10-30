---
track: shared
title: Machine language, assembly and the assembler
summary: An instruction is an operation plus operands; the assembler turns mnemonics into machine code.
needs: [why-assembly]
sources:
  - { type: slide, ref: "L4 s149", quote: "Assembly language is machine language in a human readable form" }
  - { type: slide, ref: "L4 s149", quote: "The Assembler is a program that converts assembly language to machine" }
  - { type: slide, ref: "L4 s151", quote: "Operation (verb): What the instruction is intended to do" }
  - { type: slide, ref: "L4 s151", quote: "Each instruction is “atomic” and can’t be subdivided" }
checks:
  - type: choice
    prompt: "What does an **assembler** do?"
    options: ["Converts assembly language into machine language", "Runs the program", "Converts C into assembly", "Loads the program from a disk"]
    answer: 0
    explain: "The assembler is the program that converts assembly language to machine language. The processor only ever executes machine language."
  - type: choice
    prompt: "In the instruction `ADD.W D0,D3`, what is the **mnemonic** (the operation)?"
    options: ["ADD", "D0", "D3", ".W"]
    answer: 0
    explain: "The operation (the verb) is also called the mnemonic: ADD. The operands are the data it works on (D0 and D3), and .W is the size."
  - type: choice
    prompt: "Which three questions does an instruction's **operand** part answer?"
    options: ["Where the data is, how to access it (addressing mode), and what to do with the result", "How fast, how long, how big", "Which clock, which supply, which pin", "Which compiler, which linker, which loader"]
    answer: 0
    explain: "Operands answer: where is the data (registers or memory, or a literal), how do we access it (addressing modes), and what do we do with the result."
card:
  front: "What are the parts of an instruction, and what does the assembler do?"
  back: "Operation (mnemonic: add, subtract, AND, copy, test) plus operands (where the data is, how it is accessed, where the result goes). The assembler converts assembly into machine language: bit patterns the processor's state machine acts on."
glossary:
  - { term: "Mnemonic", def: "The short name of an operation in assembly language, such as ADD or MOVE; also called the operation or op-code." }
  - { term: "Assembler", def: "A program that converts assembly language into machine language." }
---

## Learn

- **Machine language** is the pattern of bits the processor's finite state machine interprets to start a series of state transitions. That pattern is an **instruction**. Each instruction is **atomic**: it cannot be subdivided and, once started, it completes.
- **Assembly language** is machine language in a human-readable form. You can program in machine language, but it is not recommended.
- The **assembler** is the program that converts assembly language to machine language.

Most instructions have two parts, like a sentence:

| Part | Role | Examples |
|---|---|---|
| **Operation** (verb) | What to do; also called the **mnemonic** | add, subtract, multiply, divide, AND, OR, XOR, copy data, test data |
| **Operands** (nouns) | The data being manipulated | where it is (registers, memory, a literal number); how to access it (**addressing modes**); what to do with the result |

## Worked example

*Describe `MOVE.B D0,D3` in these terms.*

1. Operation: **MOVE** (copy), size **.B** (byte).
2. Operands: the data is in **D0** (a register); the result goes to **D3**.
3. The assembler turns it into the machine word `$1600`, which you will see in the next lesson on machine code.

## Try it

*Identify the operation and operands in `CMP.B D0,D1`.*

???

Operation: **CMP** (compare), byte size. Operands: **D0** and **D1** (two data registers); the instruction subtracts D0 from D1 and sets the flags without storing the result.
