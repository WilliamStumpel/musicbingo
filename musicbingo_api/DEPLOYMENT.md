# Railway Deployment Guide

## Important: Monorepo Configuration

This repository contains multiple projects. Railway MUST be configured to use the correct root directory.

## Setup Steps

### 1. Configure Root Directory in Railway

In your Railway project settings:
1. Go to **Settings** → **General**
2. Find **Root Directory**
3. Set to: `musicbingo_api`
4. Click **Save**

### 2. Redeploy

After setting the root directory, trigger a new deployment:
- Click **Deploy** → **Redeploy**

## What Railway Will Build

With the root directory set correctly, Railway will:
1. Detect `requirements.txt` and `pyproject.toml`
2. Run: `pip install -r requirements.txt`
3. Run: `pip install -e .` (installs the musicbingo_api package)
4. Start: `uvicorn musicbingo_api.main:app --host 0.0.0.0 --port $PORT`

## Verify Deployment

Once deployed:
1. Check the deployment logs for any errors
2. Visit `https://your-app.up.railway.app/health` - should return `{"status": "healthy"}`
3. Visit `https://your-app.up.railway.app/docs` - should show API documentation

## Troubleshooting

**Error: "Script start.sh not found"**
- You haven't set the Root Directory to `musicbingo_api`
- Railway is trying to build from the repository root (which has multiple projects)
- Fix: Set Root Directory in Settings as described above

**Error: "Cannot find module musicbingo_api"**
- The package wasn't installed correctly
- Check that `pip install -e .` ran in the build logs
- Verify `setup.py` and `pyproject.toml` are present

## Alternative: Deploy Only API Directory

If monorepo issues persist, you can deploy just the API:

1. Create a separate git repository for just `musicbingo_api/`
2. Push it to GitHub
3. Deploy that repository to Railway (no root directory configuration needed)
