# CareOS Prototype

A prototype home care rostering & compliance app, built with React + Vite. It includes both a web (desktop) view and a simulated mobile app view, sharing a rostering engine over mock data — no backend or database required.

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

3. Start the app
   ```
   npm run dev
   ```

4. Open the link shown in the terminal (usually **http://localhost:5173**) in your browser.

That's it — the prototype runs entirely in your browser using mock data, nothing gets sent to a server.

## Tech stack

See [TECH_STACK.md](./TECH_STACK.md) for details (React 19, Vite, Tailwind CSS, React Router, Recharts).
