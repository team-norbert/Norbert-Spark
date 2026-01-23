# E2E Testing Guide

## Overview

This directory contains end-to-end tests for the frontend application using Playwright. The tests run in an isolated container environment with dedicated database and backend server instances.

## Running E2E Tests

### Quick Start

```bash
# From project root
pnpm run test:e2e

# Or from frontend directory
cd apps/frontend
pnpm run test:e2e
```

## Troubleshooting: Process Conflicts

### Problem

E2E tests may show inconsistent results if development servers are running simultaneously. The tests are designed to run in complete isolation with their own:

- PostgreSQL database container (Testcontainers)
- Backend API server (port 3000)
- Frontend Next.js dev server (port 4321)

If dev servers are already running on these ports, tests can fail or produce unpredictable results.

### Solution: Clean Process Shutdown

Before running E2E tests, ensure all Node.js development processes are stopped.

#### Step 1: Check for Running Node Processes

```bash
ps aux | grep -i node | grep -v grep
```

This will show all Node.js processes, including:

- Next.js dev servers (`next dev`)
- Backend servers (`tsx watch`)
- Webpack loaders
- Playwright test processes
- Other Node.js processes

#### Step 2: Identify Development Processes

Look for processes matching these patterns:

- `next dev` - Frontend Next.js dev server
- `tsx watch` - Backend TypeScript dev server
- `playwright` - Running E2E tests
- `test:e2e` - Test runner processes
- `webpack-loaders` - Next.js webpack workers

#### Step 3: Kill Development Processes

**Option A: Graceful Shutdown (Recommended)**

Stop dev servers in their respective terminals using `Ctrl+C`.

**Option B: Force Kill Specific Processes**

```bash
# Kill Next.js dev server
pkill -f "next dev"

# Kill backend tsx watch server
pkill -f "tsx watch"

# Kill any running Playwright processes
pkill -f "playwright"

# Kill E2E test processes
pkill -f "test:e2e"

# Kill webpack loaders
pkill -f "webpack-loaders"
```

**Option C: Kill All at Once**

```bash
pkill -f "next dev" && \
pkill -f "tsx watch" && \
pkill -f "playwright" && \
pkill -f "test:e2e" && \
pkill -f "webpack-loaders"
```

**Option D: Force Kill (Last Resort)**

If processes don't respond to graceful shutdown:

```bash
pkill -9 -f "turbo test:e2e"
pkill -9 -f "@playwright/test"
pkill -9 -f "test-server"
```

⚠️ **Note**: The `-9` flag force kills processes without cleanup. Use only when necessary.

#### Step 4: Verify Cleanup

```bash
# Check remaining development processes
ps aux | grep -E "(next dev|tsx|playwright|webpack)" | grep -v grep | wc -l
```

This should return `0` or a very low number (VSCode language services are OK).

#### Step 5: Run E2E Tests

```bash
cd /Applications/MAMP/htdocs/norberts-spark
pnpm run test:e2e
```

## Test Environment Architecture

### Container Isolation

E2E tests use **Testcontainers** to create isolated test environments:

1. **PostgreSQL Container**: Fresh PostgreSQL 18-alpine instance for each test run
2. **Database Schema**: Applied from `apps/backend/sql/norberts_schema.sql` (SQL as source of truth)
3. **Backend Server**: Spawned on port 3000 within test environment
4. **Frontend Server**: Playwright's webServer starts Next.js dev on port 4321
5. **Automatic Cleanup**: All containers and processes cleaned up after tests complete

### Test Flow

```
Test Start
    ↓
Create PostgreSQL Container (Testcontainers)
    ↓
Apply SQL Schema (norberts_schema.sql)
    ↓
Seed Test Data
    ↓
Start Backend Server (port 3000)
    ↓
Start Frontend Server (port 4321)
    ↓
Run Playwright Tests
    ↓
Stop Backend Server
    ↓
Stop PostgreSQL Container
    ↓
Cleanup Complete
```

## Configuration Files

- [playwright.config.ts](../playwright.config.ts) - Playwright configuration
- [global-setup.ts](./global-setup.ts) - Database setup with SQL schema
- [global-teardown.ts](./global-teardown.ts) - Environment cleanup

## Best Practices

### 1. Always Run in Clean Environment

Stop all dev servers before running E2E tests:

```bash
# Kill processes, then run tests
pkill -f "next dev" && pkill -f "tsx watch" && pnpm run test:e2e
```

### 2. Use Separate Terminal Sessions

Keep dev servers and test runs in different terminal sessions:

- **Terminal 1**: `pnpm dev` (frontend dev)
- **Terminal 2**: `pnpm --filter @norberts-spark/backend dev` (backend dev)
- **Terminal 3**: E2E tests (only when dev servers are stopped)

### 3. Check Port Availability

If tests fail to start, ensure ports are free:

```bash
# Check port 3000 (backend)
lsof -i :3000

# Check port 4321 (frontend)
lsof -i :4321

# Kill process on specific port
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:4321)
```

### 4. Review Test Reports

After test completion:

```bash
pnpm exec playwright show-report
```

This opens the HTML report with detailed test results, screenshots, and traces.

## Common Issues

### Issue: Port Already in Use

**Symptom**: Tests fail with "EADDRINUSE" error

**Solution**: Kill processes using the conflicting port

```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill by process ID
```

### Issue: Database Connection Errors

**Symptom**: Tests fail with connection refused or timeout errors

**Solution**:

1. Ensure Docker is running (Testcontainers requires Docker)
2. Check Docker daemon status: `docker info`
3. Verify no orphaned containers: `docker ps -a`

### Issue: Inconsistent Test Results

**Symptom**: Tests pass sometimes, fail other times

**Solution**:

1. **Always** stop dev servers before running tests
2. Run tests from clean state
3. Check for database state pollution (global-setup creates fresh DB each time)

### Issue: Stale Container Processes

**Symptom**: Old PostgreSQL containers accumulating

**Solution**:

```bash
# List all containers
docker ps -a

# Remove stopped containers
docker container prune

# Force remove specific container
docker rm -f <container_id>
```

## Debugging

### Enable Debug Mode

```bash
# Run with debug output
DEBUG=pw:api pnpm run test:e2e

# Run specific test file
pnpm exec playwright test apps/frontend/e2e/register.spec.ts

# Run with UI mode
pnpm exec playwright test --ui
```

### View Test Logs

Backend and frontend logs are visible during test execution:

- `[Backend]` - Backend server logs
- `[WebServer]` - Frontend Next.js logs

### Generate Trace Files

For detailed debugging, traces are automatically captured on test failure.

## Test Statistics

Last successful run (23 January 2026):

- ✅ 93 tests passed
- ⏭️ 3 tests skipped
- ⏱️ Duration: 1m 43.6s
- 🎭 Browsers: Chromium, Firefox, WebKit

## Contributing

When adding new E2E tests:

1. Place test files in this directory with `.spec.ts` extension
2. Use existing test patterns (see `auth.spec.ts`, `register.spec.ts`)
3. Ensure tests are idempotent (can run multiple times)
4. Clean up test data if creating resources
5. Run full test suite before committing

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Testcontainers](https://testcontainers.com/)
- [Project Development Guide](../../../DEVELOPMENT.md)
- [Docker PostgreSQL Setup](../../../DOCKER_POSTGRES.md)
