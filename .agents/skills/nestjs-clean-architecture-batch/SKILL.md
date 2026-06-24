---
name: nestjs-clean-architecture-batch
description: NestJS refactoring and optimization using Clean Architecture, SRP, Event Aggregation, and Master Summary Logging to prevent I/O bottlenecks.
---

# 🏗️ NestJS Clean Architecture & Batch Processing

When refactoring or creating NestJS services, enforce strict Clean Architecture principles with an emphasis on **SRP (Single Responsibility Principle)** and **Performance**.

## 1. Micro-Component Isolation
A typical "fat" service must be broken down into specific layers:
- **Interfaces (`*.interface.ts`)**: Define data structures.
- **Repository (`*.repository.ts`)**: Isolate database access (e.g., Prisma queries). Optimized raw SQL is encouraged for complex joins and aggregations.
- **Formatter/Mapper (`*.formatter.ts`)**: Handle data transformations, naming resolutions, and display logic.
- **Service (`*.service.ts`)**: Act solely as an orchestrator (e.g., handling Crons and calling repositories/formatters).

*Strict Rule:* **One Class Per File.** Never mix repository logic or formatters inside the main service file.

## 2. Prevent I/O Bottlenecks (The "Master Summary" Pattern)
When processing large arrays or lists of items (e.g., running a Cron job on 5,000 items):
- ❌ **Forbidden:** Do NOT use `logger.log()` or `logger.warn()` inside a `for...of` or `map` loop. This will saturate I/O streams and drastically slow down the application.
- ❌ **Forbidden:** Do NOT send one notification (email/webhook) per item in a loop.
- ✅ **Required:** Buffer and format the results into an array or single string, then perform a **single log operation** (the Master Summary Log).
- ✅ **Required:** Inject a `NotificationService` and send **one aggregated report** instead of spamming individual notifications.

## Example File Structure
```text
src/feature/
├── interfaces/
│   └── feature-row.interface.ts
├── feature.formatter.ts
├── feature.repository.ts
└── feature.service.ts
```

## Implementation Workflow
1. Identify responsibilities in the existing service.
2. Extract the data access logic to a Repository class.
3. Extract formatting, mapping, and display logic to a Formatter class.
4. Refactor the Service class to only orchestrate the workflow.
5. Identify any loops containing logging or external calls, and refactor them using the Event Aggregation / Master Summary pattern.
