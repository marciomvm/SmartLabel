# Mushroom Production Management System (MVP)

## TL;DR

> **Quick Summary**: A mobile-first PWA for tracking mushroom batch genealogy, enforcing FIFO, and providing instant inventory visibility via barcode scanning.
> 
> **Deliverables**:
> - Next.js + Supabase Web App (PWA ready)
> - Database with Recursive Traceability (Grain -> Substrate)
> - "Shed Mode" UI for mobile scanning
> - "CEO Dashboard" for KPIs (Funnel, Death Rate, Forecast)
> 
> **Estimated Effort**: Short (12 Hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Database → Core Logic → Dashboard

---

## Context

### Original Request
Build a "Skate" (MVP) production system in < 12 hours.
Focus: ROI, Traceability (Parent/Child), FIFO, Speed (Scanning).
Hardware: Niimbot (Mobile) + USB Scanners.

### Interview Summary
**Key Decisions**:
- **Stack**: Next.js (App Router) + Supabase (Postgres).
- **Printing**: **Pre-print & Scan** workflow. User prints generic IDs (G-001...G-100), scans to "activate" them. No complex printer integration.
- **Testing**: **Manual QA Only**. Focus on speed/features.

**Guardrails (Metis Logic)**:
- **Online Only**: No complex offline sync for MVP.
- **Single User**: No complex RBAC.
- **Simple Forecast**: Linear projection only (Creation + Avg Days). No ML.
- **Input Constraint**: Scanner acts as Keyboard. No WebSerial/Bluetooth APIs.

---

## Work Objectives

### Core Objective
Enable full traceability from Grain to Sold Kit, with instant status updates via scan.

### Concrete Deliverables
- `src/app/dashboard/page.tsx`: CEO View (Funnel, KPI)
- `src/app/scan/page.tsx`: Mobile Scan Action View
- `src/lib/db/schema.sql`: Supabase Schema with Recursive Views
- `src/components/batch/genealogy.tsx`: Visual Family Tree

### Definition of Done
- [ ] Scanning a "Parent" Grain ID allows creating "Child" Substrate batches.
- [ ] Scanning a "Contaminated" batch updates stock count instantly.
- [ ] Dashboard accurately predicts "Ready Next Week" based on dates.
- [ ] "Kill Switch": Marking a parent contaminated flags all children.

---

## Verification Strategy (Manual QA)

> **Constraint**: 12-Hour Speedrun. No automated tests.

**QA Procedure per Feature:**

1.  **Traceability**:
    *   Create Batch A (Grain).
    *   Create Batch B (Substrate), select A as Parent.
    *   Verify: Batch B shows A in lineage.
    *   Mark A as "Contaminated".
    *   Verify: Batch B shows "Warning: Parent Contaminated".

2.  **FIFO Control**:
    *   Create Batch Old (15 days ago).
    *   Create Batch New (5 days ago).
    *   Try to "Ship" Batch New.
    *   Verify: System Alert "Older batch available (Batch Old)".

3.  **Scanning**:
    *   Open `/scan`.
    *   Type/Scan ID.
    *   Verify: Redirects to Batch Details or "Assign New" modal.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation):
├── Task 1: Project Setup (Next.js + Supabase + Shadcn)
├── Task 2: Database Schema & Types (Supabase SQL)
└── Task 3: Basic Layout & Navigation (Mobile + Desktop)

Wave 2 (Core Logic):
├── Task 4: Batch CRUD + "Activate via Scan" Flow
├── Task 5: Recursive Traceability Logic (Parent/Child)
└── Task 6: Status & Inventory Logic (FIFO Check)

Wave 3 (UI & Dashboards):
├── Task 7: "CEO Dashboard" (Funnel, KPIs)
├── Task 8: Forecasting & Death Rate Widgets
└── Task 9: Mobile "Scan-to-Action" UI
```

### Dependency Matrix
| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 3, 4 |
| 2 | None | 4, 5, 6 |
| 3 | 1 | 9 |
| 4 | 1, 2 | 5, 9 |
| 5 | 4 | 7 |
| 6 | 4 | 7, 8 |
| 7 | 5, 6 | None |
| 8 | 6 | None |
| 9 | 3, 4 | None |

---

## TODOs

- [ ] 1. Project Initialization & Infrastructure
  **What to do**:
  - Initialize Next.js 14 (App Router, TS, Tailwind).
  - Install Shadcn/UI (Button, Card, Table, Form, Input, Dialog, Alert).
  - Setup Supabase Client (`@supabase/supabase-js`).
  - Configure Tailwind for Mobile (safe areas).

  **Recommended Agent**: `delegate_task(category="quick", load_skills=["frontend-ui-ux"], ...)`

  **References**:
  - `package.json` (setup scripts)
  - `tailwind.config.ts` (theme config)

  **Acceptance Criteria**:
  - [ ] `npm run dev` starts without errors.
  - [ ] Supabase client connects (env vars set).
  - [ ] Shadcn components render correctly.

- [ ] 2. Database Schema Definition
  **What to do**:
  - Create `batches` table (id, readable_id, type, strain, status, parent_id, created_at, notes).
  - Create `events` table (id, batch_id, action_type, created_at).
  - Create `strains` table (config for colonization days).
  - Create `view_lineage` (Recursive CTE for traceability).

  **Recommended Agent**: `delegate_task(category="ultrabrain", load_skills=[], ...)`

  **References**:
  - Supabase SQL Editor / Migrations.
  - **Pattern**: `WITH RECURSIVE lineage AS ...` for tree traversal.

  **Acceptance Criteria**:
  - [ ] Tables created in Supabase.
  - [ ] RLS policies set (allow all for MVP or basic auth).
  - [ ] Recursive query returns full family tree.

- [ ] 3. Batch Management (CRUD) & Pre-print Scan Logic
  **What to do**:
  - Create "New Batch" form.
  - Implement "Scan to Activate":
    - Input field listens for Barcode input.
    - If ID doesn't exist -> Open "Create Batch" form with ID pre-filled.
    - If ID exists -> Go to details.
  - Implement `createBatch` server action.

  **Recommended Agent**: `delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], ...)`

  **References**:
  - `src/actions/batch.ts` (Server Actions).
  - `src/components/scan-input.tsx` (Auto-focus input).

  **Acceptance Criteria**:
  - [ ] Entering "G-001" (new) opens creation form.
  - [ ] Creating saves to DB.
  - [ ] Entering "G-001" (existing) opens details.

- [ ] 4. Traceability & Lineage UI
  **What to do**:
  - In "Create Substrate" form, allow scanning "Parent Grain".
  - Validate: Parent must be OLDER than Child.
  - On Batch Details: Show "Parents" (up) and "Children" (down).
  - Highlight "Contaminated" ancestors in Red.

  **Recommended Agent**: `delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], ...)`

  **References**:
  - `src/components/batch/lineage-card.tsx`.

  **Acceptance Criteria**:
  - [ ] Substrate batch links to Grain batch.
  - [ ] Tree view shows correct hierarchy.
  - [ ] "Kill Switch": Mark Parent Contaminated -> Child shows warning.

- [ ] 5. FIFO Logic & Status Workflow
  **What to do**:
  - Implement Status Transitions: Incubating -> Ready -> Sold | Contaminated.
  - **FIFO Check**: When marking "Sold":
    - Query `batches` for `type=SAME` and `status=READY` ordered by `created_at ASC`.
    - If older batch exists, show Alert: "Stop! Batch X is older (15 days). Use that first."

  **Recommended Agent**: `delegate_task(category="ultrabrain", load_skills=[], ...)`

  **References**:
  - `src/actions/status.ts`.

  **Acceptance Criteria**:
  - [ ] Status updates persist.
  - [ ] FIFO Alert triggers correctly when older stock exists.

- [ ] 6. CEO Dashboard (The "Funnel")
  **What to do**:
  - **Pipeline Widget**: Columns for Colonizing / Ready / Sold. Counts per stage.
  - **Death Rate Widget**: Calculate % of batches marked "Contaminated" in last 30 days.
  - **Forecast Widget**:
    - `Expected Ready Date = Created + Strain.colonization_days`.
    - Group by Week.

  **Recommended Agent**: `delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], ...)`

  **References**:
  - `src/app/page.tsx` (Dashboard).
  - `recharts` (for simple charts if needed, or just CSS bars).

  **Acceptance Criteria**:
  - [ ] Numbers match DB counts.
  - [ ] "Death Rate" accurately reflects contamination %.
  - [ ] Forecast shows realistic future dates.

- [ ] 7. Mobile "Scan Mode" UI
  **What to do**:
  - Dedicated mobile route `/scan`.
  - Big buttons: [ SCAN ], [ MARK CONTAM ], [ MARK SOLD ].
  - "Shed Mode": High contrast, large text for visibility in dim light.

  **Recommended Agent**: `delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], ...)`

  **Acceptance Criteria**:
  - [ ] Usable on mobile screen.
  - [ ] Quick actions work with minimal clicks.

---

## Success Criteria

### Final Checklist
- [ ] Can create Grain batch -> Create Substrate (linked) -> Mark Sold.
- [ ] FIFO warning prevents shipping new stock before old.
- [ ] Dashboard shows correct inventory counts.
- [ ] Scanning a barcode brings up the correct batch instantly.
