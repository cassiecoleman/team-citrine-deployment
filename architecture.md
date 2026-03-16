# Ultra Ride‑Sharing Platform --- Software Architecture

## Project

Ultra --- Ride‑Sharing for Underserved Riders

Target users: - Parents who need safer rides for children - Car‑free
commuters who depend on rides for work - Riders who want predictable,
transparent pricing

This document defines the **software architecture** for Ultra,
including: - architecture diagram - system APIs - deployment model -
links to AI chat transcripts used during the design process

All diagrams use **Mermaid** and are compatible with GitHub and the VS
Code Mermaid Preview extension.

------------------------------------------------------------------------

# 1. Architecture Diagram

``` mermaid
flowchart LR

subgraph Client
    RiderApp["Rider Mobile App"]
    DriverApp["Driver Mobile App"]
    AdminPortal["Admin Web Portal"]
end

subgraph Backend["Cloud Backend"]
    APIGateway["Backend API"]
    AuthService["Auth Service"]
    RideService["Ride Service"]
    PricingService["Pricing Service"]
    SafetyService["Safety Service"]
    NotificationService["Notification Service"]
    PaymentService["Payment Service"]
    DB[(PostgreSQL Database)]
end

subgraph External
    MapsAPI["Maps / Routing API"]
    SMSAPI["SMS / Push Notification API"]
    PaymentProcessor["Payment Processor"]
end

RiderApp --> APIGateway
DriverApp --> APIGateway
AdminPortal --> APIGateway

APIGateway --> AuthService
APIGateway --> RideService
APIGateway --> PricingService
APIGateway --> SafetyService
APIGateway --> NotificationService
APIGateway --> PaymentService

RideService --> DB
AuthService --> DB
SafetyService --> DB
PricingService --> DB

RideService --> MapsAPI
NotificationService --> SMSAPI
PaymentService --> PaymentProcessor
```

### Architecture Overview

Client applications communicate with a centralized backend API hosted in
the cloud.

Client roles: - **Rider App** --- request rides, track trips, manage
payments - **Driver App** --- accept rides, navigate routes, update trip
status - **Admin Portal** --- operations dashboard for Ultra staff

Backend services manage: - authentication - ride matching - pricing and
subscriptions - safety systems - notifications - payments

External services provide: - route calculation - messaging - financial
transactions

------------------------------------------------------------------------

# 2. Information Flow

## Rider Flow

1.  Rider opens Ultra app.
2.  Rider enters pickup and destination.
3.  Backend calculates ETA and price estimate.
4.  Ride request is sent to nearby drivers.
5.  Driver accepts ride.
6.  Rider receives driver information and trip tracking.
7.  Trip completes and payment is processed.

## Driver Flow

1.  Driver marks themselves available.
2.  Ride requests are pushed to nearby drivers.
3.  Driver accepts ride.
4.  Navigation route is generated.
5.  Driver completes ride.
6.  Payment event recorded.

## Admin Flow

Admins use the web portal to: - monitor ride activity - review safety
incidents - manage drivers - manage pricing rules

------------------------------------------------------------------------

# 3. System APIs

The APIs correspond directly to the backend services shown in the
architecture diagram.

## Authentication API

    POST /api/auth/register
    POST /api/auth/login
    POST /api/auth/logout
    GET /api/auth/me

Purpose: - manage user accounts - authenticate riders and drivers

------------------------------------------------------------------------

## Ride API

    POST /api/rides
    GET /api/rides/{id}
    POST /api/rides/{id}/cancel
    POST /api/rides/{id}/start
    POST /api/rides/{id}/complete

Purpose: - create rides - track ride status - cancel rides - start and
complete rides

------------------------------------------------------------------------

## Driver API

    POST /api/drivers/status
    POST /api/drivers/location
    GET /api/drivers/requests
    POST /api/drivers/requests/{id}/accept

Purpose: - update driver availability - send location updates - manage
ride requests

------------------------------------------------------------------------

## Pricing API

    GET /api/pricing/estimate
    GET /api/pricing/packages
    POST /api/pricing/packages/subscribe

Purpose: - price estimation - commuter packages - flat‑rate ride
subscriptions

------------------------------------------------------------------------

## Safety API

    POST /api/safety/pin/verify
    POST /api/safety/report
    GET /api/safety/trip-share/{rideId}
    POST /api/drivers/favorite/{driverId}

Purpose: - ride verification PIN - incident reporting - trip sharing
with contacts - favorite driver system

------------------------------------------------------------------------

## Admin API

    GET /api/admin/rides
    GET /api/admin/drivers
    GET /api/admin/incidents
    PATCH /api/admin/drivers/{id}/status

Purpose: - system monitoring - safety oversight - driver management

------------------------------------------------------------------------

# 4. Deployment Diagram

``` mermaid
flowchart TB

UserPhones["Rider / Driver Phones"]
AdminBrowser["Admin Browser"]

Cloud["Cloud Infrastructure"]
Backend["Backend API Server"]
Database[(Managed PostgreSQL)]

Maps["Maps API"]
Notify["Notification Service"]
Payments["Payment Processor"]

UserPhones --> Backend
AdminBrowser --> Backend

Backend --> Database
Backend --> Maps
Backend --> Notify
Backend --> Payments
```

Deployment summary:

Client devices connect over the internet to the backend API hosted in
cloud infrastructure.\
The backend stores persistent data in a PostgreSQL database and
integrates with external APIs.

------------------------------------------------------------------------

# 5. AI Chat Transcripts

The architecture design was informed by several AI‑assisted user
discovery interviews conducted by team members.

The following transcripts are included in the project repository and are
cross‑referenced here.

### Derron Dowdy Interview

-   p1-part1-user_discovery_interview-derron_dowdy.md

Insights used: - importance of **predictable pricing** - demand for
**favorite drivers** - interest in **commuter ride packages** - concerns
about **driver availability**

------------------------------------------------------------------------

### Cassie Coleman Interview

-  p1-part1-user_discovery_interview-cassie_coleman.md

Key insights:

-   commuters rely heavily on ride‑sharing due to unreliable buses
-   **surge pricing causes budget stress**
-   users want **priority pickup during rush hour**
-   ride availability during peak demand is critical

These insights influenced: - PricingService - subscription commuter
packages - ride matching logic

------------------------------------------------------------------------

### Jacob Moore Interview

-  p1-part1-user_discovery_interview-jacob_mooremd

Key insights:

-   users strongly prefer **price certainty over cheapest price**
-   some users experience **tech anxiety when using ride apps**
-   onboarding must be simple and guided
-   safety and driver identification are important

These insights influenced:

-   flat pricing APIs
-   safety service
-   trusted driver feature
-   simplified ride flow design

------------------------------------------------------------------------

# 6. Consistency Check

The design artifacts are consistent:

-   every API corresponds to a backend component shown in the
    architecture diagram
-   all external integrations appear in both the diagrams and
    architecture sections
-   rider, driver, and admin roles are represented in both diagrams and
    APIs

------------------------------------------------------------------------

# 7. Summary

Ultra uses a **client‑cloud architecture**:

Client layer: - Rider mobile application - Driver mobile application -
Admin web portal

Backend services: - ride management - pricing - safety - notifications -
authentication - payment processing

External integrations: - mapping services - notification services -
payment processors

The architecture directly reflects the needs discovered in the team's
user interviews: predictable pricing, improved safety, and reliable ride
availability.
