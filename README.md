# PrepDecks

A "LeetCode for banking/business careers" interview-prep platform. PrepDecks
covers five target career tracks — Private Equity, Investment Banking, Product
Management, Software Engineering, and Data Analysis — with full practice
content currently live for **Investment Banking** and **Private Equity**
(the others appear as "Coming Soon" on the landing page).

## Practice modes

1. **Flashcard self-grading** — the core mechanic used across the app: see a
   prompt, recall/write an answer, reveal the model answer, self-mark
   Known / Weak / Review. Progress persists per user, per question.
2. **Timed mock interview** — pick a category (or "mixed"), work through a
   timed sequence of questions with no pausing or reveal, then get a summary
   screen at the end.
3. **Technical drills with autograding** — for LBO/DCF/accounting questions
   with a numeric answer, enter a number and get instant right/wrong feedback
   plus a worked explanation.

## Tech stack

- **Framework**: [Next.js](https://nextjs.org) (App Router) + TypeScript + React
- **Database**: PostgreSQL via [Prisma](https://www.prisma.io)
- **Auth**: [NextAuth.js](https://next-auth.js.org) (credentials provider)
- **Styling**: Tailwind CSS
- **Storage**: Vercel Blob
- **Testing**: Vitest + Testing Library
- **Hosting**: Vercel

## Getting started

### Prerequisites

- Node.js
- A PostgreSQL database (the included `docker-compose.yml` spins up a local
  instance on port `5433`)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` (or set up your own `.env.local`) with:

   ```
   DATABASE_URL=postgresql://prepdecks:prepdecks@localhost:5433/prepdecks
   NEXTAUTH_SECRET=<generate with `openssl rand -base64 32`>
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Start a local database (optional, if not using a hosted Postgres):

   ```bash
   docker compose up -d
   ```

4. Apply the schema and seed data:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`       | Start the Next.js dev server         |
| `npm run build`     | Build for production                 |
| `npm run start`     | Run the production build             |
| `npm run lint`      | Run ESLint                           |
| `npm test`          | Run the Vitest test suite            |
| `npm run db:seed`   | Seed the database via Prisma         |

## Project structure

```
src/app/                        # Routes (App Router)
  (auth)/login, (auth)/signup   # Auth pages
  tracks/                       # Track → category → question flows
  api/                          # Auth + progress API routes
src/components/                 # Flashcard session, track cards, etc.
src/lib/                        # Auth, Prisma client, progress logic
prisma/schema.prisma            # Data model (User, Track, Category,
                                 # Question, UserQuestionProgress)
tests/                          # Vitest unit/integration tests
docs/superpowers/                # Design spec and implementation plan
```

## Data model

- `User` — email/password account
- `Track` — a career track (slug, name, live/coming-soon status)
- `Category` — nested categories/subcategories within a track
- `Question` — prompt, model answer, difficulty, category
- `UserQuestionProgress` — per-user, per-question status (known/weak/review),
  times seen, last seen
