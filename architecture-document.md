# Ultra: Software Architecture Document

### A Ride-Sharing Platform to Compete with Uber and Lyft

**Team Citrine** | Software Engineering | Spring 2026

---

## Table of Contents

1. [Introduction and Problem Statement](#1-introduction-and-problem-statement)
2. [Architecture Theory Primer](#2-architecture-theory-primer)
3. [Functional Requirements Summary](#3-functional-requirements-summary)
4. [Mapping on a $0 Budget](#4-mapping-on-a-0-budget)
5. [Payment Processing Approaches](#5-payment-processing-approaches)
6. [Approach A: Microservices and Event-Driven Architecture](#6-approach-a-microservices-and-event-driven-architecture)
7. [Approach B: Modular Monolith with Layered Architecture](#7-approach-b-modular-monolith-with-layered-architecture)
8. [User Interaction Complexities](#8-user-interaction-complexities)
9. [Scaling Issues](#9-scaling-issues)
10. [Comparative Tradeoff Analysis](#10-comparative-tradeoff-analysis)
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns)
12. [Verification and Testing Strategy](#12-verification-and-testing-strategy)

---

## 1. Introduction and Problem Statement

Ultra is a ride-sharing platform designed to directly compete with Uber and Lyft by prioritizing the needs of underserved rider demographics: parents transporting children, car-free commuters who depend on ride-sharing for daily employment, and budget-conscious riders who need predictable pricing. The incumbent platforms treat these users as edge cases. Ultra treats them as the core product.

Our team's research produced ten user stories spanning two primary personas. The first is Maria, a 34-year-old single working mother of two children (ages 6 and 9), who needs to schedule recurring school rides, request child-safe vehicles with verified car seats, share live trip tracking with her mother Rosa, add multiple stops in a single trip (school, daycare, then office), and build a circle of trusted drivers she can preferentially book. The second persona is a car-free commuter who needs guaranteed morning pickups, upfront fare estimates with no surge surprises, commuter discount packages, real-time driver tracking to time their departure, and automatic backup rides if a driver cancels.

These stories expose requirements that fundamentally shape architecture: real-time bidirectional communication (tracking), complex state machines (multi-stop trips with shared ride pooling), time-critical reliability guarantees (backup rides within seconds of cancellation), and safety-sensitive workflows (child seat verification, guardian notifications). Ultra must deliver all of this while remaining cost-competitive enough to undercut incumbents on the commuter segment.

The key quality attributes driving our architectural decisions are: **reliability** (a cancelled driver must be replaced automatically, a scheduled ride must execute), **safety** (child-safe vehicles must be verified, trip sharing must work in real time), **scalability** (the system must handle rush-hour surges in a growing number of cities), **real-time performance** (driver location updates must reach riders within one to two seconds), and **affordability** (the technical stack must minimize infrastructure costs to support lower fares).

---

## 2. Architecture Theory Primer

Before presenting our designs, it is important to distinguish software architecture from object-oriented design. As Bass, Clements, and Kazman describe in *Software Architecture in Practice*, these exist on different levels of abstraction. **Requirements** specify the high-level "what" — a rider needs to track a driver. **Architecture** specifies the high-level "how" and mid-level "what" — a WebSocket gateway streams location events from a tracking service to connected clients. **Object-oriented design** specifies the mid-level "how" and low-level "what" — the `LocationUpdateHandler` class implements the `EventListener` interface and writes to a `RiderConnectionPool`. **Code** is the low-level "how." Architecture asks questions like "How does Ultra scale to millions of concurrent riders?" and "What is the interface between the matching subsystem and the pricing subsystem?" — not "What lock protects the driver location cache?"

### Why Multiple Views

Describing a system's architecture requires multiple views because no single diagram can capture all relevant perspectives. A view that shows which services exist (static structure) cannot also show how a ride request flows through them at runtime (dynamic behavior), nor can it show which servers host those services (physical deployment). Each view aligns with a purpose: reasoning about extensibility, reasoning about performance, reasoning about operational cost.

### The 4+1 View Model

We adopt Kruchten's 4+1 View Model, which structures documentation into five perspectives:

- **Logical View** — The system's functional decomposition: modules, services, and their dependencies. Answers "what are the major pieces?"
- **Process View** (Dynamic View) — Runtime behavior: processes, data flow, concurrency, and event sequencing. Answers "how do the pieces interact at runtime?"
- **Development View** — Code organization: packages, source repositories, build artifacts. Answers "how is the codebase structured for the development team?"
- **Physical View** (Deployment View) — Hardware and infrastructure: servers, containers, networks. Answers "where does the software run?"
- **Scenarios** (the +1) — Key use cases that thread through the other four views. Our user stories serve as these scenarios.

### Avoiding Ambiguity

The lecture on architecture documentation stresses that much of today's documentation consists of ambiguous box-and-line diagrams where an arrow might mean "passes data to," "creates," "depends on," or "gets electricity from." Every diagram in this document includes a legend that precisely defines what each box shape represents and what each arrow or line means. We do not mix view types within a single diagram — a module diagram will not accidentally include runtime processes, and a deployment diagram will not include class-level details.

### Patterns vs. Tactics

**Architectural patterns** are recurring structural solutions to broad design problems: "How do I organize my system?" Examples include microservices, layered architecture, client-server, event-driven, and pipe-and-filter. **Architectural tactics** are more focused techniques tied to specific quality attributes: "How do I improve availability?" (redundancy, failover, health checks) or "How do I improve performance?" (caching, load balancing, async processing). Patterns give the skeleton; tactics fill in the quality-attribute-specific muscle.

---

## 3. Functional Requirements Summary

Our ten user stories consolidate into four feature groups that each impose distinct architectural demands:

**Ride Lifecycle** — US04 (multi-stop trips), US06 (scheduled morning rides), US07 (upfront fare estimates). The system must support rides with variable numbers of stops, advance scheduling with driver pre-assignment, and fare calculation that accounts for distance, time, surge, and commuter discounts. The ride entity is the central domain object and its state machine (requested, matched, driver en route, arrived, in progress across N stops, completed, cancelled) is the backbone of the business logic.

**Safety and Trust** — US01 (schedule school pickup with recurring rides), US02 (child-safe vehicles with verified car seats), US03 (live trip sharing with family), US05 (trusted/favorited drivers). These stories require a driver verification pipeline (safety equipment audits), a guardian notification system, real-time trip sharing via tokenized links, and a preference-matching layer that tries trusted drivers first before falling back to the general pool.

**Reliability** — US06 (guaranteed pickup), US09 (real-time driver tracking), US10 (automatic backup ride on cancellation). The architecture must support driver pre-assignment for scheduled rides, sub-second location streaming, and an automated re-dispatch workflow that triggers instantly when a driver cancels — replacing the driver and notifying the rider with a revised ETA within seconds, not minutes.

**Affordability** — US07 (full fare breakdown), US08 (commuter ride packages). The pricing engine must show transparent per-component costs (base fare, distance, time, fees) and apply the best available discount automatically. Commuter packages (e.g., 10 rides for $99, 20 rides for $179) must decrement correctly and show savings at checkout.

---

## 4. Mapping on a $0 Budget

Ride-sharing is fundamentally a geospatial product. Maps are in every screen of the app — the home screen shows the rider's location, the booking flow shows the route, the in-ride screen tracks the driver in real time. Uber and Lyft spend significant sums on Google Maps Platform and Mapbox licenses. Ultra operates on a $0 mapping budget, which constrains our options to the open-source ecosystem built around **OpenStreetMap (OSM)**.

### Map Rendering: Two Options

**Option 1: Leaflet.js.** Leaflet is a lightweight, open-source JavaScript library for interactive maps. It renders raster tiles (pre-generated PNG images of map sections) on a `<canvas>` or DOM layer. Tile sources are free: OSM's community tile servers can be used for development (with attribution and rate limits), and for production, self-hosted tile servers like **TileServer GL** or free-tier services from **Stamen** or **Carto** can serve raster tiles at no cost. Leaflet is battle-tested, has extensive plugin support (routing overlays, marker clustering, real-time tracking), and works on every mobile browser. The tradeoff is that raster tiles look static — you cannot smoothly rotate or tilt the map, and styling changes require regenerating the entire tile set.

**Option 2: MapLibre GL JS.** MapLibre is the open-source fork of Mapbox GL JS (created after Mapbox changed its license). It renders vector tiles on the GPU, which means smooth zooming, rotation, 3D tilting, and fully customizable styling without regenerating tiles. Vector tiles are smaller and faster to transfer. Ultra can self-host a vector tile server using **OpenMapTiles** with a Docker container, or use free-tier vector tile providers. MapLibre provides a more modern, app-like experience that is closer to what Uber and Lyft ship. The tradeoff is higher client-side GPU requirements (older phones may struggle) and more complex self-hosting for tile generation.

### Routing and ETA

For route calculation and ETA estimation, Ultra needs an open-source routing engine. **OSRM (Open Source Routing Machine)** is the industry standard — it precomputes contraction hierarchies from OSM data and returns driving routes with turn-by-turn directions in milliseconds. **Valhalla** (originally by Mapzen, now maintained by the community) supports more flexible routing profiles and time-based isochrones. **GraphHopper** is another option with a Java/JVM stack that integrates well with server-side systems.

The critical tradeoff compared to Google Maps is **traffic data**. Google has real-time traffic from billions of Android phones. OSM-based routing engines use static road speeds. Ultra can partially compensate by collecting anonymized driver speed data as drivers use the platform (a feedback loop that improves with scale), but early-stage ETAs will be less accurate than incumbents. For an MVP, this is acceptable — the ETA is an estimate, and riders adapt quickly to small inaccuracies.

### Geocoding

Address search ("Lincoln Elementary" to latitude/longitude) uses **Nominatim**, the OSM geocoder, or **Pelias**, a modular open-source geocoder that can import OSM, Who's On First, and other datasets. Both are free and self-hostable.

---

## 5. Payment Processing Approaches

A ride-sharing platform has a three-party payment flow: the rider pays, the platform retains a commission (typically 20-30%), and the driver receives the remainder. This is a marketplace model that requires specific payment infrastructure.

### Approach A: Stripe (with Stripe Connect)

Stripe is the most developer-friendly payment processor for marketplace applications. **Stripe Connect** is purpose-built for platforms that facilitate payments between buyers (riders) and sellers (drivers). Each driver onboards as a "connected account" — Stripe handles identity verification, tax form collection (1099s), and direct bank deposits.

The payment flow for a ride: (1) When the rider requests a ride, Ultra creates a **payment intent** with an authorization hold for the estimated fare. The rider's card is authorized but not charged. (2) During the ride, if the route changes (additional stops, longer distance), Ultra can update the payment intent amount. (3) When the ride completes, Ultra **captures** the final fare amount. (4) Stripe automatically splits the payment: the platform fee goes to Ultra's account, the remainder goes to the driver's connected account, typically arriving in 1-2 business days (or instantly for an additional fee).

Stripe's pricing is 2.9% + $0.30 per successful charge, plus 0.25% + $0.25 for Connect payouts. For a $15 ride, the total processing cost is approximately $0.99 (about 6.6%). Stripe handles PCI compliance entirely — Ultra never touches raw card numbers. The card tokenization happens in Stripe's JavaScript SDK (Stripe Elements) on the client side, so Ultra's servers only see tokens.

Stripe's advantages: exceptional developer documentation, robust webhook system for event-driven payment status updates, built-in fraud detection (Radar), support for Apple Pay and Google Pay, and a mature dispute resolution process. For our architecture, Stripe's webhook model (payment events pushed to our servers) integrates naturally with event-driven designs.

### Approach B: Braintree (PayPal)

Braintree, owned by PayPal, offers a competing marketplace solution. Its core differentiator is native integration with **PayPal** and **Venmo** — two payment methods with massive installed bases among younger, budget-conscious demographics (Ultra's target market). Braintree's "Marketplace" feature mirrors Stripe Connect: sub-merchants (drivers) receive payouts from platform-facilitated transactions.

The payment flow is structurally identical to Stripe: authorize at booking, capture at completion, split between platform and driver. Braintree's pricing is 2.59% + $0.49 per transaction. For a $15 ride, processing costs approximately $0.88 (about 5.9%) — slightly cheaper per transaction than Stripe, though the higher fixed fee makes Braintree less favorable for very small transactions.

Braintree's advantages: PayPal/Venmo integration reaches riders who do not have or prefer not to use credit cards (important for budget-conscious commuters), the Drop-In UI provides a pre-built payment form that handles multiple payment methods, and PayPal's buyer protection is familiar to consumers. Braintree also handles PCI compliance via client-side tokenization.

### Payment Architecture Considerations

Regardless of processor choice, Ultra's payment architecture must handle several ride-specific patterns:

- **Authorization holds with delayed capture**: A ride may last 5 minutes or 45 minutes. The hold must be large enough to cover the final fare but not so large that riders see alarming pending charges.
- **Fare adjustments**: Multi-stop trips, route changes, and wait-time fees may increase the fare beyond the original estimate. The system must support incremental authorization.
- **Refunds and disputes**: If a driver cancels and the backup system cannot find a replacement, the rider must be refunded instantly. Commuter package credits must be restored.
- **Commuter package purchases**: Lump-sum purchases ($99 for 10 rides) are straightforward charges, but the system must track ride credits, expiration dates, and automatically apply them at checkout.

---

## 6. Approach A: Microservices and Event-Driven Architecture

### Overview

This approach decomposes Ultra into independently deployable services, each owning its own data store, communicating primarily through asynchronous events on a message broker. This is the architecture that Uber itself evolved toward (though Uber started as a monolith). The pattern is appropriate when different subsystems have fundamentally different scaling profiles: the location tracking service processes millions of updates per second while the scheduling service handles thousands of requests per day.

### Logical View — Service Decomposition

```
+================================================================+
|                        ULTRA PLATFORM                          |
|================================================================|
|                                                                |
|  +-----------+  +-----------+  +------------+  +------------+ |
|  |   Rider   |  |  Driver   |  |   Ride     |  |  Pricing   | |
|  |  Service  |  |  Service  |  |  Matching  |  |  Engine    | |
|  | (profiles,|  | (profiles,|  |  Service   |  | (fares,    | |
|  |  prefs,   |  |  vehicles,|  | (dispatch, |  |  surge,    | |
|  |  trusted  |  |  safety   |  |  pooling,  |  |  packages) | |
|  |  drivers) |  |  certs)   |  |  backup)   |  |            | |
|  +-----+-----+  +-----+-----+  +------+-----+  +-----+------+ |
|        |              |               |               |        |
|  ======|==============|===============|===============|======  |
|  |              EVENT BUS (Apache Kafka)                    |  |
|  ===========|=============|==============|==================  |
|             |             |              |                     |
|  +----------+--+  +-------+----+  +------+-------+            |
|  |  Scheduling |  |  Tracking  |  | Notification |            |
|  |   Service   |  |  Service   |  |   Service    |            |
|  | (recurring, |  | (GPS ingest|  | (push, SMS,  |            |
|  |  calendar,  |  |  WebSocket |  |  email,      |            |
|  |  reminders) |  |  broadcast)|  |  trip share)  |            |
|  +-------------+  +-------+----+  +--------------+            |
|                           |                                    |
|  +-------------+  +-------+----+  +--------------+            |
|  |   Payment   |  |   Safety   |  |  Trip Share  |            |
|  |   Service   |  |   Service  |  |   Service    |            |
|  | (Stripe/    |  | (child seat|  | (tokenized   |            |
|  |  Braintree, |  |  verify,   |  |  links,      |            |
|  |  packages)  |  |  COPPA)    |  |  read-only   |            |
|  +-------------+  +------------+  |  live view)  |            |
|                                    +--------------+            |
+================================================================+

LEGEND:
  [Box]       = Independent microservice with its own database
  ---|---      = Publishes/subscribes to events via Kafka
  EVENT BUS   = Apache Kafka cluster (async message broker)
```

Each service owns its data. The Rider Service stores rider profiles and trusted driver lists in a relational database (PostgreSQL). The Tracking Service stores ephemeral location data in Redis (in-memory, sub-millisecond reads). The Ride Matching Service uses a geospatial index (Redis with geospatial commands or a dedicated spatial database) to find nearby drivers.

### Process View — Ride Request Event Flow

This diagram shows what happens at runtime when Maria requests a child-safe multi-stop ride:

```
  Maria's App            API Gateway         Ride Matching       Driver Service
      |                      |                    |                    |
      |-- POST /rides ------>|                    |                    |
      |   {child_safe:true,  |                    |                    |
      |    stops:[A,B,C],    |                    |                    |
      |    preferred:true}   |                    |                    |
      |                      |-- RideRequested -->|                    |
      |                      |   event (Kafka)    |                    |
      |                      |                    |-- QueryDrivers --->|
      |                      |                    |   {child_safe,     |
      |                      |                    |    near: A,        |
      |                      |                    |    trusted_ids:[]} |
      |                      |                    |                    |
      |                      |                    |<-- DriverList -----|
      |                      |                    |                    |
      |                      |                    |-- ScoreAndRank --->|
      |                      |                    |   (trusted first,  |  Pricing Engine
      |                      |                    |    then by ETA)    |      |
      |                      |                    |                    |      |
      |                      |                    |-- PriceRequest ---------->|
      |                      |                    |                    |      |
      |                      |                    |<-- FareEstimate ---------|
      |                      |                    |   {$24, breakdown} |      |
      |                      |                    |                    |
      |                      |<-- RideMatched ----|                    |
      |                      |    event (Kafka)   |                    |
      |<-- 200 {driver,fare}-|                    |                    |
      |                      |                    |                    |

  LEGEND:
    -----> = Synchronous HTTP/gRPC call
    --xxx> = Asynchronous event via Kafka topic
    |      = Service boundary (independent process)
```

When a driver cancels, the Ride Matching Service consumes a `DriverCancelled` event and immediately re-enters the matching loop. Because this is event-driven, the re-dispatch happens without the rider's app making a new request — the system pushes a `BackupDriverAssigned` event that the API Gateway forwards to the rider's WebSocket connection. This directly supports US10 (automatic backup ride).

### Physical/Deployment View

```
+====================================================================+
|                     CLOUD INFRASTRUCTURE                           |
|====================================================================|
|                                                                    |
|  +------------------+          +---------------------------+       |
|  |  LOAD BALANCER   |          |   CDN (Static Assets)     |       |
|  |  (nginx/HAProxy) |          |   Map tiles, app bundle   |       |
|  +--------+---------+          +---------------------------+       |
|           |                                                        |
|  +--------+---------+                                              |
|  |   API GATEWAY    |    +------------------+                      |
|  |   (Kong/Envoy)   |    | WebSocket Gateway|                      |
|  +---+----+----+----+    | (dedicated for    |                      |
|      |    |    |         |  real-time comms) |                      |
|      |    |    |         +------------------+                      |
|  +---+--+ | +--+---+                                               |
|  |Svc A | | |Svc C |  ... (N service clusters, each               |
|  |Pod x3| | |Pod x2|       auto-scaling independently)            |
|  +------+ | +------+                                               |
|       +---+---+                                                    |
|       |Svc B  |        +------------------+  +------------------+  |
|       |Pod x5 |        |  Kafka Cluster   |  |  Redis Cluster   |  |
|       +-------+        |  (3 brokers,     |  |  (location cache, |  |
|                         |   replication)   |  |   geospatial idx)|  |
|                         +------------------+  +------------------+  |
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  |  PostgreSQL      |  |  PostgreSQL      |  |  PostgreSQL      |  |
|  |  (Rider DB)      |  |  (Ride DB)       |  |  (Payment DB)    |  |
|  |  + read replica  |  |  + read replica  |  |                  |  |
|  +------------------+  +------------------+  +------------------+  |
+====================================================================+

LEGEND:
  [Box]        = Infrastructure component (server, cluster, or managed service)
  ---|---       = Network connection (TCP/HTTP)
  Pod xN       = N container replicas behind internal load balancer
  + read replica = Read-only database copy for query scaling
```

### Patterns and Tactics Used

- **Microservices pattern**: Each bounded context is an independent service with its own data store, deployable and scalable independently.
- **Event-driven pattern**: Services communicate through Kafka topics rather than direct HTTP calls, decoupling producers from consumers and enabling asynchronous processing.
- **CQRS (Command Query Responsibility Segregation)**: The Tracking Service writes location updates to a fast write path (Redis) and serves read queries from a separate optimized index. Write and read models are different.
- **Saga pattern**: A ride involves multiple services (matching, pricing, payment, notification). Rather than a distributed transaction, a saga coordinates the steps via events — if payment authorization fails, a compensating event cancels the ride match.
- **Tactics — Availability**: Circuit breakers (if the Pricing Engine is slow, the Matching Service returns a cached estimate rather than blocking), health checks, automatic pod restart.
- **Tactics — Performance**: Horizontal scaling (add more pods under load), geospatial indexing in Redis for O(log n) nearest-driver queries, WebSocket connection pooling.
- **Tactics — Modifiability**: Bulkhead isolation — a bug in the Scheduling Service cannot crash the Tracking Service.

### Shared Rides in Microservices

Ride pooling (shared rides) adds a matching dimension: the Ride Matching Service must not only find a nearby available driver, but also identify in-progress rides whose route overlaps with the new rider's route within a tolerable detour. This becomes a constrained optimization problem. In the microservices approach, the Matching Service can be independently scaled and given dedicated compute resources for this expensive calculation. The Pricing Engine calculates a discounted split fare for each pooled rider based on their proportion of the total route.

---

## 7. Approach B: Modular Monolith with Layered Architecture

### Overview

A modular monolith deploys as a single application but internally organizes code into well-separated modules with clear boundaries. This is not a tangled spaghetti monolith — it is a deliberately structured system that enforces module boundaries at the code level (separate packages, explicit public APIs between modules) while sharing a single deployment unit and database. This approach is appropriate for a startup team (3-8 developers) that cannot yet afford the operational overhead of dozens of microservices and wants to move fast with low infrastructure cost.

The **layered architecture pattern** structures the monolith vertically: a presentation layer handles HTTP/WebSocket requests, a business logic layer contains the domain rules, and a data access layer manages persistence. Each feature module (Rides, Drivers, Payments, Tracking, etc.) spans all three layers but is internally cohesive and externally decoupled.

### Logical View — Layered Module Decomposition

```
+=================================================================+
|                       ULTRA MONOLITH                            |
|=================================================================|
|                                                                 |
|  PRESENTATION LAYER (HTTP Controllers + WebSocket Handlers)     |
|  +--------+ +--------+ +--------+ +--------+ +--------+        |
|  | Ride   | |Driver  | |Payment | |Track   | |Safety  |        |
|  | Ctrl   | | Ctrl   | | Ctrl   | | WS     | | Ctrl   |        |
|  +---+----+ +---+----+ +---+----+ +---+----+ +---+----+        |
|      |          |           |          |          |              |
|- - - | - - - - -|- - - - - -|- - - - - |- - - - - | - - - - - - |
|                                                                 |
|  BUSINESS LOGIC LAYER (Domain Services + Rules)                 |
|  +--------+ +--------+ +--------+ +--------+ +--------+        |
|  | Ride   | |Driver  | |Payment | |Tracking| |Safety  |        |
|  | Module | |Module  | |Module  | |Module  | |Module  |        |
|  |--------|+|--------| |--------| |--------| |--------|        |
|  |Matching|| |Profiles| |Stripe/ | |GPS     | |Child   |        |
|  |Schedule|| |Vehicles| |Braintree|Broadcast| |Verify  |        |
|  |Multi-  || |Trusted | |Packages| |ETA Calc| |Guardian|        |
|  | stop   || |List    | |Escrow  | |        | |Notify  |        |
|  +---+----+ +---+----+ +---+----+ +---+----+ +---+----+        |
|      |          |           |          |          |              |
|- - - | - - - - -|- - - - - -|- - - - - |- - - - - | - - - - - - |
|                                                                 |
|  DATA ACCESS LAYER (Repositories + Cache)                       |
|  +----------------------------------------------------------+   |
|  |  PostgreSQL (single DB, schema-per-module)               |   |
|  |  + Redis (location cache + session store)                |   |
|  +----------------------------------------------------------+   |
+=================================================================+

LEGEND:
  [Box]          = Code module within the monolith
  - - - | - - -  = Layer boundary (enforced by package visibility)
  ---|---         = Method calls across module boundaries (in-process)
  Each module has a public API (interface) that other modules import
```

### Process View — Request Flow Through Layers

When Maria books a multi-stop child-safe ride, the request flows through layers within a single process:

```
  Maria's App                  Ultra Server (Single Process)
      |                              |
      |-- POST /rides -------------->|
      |                              |
      |                    +---------+---------+
      |                    | RideController    |
      |                    |  - validate input |
      |                    |  - authenticate   |
      |                    +--------+----------+
      |                             |
      |                    +--------v----------+
      |                    | RideModule        |
      |                    |  - create Ride    |
      |                    |  - call Driver    |
      |                    |    Module for     |
      |                    |    child-safe     |     +----------------+
      |                    |    drivers nearby |---->| DriverModule   |
      |                    |  - call Pricing   |     | - query by     |
      |                    |    Module for     |     |   location +   |
      |                    |    fare estimate  |     |   child_safe   |
      |                    |  - call Payment   |     +----------------+
      |                    |    Module for     |
      |                    |    auth hold      |     +----------------+
      |                    |                   |---->| PricingModule  |
      |                    |                   |     | - calc fare    |
      |                    |                   |     |   for 3 stops  |
      |                    |                   |     +----------------+
      |                    |                   |
      |                    |                   |     +----------------+
      |                    |                   |---->| PaymentModule  |
      |                    +--------+----------+     | - auth hold    |
      |                             |                +----------------+
      |                    +--------v----------+
      |                    | RideRepository    |
      |                    |  - persist to     |
      |                    |    PostgreSQL      |
      |                    +-------------------+
      |                              |
      |<-- 200 {ride, driver, fare} -|

LEGEND:
  -----> = Synchronous method call (in-process, same JVM/runtime)
  |      = Layer boundary
  All calls are local function calls, no network hops between modules
```

### Development View — Package Structure

```
ultra/
  src/
    rides/
      controller/        # HTTP endpoints for ride CRUD
      service/           # Matching, scheduling, multi-stop logic
      repository/        # Ride persistence (PostgreSQL)
      events/            # Internal event emitters (in-process)
      model/             # Ride, Stop, Schedule domain objects
    drivers/
      controller/
      service/           # Driver profiles, vehicle management
      repository/
      model/             # Driver, Vehicle, SafetyEquipment
    payments/
      controller/
      service/           # Stripe/Braintree integration, packages
      repository/
      model/             # Payment, CommutePack, Transaction
    tracking/
      websocket/         # WebSocket handler for live location
      service/           # GPS ingestion, ETA calculation
      cache/             # Redis-backed location store
    safety/
      service/           # Child seat verification, COPPA checks
      model/             # SafetyRequirement, ChildProfile
    tripshare/
      controller/        # Token-based link generation
      service/           # Read-only trip view for family
    notifications/
      service/           # Push (FCM/APNs), SMS, email
    shared/
      auth/              # JWT validation, OAuth2
      config/            # Application configuration
      middleware/        # Rate limiting, logging, CORS

LEGEND:
  directory/     = Java/Kotlin/TypeScript package
  Each top-level directory is a module with explicit public interfaces
  Modules import each other only through interface packages
```

### Patterns and Tactics Used

- **Layered architecture pattern**: Strict separation into presentation, business logic, and data access layers. Each layer only calls the layer directly below it, never skipping layers or calling upward.
- **Client-server pattern**: The mobile app is the client; the monolith is the server. All communication goes through RESTful HTTP endpoints and a WebSocket connection for real-time tracking.
- **Repository pattern**: Each module accesses the database only through its repository, abstracting persistence details from business logic.
- **Domain-driven module boundaries**: Modules align with business domains (Rides, Drivers, Payments), not technical concerns. This makes future extraction to microservices straightforward.
- **Tactics — Performance**: In-process method calls are orders of magnitude faster than network calls. Connection pooling (HikariCP or equivalent) minimizes database overhead. Redis caching for hot data (driver locations, fare estimates).
- **Tactics — Modifiability**: Feature flags allow toggling new capabilities (commuter packages, ride pooling) without redeployment. Module interfaces enforce that changes within a module do not break consumers.
- **Tactics — Availability**: Vertical scaling (bigger server) handles initial growth. Multiple monolith instances behind a load balancer provide horizontal redundancy. Sticky sessions or shared Redis for WebSocket state.

### Shared Rides in a Monolith

In the monolith, ride pooling logic lives inside the Ride Module's matching service. Because all data access is local (same process, same database), the pooling algorithm can efficiently query in-progress rides, calculate detour costs, and update multiple ride records in a single database transaction — something that would require a distributed transaction or saga in microservices. The tradeoff is that the pooling computation shares CPU and memory with all other operations; under heavy load, an expensive matching query could starve other requests.

---

## 8. User Interaction Complexities

### Shared Rides and Ride Pooling

Ride pooling is one of the most architecturally demanding features. When a rider requests a pooled ride, the system must: (1) search for in-progress rides with compatible routes (same general direction, acceptable detour), (2) calculate the additional time each existing rider would experience if the new rider is added, (3) ensure the detour stays within tolerance (typically < 5 minutes or < 20% of original ETA), (4) calculate split fares for all riders, and (5) notify all affected riders of the route change in real time. This is a constrained optimization problem that must execute in under 2 seconds during rush hour with thousands of concurrent rides.

The fare splitting itself raises UX and fairness challenges. If Rider A booked first and Rider B is added, does Rider A's fare decrease (rewarding them for sharing)? Most platforms say yes — each pooled rider pays less than they would solo, but the platform collects more total revenue per vehicle mile. The Pricing Engine must recalculate fares dynamically as riders are added and dropped off.

### Multi-Passenger Coordination and Child Transport

Maria's storyboards reveal a distinctive interaction pattern: children ride without a parent present (US01 — school pickup). This creates regulatory and safety requirements. The driver cannot interact with a minor in the same way as an adult rider. The architecture must support: a "guardian mode" where a parent (Maria) controls the ride but is not in the vehicle, push notifications to designated family contacts (Grandma Rosa) when the ride starts, reaches each stop, and completes, and driver verification that goes beyond standard background checks to include child safety certification.

The Trip Share Service (US03) must generate tokenized, read-only links that let Rosa see real-time location without creating an account or having the app installed. The link must expire after the trip ends and must not expose information beyond the current trip (no rider profile data, no payment information, no ride history).

### Multi-Stop Trip Complications

Multi-stop trips (US04) introduce a ride state machine with intermediate states. A standard ride transitions from IN_PROGRESS to COMPLETED. A multi-stop ride transitions through IN_PROGRESS -> ARRIVING_STOP_1 -> WAITING_AT_STOP_1 -> EN_ROUTE_TO_STOP_2 -> ... -> COMPLETED. Each stop may involve a different action: a child being dropped off (no wait time needed), a package pickup (brief wait), or an errand (extended wait with meter running).

```
RIDE STATE MACHINE:

  REQUESTED --> MATCHING --> MATCHED --> DRIVER_EN_ROUTE --> ARRIVED
                  |                                           |
                  v                                           v
               NO_MATCH                                  IN_PROGRESS
               (backup?)                                      |
                                              +---------------+---------------+
                                              |               |               |
                                         STOP_1_ARRIVING  STOP_2_ARRIVING  ...
                                              |               |
                                         STOP_1_WAITING   STOP_2_WAITING
                                              |               |
                                         STOP_1_DEPARTED  STOP_2_DEPARTED
                                              |               |
                                              +-------+-------+
                                                      |
                                                  COMPLETED --> RATING
                                                      |
                                              (or CANCELLED at any point)

LEGEND:
  BOX      = Ride state (stored in ride record)
  -->      = State transition triggered by event (driver action, system timer, or rider action)
  |        = Transition path
```

Wait time policies add fare complexity: Ultra must decide whether to charge per minute of wait time at each stop, cap wait time per stop, or include a free wait-time allowance. These are business rules, but the architecture must support configurable per-stop wait policies and real-time fare accumulation.

### Trusted Driver Matching Tension

The trusted driver feature (US05) creates a tension between rider preference and system efficiency. When Maria toggles "Preferred Drivers Only," the Matching Service first queries only drivers on her trusted list. But what if none are available? The system must: (1) search trusted drivers first with a short timeout (15-30 seconds), (2) if none are found, notify the rider and automatically expand to the general pool, and (3) clearly communicate this fallback in the UI ("No trusted drivers available — matched with a verified driver").

---

## 9. Scaling Issues

### Geographic Scaling

Ultra launches in one city and expands city by city. Each city has an independent supply-demand dynamic — a driver in Chicago cannot serve a rider in New York. This natural geographic partitioning suggests **geosharding**: partitioning data and compute by geographic region. The matching algorithm only searches for drivers within a city's boundaries. Database queries filter by a `city_id` field. In the microservices approach, each city can theoretically run its own instance cluster. In the monolith approach, geosharding happens at the database query level (partition tables by city).

### Temporal Scaling — Rush Hour Surges

Ride-sharing traffic follows sharp temporal patterns. Morning rush (7-9 AM) and evening rush (5-7 PM) can produce 10x the request volume of midday. This is the most common scaling failure mode. The microservices approach handles this well: the Ride Matching Service and Tracking Service (the two hottest components) auto-scale independently while the Scheduling Service (which is not busy during rush hour) stays at baseline. The monolith approach handles this less gracefully — the entire application scales together, wasting resources on idle modules. The monolith can mitigate this with async task queues (non-urgent operations like email receipts are deferred to off-peak processing), but the matching and tracking logic still shares resources with everything else.

### Real-Time Location Tracking at Scale

The Tracking Service is the single most demanding component. Every active driver sends a GPS update every 3-5 seconds. Every rider with an in-progress ride has a WebSocket connection receiving those updates. At 100,000 concurrent rides, that is 100,000 drivers sending 20-33 updates per minute each (2-3.3 million location updates per minute) and 100,000+ WebSocket connections consuming those updates.

The write path must be fast: location updates go to Redis (in-memory, sub-millisecond writes). The broadcast path must be efficient: rather than querying Redis per rider, a pub/sub pattern pushes updates to the correct WebSocket connections. Redis Pub/Sub or Kafka topics partitioned by `ride_id` handle this routing.

At 1 million concurrent rides, the numbers become extreme: 20-33 million location updates per minute and over 1 million persistent WebSocket connections. This requires a dedicated WebSocket gateway tier that can be horizontally scaled to hundreds of instances, with a connection routing layer that knows which gateway instance holds which rider's connection. This is infeasible in a single monolith process; at this scale, the tracking component must be extracted into its own service regardless of the overall architectural approach.

### Database Scaling

Location data is write-heavy and ephemeral — yesterday's GPS breadcrumbs are only useful for analytics, not real-time operations. This argues for a polyglot persistence strategy: Redis for current locations (fast writes, automatic expiration), PostgreSQL for ride records and user profiles (strong consistency, relational queries), and an analytics data warehouse (BigQuery, ClickHouse) for historical analysis. The monolith can still use multiple data stores; "single database" means single relational database for domain data, not necessarily a single data store overall.

Read-heavy tables (rider profiles, driver profiles, commuter package balances) benefit from read replicas. Write contention on the rides table during rush hour can be mitigated with database connection pooling and optimistic locking for state transitions.

### Matching Algorithm Scaling

Naive driver-rider matching is O(n * m) where n is waiting riders and m is available drivers. For a city with 5,000 concurrent ride requests and 3,000 available drivers, that is 15 million comparisons. Geospatial indexing reduces this dramatically: drivers are indexed by their current location using geohashing (dividing the map into grid cells). A rider's request only searches drivers in nearby grid cells, reducing the search space from thousands to tens. Redis's built-in `GEOSEARCH` command performs this in O(N+log(M)) where N is the result count and M is the total indexed items.

For ride pooling, the matching problem is harder: the algorithm must search in-progress rides (not just idle drivers), compute route overlaps, and evaluate detour costs. Approximate algorithms (beam search, greedy matching with periodic rebalancing) trade optimality for speed.

---

## 10. Comparative Tradeoff Analysis

| Quality Attribute     | Approach A: Microservices + Events       | Approach B: Modular Monolith             |
|-----------------------|------------------------------------------|------------------------------------------|
| **Scalability**       | Excellent — each service scales independently. Tracking can have 50 pods while Scheduling has 2. | Moderate — the entire application scales together. Can extract hot paths later. |
| **Reliability**       | High — service isolation prevents cascading failures. A Pricing bug does not crash Tracking. | Moderate — a memory leak in any module affects the whole process. Multiple instances provide redundancy. |
| **Development Speed** | Slower initially — service boundaries, API contracts, deployment pipelines per service. | Faster initially — single codebase, single deployment, local method calls, simple debugging. |
| **Operational Cost**  | High — Kafka cluster, multiple databases, container orchestration (Kubernetes), monitoring per service. | Low — single application server, single database, standard deployment. |
| **Team Size**         | Needs 4+ teams (one per service group). Effective with 15-50 engineers. | Effective with 3-10 engineers. One team owns the full stack. |
| **Debugging**         | Hard — distributed tracing (Jaeger/Zipkin) needed to follow a request across services. | Easy — single stack trace, single log stream, in-process debugging. |
| **Data Consistency**  | Eventual consistency. Sagas for cross-service transactions. Compensating actions for failures. | Strong consistency. Database transactions span module boundaries trivially. |
| **Latency**           | Higher per-request — network hops between services (1-5ms each). Kafka adds async delay. | Lower per-request — in-process method calls (microseconds). |

### When to Choose Each

**Choose Approach B (Monolith)** if: the team is small (under 10 engineers), Ultra is pre-product-market-fit, iteration speed matters more than theoretical scalability, and infrastructure budget is limited. This is the recommended starting point.

**Choose Approach A (Microservices)** if: Ultra has proven product-market-fit, is operating in multiple cities, has a team of 20+ engineers who need to deploy independently, and the Tracking Service is hitting single-process limits.

**Hybrid Path**: Start with the modular monolith. When a specific module becomes a bottleneck (tracking is the most likely candidate), extract it into a standalone service with a Kafka bridge. The module boundary discipline in Approach B makes this extraction a well-defined operation rather than a surgery.

---

## 11. Cross-Cutting Concerns

**Authentication and Authorization.** Riders and drivers authenticate via OAuth2 (Google, Apple, email/password). The server issues JWTs (JSON Web Tokens) containing user role (rider, driver, admin) and user ID. JWTs are validated on every API request. The Trip Share Service issues separate, limited-scope tokens that grant read-only access to a single trip without requiring authentication — these are the tokenized links Rosa receives.

**Real-Time Communication.** WebSockets are the primary channel for live driver tracking and ride status updates. The client opens a persistent connection after booking, and the server pushes location updates and state transitions. Server-Sent Events (SSE) is a simpler alternative for one-way data (server to client only), which suffices for tracking since the rider only receives updates. SSE works better with HTTP/2 and corporate proxies that sometimes block WebSocket upgrades. Ultra should support both, preferring WebSockets and falling back to SSE.

**Push Notifications.** Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNs) for iOS deliver background notifications: ride reminders (15 minutes before scheduled pickup), driver arrival alerts, cancellation/backup notifications, and trip completion confirmations to shared contacts. The Notification Service abstracts the platform-specific APIs behind a unified interface.

**Data Privacy and Child Safety.** When children ride without parents, Ultra is potentially subject to COPPA (Children's Online Privacy Protection Act) if it collects data about children under 13. The architecture must ensure that child profile data (ages, names) is stored only in the parent's account context and is never shared with third parties beyond the assigned driver. Trip sharing links must not expose child identity information. Driver background checks and child safety certifications must be re-verified periodically and stored with audit trails.

**Observability.** Structured logging (JSON logs with correlation IDs), application metrics (Prometheus), distributed tracing (OpenTelemetry), and alerting (PagerDuty/Grafana OnCall) are essential for both approaches. In the monolith, a single correlation ID threads through all module calls. In microservices, trace propagation headers (W3C TraceContext) carry the ID across service boundaries.

---

## 12. Verification and Testing Strategy

**Architecture Validation.** To verify that the architecture meets its quality goals, we define concrete measurable criteria: (1) a ride request must be matched within 3 seconds at P99, (2) a driver cancellation must trigger a backup match within 5 seconds, (3) location updates must reach the rider's app within 2 seconds of being sent by the driver, (4) the system must handle a 10x traffic surge without degraded matching latency.

**Load Testing.** Use Locust or k6 to simulate realistic traffic patterns: gradually ramp to 100,000 concurrent ride requests, simulate rush-hour spikes, and measure matching latency, WebSocket throughput, and database connection pool exhaustion. Run load tests against a staging environment that mirrors production topology.

**Integration Testing.** Each payment flow (authorize, capture, refund, commuter package deduction) must be tested end-to-end against Stripe/Braintree sandbox environments. Trip sharing must be tested with real WebSocket connections and token expiration. Multi-stop rides must be tested for correct state machine transitions and fare accumulation.

**Chaos Engineering.** In the microservices approach, intentionally kill service instances during load tests to verify that circuit breakers activate, Kafka consumers rebalance, and rider-facing latency stays within SLA. In the monolith approach, kill one of N instances to verify that the load balancer reroutes and in-progress WebSocket connections reconnect.

**Canary Deployments.** Roll out new versions to 5% of traffic first, monitor error rates and latency, and only promote to full deployment if metrics remain healthy. Feature flags gate new capabilities (ride pooling, commuter packages) independently of deployments, enabling gradual rollout and instant rollback.
