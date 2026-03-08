# CI/CD & Deployment Guide

This project uses GitHub Actions to automatically test, migrate, and deploy on every push to the main branch.

## Overview

The deployment pipeline consists of:

1. **Lint & Type Check** - Validates code quality
2. **Build** - Builds the production bundle
3. **Supabase Migrations** - Applies database schema changes
4. **Vercel Deployment** - Deploys frontend to production

## Workflow

```
Your Code Push to main
         ↓
   GitHub Actions
         ↓
    ┌────┴────┬────────────┐
    ↓         ↓            ↓
  Lint    Build      Database Migrations
    ↓         ↓            ↓
    └────┬────┴────────────┘
         ↓
  Vercel Deployment
         ↓
   Live at vercel.app
```

## GitHub Actions Workflow

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml) for the complete workflow.

### Workflow Jobs

#### 1. supabase-migrations
**Runs on**: Push to main only

Applies pending database migrations to your production Supabase instance.

```yaml
- Checkout code
- Setup Supabase CLI
- Push migrations using: supabase db push
```

#### 2. lint
**Runs on**: All pushes (main + PRs)

Validates code with ESLint:

```bash
npm run lint
```

Fails if there are linting errors (prevents bad code from merging).

#### 3. build
**Runs on**: All pushes (main + PRs), after lint passes

Builds the production bundle:

```bash
npm run build
```

Requires these environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Fails if there are TypeScript or build errors.

#### 4. deploy
**Runs on**: Push to main only, after all other jobs pass

Deploys the application to Vercel using the [vercel/action](https://github.com/vercel/action).

## Setup

### 1. Prepare GitHub Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repo as origin
git remote add origin https://github.com/YOUR_USERNAME/whiteboard.git
git branch -M main
git push -u origin main
```

### 2. Set GitHub Secrets

In your GitHub repository:

1. Go to **Settings > Secrets and variables > Actions**
2. Click **New repository secret** and add each:

```
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_URL
SUPABASE_DB_PASSWORD
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VERCEL_TOKEN          (optional)
VERCEL_ORG_ID         (optional)
VERCEL_PROJECT_ID     (optional)
```

### Getting Each Secret

#### SUPABASE_ACCESS_TOKEN

1. Go to https://app.supabase.com/account/tokens
2. Create a new token (any name)
3. Copy the token

#### SUPABASE_DB_URL

1. Go to Supabase Dashboard > Settings > Database
2. Find **Connection strings** section
3. Copy the **IPV4** connection string

Example:
```
postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
```

#### SUPABASE_DB_PASSWORD

1. In Supabase Dashboard > Settings > Database
2. Under **Password** section, copy or reset your database password

#### VITE_SUPABASE_URL

1. In Supabase Dashboard > Settings > API
2. Copy **Project URL**

Example:
```
https://abc123xyz.supabase.co
```

#### VITE_SUPABASE_ANON_KEY

1. In Supabase Dashboard > Settings > API
2. Copy **Anon public** key

#### VERCEL_TOKEN (Optional)

1. Go to https://vercel.com/account/tokens
2. Create a new token with **Full Access**
3. Copy the token

#### VERCEL_ORG_ID (Optional)

1. Go to Vercel Dashboard
2. Select your team/organization
3. URL will be: `vercel.com/ORGANIZATION_ID/...`
4. Copy the organization ID

#### VERCEL_PROJECT_ID (Optional)

1. Create a new project in Vercel by importing your GitHub repo
2. Go to project Settings > General
3. Copy **Project ID**

Or use `npm install -g vercel` and run `vercel link` locally to auto-detect.

### 3. Test the Workflow

```bash
# Create a test branch
git checkout -b test/workflow

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test workflow"
git push -u origin test/workflow

# Create pull request on GitHub
# Watch the workflow run in Pull Requests tab
```

You should see:
✅ **lint** - Passes  
✅ **build** - Passes  

Then for main branch:
✅ **supabase-migrations** - Passes  
✅ **deploy** - Passes

## Making Changes

### Code Changes

1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "Add my feature"`
3. Push: `git push origin feature/my-feature`
4. Create PR on GitHub
5. Workflow runs automatically:
   - ✅ Passes lint
   - ✅ Passes build
6. Once approved, merge to main
7. Workflow automatically:
   - ✅ Applies migrations
   - ✅ Deploys to Vercel

### Database Changes (Migrations)

1. Create a migration locally:
   ```bash
   supabase migration new add_my_column
   ```

2. Edit `supabase/migrations/TIMESTAMP_add_my_column.sql`:
   ```sql
   ALTER TABLE whiteboards ADD COLUMN new_column TEXT;
   ```

3. Test locally:
   ```bash
   supabase start
   supabase db push
   ```

4. Commit and push:
   ```bash
   git add supabase/migrations/
   git commit -m "Add new_column to whiteboards"
   git push
   ```

5. Merge to main - workflow automatically applies migration to production

## Monitoring Deployments

### GitHub Actions Logs

1. Push code to GitHub
2. Go to **Actions** tab in your repo
3. Click the latest workflow run
4. Click each job to see logs
5. Fix any errors and push again

### Supabase Migrations

Check migration status:

```bash
supabase migration list --db-url "your-db-url"
```

Or in dashboard: Settings > Database > Migrations

### Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. See deployment history and logs
4. Click any deployment to see details

## Rollback

If something goes wrong:

### Rollback Code

```bash
# Revert last commit
git revert HEAD
git push

# Workflow will redeploy the previous version
```

### Rollback Database

⚠️ No automated rollback for migrations. Options:

1. **Create a new migration to fix it:**
   ```bash
   supabase migration new fix_last_migration
   # Write SQL to undo the change
   ```

2. **Restore from backup** (Supabase > Settings > Backups)

## Troubleshooting

### Deployment Stuck or Failing

1. Check **Actions** tab in GitHub for error logs
2. Common issues:
   - Missing secrets → add to Settings > Secrets
   - Database connection URL wrong → verify in Supabase settings
   - Migration syntax error → test locally with `supabase db push --dry-run`

### Linting Errors

```bash
npm run lint

# Fix auto-fixable issues:
npm run lint -- --fix
```

### Build Errors

```bash
# Test locally:
npm run build

# Check for:
- TypeScript errors
- Missing environment variables
- Missing dependencies
```

### Migrations Not Applying

```bash
# Check migration history:
supabase migration list --db-url "postgresql://..."

# Test locally:
supabase db push --dry-run

# Check for RLS errors in migration file
```

## Best Practices

1. **Never commit secrets** - Always use GitHub Secrets
2. **Test migrations locally** - Before pushing to main
3. **Keep migrations small** - One feature per migration
4. **Write descriptive messages** - `git commit -m "Add user profile table"`
5. **Review PRs before merging** - Check workflow passes
6. **Monitor Vercel deployments** - Check for errors after deploy

## Security

- ✅ Never commit `.env.local`
- ✅ Rotate Supabase tokens regularly
- ✅ Use strong database passwords
- ✅ Review RLS policies for correctness
- ✅ Only expose public keys in env variables

## References

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Supabase CLI Reference](https://supabase.com/docs/guides/cli)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Supabase Migrations](https://supabase.com/docs/guides/migrations)
