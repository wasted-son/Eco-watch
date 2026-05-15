# 🌍 EcoAlert — Community Environmental Crisis Map

A real-time, community-powered environmental reporting app.
Residents report issues → pins drop on a live map → everyone sees them instantly.

**100% free to run. No bank card needed. No payment registration.**

---

## 📁 Project Structure

```
eco-alert/
├── frontend/               ← HTML/CSS/JS (served by backend)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── config.js       ← ⭐ Edit your keys here
│       ├── app.js
│       ├── map.js
│       ├── report.js
│       ├── weather.js
│       ├── realtime.js
│       └── admin.js
├── backend/
│   ├── server.js           ← Express app entry point
│   ├── supabase.js         ← DB client
│   ├── package.json
│   ├── .env.example        ← Copy to .env and fill in
│   ├── routes/
│   │   ├── reports.js
│   │   ├── admin.js
│   │   └── weather.js
│   └── middleware/
│       └── auth.js
├── deployment/
│   └── supabase_schema.sql ← Run this in Supabase first
├── railway.toml            ← Railway deploy config
├── render.yaml             ← Render.com deploy config
└── .gitignore
```

---

## 🚀 Setup Guide (Step by Step)

### STEP 1 — Get a Free Supabase Database

1. Go to **https://supabase.com** and sign up (free, GitHub login works)
2. Click **"New Project"** → give it a name like `eco-alert` → set a DB password Mr.violence1122
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** → **New Query** → paste the entire contents of
   `deployment/supabase_schema.sql` → click **Run**
5. Go to **Storage** → **New Bucket**
   - Name: `report-photos`
   - Toggle **Public** to ON → Create
6. Go to **Settings → API** and copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

---

### STEP 2 — Get a Free OpenWeatherMap Key

1. Go to **https://openweathermap.org** → Sign Up (free, no card)
2. Go to **My API Keys** → copy your default key
3. Wait up to 10 minutes for it to activate after signup

---

### STEP 3 — Configure the Backend

```bash
# In your terminal:
cd eco-alert/backend
cp .env.example .env
```

Open `.env` and fill in:

```env
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
OPENWEATHER_KEY=abc123...
ADMIN_PASSWORD=YourStrongPassword123
JWT_SECRET=some_long_random_string_here_make_it_64_chars
ALLOWED_ORIGIN=http://localhost:5500
PORT=3000
```

---

### STEP 4 — Configure the Frontend

Open `frontend/js/config.js` and update:

```js
OPENWEATHER_KEY: 'your_openweather_key',  // same key as above
DEFAULT_LAT: -1.286389,   // Change to your city's coordinates
DEFAULT_LNG: 36.817223,   // (current: Nairobi)
```

To find your city's coordinates: https://www.latlong.net

---

### STEP 5 — Run Locally

```bash
cd eco-alert/backend
npm install
npm start
```

Then open your browser to: **http://localhost:3000**

That's it! The backend serves both the API and the frontend.

---

## 🌐 Deploy for Free (Railway — Recommended)

Railway is free, works with GitHub login, no card needed.

1. Push your project to GitHub (make sure `.env` is in `.gitignore`)
2. Go to **https://railway.app** → Login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"** → select `eco-alert`
4. Railway auto-detects `railway.toml` and uses `backend/` as root
5. Go to **Variables** tab and add all your `.env` keys
6. Your app gets a public URL like `https://eco-alert.railway.app`
7. Update `ALLOWED_ORIGIN` in Railway variables to match your domain

### OR: Deploy on Render.com (also free)

1. Go to **https://render.com** → Login with GitHub
2. **New → Web Service** → connect your GitHub repo
3. Render reads `render.yaml` automatically
4. Add your environment variables in the dashboard
5. Click Deploy

---

## 📋 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports` | None | Get all reports |
| POST | `/api/reports` | None | Submit new report |
| PATCH | `/api/reports/:id/confirm` | None | Add public confirmation |
| PATCH | `/api/reports/:id/resolve` | Admin JWT | Mark as resolved |
| POST | `/api/admin/login` | None | Get admin token |
| GET | `/api/weather?lat=X&lng=Y` | None | Current weather |
| GET | `/api/aqi?lat=X&lng=Y` | None | Air quality index |
| GET | `/health` | None | Health check |

---

## 🗺️ Features

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | GPS auto-detect, map centres on user | ✅ |
| 1 | Color-coded pins (red/amber/green) | ✅ |
| 2 | 9-category report form | ✅ |
| 2 | Photo upload with auto-compress | ✅ |
| 2 | GPS auto-tag + map click pin | ✅ |
| 3 | Supabase real-time database | ✅ |
| 3 | Severity auto-assign | ✅ |
| 3 | Live weather + AQI for weather reports | ✅ |
| 4 | Live map updates (10s poll) | ✅ |
| 4 | Dashboard stats auto-update | ✅ |
| 5 | Public confirmation ("I see it too") | ✅ |
| 5 | Admin resolve to close the loop | ✅ |
| 5 | Pin detail panel with photo | ✅ |

---

## 🔐 Admin Access

1. Click the **🔐 Admin** button in the header
2. Enter your `ADMIN_PASSWORD` from `.env`
3. You'll see all active reports and can mark them resolved
4. Alternatively, click any pin on the map → "Mark Resolved" (requires login)

---

## 🛠️ Customisation Tips

- **Add more categories**: Edit the `CATEGORIES` array in `frontend/js/config.js`
- **Change map default location**: Update `DEFAULT_LAT` / `DEFAULT_LNG`
- **Change poll speed**: Update `POLL_INTERVAL` (ms) in `config.js`
- **Add your community name**: Edit the brand in `index.html`

---

## 🆘 Troubleshooting

**Map not loading?**
→ Check browser console for errors. Make sure you're accessing via `http://localhost:3000`

**GPS not working?**
→ Browser requires HTTPS for GPS on production. Railway/Render provide HTTPS automatically.

**Reports not appearing?**
→ Check that `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct in `.env`

**Weather showing error?**
→ OpenWeatherMap keys take up to 10 minutes to activate after signup.

**Photo upload failing?**
→ Ensure the `report-photos` Supabase Storage bucket is created and set to **Public**.

---

Built with ❤️ for community environmental action.
