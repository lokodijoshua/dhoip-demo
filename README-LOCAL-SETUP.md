# D-HOIP — Run Locally in VS Code (Step-by-Step Guide)

This guide walks you through copying the D-HOIP demo from this sandbox to your own machine and running it in VS Code.

---

## 1. Install the prerequisites

You need **three** tools installed on your computer (Windows, Mac, or Linux):

### a) Node.js (JavaScript runtime)
- Download from **https://nodejs.org**
- Pick the **LTS** version (currently 20.x or 22.x)
- Verify by opening a terminal and running:
  ```bash
  node --version
  ```
  Should print something like `v20.18.0` or higher.

### b) Bun (faster package runner — what this project uses)
- Install from **https://bun.sh**
- Mac/Linux: run this in your terminal:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- Windows: open **PowerShell as Administrator** and run:
  ```powershell
  irm bun.sh/install.ps1 | iex
  ```
- Verify:
  ```bash
  bun --version
  ```
  Should print something like `1.1.x`.

### c) Git (version control — needed to clone/track the project)
- Download from **https://git-scm.com/downloads**
- Verify:
  ```bash
  git --version
  ```

### d) VS Code (editor)
- Download from **https://code.visualstudio.com**

---

## 2. Get the project files onto your computer

You have **two options**:

### Option A — Use Git (recommended)
This sandbox has a Git repo at `/home/z/my-project/.git`. If you can push it to GitHub/GitLab, on your computer just clone it:
```bash
git clone https://github.com/YOUR_USERNAME/dhoip-demo.git
cd dhoip-demo
```

### Option B — Copy the files manually
Download the whole `/home/z/my-project` folder as a ZIP and unzip it on your computer into a folder like `dhoip-demo`.

**Files you MUST copy** (everything except `node_modules` and `.next`):
- `src/` (all source code)
- `prisma/` (database schema)
- `public/` (logo and assets — **includes your dare2care-logo.jpg**)
- `package.json`, `bun.lock`
- `tsconfig.json`, `next.config.ts`
- `tailwind.config.ts`, `postcss.config.mjs`
- `eslint.config.mjs`, `components.json`
- `.gitignore`
- `.env` (see step 4 below — you'll edit this)

**Do NOT copy**:
- `node_modules/` (huge, will be regenerated)
- `.next/` (build cache)
- `dev.log`, `server.log` (runtime logs)

---

## 3. Open the project in VS Code

1. Open VS Code.
2. **File → Open Folder…** (Mac: *Open…*)
3. Select your `dhoip-demo` folder.
4. VS Code may prompt: "Recommended extensions" — install these:
   - **ES7+ React/Redux/React-Native snippets**
   - **Tailwind CSS IntelliSense**
   - **PostCSS Language Support**
   - **Prisma** (for syntax highlighting in `schema.prisma`)
   - **ESLint**

---

## 4. Set up your `.env` file

In the project root, open the `.env` file. The sandbox version has:
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

Change the path to point at a folder inside your local project, e.g.:
```
DATABASE_URL=file:./db/custom.db
```

(Prisma will create the `db/` folder automatically when you run the migration.)

---

## 5. Open the VS Code integrated terminal

- **Terminal → New Terminal** (or press `` Ctrl + ` `` on Windows/Linux, `` Cmd + ` `` on Mac)
- Make sure the terminal is at your project root (you should see `package.json` when you run `ls`).

---

## 6. Install dependencies

In the VS Code terminal:
```bash
bun install
```

This will download all the packages listed in `package.json` (React, Next.js, Tailwind, shadcn/ui, Prisma, Zustand, etc.). It usually takes 1–3 minutes the first time.

When it finishes, you'll see a `node_modules/` folder appear.

---

## 7. Set up the database (optional for the demo)

The demo actually runs without a real database — all data lives in the browser's `localStorage` via Zustand. But to keep Prisma from complaining, run:
```bash
bun run db:push
```

This creates an empty SQLite file at the path in your `.env`. You can skip this if you don't care about the database for the demo.

---

## 8. Start the dev server

In the VS Code terminal:
```bash
bun run dev
```

You should see something like:
```
▲ Next.js 16.1.1
- Local:   http://localhost:3000
✓ Ready in 1.2s
```

VS Code may pop up a notification: "Your application running on port 3000 is ready." Click **Open in Browser**.

Or just open your browser manually to: **http://localhost:3000**

---

## 9. Use the demo

1. You'll see the Dare2Care landing page with your logo.
2. Click **Sign in** (top-right).
3. Pick a role (Director / Doctor / Admin).
4. Enter password: **`123`**
5. Explore the workspace — register patients, order investigations, create invoices, dispatch requests.
6. Use the **Reset** button in the topbar to restore seed data anytime.

---

## 10. Stop the server

In the VS Code terminal, press **`Ctrl + C`** (Mac: `Cmd + C`).

---

## Common issues

### "command not found: bun"
- Restart your terminal after installing Bun, or restart VS Code.
- Verify the install with `bun --version`.

### Port 3000 already in use
- Another app is using port 3000. Either close it, or start the dev server on a different port:
  ```bash
  bun run next dev -p 3001
  ```
  Then open http://localhost:3001

### "Module not found" errors
- Run `bun install` again from the project root.
- Delete `node_modules` and `bun.lock` and re-install:
  ```bash
  rm -rf node_modules bun.lock
  bun install
  ```

### Prisma errors
- Run `bun run db:push` to recreate the database.
- Make sure your `.env` `DATABASE_URL` path is valid and writable.

### Logo not showing
- Make sure `/public/dare2care-logo.jpg` exists.
- The page will fall back to a Building2 icon if the file is missing — check the browser DevTools Network tab for 404s.

### Changes not showing
- The dev server auto-reloads on file changes.
- If something seems stuck, restart the dev server (`Ctrl + C`, then `bun run dev`).
- Hard refresh the browser: `Ctrl + Shift + R` (Mac: `Cmd + Shift + R`).

### Want to use `npm` instead of `bun`?
You can — just run:
```bash
npm install
npm run dev
```
But `bun` is significantly faster and is what the project was built with.

---

## Useful VS Code shortcuts

| Action | Windows/Linux | Mac |
|---|---|---|
| Open terminal | `` Ctrl + ` `` | `` Cmd + ` `` |
| Command palette | `Ctrl + Shift + P` | `Cmd + Shift + P` |
| Find in files | `Ctrl + Shift + F` | `Cmd + Shift + F` |
| Quick open file | `Ctrl + P` | `Cmd + P` |
| Toggle sidebar | `Ctrl + B` | `Cmd + B` |
| Format document | `Shift + Alt + F` | `Shift + Option + F` |

---

## Project structure (where to find things)

```
dhoip-demo/
├── public/
│   └── dare2care-logo.jpg       ← Your hospital logo
├── prisma/
│   └── schema.prisma            ← Relational database model
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← Root layout (fonts, metadata)
│   │   ├── page.tsx             ← Role router (landing/login/workspace)
│   │   └── globals.css          ← Editorial design system (colors, fonts)
│   ├── lib/
│   │   ├── store.ts             ← Zustand store + session persistence
│   │   ├── types.ts             ← TypeScript domain types
│   │   └── seed-data.ts         ← Demo patients/staff/services data
│   └── components/
│       ├── ui/                  ← shadcn/ui primitives (button, dialog, etc.)
│       └── dhoip/
│           ├── LandingPage.tsx  ← Public landing page
│           ├── shared/
│           │   ├── AppShell.tsx     ← Workspace topbar + sidebar
│           │   ├── LoginModal.tsx   ← Sign-in modal
│           │   ├── StatCard.tsx     ← KPI card component
│           │   └── StatusBadge.tsx  ← Status pills
│           ├── director/
│           │   └── DirectorWorkspace.tsx
│           ├── doctor/
│           │   └── DoctorWorkspace.tsx
│           └── admin/
│               └── AdminWorkspace.tsx
├── .env                         ← Database URL (edit this)
├── package.json                 ← Dependencies + scripts
└── README.md                    ← You are here
```

---

## Quick reference — most common commands

```bash
bun install          # Install dependencies (run once)
bun run dev          # Start dev server on http://localhost:3000
bun run lint         # Check code quality
bun run db:push      # Recreate database (optional for demo)
```
