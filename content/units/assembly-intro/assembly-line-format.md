---
track: shared
title: The layout of an assembly line
summary: Label, op-code, operands (comma, no spaces), comment; each instruction is exactly one line.
needs: [machine-and-assembly]
sources:
  - { type: slide, ref: "L4 s174", quote: "Optional, but must start in column 1" }
  - { type: slide, ref: "L4 s176", quote: "Operands are separated by commas, no spaces allowed" }
  - { type: slide, ref: "L4 s177", quote: "Labels cause the assembler to automatically calculate branch and jump addresses" }
  - { type: slide, ref: "L4 s155", quote: "Every instruction is exactly one line long" }
checks:
  - type: choice
    prompt: "Where must a **label** start in 68000 assembly?"
    options: ["Column 1", "Column 8", "Anywhere", "After the op-code"]
    answer: 0
    explain: "A label is optional but must start in column 1. The op-code begins in column 2 or higher, after whitespace."
  - type: choice
    prompt: "Which operand field is written **correctly**?"
    options: ["D0,D3", "D0, D3", "D0 ,D3", "D0 D3"]
    answer: 0
    explain: "Operands are separated by a comma and no spaces are allowed (a space would start the comment field)."
  - type: choice
    prompt: "What does a label give you, besides readability?"
    options: ["The assembler calculates branch and jump addresses for you, avoiding addressing errors", "Faster execution", "More memory", "Automatic comments"]
    answer: 0
    explain: "Labels make code readable and cause the assembler to calculate branch and jump addresses automatically."
  - type: choice
    prompt: "What does `foo   BRA   foo` do?"
    options: ["Branches to itself forever (an infinite loop)", "Stops the processor", "Does nothing and continues", "Defines a constant"]
    answer: 0
    explain: "The label foo marks this BRA instruction, and BRA foo branches to it, so the processor executes the same instruction forever. This is how an embedded program 'stops' on real hardware."
card:
  front: "What are the fields of an assembly line and the rules for each?"
  back: "LABEL (optional, column 1), OP-CODE (column 2 or later, after whitespace), OPERANDS (comma separated, no spaces), COMMENT (starts with * or ;). One instruction per line, up to 132 characters."
glossary:
  - { term: "Label", def: "A symbolic name for the address of an instruction or data; defined in column 1." }
---

## Learn

A 68000 assembly line has up to four fields, separated by spaces or tabs:

`LABEL    OP CODE    OPERAND1,OPERAND2    * COMMENT`

- **Label**: optional, **must start in column 1**, usually limited to about 14 characters (the exact limit depends on the assembler). The first whitespace after it starts the op-code field.
- **Op-code**: column 2 or higher; it includes the **size** (`.B`, `.W`, `.L`) on the 68000.
- **Operands**: the first whitespace after the op-code starts them. Separate them with a **comma, with no spaces**.
- **Comment**: starts with `*` or `;` (a `:` is also accepted after the operands as in the slide).
- **Every instruction is exactly one line**, at most 132 characters.

Labels name an instruction or variable, make the program readable and let the assembler calculate branch and jump addresses. Instruction counts by operands: `NOP` (0 operands), `BRA FOO` (1), `ADD.W D0,D3` (2).

## Worked example

*Label the fields of: `LOOP   MOVE.B (A2),D6   *Get the pattern`.*

1. Label: **LOOP** (column 1).
2. Op-code: **MOVE.B**.
3. Operands: **(A2),D6** (no space after the comma).
4. Comment: **\*Get the pattern**.

## Try it

*Why does `ADD.W D0, D3` fail to assemble as intended?*

???

The space after the comma ends the operand field, so `D3` is read as the start of a comment (or an error). Operands must be separated by a comma with **no spaces**.
