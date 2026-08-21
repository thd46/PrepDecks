# PrepDecks v1 — Design

## Summary

PrepDecks is a "LeetCode for banking/business careers" interview-prep platform. v1
ships a landing page covering all five target tracks (Private Equity, Investment
Banking, Product Management, Software Engineering, Data Analysis) but only builds
out full practice content for **Investment Banking + Private Equity**, since they
share the most content and are the strongest starting domain. Other tracks appear
as "Coming Soon" cards to establish the site's positioning without committing to
content we haven't written yet.

## Content sourcing note

We reviewed "The 400 Investment Banking Interview Questions & Answers" (Breaking
Into Wall Street / Mergers & Inquisitions, © Capital Capable Media LLC) as a
reference for category structure only. It is copyrighted and explicitly restricts
reproduction. **No question or answer text from that guide will be copied into
the product.** We use it purely to inform the taxonomy below; all actual question
and answer content shipped in the app is original.

## Landing page

- Hero section: site value prop + a "Tell me about yourself" framing — i.e. the
  landing page pitches the platform back to the visitor the way a candidate would
  pitch themselves (this is the requested "tell me about yourself" framing for the
  page's narrative voice, not a literal user-facing form field).
- Five track cards: Private Equity, Investment Banking, Product Management,
  Software Engineering, Data Analysis.
  - IB and PE link into live content.
  - PM, SWE, Data Analysis show a "Coming Soon" state (no dead links, just a
    waitlist/notify signal or a disabled card).
- A "Core" section framing the site's purpose: "prepare you for an interview" —
  short explainer of the practice loop (flashcards, mock interviews, technical
  drills) so a first-time visitor understands the mechanic before signing up.

## Content taxonomy (IB + PE track)

Modeled on the structure of the reference guide, with original content:

**Fit / Behavioral**
- Background & Personal
- Why Banking / Why This Firm
- Strengths & Weaknesses
- Team & Leadership
- Career Changer scenarios
- Deal / Transaction Discussion (walk me through a deal you worked on)

**Technical**
- Accounting — Basic, Advanced
- Enterprise Value / Equity Value — Basic, Advanced
- Valuation (Comps, Precedent Transactions) — Basic, Advanced
- DCF — Basic, Advanced
- Merger Models — Basic, Advanced
- LBO Models — Basic, Advanced
- Brain Teasers

Each question record has: category, subcategory, difficulty (Basic/Advanced),
prompt text, model answer text, and (for technical drill questions only) a
structured numeric-input schema for autograding.

## Practice modes

1. **Flashcard self-grading** (core mechanic, used everywhere): prompt shown →
   user recalls/writes an answer → reveals model answer → self-marks
   Known / Weak / Review. Per-user progress persists per question.
2. **Timed mock interview**: user picks a category (or "mixed"), gets a
   sequence of questions on a timer, no pausing/reveal until the round ends,
   then a summary screen (time per question, self-graded results).
3. **Technical drills with autograding**: for LBO/DCF/accounting questions that
   have a numeric answer (e.g. "Depreciation goes up by $10 — what happens to
   cash?"), user enters a number, gets instant right/wrong feedback plus the
   worked explanation.

## Accounts & progress

- Email/password accounts from v1 (NextAuth + Prisma adapter).
- Per-user, per-question progress state (Known/Weak/Review, last seen, times
  practiced) drives a simple dashboard: weak-question queue, category
  completion %, mock interview history.

## Tech stack

- **Frontend/Backend**: Next.js (App Router) + TypeScript, React.
- **Database**: Postgres, accessed via Prisma ORM.
- **Auth**: NextAuth.js (credentials provider for v1; can add OAuth later).
- **Hosting**: Vercel (app) + a hosted Postgres provider (Neon or Supabase).
- **Styling**: Tailwind CSS for speed.

Rationale: this stack is fast to build solo, has strong defaults, deploys with
minimal ops overhead, and keeps frontend/backend in one TypeScript codebase.

## Data model (high level)

- `User` (id, email, password hash, createdAt)
- `Track` (id, slug, name, status: live | coming_soon)
- `Category` (id, trackId, name, parentCategoryId nullable — supports
  subcategories like Accounting → Basic/Advanced)
- `Question` (id, categoryId, difficulty, prompt, modelAnswer, drillSchema
  nullable JSON for autograded questions)
- `UserQuestionProgress` (userId, questionId, status: known | weak | review,
  lastSeenAt, timesSeen)
- `MockInterviewSession` (id, userId, categoryId nullable, startedAt,
  completedAt, questionIds[], results JSON)

## Out of scope for v1

- PM / SWE / Data Analysis actual content (landing page placeholders only).
- Social features (leaderboards, sharing, comments).
- Payments / subscriptions.
- OAuth login providers (email/password only to start).

## Testing approach

- Unit tests for progress-tracking logic and drill autograding (pure functions).
- Integration tests for auth flows and core API routes (question fetch, progress
  update, mock interview session lifecycle).
- Manual verification of the practice UI flows (flashcard flip, mock interview
  timer, drill grading) in a browser per the frontend verification step of the
  normal dev workflow.
