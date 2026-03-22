# Collaborative Whiteboard with Supabase

A real-time collaborative whiteboard application built with React, TypeScript, Vite, and Supabase.

## Features

- 🎨 **Real-time Drawing**: Draw on the canvas and see changes instantly on all connected clients
- 👥 **Collaborative**: Multiple users can draw on the same whiteboard simultaneously
- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 📊 **Dashboard**: Manage multiple whiteboards
- 🎯 **Persistent Storage**: All drawings are saved to the database
- 📱 **Responsive**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+
- Supabase account (free tier available at [supabase.com](https://supabase.com))

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to **Settings > API** to get your:
   - Project URL (`VITE_SUPABASE_URL`)
   - Anon Public Key (`VITE_SUPABASE_ANON_KEY`)

### 2. Set Up Database Schema

Database migrations are stored in the `supabase/migrations/` directory and will be automatically applied via GitHub Actions when you push to the main branch.

For initial setup, run the migrations in the Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase
2. Click **New Query** and run the three migration files in order:
   - [20260308000001_create_initial_tables.sql](supabase/migrations/20260308000001_create_initial_tables.sql)
   - [20260308000002_enable_rls_and_policies.sql](supabase/migrations/20260308000002_enable_rls_and_policies.sql)
   - [20260308000003_enable_realtime.sql](supabase/migrations/20260308000003_enable_realtime.sql)

Or for local development, see [supabase/README.md](supabase/README.md) for using the Supabase CLI.

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Sign Up**: Create a new account
2. **Create a Whiteboard**: Click "Create New Whiteboard" and enter a title
3. **Draw**: Open a whiteboard and start drawing
4. **Share**: Share the whiteboard ID with others (they must be logged in)
5. **Collaborate**: See changes in real-time as others draw

## Project Structure

```
src/
├── components/
│   └── Canvas.tsx          # Drawing canvas component
├── context/
│   └── AuthContext.tsx     # Authentication state management
├── pages/
│   ├── Home.tsx           # Entry point
│   ├── Login.tsx          # Login page
│   ├── Signup.tsx         # Signup page
│   ├── Dashboard.tsx      # Whiteboard list
│   └── WhiteboardPage.tsx # Individual whiteboard
├── lib/
│   └── supabase.ts        # Supabase client setup
├── types.ts               # TypeScript interfaces
├── main.tsx               # App entry point
└── index.css              # Global styles
```

## Features Explained

### Real-time Synchronization
- Uses Supabase Realtime to subscribe to changes
- New strokes are saved to the database and broadcast to all connected clients
- Strokes are validated using Row Level Security policies

### Authentication
- Supabase Auth handles user registration and login
- Auth context manages global session state
- Protected routes redirect unauthenticated users to login

### Canvas Drawing
- HTML5 Canvas API for drawing
- Touch support for mobile devices
- Customizable brush size and color
- Clear all strokes option

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Set environment variables in Vercel settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Automatic Database Migrations with GitHub Actions

Database migrations are automatically applied to Supabase when you push to the `main` branch. This is configured in [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

**Setup:**

1. Generate a Supabase access token:
   - Go to [app.supabase.com/account/tokens](https://app.supabase.com/account/tokens)
   - Create a new token with scopes: `postgresql`, `functions`

2. Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):
   - `SUPABASE_ACCESS_TOKEN` - Your access token from above
   - `SUPABASE_DB_URL` - PostgreSQL connection URL from Supabase Dashboard > Settings > Database
   - `SUPABASE_DB_PASSWORD` - Your database password
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VERCEL_TOKEN` - (Optional) Your Vercel API token
   - `VERCEL_ORG_ID` - (Optional) Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - (Optional) Your Vercel project ID

3. The workflow will:
   - Run linting and build checks on all PRs
   - Apply migrations to Supabase on push to `main`
   - Deploy to Vercel on push to `main`

**Creating new migrations locally:**

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Create a new migration
supabase migration new my_migration_name

# Edit the file in supabase/migrations/
# Then test locally:
supabase start

# When ready, push to GitHub - the workflow will handle deployment
```

See [supabase/README.md](supabase/README.md) for more details.

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous public key |

## Troubleshooting

### "Supabase not configured" message
- Ensure `.env.local` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Reload the page after updating environment variables

### Realtime updates not working
- Check that `ALTER PUBLICATION supabase_realtime ADD TABLE drawing_strokes;` was executed
- Verify RLS policies are correct
- Check browser console for errors

### Authentication issues
- Ensure email verification is not required (or verify email first)
- Check that Auth is enabled in Supabase settings
- Clear browser storage and try again

## Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Layer support
- [ ] Eraser tool
- [ ] Text tool
- [ ] Collaborative cursors (see where others are drawing)
- [ ] Export to image
- [ ] Share with specific users
- [ ] Comments/annotations
- [ ] Drawing templates

## Technologies Used

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build**: Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Hosting**: Vercel (recommended)

## License

MIT

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review React documentation: https://react.dev
3. Check GitHub Issues
