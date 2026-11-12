# MindBank AI

**Withdraw money from your mind to your bank account.**

MindBank AI helps people turn the amount of money they imagine into a realistic plan to save and earn it, without borrowing. A user enters an amount and a goal, answers a short financial assessment, and gets a personalized plan, a list of quick ways to earn (surveys and microtasks), and a dashboard to track progress.

MindBank does not lend money.

---

## How it works

1. **Think of an amount.** Visitors enter an amount (for example ₦100,000) and what they want to spend it on. No account needed.
2. **Withdraw my money.** Clicking the button sends them to log in or create an account.
3. **Answer the assessment.** Income, skills, expenses, savings, free time and deadline.
4. **Get an AI plan.** Saving strategy, ways to earn and weekly actions.
5. **Earn.** Survey and microtask platforms with links, pay and payout minimums.
6. **Track progress.** Log earnings and savings and watch the goal ring fill.

Only signed-in users can open the assessment, plan, earn page and dashboard.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | lucide-react |
| Auth | Firebase Authentication (email/password and Google) |
| AI | Google Gemini API (REST) |
| Fonts | Bricolage Grotesque and DM Sans via `next/font` |

---

## Project structure

```
app/
├── layout.tsx              Root layout, fonts, AuthProvider
├── globals.css             Tailwind theme, colors, shared utilities
├── page.tsx                Landing page
├── auth/page.tsx           Log in / create account
├── assessment/             Financial questions (4 steps)
├── plan/                   AI-generated plan
├── earn/                   Surveys and microtasks
├── dashboard/              Progress tracker
└── api/plan/route.ts       Gemini route (with fallback plan)

components/
└── AuthProvider.tsx        Session context + RequireAuth guard

lib/
└── firebase.ts             Firebase init and persistence
```

Each protected folder (`assessment`, `plan`, `earn`, `dashboard`) contains a small `layout.tsx` that wraps its page in `RequireAuth`.

---

## Getting started

### 1. Install

```bash
npm install
npm install firebase framer-motion lucide-react
```

### 2. Environment variables

Copy `env.local.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
# Optional. Defaults to gemini-2.5-flash
GEMINI_MODEL=
```

`GEMINI_API_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.

### 3. Firebase setup

1. Create a project in the [Firebase console](https://console.firebase.google.com).
2. Add a **web app** and copy its config into `.env.local`.
3. Go to **Authentication → Sign-in method** and enable **Email/Password** and **Google**.
4. Go to **Authentication → Settings → Authorized domains** and make sure `localhost` and your production domain are listed.

### 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

> The code imports with the `@/` alias (for example `@/lib/firebase`). `create-next-app` sets this up by default. If your project has no alias, add `"paths": { "@/*": ["./*"] }` to `tsconfig.json`.

---

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page and goal entry |
| `/auth` | Public | Log in or sign up |
| `/assessment` | Signed in | Income, skills, expenses, time |
| `/plan` | Signed in | AI plan and weekly actions |
| `/earn` | Signed in | Survey and microtask platforms |
| `/dashboard` | Signed in | Progress, charts, history |
| `POST /api/plan` | See limitations | Generates the plan |

---

## Sessions

Firebase local persistence keeps users signed in after they close the tab or browser, until they sign out. `AuthProvider` reads the saved session on load and exposes it through `useAuth()`:

```tsx
const { user, loading, logout } = useAuth();
```

---

## Where data lives today

| Data | Stored in |
| --- | --- |
| Login session | Firebase (browser persistence) |
| Landing goal (amount and text) | `sessionStorage` (`mindbank:draft`) |
| Assessment answers | `sessionStorage` (`mindbank:assessment`) |
| Goal, deadline, start date, logged entries, ticked tasks, joined platforms, dollar rate | `localStorage` (`mindbank:*` keys) |

This data is saved on one device and browser only. See the roadmap below.

---

## The AI plan

`POST /api/plan` sends the goal and assessment to Gemini and expects JSON back: summary, feasibility, weekly target, saving strategy, earning opportunities and weekly actions.

- The prompt forbids loans, betting, crypto trading and get-rich-quick schemes, and asks for honest estimates.
- If `GEMINI_API_KEY` is missing, or Gemini fails, the route returns a plan calculated from the user's own numbers, so the page still works. The response includes `source: "gemini"` or `"fallback"`.

---

## Earning platforms

The `/earn` page lists survey and microtask sites from the `PLATFORMS` array at the top of `app/earn/page.tsx`. Each entry has the pay per task, minimum cashout, payout methods, Nigeria availability and a link.

**Important:**

- Figures come from third-party reviews and user reports, not a live feed. They change often. The page shows a "last checked" date, which is set by `LAST_CHECKED`.
- Re-check each platform before launch and whenever you update the list.
- Prolific is not listed because it supports only certain countries and Nigeria is not on its main list.
- Do not call these platforms "verified" unless you verify them yourself.
- No referral codes are included. If you add any, disclose them to users.

---

## Known limitations and roadmap

- [ ] **Firestore.** Save the goal, assessment, plan and entries per user so data follows them across devices.
- [ ] **Protect `/api/plan`.** The client sends its Firebase ID token and the route verifies it with `firebase-admin`. Right now anyone can call it and use your Gemini quota.
- [ ] **Firestore security rules.** The route guard is only a convenience, because page code still reaches the browser. Real protection is server-side checks and rules.
- [ ] Landing page: make the auth modal's Continue button go to `/auth`, and show "Dashboard" in the nav when signed in.
- [ ] Add a log-out button and a profile page.
- [ ] Forgot password, Terms and Privacy pages, and a custom 404.
- [ ] Move `PLATFORMS` to a database table so it can be updated without redeploying.
- [ ] Replace the placeholder Unsplash images with your own files in `/public`.
- [ ] Have the AI plan recommend platforms from the `/earn` list.

---

## Deployment

1. Push the project to GitHub.
2. Import it into [Vercel](https://vercel.com) (or any Next.js host).
3. Add every variable from `.env.local` in the host's environment settings.
4. Add the deployed domain to Firebase **Authorized domains**.
5. Run `npm run build` locally first to catch errors.

---

## Disclaimer

MindBank provides planning guidance only. It is not financial advice and does not guarantee earnings. Pay estimates for third-party platforms are indicative and may be out of date. Users should read each platform's terms and never pay to join a survey or microtask site.

---

**Think it. Plan it. Earn it. Withdraw it.**