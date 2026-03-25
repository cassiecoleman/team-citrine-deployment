# P1 Part 4: Software Architecture --- AI Chat Transcript

**Tool:** ChatGPT (GPT-5.3, OpenAI)\
**Date:** March 16, 2026\
**Team:** Citrine (Jacob Moore, Cassie Coleman, Derron Dowdy)

------------------------------------------------------------------------

# Session Overview

This transcript documents the AI-assisted creation of the **Part 4
Software Architecture deliverable** for the Ultra ride-sharing
application. The session focused on translating insights from the user
discovery interviews and storyboards into a consistent system
architecture design.

The process included:

-   Generating the **architecture diagram**
-   Designing the **backend APIs**
-   Ensuring consistency between diagrams and APIs
-   Linking the **AI transcripts** that informed the design decisions

------------------------------------------------------------------------

# Conversation Flow

------------------------------------------------------------------------

# 1. Assignment Requirements Review

### User

Provided the assignment instructions for Part 4 and asked how to
structure the architecture document in Markdown. The instructions
required:

-   An **architecture diagram written in Mermaid**
-   A list of **system APIs**
-   **Cross-references to AI chat transcripts**

------------------------------------------------------------------------

### ChatGPT

Explained how the architecture document should be structured and
recommended creating a file named:

    architecture.md

Suggested organizing the document into three main sections:

1.  **Architecture Diagram**
2.  **APIs**
3.  **AI Chat Transcripts**

Also emphasized that **all APIs must correspond to components shown in
the architecture diagram** to avoid inconsistencies.

------------------------------------------------------------------------

# 2. Architecture Diagram Creation

### User

Requested a Mermaid architecture diagram showing where components run
and how information flows between them.

------------------------------------------------------------------------

### ChatGPT

Generated a Mermaid architecture diagram organized into three system
layers.

## Client Layer

Applications used directly by system users.

-   Rider Mobile App
-   Driver Mobile App
-   Admin Web Portal

## Cloud / Backend Layer

Core backend services responsible for business logic.

-   Backend API
-   Authentication Service
-   Ride Service
-   Pricing Service
-   Safety Service
-   Notification Service
-   Payment Service
-   PostgreSQL Database

## External Services

Third-party services used by the system.

-   Maps / Routing API
-   Payment Processor
-   Messaging / Notification API

The diagram shows how riders and drivers interact with the **Backend
API**, which coordinates requests across backend services and external
integrations.

------------------------------------------------------------------------

# 3. API Design

### User

Asked for a set of APIs that match the services shown in the
architecture diagram.

------------------------------------------------------------------------

### ChatGPT

Generated REST APIs that correspond directly to the backend services.

## Authentication API

Handles account management and authentication.

    POST /api/auth/register
    POST /api/auth/login
    POST /api/auth/logout
    GET /api/auth/me

Purpose:

-   user account creation
-   login and session management
-   identity verification

------------------------------------------------------------------------

## Ride API

Manages ride lifecycle events.

    POST /api/rides
    GET /api/rides/{id}
    POST /api/rides/{id}/cancel
    POST /api/rides/{id}/start
    POST /api/rides/{id}/complete

Purpose:

-   ride requests
-   ride status tracking
-   ride cancellation
-   ride completion

------------------------------------------------------------------------

## Driver API

Supports driver availability and ride acceptance.

    POST /api/drivers/status
    POST /api/drivers/location
    GET /api/drivers/requests
    POST /api/drivers/requests/{id}/accept
    POST /api/drivers/requests/{id}/reject

Purpose:

-   driver availability updates
-   location tracking
-   ride request management

------------------------------------------------------------------------

## Pricing API

Supports predictable pricing and subscription packages.

    GET /api/pricing/estimate
    GET /api/pricing/packages
    POST /api/pricing/packages/subscribe

Purpose:

-   ride cost estimation
-   commuter subscription packages
-   predictable pricing models

------------------------------------------------------------------------

## Safety API

Supports ride safety and verification.

    POST /api/safety/pin/verify
    POST /api/safety/report
    GET /api/safety/trip-share/{rideId}
    POST /api/drivers/favorite/{driverId}

Purpose:

-   rider/driver identity verification
-   incident reporting
-   trip sharing with trusted contacts
-   favorite driver functionality

------------------------------------------------------------------------

## Admin API

Used by system administrators.

    GET /api/admin/rides
    GET /api/admin/drivers
    GET /api/admin/incidents
    PATCH /api/admin/drivers/{id}/status

Purpose:

-   monitoring rides and drivers
-   reviewing incidents
-   managing driver status

------------------------------------------------------------------------

# 4. Cross-Referencing AI Chat Transcripts

### User

Asked how to satisfy the assignment requirement that all AI transcripts
must be cross-referenced.

------------------------------------------------------------------------

### ChatGPT

Recommended creating an **AI Chat Transcripts** section in the
architecture document and linking relevant files in the repository.

## Linked Transcript Files

The following transcripts informed the architecture design:

-   p1-part1-user_discovery_interview-derron_dowdy.md
-   p1-part1-user_discovery_interview-cassie_coleman.md
-   p1-part1-user_discovery_interview-jacob_moore.md
-   user-discovery.md
-   storyboard.md

------------------------------------------------------------------------

## Design Insights from Transcripts

Insights from interviews influenced several parts of the architecture:

**Predictable Pricing**

-   Led to creation of the **Pricing Service**
-   Implemented through the **Pricing API**

**Safety Concerns**

-   Led to creation of the **Safety Service**
-   Included ride PIN verification and trip sharing

**Driver Availability**

-   Influenced the **Ride Service** and **Driver API**

**Subscription Pricing**

-   Influenced commuter package support in the **Pricing API**

------------------------------------------------------------------------

# 5. Final Architecture Document

### User

Requested a finalized architecture document including diagrams, APIs,
and transcript references.

------------------------------------------------------------------------

### ChatGPT

Generated the final architecture file:

    architecture.md

The file contains:

-   Mermaid **architecture diagram**
-   REST **API definitions**
-   **AI transcript references**
-   Cross-reference explanations connecting user insights to system
    components

------------------------------------------------------------------------

# Outcome

The AI-assisted session successfully produced the **Part 4 Software
Architecture deliverable**.

The final architecture connects user needs discovered during interviews
and storyboarding with a scalable **client-cloud ride-sharing system
architecture**.

Key architecture goals include:

-   predictable pricing
-   improved rider safety
-   reliable ride matching
-   scalable backend services
