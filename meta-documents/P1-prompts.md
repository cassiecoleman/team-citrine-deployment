# P1 Prompts — Team Citrine

## Agreed-Upon Interview Questions (All 3 Use These)

1. How do you currently get around for daily transportation?
2. You are a regular user of taxis in a large city core (NYC, etc). Think of your common frustrations with the process of using a cab.
3. You are a regular user of Uber and/or Lyft. What are your common frustrations with the process of using these apps?  
4. In what circumstances do you find yourself hailing a cab as opposed to driving yourself, walking, or using public transportation?
5. How important is price predictability vs. getting the lowest possible fare?
6. How do you feel about scheduling rides in advance vs. requesting on-demand?
7. What safety features matter most to you in a ride-sharing app?
8. How would you feel about being able to favorite/request specific drivers?
9. What would a "commuter package" (e.g., 20 rides/month for a flat fee) be worth to you?
10. If this product existed today, what would stop you from using it?

---

## Part 1: User Discovery — Persona Interview Prompts

### Cassie — Persona from List 1–7

**Opening prompt (paste into Gemini link):**

> Hi! I'm part of Team Citrine and we're developing Ultra, a ride-sharing platform designed for underserved rider groups — specifically parents who need child-safe rides, car-free commuters who depend on rides for work, and budget-conscious riders who want predictable pricing.
>
> I'd like to do a user discovery interview with you. I'll ask about 10 questions about your transportation needs and experiences. Please answer from your genuine perspective and feel free to elaborate.
>
> Let's start: How do you currently get around for daily transportation?

Then ask each of the 10 questions above one at a time, following up naturally on interesting answers.

**Closing prompt:**

> Thank you! Two final questions: If Ultra existed today and offered features like scheduled rides, upfront flat pricing, commuter packages, and the ability to favorite trusted drivers — would you use it? And what would you be willing to pay per ride compared to what you pay now?

---

### Derron — Persona from List 1–7

**Opening prompt (paste into Gemini link):**

> Hello! I'm working on a startup called Ultra — it's a ride-sharing app built specifically for people who are underserved by Uber and Lyft. Our target users include parents needing safe rides for kids, people without cars who rely on rides to get to work, and riders who want transparent, affordable pricing.
>
> I'd love to learn about your transportation habits and pain points through a short interview of about 10 questions. Please share openly — there are no wrong answers.
>
> First question: How do you currently get around for daily transportation?

Then ask each of the 10 questions above one at a time, following up naturally on interesting answers.

**Closing prompt:**

> Last couple of questions: What feature would be the single biggest reason you'd try Ultra? And is there anything about ride-sharing apps that we haven't discussed that you think is important?

---

### Jacob — Persona from List 8–10

**Opening prompt (paste into Gemini link):**

> Hi there! My team is building Ultra, a ride-sharing platform that differentiates itself from Uber/Lyft by focusing on three underserved groups: parents who need child-safe vehicle options, daily commuters without cars who need reliability guarantees, and price-sensitive riders who want subscription-style packages instead of surge pricing.
>
> I'd like to interview you about your transportation needs and experiences. I have about 10 questions — please answer honestly and feel free to go into detail.
>
> To start: How do you currently get around for daily transportation?

Then ask each of the 10 questions above one at a time, following up naturally on interesting answers.

**Closing prompt:**

> Wrapping up: If you could design your ideal ride-sharing experience from scratch, what would it look like? And how much would you realistically pay per month for a ride service you could count on?

---

## Part 2: User Stories — Team Prompt (Pair Programming)

Use with a regular LLM (ChatGPT, Claude, etc.). One person drives, rotate every 20–30 min.

**Initial prompt:**

> We're building Ultra, a ride-sharing app for underserved rider demographics. Our core user groups are:
> 1. Parents (especially single parents) who need child-safe, reliable rides for their kids
> 2. Car-free commuters who depend on rides to get to work daily
> 3. Budget-conscious riders who want predictable, affordable pricing
>
> Generate a feature-complete set of ten user stories organized under epics. Each story should follow the format: "As a [type of user], I want [goal] so that [benefit]."
>
> Make sure stories cover: ride booking/scheduling, safety features, pricing/payments, driver management, real-time tracking, notifications, account management, and any other essential features.

**Follow-up prompt:**

> Review these stories against INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable) criteria. Flag any that violate INVEST and suggest improvements. Also check: are we missing any essential features that a ride-sharing app needs to function?

---

## Part 3: UX Storyboard — Team Prompt (Pair Programming)

**Prompt:**

> We're building Ultra, a ride-sharing app. Here are our most valuable user stories representing our core business value:
>
> [PASTE THE EPIC/STORIES YOU SELECTED]
>
> Create a UX storyboard in Markdown showing how a user engages with Ultra to benefit from these features. Include:
> - Scene-by-scene panels (6–8 panels)
> - Each panel should have: a title, ASCII art illustration, description of what the user is doing, and what the app is showing
> - Show the complete user journey from opening the app to completing the task
> - Make the ASCII art simple but clear

---

## Part 4: Architecture — Team Prompt (Pair Programming)

**Prompt:**

> We're building Ultra, a ride-sharing app with these features:
>
> [PASTE YOUR FINAL USER STORIES/EPICS]
>
> Create a software architecture document in Markdown with ONLY:
>
> 1. An Architecture Diagram — using Mermaid syntax in a fenced code block. Show where components run (client mobile app, backend server, cloud services, third-party APIs) and what information flows between them.
>
> 2. APIs — specify the backend APIs the system will use. For each endpoint, show the HTTP method, path, request/response format, and brief description.
>
> Make sure the APIs are consistent with the components in the architecture diagram — every API should correspond to a component that exists in the diagram.

---

## Part 5: Team Reflection — Team Prompt

Write together (no LLM needed). For each part (1–4), answer:

- **What worked well?** (1 paragraph)
- **What key problems did you encounter and how did you overcome them?** (1 paragraph)
