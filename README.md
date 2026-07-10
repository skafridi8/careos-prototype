# CareOS Prototype

A home care rostering & compliance app, built with React + Vite. It includes a web (desktop) view and a simulated mobile carer app view, sharing a rostering engine over mock data — plus a real **Supabase** backend for carer sign-in, training records, client sign-ups, and weekly hours/pay.

## Running it on your own computer

**Requirements:** [Node.js](https://nodejs.org/) version 18 or later (includes `npm`). Download and install it if you don't already have it, then restart your terminal.

**Steps:**

1. Download the code
   ```
   git clone https://github.com/skafridi8/careos-prototype.git
   cd careos-prototype
   ```
   (No `git`? Instead click the green **Code** button on the [GitHub page](https://github.com/skafridi8/careos-prototype) → **Download ZIP**, then unzip it and open a terminal in that folder.)

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables — copy `.env.example` to `.env.local` and fill in your Supabase project's URL and anon key (Project Settings → API in the Supabase dashboard):
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```

4. Create the database tables — open your Supabase project's **SQL Editor**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates `profiles`, `carer_training`, `client_intake`, and `carer_timesheets` tables with row-level security so carers only see their own data and managers see everyone's.

5. Start the app
   ```
   npm run dev
   ```

6. Open the link shown in the terminal (usually **http://localhost:5173**), click **Get started**, then **Create account** to sign up as a carer or manager.

The Care Planning / AI Notes / Rostering / Compliance screens still run on mock data (no backend needed for those, unchanged). The **Training log**, **New client sign-up**, **Weekly hours & pay**, and **Records** pages read/write live Supabase data behind real auth.

## Deploying to Vercel

1. Push this repo to GitHub (already done — `skafridi8/careos-prototype`).
2. In [Vercel](https://vercel.com), click **Add New → Project** and import the GitHub repo. Vercel auto-detects the Vite build (`npm run build`, output `dist`).
3. Before the first deploy, add the same two environment variables under **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. `vercel.json` in this repo rewrites all routes to `index.html` so client-side routing (React Router) works correctly on refresh/deep links.
5. In Supabase, under **Authentication → URL Configuration**, add your `*.vercel.app` deploy URL (and any custom domain) to the allowed redirect URLs so sign-up/sign-in works in production.

## Tech stack

See [TECH_STACK.md](./TECH_STACK.md) for details (React 19, Vite, Tailwind CSS, React Router, Recharts, Supabase).
