# Azure Static Web Apps Function Deployment Issue

## Problem
Azure Static Web Apps is only discovering the `health` function at the root level (`api/health/`), but not discovering Functions in nested subdirectories like:
- `api/auth/login/`
- `api/auth/signup/`
- `api/auth/session/`
- `api/profiles/*/`
- `api/requests/*/`

## Root Cause
Azure Static Web Apps has limitations with nested Function discovery. The Functions runtime may not properly discover Functions in subdirectories when deployed via the SWA CLI.

## Solution Options

### Option 1: Flatten Function Structure (Recommended)
Move all Functions to the root level of the `api` folder:
```
api/
├── health/
├── auth-login/
├── auth-signup/
├── auth-session/
├── profiles-get/
├── profiles-list/
├── profiles-update/
├── requests-get/
├── requests-create/
├── requests-update/
├── requests-approve/
└── lib/
```

### Option 2: Use GitHub Actions Deployment
GitHub Actions deployment might handle nested Functions better than CLI deployment.

### Option 3: Manual Function App Deployment
Deploy Functions to a separate Azure Function App and configure it as the backend.

## Current Status
- ✅ Health endpoint works: `/api/health`
- ❌ Auth endpoints return 404: `/api/auth/*`
- ❌ Profile endpoints return 404: `/api/profiles/*`
- ❌ Request endpoints return 404: `/api/requests/*`

## Next Steps
1. Restructure Functions to root level (Option 1)
2. Update all route configurations
3. Update import paths in Function code
4. Redeploy


