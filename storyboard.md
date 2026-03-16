# UX Storyboard — Ultra Ride-Sharing App

**Team Citrine** | Spring 2026

---

## Selected Feature: Epic 3 — Pricing & Payments

We selected Epic 3 (Pricing & Payments) as the feature set that best represents Ultra's core business value. Across all three user discovery interviews, **price predictability** was the single most repeated concern. Every persona expressed frustration with surge pricing and a willingness to pay more for cost certainty. The two stories in this epic — subscribing to a weekly ride pass (US05) and splitting a fare with a co-rider (US06) — directly address that pain point and represent what distinguishes Ultra from Uber and Lyft.

---

# Storyboard 1: Lock In a Predictable Weekly Rate (US05)

**User Story:** As a budget-conscious rider, I want to subscribe to a weekly ride pass at a fixed price for my regular commute route, so that I can budget my transportation costs without worrying about surge pricing.

**Persona:** James, 28, a car-free software developer who commutes daily from his apartment to a downtown office. He spends $15-25/ride on Uber depending on surge and is tired of unpredictable costs.

**Scenario:** It's the 1st of the month. James opens Ultra to subscribe to a weekly commute pass after hearing about it from a coworker.

---

## Panel 1: Discovering the Ride Pass

**Context:** James opens the Ultra app on a Monday morning, planning to book his usual commute to the office. He's been dreading the price — last Friday's ride cost $24 due to surge pricing. A coworker recently told him about Ultra's Ride Pass feature, and he's looking for it.

**Action:** James notices a prominent blue banner on the home screen just below the map that reads "Ride Pass — Save up to 25% on your commute." He taps the banner.

**System Response:** The home screen displays the standard map view with James's saved locations (Home, Office) as quick-pick options. The Ride Pass banner sits between the map and the "Where to?" search bar, featuring a subtle animation to draw attention. Tapping it navigates to the Ride Pass marketplace.

**Emotion:** Curiosity and hope. James has been frustrated by unpredictable costs for months. Seeing a dedicated feature that promises savings feels like the app finally understands his pain point. He's eager to learn more.

```
┌───────────────────────┐
│ 9:41            100%  │
│───────────────────────│
│ ☰  Ultra          🔔  │
│───────────────────────│
│                       │
│  ┌─────────────────┐  │
│  │   ~ ~ map ~ ~   │  │
│  │                  │  │
│  │  📍 You are here │  │
│  │                  │  │
│  └─────────────────┘  │
│                       │
│ ┌─────────────────────┐│
│ │ 🎫 Ride Pass        ││
│ │ Save up to 25% on  ││
│ │ your commute  ➜     ││
│ └─────────────────────┘│
│                       │
│  🔍 Where to?         │
│                       │
│  🏠 Home        ⭐    │
│  🏢 Office      ⭐    │
│                       │
│  🏠    🔍    🎫    👤  │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us05-wireframe-1.svg)

---

## Panel 2: Browsing Weekly Plans

**Context:** James lands on the Ride Pass marketplace. The app has detected his most frequent route (Home to Office) based on ride history and presents tailored plan options. He can see how much he currently spends versus what the pass would cost.

**Action:** James scrolls through the available plans. He sees a "Weekly Commute" pass for his Home-to-Office route at $75/week for 5 rides. Below the plan, the app shows his average weekly spend of $100 on the same route. He taps the $75/week plan to see details.

**System Response:** The Ride Pass screen displays James's detected route at the top with a small map preview. Below it, plan cards show pricing tiers: a 5-ride weekly plan at $75 and a 10-ride weekly plan at $140. Each card includes a comparison showing estimated savings. The selected plan highlights with a blue border. A "Your Spending" section shows a bar chart comparing his current average ($100/week) against the pass price ($75/week).

**Emotion:** Pleasant surprise and validation. Seeing his actual spending data compared side-by-side with the pass price makes the value immediately obvious. James feels like this was designed for people exactly like him — the $25/week savings would add up to over $100/month.

```
┌───────────────────────┐
│ 9:41            100%  │
│───────────────────────│
│ ←  Ride Pass      🔔  │
│───────────────────────│
│                       │
│  Your Route           │
│  🏠 Home → 🏢 Office  │
│  4.2 mi · ~18 min     │
│                       │
│ ┌─────────────────────┐│
│ │ ✦ Weekly Commute    ││
│ │   5 rides/week      ││
│ │                     ││
│ │   $75/week     BEST ││
│ │   $15.00/ride       ││
│ │   Save $25/wk ✓     ││
│ └─────────────────────┘│
│ ┌─────────────────────┐│
│ │   10 rides/week     ││
│ │   $140/week         ││
│ │   $14.00/ride       ││
│ └─────────────────────┘│
│                       │
│  📊 Your Spending     │
│  Avg now:  $100/wk ██████│
│  With pass: $75/wk ████ │
│                       │
│  🏠    🔍    🎫    👤  │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us05-wireframe-2.svg)

---

## Panel 3: Review and Subscribe

**Context:** James has selected the 5-ride weekly plan at $75/week. The app presents a detailed review screen with all the plan terms before he commits. He wants to make sure he understands what he's signing up for — especially cancellation flexibility.

**Action:** James reads through the plan summary: route, schedule, pricing, and terms. He sees that the pass auto-renews weekly but can be canceled anytime before the next billing cycle. His saved payment method (Visa ending in 4821) is pre-selected. Satisfied with the terms, he taps "Subscribe — $75/week."

**System Response:** The review screen displays a structured summary: the route (Home to Office), ride window (Mon-Fri, 7:00 AM - 9:00 AM / 5:00 PM - 7:00 PM), price ($75/week, billed every Monday), ride allowance (5 rides), surge protection (included), cancellation policy (cancel anytime, effective next cycle), and payment method. A large green "Subscribe" button anchors the bottom of the screen. After tapping, a brief loading spinner appears followed by a success checkmark animation.

**Emotion:** Confidence and decisiveness. The transparent terms — especially "cancel anytime" and "surge protection included" — eliminate James's hesitation. He feels in control of the decision rather than locked into a commitment he might regret.

```
┌───────────────────────┐
│ 9:41            100%  │
│───────────────────────│
│ ←  Review Plan    🔔  │
│───────────────────────│
│                       │
│  ✦ Weekly Commute Pass│
│  ─────────────────────│
│  📍 Home → Office     │
│  📅 Mon - Fri         │
│  🕐 7-9 AM / 5-7 PM  │
│  🎫 5 rides included  │
│  🛡️ Surge protection  │
│                       │
│  ─────────────────────│
│  Price    $75.00/week │
│  Billed  Every Monday │
│  Cancel  Anytime      │
│  ─────────────────────│
│                       │
│  💳 Visa ····4821     │
│     [Change method]   │
│                       │
│ ┌─────────────────────┐│
│ │ ✓ Subscribe $75/wk  ││
│ └─────────────────────┘│
│  🏠    🔍    🎫    👤  │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us05-wireframe-3.svg)

---

## Panel 4: Pass Active — Confirmation and Savings Tracker

**Context:** James has successfully subscribed. The app transitions to a confirmation screen showing his active Ride Pass. It's Monday morning, and his first pass ride is ready to be used. The screen serves as both a receipt and a dashboard for tracking his ongoing savings.

**Action:** James reviews his active pass. He sees a green "Active" badge, his next scheduled ride (today at 8:15 AM, Home to Office), and a savings tracker showing projected monthly savings. He smiles, screenshots the screen to send to his coworker, and taps "Book First Ride" to use his pass immediately.

**System Response:** The confirmation screen displays a card with a green "Active" status badge and the pass details. Below it, a "Next Ride" section shows his upcoming commute with a one-tap booking button. A savings tracker at the bottom displays: current week savings ($0 of $25 projected), and estimated monthly savings ($100). The "Book First Ride" button is prominent, encouraging immediate use. A subtle confetti animation plays on load to celebrate the subscription.

**Emotion:** Relief and excitement. For the first time in months, James knows exactly what his commute will cost this week — and every week going forward. The savings tracker turns an abstract benefit into something tangible. He feels smart for making the switch and grateful to his coworker for the recommendation.

```
┌───────────────────────┐
│ 9:41            100%  │
│───────────────────────│
│ ←  My Ride Pass   🔔  │
│───────────────────────│
│                       │
│  ┌─────────────────┐  │
│  │ ✦ Weekly Commute│  │
│  │    ● Active     │  │
│  │                 │  │
│  │ 🏠 Home → 🏢 Office│
│  │ 5 rides · $75/wk│  │
│  │ Renews: Mar 23  │  │
│  └─────────────────┘  │
│                       │
│  Next Ride            │
│  📅 Today · 8:15 AM   │
│  🏠 Home → 🏢 Office  │
│  🎫 Pass ride (1 of 5)│
│                       │
│ ┌─────────────────────┐│
│ │  🚗 Book First Ride ││
│ └─────────────────────┘│
│                       │
│  💰 Savings Tracker   │
│  This week:  $0/$25   │
│  Monthly est: ~$100   │
│  ░░░░░░░░░░░░░░░░░░  │
│                       │
│  🏠    🔍    🎫    👤  │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us05-wireframe-4.svg)

---

# Storyboard 2: Split a Fare with Another Rider (US06)

**User Story:** As a budget-conscious commuter, I want to split the cost of a ride with another Ultra user traveling a similar route, so that I can reduce my daily transportation expenses while still getting door-to-door service.

**Persona:** Aisha, 31, a budget-conscious nurse who works the day shift at a downtown hospital. She and her neighbor Kenji both commute to the same area each morning and have talked about splitting rides.

**Scenario:** It's Monday morning. Aisha wants to book a ride to work and split the fare with Kenji to save money.

---

## Panel 1: Booking a Ride

**Context:** It's Monday at 6:45 AM. Aisha is getting ready for her morning shift at the hospital. She opens the Ultra app to book her commute and notices a new "Split Fare" option on the booking screen alongside the standard ride options.

**Action:** Aisha types "Metro General Hospital" into the destination field. The app populates her home address automatically as the pickup location. Below the ride estimate of $19.00, she spots a "Split Fare" button with a small icon indicating shared cost. She taps it to explore the option.

**System Response:** The home screen loads with Aisha's saved home location pinned on the map. When she enters her destination, the app calculates the route and displays the estimated fare of $19.00 for a solo ride. A "Split Fare" button appears beneath the fare estimate, highlighted with a subtle badge reading "Save up to 50%." The map draws the route from her home to the hospital.

**Emotion:** Aisha feels hopeful and curious. She's been spending too much on daily rides and the prospect of cutting her fare in half is exactly what she needs. The prominently placed split option feels like the app understands her situation.

```
┌───────────────────────┐
│ 6:45          92%     │
│───────────────────────│
│ ☰  Ultra          🔔 │
│───────────────────────│
│                       │
│ ┌───────────────────┐ │
│ │    ·  ·           │ │
│ │  📍- - - - - 🏥   │ │
│ │    ·    MAP    ·   │ │
│ │  ·       ·        │ │
│ └───────────────────┘ │
│                       │
│ From:                 │
│ ┌───────────────────┐ │
│ │🏠 742 Elm St(Home)│ │
│ └───────────────────┘ │
│ To:                   │
│ ┌───────────────────┐ │
│ │🏥 Metro General   │ │
│ └───────────────────┘ │
│                       │
│  Estimated Fare       │
│  ┌───────────────────┐│
│  │  💳 $19.00  solo  ││
│  └───────────────────┘│
│                       │
│ ┌───────────────────┐ │
│ │👤👤 Split Fare    │ │
│ │   Save up to 50%  │ │
│ └───────────────────┘ │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us06-wireframe-1.svg)

---

## Panel 2: Inviting a Co-Rider

**Context:** Aisha has tapped the "Split Fare" button and is now on the co-rider invitation screen. She needs to select someone to share the ride with, and Kenji is already in her Ultra contacts since they exchanged info last week.

**Action:** Aisha sees a search bar at the top of the invite screen and a list of her Ultra contacts below it. She spots Kenji's name near the top of the list and taps on his profile to select him. The screen immediately updates to show the new cost breakdown with the fare split between two riders.

**System Response:** The app displays Aisha's Ultra contacts with profile pictures and names. When she selects Kenji, a split fare summary card appears showing the original fare ($19.00), the per-person cost ($9.50 each), and the total savings ($9.50). A text field is pre-filled with a default message: "Hey! Want to split a ride to the downtown area?" A green "Send Invite" button activates at the bottom. The app notes that Kenji's destination is within the shared route corridor.

**Emotion:** Aisha feels excited and empowered by the clear savings breakdown. Seeing the fare literally cut in half from $19.00 to $9.50 validates her decision. She's glad the process is simple and doesn't require exchanging cash or doing math later.

```
┌───────────────────────┐
│ 6:46          92%     │
│───────────────────────│
│ < Split Fare      🔔  │
│───────────────────────│
│                       │
│ Invite a Co-Rider     │
│ ┌───────────────────┐ │
│ │ 🔍 Search contacts │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ ✓ 👤 Kenji T.     │ │
│ │   📍 Near your rte │ │
│ ├───────────────────┤ │
│ │   👤 Priya M.     │ │
│ ├───────────────────┤ │
│ │   👤 David L.     │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │ Fare Breakdown    │ │
│ │                   │ │
│ │ Total:    $19.00  │ │
│ │ Your half: $9.50  │ │
│ │ Kenji:     $9.50  │ │
│ │ You save:  $9.50  │ │
│ └───────────────────┘ │
│                       │
│ ┌───────────────────┐ │
│ │  ✉ Send Invite    │ │
│ └───────────────────┘ │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us06-wireframe-2.svg)

---

## Panel 3: Co-Rider Accepts

**Context:** Aisha has sent the invite and is waiting on the confirmation screen. Within a minute, Kenji checks his phone, sees the Ultra notification, and accepts the shared ride. Aisha's screen updates in real time.

**Action:** Aisha watches the status indicator change from "Pending" to "Accepted" as Kenji confirms. The screen transitions to a shared ride summary showing both riders' pickup points on the map, the combined route, and the confirmed split price. Aisha reviews the details and taps "Confirm & Book" to finalize the ride.

**System Response:** The app receives Kenji's acceptance and triggers a confirmation animation. The map updates to display two pickup pins — Aisha's home and Kenji's address one block away — connected by a blue route line to the downtown hospital area. Both rider profiles appear side by side with green checkmarks. The confirmed fare of $9.50 per person is displayed prominently. A driver is shown being matched, with an ETA of 8 minutes. The "Confirm & Book" button pulses to prompt Aisha to finalize.

**Emotion:** Aisha feels a wave of relief and satisfaction. The quick acceptance from Kenji makes the whole process feel seamless. Seeing both their names confirmed on screen with the split cost locked in gives her confidence that the morning commute is sorted and affordable.

```
┌───────────────────────┐
│ 6:48          91%     │
│───────────────────────│
│ < Shared Ride     🔔  │
│───────────────────────│
│                       │
│ ┌───────────────────┐ │
│ │  📍A · · ·        │ │
│ │  📍K · · → 🏥     │ │
│ │       MAP          │ │
│ └───────────────────┘ │
│                       │
│   Ride Confirmed!     │
│                       │
│ ┌─────────┬─────────┐ │
│ │ 👤 Aisha│ 👤 Kenji│ │
│ │   ✓     │   ✓     │ │
│ │  $9.50  │  $9.50  │ │
│ └─────────┴─────────┘ │
│                       │
│  Route: Elm St →      │
│    Oak Ave → Metro Gen│
│  ETA pickup: 8 min    │
│  Driver: Matching...  │
│                       │
│ ┌───────────────────┐ │
│ │ Confirm & Book    │ │
│ └───────────────────┘ │
│                       │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us06-wireframe-3.svg)

---

## Panel 4: Ride Complete

**Context:** The ride has been completed. Both Aisha and Kenji have been dropped off at their respective stops near the hospital. The app transitions to the post-ride receipt screen showing the final charges.

**Action:** Aisha opens the receipt notification after arriving at work. She sees a detailed breakdown of the ride: total fare, her individual charge, Kenji's charge, and a highlighted savings summary. She smiles at the amount saved and taps the "Rate Ride" button to leave feedback. She also notices a "Ride Again" shortcut to rebook the same split fare for tomorrow.

**System Response:** The app displays a clean receipt card with the ride summary. The total fare is $19.00, with $9.50 charged to Aisha's card and $9.50 charged to Kenji's card. A green savings banner highlights "You saved $9.50 on this ride!" Below the receipt, the app shows a weekly savings tracker indicating Aisha could save $47.50 per week by splitting fares on all five commutes. Two action buttons appear: "Rate Ride" and "Ride Again Tomorrow."

**Emotion:** Aisha feels accomplished and financially smart. Seeing the concrete savings on her receipt reinforces that splitting the fare was a great decision. The weekly projection motivates her to make this a regular habit. She heads into work feeling lighter, knowing she's found a sustainable way to cut commute costs.

```
┌───────────────────────┐
│ 7:22          87%     │
│───────────────────────│
│ ☰  Ultra          🔔 │
│───────────────────────│
│                       │
│    🧾 Ride Receipt    │
│                       │
│ ┌───────────────────┐ │
│ │ 🏠 Elm → 🏥 Metro │ │
│ │ Mon 7:01-7:19 AM  │ │
│ ├───────────────────┤ │
│ │ Total Fare $19.00 │ │
│ ├───────────────────┤ │
│ │ 👤 Aisha   $9.50  │ │
│ │   💳 Visa ··4821  │ │
│ │ 👤 Kenji   $9.50  │ │
│ │   💳 Visa ··7733  │ │
│ ├───────────────────┤ │
│ │ ✓ You saved $9.50!│ │
│ └───────────────────┘ │
│                       │
│ 💡 Save $47.50/week  │
│  by splitting daily!  │
│                       │
│ ┌─────────┬─────────┐ │
│ │Rate Ride│Ride Again│ │
│ │  ⭐⭐⭐  │Tomorrow  │ │
│ └─────────┴─────────┘ │
└───────────────────────┘
```

![Wireframe](storyboard-svgs/us06-wireframe-4.svg)

---

## AI Chat Transcripts

| Purpose | Tool | Link / File |
|---------|------|-------------|
| Storyboard generation (US05 + US06 ASCII art and narrative) | Claude (Anthropic) | Generated during creation of this document |
| SVG wireframe generation (US05 + US06) | Claude (Anthropic) | Generated during creation of this document |
