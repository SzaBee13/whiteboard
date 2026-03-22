# Getting Started (5 Minutes)

## Step 1: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with email
4. Create a new project (choose free tier)
5. Wait for it to initialize (~1 min)

## Step 2: Get Your Credentials (1 min)

1. In Supabase dashboard, go to **Settings > API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Public** → `VITE_SUPABASE_ANON_KEY`

## Step 3: Create Database (1 min)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL (from SETUP.md):
```sql
-- Copy the full SQL script from SETUP.md here
```
4. Click **Run**

## Step 4: Configure App (1 min)

1. Copy `.env.example` → `.env.local`
2. Paste your credentials from Step 2
3. Save file

```bash
# In terminal
cp .env.example .env.local
# Edit .env.local with your credentials
```

## Step 5: Run App

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in browser.

## First Time Usage

1. **Sign Up**: Create an account
2. **Create Whiteboard**: Click "Create New Whiteboard"
3. **Draw**: Open it and draw!
4. **Share**: Open in another tab or browser to see real-time sync

## Verify Everything Works

- [ ] Signup page loads
- [ ] Can create account
- [ ] Can login
- [ ] Dashboard shows whiteboards
- [ ] Can create new whiteboard
- [ ] Can draw on canvas
- [ ] Clear button works
- [ ] Can change color
- [ ] Can adjust brush size
- [ ] Open in 2nd browser tab → see drawing sync in real-time

## Next Steps

- See [SETUP.md](./SETUP.md) for detailed setup
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it works
- Deploy to [Vercel](https://vercel.com)

## Stuck?

### "Supabase not configured"
- Check `.env.local` exists
- Verify both URL and key are filled
- Restart dev server

### Can't login
- Verify SQL schema was run
- Check RLS policies in Supabase dashboard
- Test auth in Supabase dashboard first

### Drawing doesn't sync
- Open browser DevTools (F12)
- Check Console for errors
- Verify Realtime is enabled in Supabase
- Check RLS policies allow your user

### Still stuck?
- Check SETUP.md Troubleshooting section
- Review browser console errors
- Test Supabase connection directly in dashboard
