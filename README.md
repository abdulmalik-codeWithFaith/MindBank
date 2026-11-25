# MindBank AI

**Withdraw money from your mind to your bank account.**

MindBank AI turns the amount of money a person imagines into a realistic plan to save and earn it, without borrowing. MindBank does not lend money.

## How it works

1. **Think of an amount.** Enter an amount (for example ₦100,000) and what it is for.
2. **Withdraw my money.** Continue to a short financial assessment.
3. **Answer the assessment.** Income, skills, expenses, savings, free time and deadline.
4. **Get an AI plan.** Saving strategy, ways to earn that fit the person's skills, and weekly actions.
5. **Earn.** Skill-based work plus survey and microtask sites, with links.
6. **Track progress.** Log earnings and savings and watch the goal ring fill.

There are no accounts. Everything is saved in the visitor's own browser.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | lucide-react |
| AI | Google Gemini API (REST, server side) |

## Project structure

```
app/
├── layout.tsx              Root layout and fonts
├── globals.css             Tailwind theme and shared utilities
├── page.tsx                Landing page
├── assessment/page.tsx     Financial questions (4 steps)
├── plan/page.tsx           AI plan
├── earn/page.tsx           Skill gigs, surveys and microtasks
├── dashboard/page.tsx      Progress tracker
└── api/plan/route.ts       Builds the plan (Gemini, with fallback)

lib/
├── store.ts                Saved data (browser) and hooks
├── opportunities.ts        Skill-to-work catalog
└── planKey.ts              Fingerprint for goal + answers
```

## Getting started

```bash
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=
# Optional. Defaults to gemini-2.5-flash
GEMINI_MODEL=
```

```bash
npm run dev
```

Open `http://localhost:3000`. On your host (for example Vercel), add `GEMINI_API_KEY` in the environment variables and redeploy.

## Where data lives

Goal, answers, plan, ticked tasks, logged entries, joined platforms and the dollar rate are stored in `localStorage` under the key `mindbank:data`. This means:

- Data stays on one device and browser.
- Clearing browser data erases it.
- Nothing is sent to a server except the goal and answers, which go to `/api/plan` to build the plan.

## The AI plan

`POST /api/plan` receives the goal and answers, checks and trims them, and returns a plan.

- Opportunities come from `lib/opportunities.ts`, so links are real and matched to the person's skills (free text such as "React developer" is understood).
- Gemini writes the summary, saving advice and weekly steps. If it is busy or no key is set, a built-in plan is returned.
- The route is public, so it limits each IP to 6 plans per 10 minutes. This is a basic, per-instance limit.

## Earning platforms

The survey and microtask sites are listed in the `PLATFORMS` array at the top of `app/earn/page.tsx`. Figures come from third-party reviews and user reports, not a live feed, and change often. Re-check them before launch. Do not call them "verified" unless you verify them yourself.

## Known limits and next steps

- [ ] No accounts: data does not follow a person across devices. Add sign-in and a database if you need that.
- [ ] The rate limit resets when the server instance restarts. Use a shared store (for example Upstash Redis) or add sign-in for stronger protection of your Gemini quota.
- [ ] Re-check every platform's pay, minimum cashout and link.
- [ ] Add Terms, Privacy, and a custom 404 page.
- [ ] Replace the Unsplash images with your own files in `/public`.

## Disclaimer

MindBank provides planning guidance only. It is not financial advice and does not guarantee earnings. Pay estimates for third-party platforms are indicative and may be out of date. Never pay to join a survey or microtask site.