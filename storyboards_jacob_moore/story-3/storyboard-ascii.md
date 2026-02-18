# Storyboard: Share Ride Tracking with Family

**User Story:** As a single mom who is trying to get transport of kids, I want to share live ride tracking with a trusted family member so that someone else can monitor our trip.

**Persona:** Maria, 34, single working mom. Her mother Rosa often watches the kids' whereabouts.
**Scenario:** Maria is in a ride with her kids heading to soccer practice. She wants Grandma Rosa to see their location in real-time.

---

## Panel 1: Trip In Progress
**Context:** Maria and her two kids (ages 6 and 9) are in a ride heading to soccer practice. The trip is underway and the app displays the live map, route, driver information, and ETA. Maria wants to let Grandma Rosa follow along.
**Action:** Maria looks at the trip screen showing the map with the route, driver details, and estimated arrival time. She taps the prominent "Share Trip" button in the bottom toolbar.
**System Response:** The app highlights the "Share Trip" button and transitions to the share trip screen, loading Maria's previously saved trusted contacts.
**Emotion:** Maria feels a mild sense of responsibility. She wants her mom to know where the kids are so everyone can feel safe during the ride.

```
+-------------------------+
|  9:41        LTE    ... |
|  Trip in Progress       |
|+=======================+|
||                       ||
||    o - - - - > o      ||
||   Home     Soccer     ||
||                       ||
|+=======================+|
|  (O) James R.  4.9 *   |
|  Toyota Highlander      |
|-------------------------|
|  ETA: 3:45 PM - 12 min |
|-------------------------|
|                         |
| [Share Trip] [Safety]   |
|          [Contact]      |
+-------------------------+
```

---

## Panel 2: Share Trip with Trusted Contact
**Context:** The Share Trip screen is now open. Maria sees her pre-saved trusted contacts list. Grandma Rosa is at the top of the list. Maria can also choose how to share (SMS, WhatsApp, or a direct link).
**Action:** Maria taps on Grandma Rosa's name, which selects her with a checkmark. She then taps the "Share with Rosa" confirmation button at the bottom of the screen.
**System Response:** The system marks Rosa as the selected recipient, shows a checkmark next to her name, and activates the confirmation button. Once confirmed, the app sends a live tracking link to Rosa via her preferred contact method and displays a brief "Shared!" toast notification.
**Emotion:** Maria feels relieved and reassured. Sharing is fast and requires only two taps since her trusted contacts were already saved.

```
+-------------------------+
|  9:41        LTE    ... |
|  < Share Your Trip      |
|-------------------------|
|  Trusted Contacts       |
|-------------------------|
|  (O) Grandma Rosa    v  |
|      Mom                |
|  (O) Uncle David        |
|      Uncle              |
|  [+ Add Contact]        |
|-------------------------|
|  Share via:             |
|  [SMS] [WhatsApp] [Link]|
|                         |
|  +=====================+|
|  |  Share with Rosa    ||
|  +=====================+|
+-------------------------+
```

---

## Panel 3: Rosa Receives Live Tracking
**Context:** Grandma Rosa is at home. She receives a notification on her phone that Maria has shared a ride with her. She taps the notification to open the live tracking view.
**Action:** Rosa opens the live tracking link and sees a map with the car's current position, the route from home to the soccer fields, and an info card showing the driver name, vehicle, and estimated arrival time (8 minutes remaining).
**System Response:** The system renders a real-time map view with the ride's current location, the route path, driver information, and a countdown ETA. Rosa also has quick-action buttons to call Maria or the driver directly if needed.
**Emotion:** Rosa feels connected and at ease. She can see exactly where her grandchildren are and how long until they arrive, without having to call or text Maria during the ride.

```
+-------------------------+
|  9:41        LTE    ... |
|  Live Trip Tracking  RS |
|+=======================+|
||                       ||
||  o - - >[]- - > o    ||
|| Home    car   Soccer  ||
||                       ||
|+=======================+|
| Maria's Trip            |
| Driver: James R.        |
|  Toyota Highlander      |
| ETA: 3:45 PM (8 min)   |
| Home -> Soccer Fields   |
|-------------------------|
| [Call Maria]            |
|          [Call Driver]  |
+-------------------------+
```

---

## Panel 4: Trip Completed Safely
**Context:** The ride has arrived at the soccer fields. The trip is now complete. Both Maria and Rosa receive notifications confirming the safe arrival.
**Action:** Maria sees the "Trip Complete" screen with a summary showing the destination, trip duration, and confirmation that the trip was shared with Grandma Rosa. Rosa simultaneously receives a "Trip Completed Safely" push notification on her phone.
**System Response:** The system displays the completed route on the map with start and end markers, shows trip details (destination, duration, sharing status), and prompts Maria to rate the driver. Rosa's tracking view updates to show "Trip Completed Safely" with the arrival confirmation.
**Emotion:** Both Maria and Rosa feel a sense of relief and safety. Maria is confident that her family support network was informed throughout the trip. Rosa is grateful she could watch over her grandchildren remotely.

```
+-------------------------+
|  9:41        LTE    ... |
|  Trip Complete    [v]   |
|+=======================+|
||                       ||
||  o =========== o      ||
|| Home        Soccer    ||
||                       ||
|+=======================+|
| Arrived: Soccer Fields  |
| Duration: 18 min        |
| Shared: Grandma Rosa v  |
|-------------------------|
| Rate your trip          |
|  * * * * *              |
|                         |
| [Rate Driver]  [Done]  |
+-------------------------+
```

---
