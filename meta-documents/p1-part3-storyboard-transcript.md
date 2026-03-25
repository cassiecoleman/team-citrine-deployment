# P1 Part 3: Storyboard — AI Chat Transcript

**Tool:** Claude Code (Claude Opus 4.6, Anthropic)
**Date:** March 16, 2026
**Team:** Citrine (Jacob Moore, Cassie Coleman, Derron Dowdy)

---

## Session Overview

This transcript documents the AI-assisted creation of the Part 3 UX Storyboard deliverable for the Ultra ride-sharing app. The session covered the full project workflow from initial planning through final deliverable generation.

---

## Conversation Flow

### 1. Project Orientation

**User:** Provided the P1 assignment spec and asked for a step-by-step guide for approaching the project. Noted that some in-class work existed in the repo but needed to be redone for the project submission.

**Claude:** Explored the existing repo contents (US06-10 user stories, Jacob's storyboard folder, architecture document). Identified the product as "Ultra" — a ride-sharing platform for underserved demographics. Produced a step-by-step guide covering all 5 parts of the assignment with suggested prompts for each team member.

---

### 2. Prompt File Creation

**User:** Asked to put prompts into a markdown file `P1-prompts.md` with team member names Cassie, Derron, and Jacob.

**Claude:** Created `P1-prompts.md` with:
- 10 agreed-upon semi-structured interview questions
- 3 persona interview opening/closing prompts (one per team member)
- Team prompts for Parts 2–5

Committed and pushed to repo.

---

### 3. Interview Transcript Formatting

**User:** Provided the raw Gemini interview transcript for Persona 8 (Jacob Moore's interview) and asked to format it into a markdown file with synthesis of core concerns.

**Claude:** Created `p1-part1-user_discovery_interview-jacob_moore.md` with:
- Formatted Q&A with clear persona/interviewer labels
- All 10 questions and responses preserved
- Synthesis section identifying 5 core repeated concerns:
  1. Price predictability above all else
  2. Fear of making mistakes / tech anxiety
  3. Strong preference for routine and familiarity
  4. Safety and personal security
  5. Need for guided onboarding

Committed and pushed.

---

### 4. User Discovery Summary

**User:** Asked to create `user-discovery.md` based on interview results. Provided notes on the startup concept, including the subscription model as the key differentiator. Made manual edits to the file.

**Claude:** Read all three interview transcripts (Cassie/Persona 3, Derron/Persona 5, Jacob/Persona 8). Applied formatting improvements:
- Removed backtick wrapper and assignment instruction text
- Added proper markdown headings
- Converted personas/interviewers to a table
- Fixed transcript references to relative paths
- Added Value Proposition section

Committed and pushed.

---

### 5. Part 3: Storyboard Generation (Main Deliverable)

**User:** Asked to complete Part 3 using multiple parallel agents. Requested both ASCII and SVG storyboards, following the format of Jacob Moore's existing storyboards.

**Claude:** Read all input files:
- `p1-part2-user_stories.md` (10 user stories across 7 epics)
- All 3 interview transcripts
- Jacob's existing storyboard format (`storyboards_jacob_moore/story-1/`)

**Claude:** Asked which epic/stories to storyboard, presenting 4 options:
- A: Epic 3 — Pricing & Payments (US05 + US06)
- B: Epic 1 — Ride Booking & Scheduling (US01 + US02)
- C: Combo US01 + US05
- D: Epic 2 — Safety (US03 + US04)

**User:** Selected Option A (Epic 3: Pricing & Payments).

**Claude:** Launched 4 parallel agents:
1. **US05 ASCII storyboard** — Weekly ride pass subscription flow (James persona, 4 panels)
2. **US06 ASCII storyboard** — Fare splitting flow (Aisha + Kenji personas, 4 panels)
3. **US05 SVG wireframes** — 4 phone wireframe SVGs for the ride pass flow
4. **US06 SVG wireframes** — 4 phone wireframe SVGs for the fare splitting flow

**Output files created:**

`storyboard.md` — Main deliverable containing:
- Feature selection rationale (Epic 3, Pricing & Payments)
- Storyboard 1: US05 — Lock In a Predictable Weekly Rate (4 panels)
  - Panel 1: Discovering the Ride Pass (home screen with banner)
  - Panel 2: Browsing Weekly Plans (plan comparison with spending data)
  - Panel 3: Review and Subscribe (terms, payment, confirm)
  - Panel 4: Pass Active with Savings Tracker (confirmation dashboard)
- Storyboard 2: US06 — Split a Fare with Another Rider (4 panels)
  - Panel 1: Booking a Ride (destination entry, split fare option)
  - Panel 2: Inviting a Co-Rider (contact selection, cost breakdown)
  - Panel 3: Co-Rider Accepts (shared map, confirmed split price)
  - Panel 4: Ride Complete (receipt, savings summary)
- AI Chat Transcripts reference table

`storyboard-svgs/` — 8 SVG wireframe files:
- `us05-wireframe-1.svg` through `us05-wireframe-4.svg`
- `us06-wireframe-1.svg` through `us06-wireframe-4.svg`

Each panel followed the established format: Context, Action, System Response, Emotion, ASCII wireframe, and SVG reference.

Committed with message "Storyboards done, svg and ascii, for user stories 5 and 6" and pushed to origin.
