# Pact Broker Docker Setup

This directory contains a Docker Compose configuration for running [Pact Broker](https://docs.pact.io/pact_broker), a service that provides contract testing capabilities for microservices and distributed systems.

## What is Pact Broker?

Pact Broker is a repository for storing and sharing consumer-driven contract tests (Pacts). It enables:

- **Contract Testing**: Verify that services can communicate with each other
- **Version Management**: Track contract versions across different environments
- **Breaking Change Detection**: Identify when changes break existing contracts
- **CI/CD Integration**: Automate contract verification in your pipeline
- **Documentation**: Auto-generate API documentation from contracts

## Prerequisites

- Docker and Docker Compose installed
- Port 9292 available (or modify the port mapping in `.env`)
- PostgreSQL 18.1 (included in the docker-compose.yml)

## Quick Start

### 1. Create Environment File

Copy the example environment file:

```bash
cd infrastructure/pact-broker
cp .env.example .env
```

**⚠️ Security Warning**: The default password in `.env.example` is for development only. Always change it before using in any real or shared environment:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=postgres

# Pact Broker Configuration
PACT_BROKER_PORT=9292
PACT_BROKER_LOG_LEVEL=INFO
PACT_BROKER_SQL_LOG_LEVEL=DEBUG

# Pact Broker Database URL (uses the above credentials)
PACT_BROKER_DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres/${POSTGRES_DB}"
```

### 2. Start Pact Broker

```bash
cd infrastructure/pact-broker
docker compose up -d
```

This will:

- Pull the PostgreSQL 18.1 Alpine image
- Pull the Pact Broker 2.113.0 image (with pact-broker 2.107.1)
- Create a PostgreSQL container with health checks
- Create a Pact Broker container that depends on PostgreSQL
- Expose Pact Broker on port 9292 (configurable via `.env`)
- Create a persistent volume for PostgreSQL data

### 3. Verify Installation

Check that both services are running:

```bash
docker compose ps
```

You should see both `postgres` and `pact-broker` containers with status "Up" and "healthy".

Access the Pact Broker web interface:

```bash
open http://localhost:9292
# or
curl http://localhost:9292
```

## Common Commands

All commands should be run from the `infrastructure/pact-broker` directory:

```bash
cd infrastructure/pact-broker
```

### Start the services

```bash
docker compose up -d
```

### Stop the services

```bash
docker compose down
```

### Stop and remove data (⚠️ destructive)

```bash
docker compose down -v
```

This will delete all contracts and PostgreSQL data.

### View logs

```bash
# View all logs
docker compose logs

# View Pact Broker logs only
docker compose logs pact-broker

# View PostgreSQL logs only
docker compose logs postgres
```

### Follow logs in real-time

```bash
# Follow all logs
docker compose logs -f

# Follow Pact Broker logs only
docker compose logs -f pact-broker
```

### Restart services

```bash
# Restart all services
docker compose restart

# Restart Pact Broker only
docker compose restart pact-broker
```

### Check service health

```bash
# Check PostgreSQL health
docker compose exec postgres pg_isready -U postgres

# Check Pact Broker health (returns JSON with status)
curl http://localhost:9292/diagnostic/status/heartbeat
```

## Integration with Monorepo Testing Strategy

### Contract Testing Workflow

Pact Broker integrates with the existing testing infrastructure:

1. **Consumer Tests** (Frontend/Backend):
   - Write consumer tests that generate Pact contracts
   - Publish contracts to Pact Broker after successful tests
   - Contracts define expected API behavior

2. **Provider Tests** (Backend):
   - Verify backend can fulfill all published contracts
   - Run provider verification tests against Pact Broker
   - Report verification results back to Pact Broker

3. **CI/CD Integration**:
   - Run consumer tests in CI pipeline
   - Publish contracts to Pact Broker
   - Run provider verification tests
   - Use "can-i-deploy" checks before deployments

### Example: Publishing Contracts

```bash
# From frontend or backend workspace
pnpm add -D @pact-foundation/pact

# Publish contract to Pact Broker
pact-broker publish ./pacts \
  --consumer-app-version=$GIT_COMMIT \
  --broker-base-url=http://localhost:9292
```

### Example: Verifying Contracts

```bash
# From backend workspace
# Verify backend fulfills all consumer contracts
pact-broker can-i-deploy \
  --pacticipant=backend \
  --version=$GIT_COMMIT \
  --to-environment=production \
  --broker-base-url=http://localhost:9292
```

## Configuration

### Environment Variables

The Pact Broker is configured via environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | (see `.env.example`) | PostgreSQL password (change in production!) |
| `POSTGRES_DB` | `postgres` | PostgreSQL database name |
| `PACT_BROKER_PORT` | `9292` | Port where Pact Broker is accessible |
| `PACT_BROKER_DATABASE_URL` | (auto-generated) | PostgreSQL connection string |
| `PACT_BROKER_LOG_LEVEL` | `INFO` | Application log level (DEBUG, INFO, WARN, ERROR) |
| `PACT_BROKER_SQL_LOG_LEVEL` | `DEBUG` | SQL query log level |

### Custom Port

To use a different port, edit `infrastructure/pact-broker/.env`:

```env
PACT_BROKER_PORT=9293
```

Then access Pact Broker at `http://localhost:9293`

### Base URLs

The `PACT_BROKER_BASE_URL` environment variable is pre-configured to allow access from:

- `https://localhost` - HTTPS from host (requires nginx with SSL)
- `http://localhost` - HTTP from host
- `http://localhost:9292` - HTTP from host with explicit port
- `http://pact-broker:9292` - From within Docker network
- `http://host.docker.internal` - From other Docker containers on macOS/Windows
- `http://host.docker.internal:9292` - From other Docker containers with explicit port

This prevents cache poisoning vulnerabilities while allowing flexible access patterns.

### Persistent Data

Contract data and PostgreSQL data are stored in a Docker volume named `postgres-volume`. This ensures data persists between container restarts.

To backup all contract data:

```bash
cd infrastructure/pact-broker
docker compose exec postgres pg_dump -U postgres postgres > pact-broker-backup.sql
```

To restore from backup:

```bash
cd infrastructure/pact-broker
docker compose exec -T postgres psql -U postgres -d postgres < pact-broker-backup.sql
```

## Optional: Nginx Reverse Proxy with SSL

The docker-compose.yml includes an optional nginx service (currently disabled) for adding HTTPS support. To enable it:

### 1. Create SSL Directory

```bash
cd infrastructure/pact-broker
mkdir -p ssl
```

### 2. Generate Self-Signed Certificate (Development)

```bash
cd ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx-selfsigned.key \
  -out nginx-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### 3. Create nginx.conf

Create `infrastructure/pact-broker/ssl/nginx.conf`:

```nginx
upstream pact_broker {
    server pact-broker:9292;
}

server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    location / {
        proxy_pass http://pact_broker;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Scheme $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header X-Forwarded-Ssl on;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Enable nginx Service

Uncomment the nginx service in `docker-compose.yml` (lines 47-56).

### 5. Restart Services

```bash
docker compose down
docker compose up -d
```

Pact Broker will now be accessible via:
- HTTP: `http://localhost` (redirects to HTTPS)
- HTTPS: `https://localhost`

## Troubleshooting

### Port already in use

If port 9292 is already in use:

1. Change the port in `.env`:
   ```env
   PACT_BROKER_PORT=9293
   ```

2. Restart services:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Pact Broker won't start

Check logs for errors:

```bash
cd infrastructure/pact-broker
docker compose logs pact-broker
```

Common issues:

- PostgreSQL not ready: Wait for PostgreSQL health check to pass (configured with max 5 retries)
- Port conflict: Change `PACT_BROKER_PORT` in `.env`
- Database connection error: Verify `PACT_BROKER_DATABASE_URL` in `.env`

### PostgreSQL connection errors

Verify PostgreSQL is running and healthy:

```bash
docker compose ps postgres
docker compose exec postgres pg_isready -U postgres
```

If PostgreSQL is unhealthy, check logs:

```bash
docker compose logs postgres
```

### Database initialization issues

If Pact Broker fails to initialize the database schema:

1. Stop all services:
   ```bash
   docker compose down -v
   ```

2. Start PostgreSQL first:
   ```bash
   docker compose up -d postgres
   ```

3. Wait for PostgreSQL to be healthy:
   ```bash
   docker compose ps
   ```

4. Start Pact Broker:
   ```bash
   docker compose up -d pact-broker
   ```

### Reset everything

To start completely fresh:

```bash
cd infrastructure/pact-broker
docker compose down -v
docker volume rm pact-broker_postgres-volume 2>/dev/null || true
docker compose up -d
```

**Warning**: This will delete all contract data and PostgreSQL data.

### Permission denied errors

Ensure Docker has proper permissions to create volumes:

```bash
cd infrastructure/pact-broker
docker compose down -v
docker compose up -d
```

## Additional Resources

- [Pact Documentation](https://docs.pact.io/)
- [Pact Broker Documentation](https://docs.pact.io/pact_broker)
- [Pact Broker Docker Image](https://hub.docker.com/r/pactfoundation/pact-broker)
- [Contract Testing Guide](https://docs.pact.io/getting_started)
- [PostgreSQL 18 Documentation](https://www.postgresql.org/docs/18/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Next Steps

1. **Set up consumer tests**: Install `@pact-foundation/pact` in your frontend/backend
2. **Generate contracts**: Write consumer tests that create Pact contracts
3. **Publish contracts**: Configure CI to publish contracts to Pact Broker
4. **Verify contracts**: Add provider verification tests to backend
5. **Integrate with CI/CD**: Use `can-i-deploy` checks before deployments
6. **Monitor contracts**: Use Pact Broker web UI to track contract versions

For detailed examples of writing Pact tests, see the [Pact Getting Started Guide](https://docs.pact.io/getting_started).
