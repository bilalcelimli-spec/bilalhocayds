# Daily Multi-Source AI Reading Module Implementation Plan

## Delivery Principle

Ship this in phases that preserve the current reading module until the new package pipeline is production-ready.

## Phase 1: Data Foundations

Goal:

- add schema support for ingestion, passage assets, packages, activities, vocabulary targets, assignments, attempts, and answers

Deliverables:

- Prisma enums and models in `prisma/schema.prisma`
- migration SQL for local and production databases
- no runtime dependency on new tables yet

Success criteria:

- `prisma generate` succeeds
- no existing page or API depends on new tables yet

## Phase 2: Admin Ingestion Workflow

Goal:

- create admin-side ingestion queue and manual source upload flow

Deliverables:

- approved source domain management
- URL ingestion action
- manual paste/upload action
- source document list with statuses
- raw vs cleaned preview

Files expected:

- `app/api/admin/reading-sources/fetch/route.ts`
- `app/api/admin/reading-sources/upload/route.ts`
- `src/lib/reading-ingestion.ts`
- `src/app/admin/readings/page.tsx` refactor or a new `src/app/admin/reading-sources/page.tsx`

## Phase 3: Cleaning and Passage Asset Creation

Goal:

- transform source documents into clean passage assets

Deliverables:

- extraction normalization service
- cleaning rules
- CEFR and suitability scoring
- editorial status workflow

Files expected:

- `src/lib/reading-cleaning.ts`
- `src/lib/reading-analysis.ts`
- `app/api/admin/reading-assets/clean/route.ts`
- `app/api/admin/reading-assets/analyze/route.ts`

## Phase 4: Package Generation

Goal:

- generate structured reading packages from passage assets

Deliverables:

- package generator service
- activity generator
- vocabulary extraction
- explanation generation
- QA validators

Files expected:

- `src/lib/reading-package-generator.ts`
- `src/lib/reading-question-validator.ts`
- `app/api/admin/reading-packages/generate/route.ts`

## Phase 5: Student Delivery and Tracking

Goal:

- deliver the package to students and track interaction

Deliverables:

- package assignment logic
- attempt start and autosave APIs
- submission and scoring
- review mode
- analytics summary

Files expected:

- `src/lib/student-reading.ts`
- `app/api/reading/today/route.ts`
- `app/api/reading/attempts/route.ts`
- `app/api/reading/attempts/[attemptId]/autosave/route.ts`
- `app/api/reading/attempts/[attemptId]/submit/route.ts`

## Phase 6: UI Upgrade

Goal:

- replace the current reading UI with a premium split-view package interface

Deliverables:

- desktop split layout
- mobile reading/question toggle
- question navigator
- vocabulary and explanation tabs
- answer state persistence

Files expected:

- `src/app/reading/page.tsx`
- `src/components/reading/*`

## Phase 7: Adaptive Optimization

Goal:

- use real performance to personalize future packages

Deliverables:

- skill weakness scoring
- package difficulty adjustment
- connector-heavy and vocabulary-heavy modes
- YDT/YDS expert mode rollout

## Initial Slice Included In This Commit

This first slice introduces:

- documentation for the architecture
- implementation plan
- initial Prisma schema models for the new reading pipeline

It intentionally does not yet:

- replace the current student reading flow
- add admin pages that depend on the new tables
- bind runtime code to unmigrated schema

## Validation Checklist For The Next Coding Step

Before Phase 2 starts:

1. run `npx prisma generate`
2. add migration SQL
3. run local database migration
4. scaffold admin ingestion route handlers
5. add a minimal admin page for source documents