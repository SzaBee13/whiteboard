# Supabase Setup and Configuration Guide

This directory contains Supabase-specific configuration and database migrations for the collaborative whiteboard application.

## Directory Structure

```
supabase/
├── config.toml          # Supabase local development configuration
└── migrations/
    ├── 20260308000001_create_initial_tables.sql
    ├── 20260308000002_enable_rls_and_policies.sql
    └── 20260308000003_enable_realtime.sql
```

## Migrations

Migrations are automatically applied in order by Supabase based on their timestamp prefix.

### 20260308000001 - Create Initial Tables
Creates the core tables for the whiteboard application:
- `whiteboards` - Metadata for each whiteboard session
- `drawing_strokes` - Individual drawing operations

### 20260308000002 - Enable RLS and Policies
Enables Row Level Security (RLS) and defines policies that ensure:
- Users can only access their own whiteboards
- Only the whiteboard owner can modify or delete strokes
- Public whiteboards can be viewed by anyone

### 20260308000003 - Enable Realtime
Enables Supabase Realtime for the `drawing_strokes` table, allowing real-time synchronization of drawing changes across clients.

## Local Development

### Start Local Supabase

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Initialize Supabase (if not already done)
supabase init

# Start local Supabase instance
supabase start

# This will output connection details for local development
```

### Apply Migrations Locally

```bash
# Migrations are applied automatically when you run 'supabase start'
# To manually push migrations to a remote project:
supabase db push --db-url "postgresql://..."
```

### Create New Migration

```bash
# Generate a new migration file
supabase migration new add_new_feature

# Edit the generated file in supabase/migrations/
# Then apply it:
supabase db push
```

## Production Deployment

### Using GitHub Actions

Migrations are automatically applied to production Supabase on push to `main` branch via GitHub Actions. See `.github/workflows/deploy.yml`.

#### Required GitHub Secrets

Set these in your GitHub repository settings (Settings > Secrets and variables > Actions):

```
SUPABASE_ACCESS_TOKEN       # Get from: https://app.supabase.com/account/tokens
SUPABASE_DB_URL            # From Supabase dashboard: Settings > Database
SUPABASE_DB_PASSWORD       # Your database password
VITE_SUPABASE_URL          # Your project URL
VITE_SUPABASE_ANON_KEY     # Your anon public key
VERCEL_TOKEN               # For Vercel deployment (optional)
VERCEL_ORG_ID              # For Vercel deployment (optional)
VERCEL_PROJECT_ID          # For Vercel deployment (optional)
```

### Manual Database Push

If you prefer to push migrations manually:

```bash
# Login to Supabase CLI
supabase login

# Link your local project to remote
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Pull schema changes from production (for backup)
supabase db pull
```

## Configuration

Edit `config.toml` to customize:
- `api.port` - API server port (default 54321)
- `db.port` - PostgreSQL port (default 54322)
- `auth.site_url` - Base URL for auth redirects
- `auth.additional_redirect_urls` - Allow-list for post-auth redirects
- `auth.jwt_expiry` - Session token duration

## Database Connection

### Local Development
```
postgresql://postgres:postgres@localhost:54322/postgres
```

### Production
Get connection strings from Supabase Dashboard > Settings > Database

## Troubleshooting

### Migrations not applying
```bash
# Check migration status
supabase migration list --db-url "..."

# Reapply specific migration
supabase db push --dry-run
```

### RLS policies causing access errors
- Check `supabase/migrations/20260308000002_enable_rls_and_policies.sql`
- Verify JWT token has correct `auth.uid()`
- Test policies in Supabase dashboard: Authentication > Policies

### Realtime not working
- Ensure `drawing_strokes` was added to publication (see migration 003)
- Check WebSocket connection in browser DevTools
- Verify `auth.uid()` claim in JWT token

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
