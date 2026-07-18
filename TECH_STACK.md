# Tendly Prototype — Tech Stack

## Core
- **React 19** + **React Router 7** (client-side routing) — plain JS/JSX, no TypeScript (the `@types/react*` packages are only for editor intellisense)
- **Vite 8** as the dev server/build tool, running on the new Rolldown-based bundler (hence the `rolldown` / `@rolldown/*` packages)

## UI
- **Tailwind CSS 4** via `@tailwindcss/vite` for styling
- **lucide-react** for icons
- **Recharts** for charts/graphs

## Backend
- **Supabase** (Postgres + Auth + Realtime) via `@supabase/supabase-js` — real auth (carer/manager/family roles). Base schema + RLS in `supabase/schema.sql` (`profiles`, `carer_training`, `client_intake`, `carer_timesheets`, `chat_logs`, `customer_subscriptions`). Phase 0 schema in `supabase/phase0-schema.sql` mirrors the mock ids from `src/data/*` into `clients`/`carers`/`visits` and adds `care_notes`, `care_insights`, `risk_scores`, `family_members`, `messages`, `visit_logs`, `visit_assignments`, analytics views (`care_quality_daily`, `care_quality_summary`, `carer_workload`), and Realtime on `messages`/`visit_logs`. Client at `src/lib/supabaseClient.js`, reading `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env.

## Hosting
- **Vercel** — `vercel.json` rewrites all paths to `index.html` for client-side routing.

## Tooling
- **oxlint** (Rust-based linter) instead of ESLint — config in `.oxlintrc.json`

## App Structure (all plain `.jsx`)
- `src/pages/web/*` — web/desktop views (Roster, Compliance, ClientList, ClientDetail, CarePlanEditor, AiAssistant, Records)
- `src/pages/web/forms/*` — Supabase-backed forms (carer training log, client sign-up, weekly hours/pay)
- `src/pages/Login.jsx` + `src/context/AuthContext.jsx` + `src/components/layout/ProtectedRoute.jsx` — Supabase Auth sign-in/sign-up and route protection
- `src/components/mobile/*` — simulated mobile app rendered inside a `PhoneFrame` component, toggled via `ViewModeContext`
- `src/pages/family/FamilyPortal.jsx` + `src/components/family/*` + `src/lib/familyApi.js` — family-facing portal (`/family`, own `family` role) with live visit status + two-way messaging over Supabase Realtime; manager-side sharing toggles and thread on ClientDetail
- `src/components/insights/*` + `src/lib/careData.js` + `api/insights/generate.js` — AI care insights: Groq analyses `care_notes` into `care_insights` rows, weighted `risk_scores`, chatbot `query_care_data` tool
- `src/pages/web/Analytics.jsx` + `src/lib/analyticsApi.js` — premium analytics from the Postgres views, gated on `customer_subscriptions`
- `src/pages/web/LiveVisits.jsx` + `src/lib/visitLogsApi.js` + `src/components/mobile/GpsCheckInCard.jsx` — GPS check-in/out from the carer phone into `visit_logs`, live who's-where board over Realtime, continuity/proximity stats feeding `suggestCarers`
- `src/components/roster/*` + `src/context/RosterContext.jsx` + `src/utils/rosterEngine.js` — rostering engine/state shared between web and mobile views
- `src/data/*` — static mock/seed data (clients, carers, visits, compliance, etc.) still used by Care Planning/Roster/Compliance screens

## State Management
Care Planning/Roster/Compliance run on React Context (`RosterContext`, `ViewModeContext`) over the static `src/data/*` mock layer, unchanged. Auth/forms/records run on live Supabase data via `AuthContext` and direct `supabase-js` calls per page.
