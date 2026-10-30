---
track: shared
title: "Formal design reviews"
summary: "Reviews find errors while they are cheap to fix; the aim is to find issues, not solve them or defend the design."
needs: [design-phases]
sources:
  - { type: slide, ref: "L1 s53", quote: "Studies have shown that a design review can have a return on investment" }
  - { type: slide, ref: "L1 s55", quote: "The purpose of the review is to identify issues, not to solve them" }
  - { type: slide, ref: "L1 s55", quote: "Circulate all of the pertinent design document at least 3 or 4 days ahead of the review" }
checks:
  - type: choice
    prompt: "What return on investment can a design review have, according to the lecture?"
    options: ["More than 20 times", "About the same as the cost", "Twice the cost", "None; it is only a formality"]
    answer: 0
    explain: "Studies have shown that a design review can have a return on investment of more than 20 times, because fixing a hardware defect in a released product is a nightmare."
  - type: choice
    prompt: "What is the **purpose** of the review meeting, and what does the designer do in it?"
    options: ["To identify issues, not solve them; the designer explains but does not defend the design", "To fix the design on the spot; the designer defends it", "To approve it quickly", "To assign blame"]
    answer: 0
    explain: "The moderator leads and notes each issue; the designer offers some explanations but does not try to defend the design."
  - type: choice
    prompt: "When should the **review documents** (schematics, data sheets, code, timing calculations) be circulated?"
    options: ["At least 3 or 4 days before the review", "At the start of the meeting", "After the review", "Never"]
    answer: 0
    explain: "Circulate all the pertinent design documents at least 3 or 4 days ahead. Pick one to three reviewers and a moderator/recording secretary about a week before."
  - type: choice
    prompt: "After the review, who writes the summary and who addresses the issues?"
    options: ["The moderator writes the summary; the designer addresses each issue and writes a final report", "The designer writes both", "The lab manager does both", "Nobody"]
    answer: 0
    explain: "The moderator writes the summary of the contents and the issues and sends it to the lab manager and the participants; the designer then addresses each issue and writes up how each was handled. A follow-up review may be scheduled if the design changed substantially; once everyone signs off, the design moves to PC board layout."
card:
  front: "How does a formal design review work and why do it?"
  back: "Pick 1-3 reviewers plus a moderator a week ahead; circulate documents 3-4 days before; in the meeting the moderator lists issues (the goal is to identify, not solve; the designer explains but does not defend); moderator writes the summary; designer fixes and reports; follow-up review if needed; sign-off before PCB layout. ROI above 20x."
glossary:
  - { term: "Design review", def: "A formal meeting where other engineers examine a design to find issues while they are cheap to fix." }
---

## Learn

The **hardware design review** is arguably more important than a software design review. A formal review finds errors when they are relatively easy to fix (fixing a hardware defect in a released product is a nightmare), and studies show a **return on investment of more than 20 times**.

The process in the lecture:

1. About a week before, choose **one to three reviewers and a moderator/recording secretary**.
2. Make sure engineers have time in their schedules for lab-wide reviews; everyone takes turns.
3. **Circulate the documents** (schematics, data sheets, ABEL or Verilog code, timing calculations, simulations) at least **3 or 4 days ahead**.
4. In the review the moderator leads; reviewers raise issues. **The purpose is to identify issues, not to solve them.** The designer explains but **does not defend** the design. The moderator notes each issue and whether it needs follow-up.
5. At the end the moderator restates each issue needing attention.
6. The moderator writes the summary and sends it to the lab manager and participants.
7. The designer addresses each issue and writes up how.
8. A **follow-up review** may be needed if there were many issues or substantial changes.
9. After sign-off, the design can move to **PC board layout**.

The lecture's HP story makes the point from another side: a retrained hardware engineer who never had a software bug logged against him explained, "I didn't know that I was allowed to have bugs."

## Worked example

*A reviewer says 'your regulator's footprint looks wrong'. How should the designer respond?*

1. Note it; ask clarifying questions if needed; do not argue the design is right.
2. The moderator records it as an issue to follow up.
3. After the meeting the designer checks the data sheet and reports how it was resolved.

## Try it

*Why is it a bad idea to fix problems during the review meeting?*

???

The meeting's job is to identify issues quickly with several people present; solving them there wastes everyone's time. Issues are fixed afterwards and reported in a write-up.
