# Daily Multi-Source AI Reading Module

## Purpose

This document translates the product design into a repo-aware architecture for bilalhocayds.com.

The goal is to evolve the current daily reading flow from a single AI response into a pipeline-backed reading system that supports:

- multi-source ingestion
- deterministic cleaning
- pedagogical adaptation
- YDT/YDS-aligned activity generation
- answer tracking
- analytics
- admin review and publishing

## Current Repo Baseline

The current reading stack is centered on three areas:

- `src/lib/student-daily-content.ts`: assigns and caches daily content per student
- `src/lib/ai-content.ts`: generates the current reading payload in one pass
- `src/app/admin/readings/page.tsx`: basic admin CRUD for reading texts

This means the new module should not replace the student delivery flow first. It should insert a new content pipeline behind it.

## Target Product Shape

The new reading module should produce one `ReadingPackage` per student-facing session.

Each package contains:

- one curated final passage asset
- a premium header
- structured activities
- trackable questions
- vocabulary targets
- explanations
- analytics blueprint

The system should separate content lifecycle from student lifecycle.

Content lifecycle:

1. source approval
2. ingestion
3. cleaning
4. analysis
5. pedagogical transformation
6. question generation
7. review
8. publish

Student lifecycle:

1. assignment
2. attempt start
3. autosave answers
4. submit
5. review
6. analytics
7. adaptive next step

## Proposed Pipeline

### 1. Source Governance

Use an approved-domain registry to control trust and extraction behavior.

Key controls:

- active or inactive domain
- trust score
- source type
- extraction strategy
- allowed topics
- blocked patterns
- daily fetch limits

### 2. Ingestion

Supported entry points:

- approved URL fetch
- RSS-driven article discovery
- manual admin paste/upload
- curated internal database import
- platform-authored original text

Each ingestion creates a `ReadingSourceDocument`.

### 3. Cleaning and Normalization

Cleaning must be deterministic before AI adaptation.

Required transformations:

- strip menus and navigation text
- remove cookie banners and social labels
- remove author bio clutter
- normalize punctuation and spacing
- repair broken line wraps
- preserve paragraph boundaries
- preserve discourse connectors
- reject texts that remain noisy after cleaning

### 4. Linguistic and Assessment Analysis

The system should score each cleaned passage for:

- CEFR
- lexical density
- sentence complexity
- connector density
- academic tone
- exam suitability by target exam family

### 5. Pedagogical Transformation

The passage asset should then be transformed into a final student-safe reading passage.

Allowed transformations:

- shorten low-value sections
- segment long passages into coherent blocks
- retain referential chains
- retain logical connectors
- reduce noise without reducing meaning

### 6. Activity Generation

Questions must be generated from an intermediate discourse map, not directly from raw text.

The generator should first identify:

- paragraph function
- key claims
- evidence relationships
- inferential hotspots
- target vocabulary
- connector anchors

Only then should it generate questions.

### 7. QA and Editorial Review

Every passage and question set should pass through automated checks.

Automated QA:

- answer presence
- distractor uniqueness
- explanation presence
- evidence anchor presence
- passage-length band validation
- target-skill coverage

Editorial statuses:

- draft
- ai-generated
- admin-reviewed
- published
- archived
- rejected

### 8. Student Delivery

The student should receive a package that is:

- mobile friendly
- answerable on screen
- autosaved
- section-submittable
- reviewable after submission

## Personalization Logic

The assignment layer should build a student brief using:

- exam target
- CEFR level
- daily time budget
- recent skill weaknesses
- topic preferences
- reading speed profile
- vocabulary weakness map

Adaptive rules:

- YDT: shorter, inferential, paragraph-logic heavy
- YDS and YOKDIL: academic, vocabulary dense, discourse heavy
- weak connectors: more cohesion tasks
- weak vocabulary: more in-context meaning and collocation work
- slow readers: shorter passage and reduced task load

## Activity Architecture

Each package should include these activity families:

### Mandatory

- multiple-choice comprehension
- vocabulary in context
- YDT/YDS meaning and inference
- connector and cohesion activity
- short follow-up analysis

### Optional

- paragraph completion
- sentence insertion
- main idea
- reference word
- closest meaning
- cloze paragraph
- title matching

## Connector Design Principles

Connector tasks are a primary product differentiator.

The engine should test:

- relation type
- continuation logic
- concession vs contrast distinction
- result vs addition distinction
- sentence-bridge selection
- paragraph flow consistency

Connector items must depend on actual discourse flow, not isolated keyword substitution.

## Vocabulary Layer

Each package should extract 8 to 15 useful target items.

Each target should include:

- word
- lemma
- part of speech
- English definition
- Turkish meaning
- example sentence
- collocation
- synonym or antonym if useful
- word family if useful
- memory note if useful

## Analytics Layer

After submission, the system should report:

- score summary
- question family breakdown
- weak area detection
- next-step recommendation
- time behavior
- answer revision behavior

## Admin System

The admin system should expand beyond CRUD into five working areas:

1. source governance
2. ingestion queue
3. passage editor
4. question review
5. performance monitoring

## Suggested API Surface

Because live APIs in this repo should exist under root `app/api`, the target structure should be:

- `app/api/admin/reading-sources/fetch/route.ts`
- `app/api/admin/reading-sources/upload/route.ts`
- `app/api/admin/reading-packages/generate/route.ts`
- `app/api/admin/reading-packages/publish/route.ts`
- `app/api/reading/today/route.ts`
- `app/api/reading/attempts/route.ts`
- `app/api/reading/attempts/[attemptId]/autosave/route.ts`
- `app/api/reading/attempts/[attemptId]/submit/route.ts`

## Repo-Specific Rollout Strategy

The safest rollout path for this codebase is:

1. add schema models first
2. add admin ingestion APIs next
3. add internal generator services
4. add student delivery and answer tracking
5. switch `student-daily-content` from legacy reading JSON to package assignment

This avoids breaking the existing reading page while the new system is being built.