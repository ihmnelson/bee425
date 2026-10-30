---
track: shared
title: Two's complement numbers
summary: Negate by complementing the bits and adding 1; the top bit is the sign; a byte holds -128 to +127.
needs: [programmers-model]
sources:
  - { type: slide, ref: "L3 s141", quote: "Step 1: Complement all bits of the byte, word, or long word" }
  - { type: slide, ref: "L3 s141", quote: "Two’s complement = 1010 0001 + 1 = 1010 0010 = $A2" }
  - { type: slide, ref: "L3 s142", quote: "Range of 8-bit number is -128 to +127" }
checks:
  - gen: number.negateByte
  - gen: number.signedValue
  - type: choice
    prompt: "What is the range of a **16-bit** two's complement number?"
    options: ["-32,768 to +32,767", "0 to 65,535", "-65,536 to +65,535", "-32,767 to +32,768"]
    answer: 0
    explain: "A 16-bit signed number runs from -32,768 to +32,767 (8-bit: -128 to +127; 32-bit: -2,147,483,648 to +2,147,483,647). There is one more negative value than positive, because zero counts as positive."
card:
  front: "How do you form the two's complement of a number, and what is the 8-bit range?"
  back: "Complement all the bits, then add 1 (for example $5E gives 1010 0001 + 1 = $A2). An 8-bit signed number runs from -128 to +127; 16-bit from -32,768 to +32,767."
glossary:
  - { term: "Two's complement", def: "The way negative numbers are stored: complement every bit and add 1; all subtraction becomes addition." }
---

## Learn

Processors turn subtraction into addition by storing negative numbers in **two's complement**. To negate a number (byte, word or long word):

1. **Complement** every bit (1s become 0s and 0s become 1s).
2. **Add 1**.

Example: $5E = 0101 1110. Complement: 1010 0001. Add 1: 1010 0010 = **$A2**. So $A2 means -$5E (decimal -94).

Facts to keep:
- The **top bit is the sign**: 1 means negative.
- 8-bit range **-128 to +127**; 16-bit **-32,768 to +32,767**; 32-bit **-2,147,483,648 to +2,147,483,647**. Zero counts as positive.
- The processor always treats an addition as signed; it is the programmer's job to decide the context.
- Branching backwards works by adding a negative number to the program counter.
- A quick decode of a negative byte: subtract 256 (so $A2 = 162 - 256 = -94).

## Worked example

*What does the byte $F6 mean as a signed number?*

1. $F6 = 1111 0110; the top bit is 1, so it is negative.
2. Complement: 0000 1001. Add 1: 0000 1010 = $0A = 10.
3. So $F6 = **-10**. (Check: 246 - 256 = -10.)

## Try it

*Find the two's complement of $01, and say what number it represents.*

???

$01 = 0000 0001. Complement: 1111 1110. Add 1: 1111 1111 = **$FF**, which represents **-1**.
