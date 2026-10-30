---
track: m68k
title: "Signed and unsigned branches after CMP"
summary: "The same CMP D0,D1 needs BLT/BGT for signed numbers and BCS/BHI for unsigned ones."
needs: [m68k-compare-and-flags, programmers-model.signed-overflow]
sources:
  - { type: slide, ref: "L5 s235", quote: "BCS = Branch on carry set" }
  - { type: slide, ref: "L5 s235", quote: "BCC = Branch on carry" }
  - { type: oracle, ref: "the branch demonstration below is run on the 68000 core" }
programs:
  - cpu: m68k
    name: "D1 = $01, D0 = $FF: unsigned lower, signed greater"
    source: |
      * program
              ORG     $1000
      START   MOVE.B  #0,D2
              MOVE.B  #$FF,D0
              MOVE.B  #$01,D1
              CMP.B   D0,D1
              BCS     uns_lt
              BRA     c1
      uns_lt  ADDQ.B  #1,D2
      c1      CMP.B   D0,D1
              BLT     sg_lt
              BRA     c2
      sg_lt   ADDQ.B  #2,D2
      c2      CMP.B   D0,D1
              BGT     sg_gt
              BRA     done
      sg_gt   ADDQ.B  #4,D2
      done    SIMHALT
              END     START
    expect:
      regs: { D2: 5 }
checks:
  - type: choice
    prompt: "After `CMP D0,D1`, which branch means **D1 < D0 for signed numbers**, and which for unsigned?"
    options: ["Signed BLT, unsigned BCS", "Signed BCS, unsigned BLT", "Both BLT", "Both BCS"]
    answer: 0
    explain: "From the lecture's table: D1 < D0 is BLT (signed) and BCS, branch on carry set (unsigned). The unsigned test is a borrow, so it uses the carry flag."
  - type: choice
    prompt: "Match **D1 > D0**: which branch for signed, which for unsigned?"
    options: ["Signed BGT, unsigned BHI", "Signed BHI, unsigned BGT", "Signed BGE, unsigned BCC", "Signed BLE, unsigned BLS"]
    answer: 0
    explain: "D1 > D0: BGT for signed numbers and BHI (higher) for unsigned. D1 >= D0 is BGE (signed) and BCC (carry clear, unsigned). D1 <= D0 is BLE and BLS. Equality BEQ/BNE is the same for both."
  - type: choice
    prompt: "D0 = $FF and D1 = $01 as bytes. After `CMP.B D0,D1`, which of these is true?"
    options: ["Unsigned: D1 < D0 (1 < 255). Signed: D1 > D0 (1 > -1)", "Unsigned and signed agree that D1 < D0", "Unsigned and signed agree that D1 > D0", "Z is set"]
    answer: 0
    explain: "$FF is 255 unsigned but -1 signed. The program above takes BCS and BGT and not BLT (result 1 + 4 = 5), confirmed on the core. Choosing the wrong branch type is the signed/unsigned trap in Homework 3."
  - type: choice
    prompt: "Which branch is the same for signed and unsigned numbers?"
    options: ["BEQ and BNE", "BGT", "BCS", "BLS"]
    answer: 0
    explain: "Equality is the same either way: BEQ and BNE test only the Z flag."
card:
  front: "Table of branches after CMP D0,D1 for signed and unsigned numbers?"
  back: "D1<D0: BLT / BCS. D1<=D0: BLE / BLS. D1=D0: BEQ / BEQ. D1<>D0: BNE / BNE. D1>D0: BGT / BHI. D1>=D0: BGE / BCC. (Signed / unsigned.)"
glossary: []
---

## Learn

`CMP D0,D1` computes D1 - D0. Whether D1 is "less than" D0 depends on whether the bytes are **signed or unsigned**, and each case has its own branch instruction:

| Relationship | Signed | Unsigned |
|---|---|---|
| D1 < D0 | **BLT** | **BCS** (branch on carry set) |
| D1 <= D0 | BLE | BLS |
| D1 = D0 | BEQ | BEQ |
| D1 <> D0 | BNE | BNE |
| D1 > D0 | **BGT** | **BHI** |
| D1 >= D0 | BGE | **BCC** (branch on carry clear) |

The same bit pattern can be both: `$FF` is 255 unsigned but -1 signed. With D0 = $FF and D1 = $01, unsigned says D1 < D0 and signed says D1 > D0. The assembler does not know which you meant, so you must choose the matching branch. (The course homework asks for both readings.)

## Worked example

*D0 = $80, D1 = $7F as bytes. After `CMP.B D0,D1`, which branches are taken for D1 > D0?*

1. Unsigned: $7F = 127, $80 = 128, so D1 < D0: **BHI is not taken**.
2. Signed: $7F = +127, $80 = -128, so D1 > D0: **BGT is taken**.
3. Same bits, opposite answers.

## Try it

*You are finding the largest of some unsigned bytes. Which branch should replace BGE in the lecture's program?*

???

An unsigned "higher or same" branch: **BCC** (equivalently BHS). That is what makes `$90` count as larger than `$42`.
