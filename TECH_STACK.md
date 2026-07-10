# CareOS Prototype — Tech Stack

## Core
- **React 19** + **React Router 7** (client-side routing) — plain JS/JSX, no TypeScript (the `@types/react*` packages are only for editor intellisense)
- **Vite 8** as the dev server/build tool, running on the new Rolldown-based bundler (hence the `rolldown` / `@rolldown/*` packages)

## UI
- **Tailwind CSS 4** via `@tailwindcss/vite` for styling
- **lucide-react** for icons
- **Recharts** for charts/graphs

## Backend
- **Supabase** (Postgres + Auth) via `@supabase/supabase-js` — real auth (carer/manager roles) and 4 tables: `profiles`, `carer_training`, `client_intake`, `carer_timesheets`. Schema + row-level security policies live in `supabase/schema.sql`. Client at `src/lib/supabaseClient.js`, reading `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env.

## Hosting
- **Vercel** — `vercel.json` rewrites all paths to `index.html` for client-side routing.

## Tooling
- **oxlint** (Rust-based linter) instead of ESLint — config in `.oxlintrc.json`

## App Structure (all plain `.jsx`)
- `src/pages/web/*` — web/desktop views (Roster, Compliance, ClientList, ClientDetail, CarePlanEditor, AiAssistant, Records)
- `src/pages/web/forms/*` — Supabase-backed forms (carer training log, client sign-up, weekly hours/pay)
- `src/pages/Login.jsx` + `src/context/AuthContext.jsx` + `src/components/layout/ProtectedRoute.jsx` — Supabase Auth sign-in/sign-up and route protection
- `src/components/mobile/*` — simulated mobile app rendered inside a `PhoneFrame` component, toggled via `ViewModeContext`
- `src/components/roster/*` + `src/context/RosterContext.jsx` + `src/utils/rosterEngine.js` — rostering engine/state shared between web and mobile views
- `src/data/*` — static mock/seed data (clients, carers, visits, compliance, etc.) still used by Care Planning/Roster/Compliance screens

## State Management
Care Planning/Roster/Compliance run on React Context (`RosterContext`, `ViewModeContext`) over the static `src/data/*` mock layer, unchanged. Auth/forms/records run on live Supabase data via `AuthContext` and direct `supabase-js` calls per page.
