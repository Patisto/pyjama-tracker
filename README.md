# PJ Tracker

Simple customer + sales tracker for a pyjama / women's clothing business.
Record sales, search customer history, and see a weekly "Sunday night" snapshot
of best-selling items, colours, and sizes.

## Stack
- **Frontend**: React + Vite, PWA (installable on phone, works offline-ish), deployed on Vercel
- **Backend**: Express (Node), deployed on Render
- **Database/Auth**: Supabase (Postgres + email/password auth with email verification)

---

## 1. Supabase setup

1. Create a project at https://supabase.com (free tier).
2. Go to **SQL Editor** → paste the contents of `backend/supabase-schema.sql` → Run.
3. Go to **Authentication → Providers** → confirm "Email" is enabled.
4. Go to **Authentication → Settings** → **Email confirmations** should be ON
   (this is the default — users must verify their email before signing in).
5. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to your deployed frontend URL (e.g. `https://pj-tracker.vercel.app`)
   - Add the same URL to **Redirect URLs**
6. Get your keys from **Project Settings → API**:
   - `Project URL` → used as `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` `public` key → used as `VITE_SUPABASE_ANON_KEY` (frontend)
   - `service_role` `secret` key → used as `SUPABASE_SERVICE_ROLE_KEY` (backend only — never expose this in frontend code)

---

## 2. Backend setup (Express)

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
```
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
```

Run locally:
```bash
npm run dev
```

### Deploy to Render
1. Push this repo to GitHub.
2. On Render: **New → Web Service** → connect repo → select `backend` as root directory.
3. Build command: `npm install`, Start command: `npm start`.
4. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (your Vercel URL once deployed).
5. Deploy. Note the Render URL (e.g. `https://pj-tracker-api.onrender.com`).

> Free Render services sleep after inactivity — first request after idle may take ~30s to wake up.

---

## 3. Frontend setup (React + Vite, PWA)

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
```

Run locally:
```bash
npm run dev
```

### Deploy to Vercel
1. Push to GitHub (if not already).
2. On Vercel: **New Project** → import repo → set **Root Directory** to `frontend`.
3. Framework preset: Vite (auto-detected).
4. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (your Render backend URL).
5. Deploy. Note the Vercel URL (e.g. `https://pj-tracker.vercel.app`).
6. Go back to Supabase → **Authentication → URL Configuration** → update Site URL / Redirect URLs to this Vercel URL.
7. Go back to Render → update `FRONTEND_URL` env var to this Vercel URL → redeploy.

---

## 4. Using the app

1. Open the Vercel URL on a phone → **Sign up** with email + password.
2. Check email → click the verification link.
3. Sign in.
4. **Add to Home Screen** (Chrome: menu → "Add to Home screen") for an app-like icon and full-screen experience.
5. Use the **Sale** tab to record each sale (~30 seconds per entry).
6. Use **Customers** to search anyone by name or phone — tap **WhatsApp** to message them directly.
7. Use **Snapshot** every Sunday night to see top items, colours, sizes, and total revenue for the week. Export to CSV if she wants a paper/Excel backup.

---

## Project structure

```
pyjama-tracker/
├── backend/
│   ├── index.js              # Express server entry
│   ├── supabaseClient.js     # Supabase client + auth middleware
│   ├── supabase-schema.sql   # Run this in Supabase SQL editor
│   └── routes/
│       ├── customers.js
│       ├── sales.js
│       └── dashboard.js
└── frontend/
    ├── src/
    │   ├── lib/               # Supabase client, auth context, API wrapper
    │   ├── pages/              # RecordSale, Customers, CustomerDetail, Dashboard, Login, Signup
    │   └── components/         # NavBar, ProtectedRoute
    └── vite.config.js          # PWA config
```

## Notes on data model
- **customers**: name, phone, owner_id (each business owner's data is isolated)
- **sales**: item, size, colour, quantity, unit_price, amount, sale_date, linked to a customer

When recording a sale, the app matches an existing customer by phone (or name if no phone),
or creates a new customer automatically — so repeat customers build up order history without
extra steps.
