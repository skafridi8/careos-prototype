# CareOS Prototype — Tech Stack

## Core
- **React 19** + **React Router 7** (client-side routing) — plain JS/JSX, no TypeScript (the `@types/react*` packages are only for editor intellisense)
- **Vite 8** as the dev server/build tool, running on the new Rolldown-based bundler (hence the `rolldown` / `@rolldown/*` packages)

## UI
- **Tailwind CSS 4** via `@tailwindcss/vite` for styling
- **lucide-react** for icons
- **Recharts** for charts/graphs

## Tooling
- **oxlint** (Rust-based linter) instead of ESLint — config in `.oxlintrc.json`

## App Structure (all plain `.jsx`)
- `src/pages/web/*` — web/desktop views (Roster, Compliance, ClientList, ClientDetail, CarePlanEditor, AiAssistant)
- `src/components/mobile/*` — simulated mobile app rendered inside a `PhoneFrame` component, toggled via `ViewModeContext`
- `src/components/roster/*` + `src/context/RosterContext.jsx` + `src/utils/rosterEngine.js` — rostering engine/state shared between web and mobile views
- `src/data/*` — static mock/seed data (clients, carers, visits, compliance, etc.) standing in for a backend

## State Management
No backend, no state library (e.g. Redux). State is handled via React Context (`RosterContext`, `ViewModeContext`) and local component state, with `src/data/*` acting as the mock data layer.
