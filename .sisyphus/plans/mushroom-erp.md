# Mushroom ERP System (The Skate MVP)

## TL;DR

> **Quick Summary**: A local-first Mushroom Farm Management System focusing on traceability, FIFO enforcement, and rapid inventory via QR codes.
> 
> **Deliverables**:
> - Next.js 14 PWA (Localhost)
> - SQLite Database (traceability & logs)
> - QR Code Generator & Scanner Logic
> - Dashboard (Kanban, Forecast, Death Rate)
> 
> **Estimated Effort**: Medium (MVP)
> **Parallel Execution**: YES - 3 Waves
> **Critical Path**: Database Schema → Traceability Logic (TDD) → UI Implementation

---

## Context

### Original Request
Build a system to manage mushroom production with:
1. **Traceability**: Parent/Child relationship (Grain -> Substrate).
2. **FIFO**: Prevent sending old/young kits.
3. **Inventory**: Rapid QR scanning.
4. **Dashboard**: "What do I have?", "What will die?", "Forecast".

### Interview Summary
**Key Discussions**:
- **Architecture**: "Skate" MVP approach (Local SQLite + Next.js).
- **Auth**: Single User (Simple Password) for speed.
- **Testing**: **TDD Enforcement** for backend business logic (Traceability, Death Rate).
- **Scanning**: Mobile-web focus.

**Research/Analysis Findings**:
- **Local LAN**: Using camera via browser requires HTTPS or localhost. We will prioritize "Native Camera -> URL" flow for simplicity in the MVP, but support in-app scanning where possible.
- **Data Safety**: Since it's local SQLite, we need a "Download Backup" feature.

---

## Work Objectives

### Core Objective
Enable the farmer to instantly trace contamination sources and manage inventory age without spreadsheets.

### Concrete Deliverables
- [ ] Next.js 14 Project (App Router)
- [ ] SQLite Database with Prisma Schema (Batches, Actions)
- [ ] TDD Suite for Core Logic (Traceability, Age, Contamination)
- [ ] Label Printing Page (CSS Print optimized)
- [ ] Dashboard Widgets (Kanban, KPI)

### Definition of Done
- [ ] `npm run test` passes (100% coverage on core logic)
- [ ] User can scan a QR code and see the Batch Details page
- [ ] Marking a parent "Contaminated" visualizes risk on children

### Must Have
- Parent/Child Traceability
- FIFO Warnings (Red alert if older stock exists)
- Death Rate Calculation

### Must NOT Have (Guardrails)
- Complex User Roles (Auth is single-user)
- Cloud Infrastructure (No AWS/Vercel setup)
- Native Mobile App (PWA/Web only)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (New Project)
- **User wants tests**: **YES (TDD)**
- **Framework**: **Vitest** (Fast, compatible with Next.js)

### TDD Workflow (RED-GREEN-REFACTOR)

For all backend logic tasks:
1. **RED**: Create `src/lib/__tests__/[feature].test.ts`. Write a test case that fails.
2. **GREEN**: Implement logic in `src/lib/[feature].ts` to pass the test.
3. **REFACTOR**: Optimize.

### Manual Verification
For UI tasks (Dashboard, Scanner):
- **Playwright** is recommended for E2E, but we will use **Manual QA Checklist** for this MVP to move fast on UI.
- **Browser Testing**: Verify on Desktop (Chrome) and Mobile (Responsive).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Setup & Core Logic):
├── Task 1: Project Init & Test Infra
├── Task 2: DB Schema & Prisma Setup
└── Task 3: Core Logic TDD (Traceability, FIFO)

Wave 2 (Feature Implementation):
├── Task 4: Batch CRUD API & Pages
├── Task 5: QR Code Generation & Print View
└── Task 6: Dashboard Analytics Logic

Wave 3 (UI & Integration):
├── Task 7: Mobile Scanner & Action UI
├── Task 8: Dashboard Widgets (UI)
└── Task 9: Backup & Polish
```

---

## TODOs

- [ ] 1. Project Initialization & Test Infra
  **What to do**:
  - Initialize Next.js 14 (TS, Tailwind, ESLint).
  - Install `vitest` and `better-sqlite3`.
  - Configure `vitest` to run with `npm run test`.
  - Create a dummy test to verify setup.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]

  **Acceptance Criteria**:
  - [ ] `npm run test` passes with 1 dummy test.
  - [ ] `npm run dev` starts the server.

- [ ] 2. Database Schema & Prisma Setup
  **What to do**:
  - Install `prisma`.
  - Define schema in `prisma/schema.prisma` (Batches, Actions, Settings) based on the JSON spec provided.
  - Run migration: `npx prisma migrate dev --name init`.
  - Create a seed script (`prisma/seed.ts`) with some dummy data (Grain, Substrate).

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`git-master`]

  **Acceptance Criteria**:
  - [ ] `npx prisma studio` opens and shows tables.
  - [ ] Seed data is present in the DB.

- [ ] 3. Core Logic TDD: Traceability & FIFO
  **What to do**:
  - **RED**: Write tests for:
    - `getGenealogy(batchId)`: Should return parent chain.
    - `propagateContamination(batchId)`: Should find all children.
    - `checkFIFO(batchId)`: Should warn if older batch of same strain/type exists.
  - **GREEN**: Implement `src/lib/logic/traceability.ts` and `inventory.ts`.

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`git-master`]

  **Parallelization**:
  - Depends on Task 2.

  **Acceptance Criteria**:
  - [ ] Tests pass for circular dependency check.
  - [ ] Tests pass for contamination propagation (returns correct list of child IDs).
  - [ ] Tests pass for FIFO warning logic.

- [ ] 4. Batch CRUD & Details Page
  **What to do**:
  - Create Server Actions for `createBatch`, `updateStatus`.
  - Create Page: `/batches/[id]` (The "Scan Destination").
  - Show "Parent" link and "Children" list.
  - **Visuals**: If status is "Contaminated", show Red Banner.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Acceptance Criteria**:
  - [ ] Can create a new batch.
  - [ ] Can view a batch and click to navigate to parent.

- [ ] 5. QR Code Generation & Print View
  **What to do**:
  - Install `qrcode`.
  - Create component `<LabelPrintView batch={batch} />`.
  - Route `/batches/[id]/print` that renders a CSS-print optimized page (3x2 inch label style).
  - Include: QR Code, Human Readable ID, Date, Strain.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Acceptance Criteria**:
  - [ ] `/batches/123/print` shows a clean label.
  - [ ] Printing to PDF produces correct dimensions.
  - [ ] QR Code scans to `http://[host]/batches/123`.

- [ ] 6. Dashboard Analytics Logic (TDD)
  **What to do**:
  - **RED**: Write tests for:
    - `calculateDeathRate(days=30)`: Returns %.
    - `getPipelineCounts()`: Returns counts by stage.
  - **GREEN**: Implement `src/lib/logic/analytics.ts`.

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`git-master`]

  **Acceptance Criteria**:
  - [ ] Tests pass for death rate logic (e.g., 10 created, 1 contaminated = 10%).

- [ ] 7. Dashboard Widgets (UI)
  **What to do**:
  - Create `/dashboard` page.
  - **Kanban Widget**: Columns for Colonizing, Ready, Fruiting.
  - **KPI Widget**: "Death Rate" in Red/Green.
  - **Forecast Widget**: Simple line chart (using `recharts` or just CSS bars) for next 4 weeks availability.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Acceptance Criteria**:
  - [ ] Dashboard loads fast.
  - [ ] Kanban cards are clickable (go to Details).

- [ ] 8. Backup & Settings
  **What to do**:
  - Create `/settings` page.
  - Add "Download Database" button (Server Action that streams `prisma/dev.db`).
  - Add "Strain Configuration" form (edit colonization days).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Acceptance Criteria**:
  - [ ] Clicking "Download Backup" saves the `.db` file.

---

## Success Criteria

### Verification Commands
```bash
npm run test      # All TDD logic passes
npm run build     # Production build works
npm run start     # App runs locally
```

### Final Checklist
- [ ] Scanning a "Grain" batch shows which "Substrate" batches came from it (Reverse Traceability).
- [ ] Marking a parent contaminated flags children.
- [ ] Dashboard answers "What do I have?" in < 5 seconds.
