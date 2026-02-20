# PostgreSQL Docker Best Practices Implementation

This document describes the best practices implemented for running PostgreSQL in Docker in this project

## ✅ Implemented Best Practices

### 1. ✅ Used Specific PostgreSQL Version Tags

**Implementation**: Using `postgres:18.1-alpine` instead of `latest`

```yaml
image: postgres:18.1-alpine
```

**Benefits**:

- Consistent environment across development and production
- Prevents unexpected version changes
- Alpine variant reduces image size by ~70%

---

### 2. ✅ Optimised Container Resource Allocation

**Implementation**: Added resource limits and reservations

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
shm_size: 256mb
```

**Benefits**:

- Prevents PostgreSQL from overloading the host
- Guarantees minimum resources for stable operation
- Shared memory prevents "out of shared memory" errors

---

### 3. ✅ Automated Database Setup with Init Scripts

**Implementation**: SQL scripts in `/docker-entrypoint-initdb.d/`

Files created:

- `init-scripts/01-create-extensions.sql` - PostgreSQL extensions
- `init-scripts/02-create-schema.sql` - Initial schema setup

**Benefits**:

- Automatic database initialization on first startup
- Version-controlled schema setup
- Extensions enabled automatically (pg_stat_statements, uuid-ossp, pgcrypto, citext)

---

### 4. ✅ Enabled WAL (Write-Ahead Logging) Configuration

**Implementation**: Custom `postgresql.conf` with WAL settings

```conf
wal_level = replica
wal_compression = on
max_wal_size = 1GB
# archive_mode = on  (disabled for development)
```

**Benefits**:

- Prepared for point-in-time recovery (PITR)
- WAL compression reduces storage
- Easy to enable archiving for production

Volume mapping:

```yaml
volumes:
  - ./postgres-config/postgresql.conf:/etc/postgresql.conf:ro
  - postgres_wal:/var/lib/postgresql/wal_archive
```

---

### 5. ⚠️ SSL/TLS Configuration (Prepared, Disabled by Default)

**Implementation**: Configuration ready in `postgresql.conf`

```conf
# ssl = on  (commented out for development)
# ssl_cert_file = '/var/lib/postgresql/server.crt'
# ssl_key_file = '/var/lib/postgresql/server.key'
# ssl_min_protocol_version = 'TLSv1.2'
```

**To Enable SSL**:

1. Generate certificates:

   ```bash
   openssl req -new -x509 -days 365 -nodes -text \
     -out server.crt -keyout server.key \
     -subj "/CN=localhost"
   chmod 600 server.key
   ```

2. Uncomment SSL settings in `postgresql.conf`

3. Add volume mount:
   ```yaml
   - ./certs/server.crt:/var/lib/postgresql/server.crt:ro
   - ./certs/server.key:/var/lib/postgresql/server.key:ro
   ```

---

### 6. ✅ Used Alpine Postgres Image

**Implementation**: Using `postgres:18.1-alpine`

**Benefits**:

- Image size: ~80MB vs ~300MB (standard)
- Faster deployments
- Lower memory footprint
- Full PostgreSQL functionality maintained

---

### 7. ✅ Add Container Health Checks

**Implementation**: Enhanced health check with database validation

```yaml
healthcheck:
  test:
    [
      'CMD-SHELL',
      'pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-norbertsSpark} || exit 1',
    ]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Benefits**:

- Docker monitors database responsiveness
- Automatic container restart if unhealthy
- Validates both server and specific database
- 40s start period accounts for initialization

---

### 8. ✅ Isolated the Network for Security

**Implementation**: Custom Docker network with defined subnet

```yaml
networks:
  norbertsSpark-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

**Benefits**:

- Isolated network for database
- Controlled access from other containers
- Prevents unauthorized external access
- Easy to add other services to the network

---

### 9. ✅ Maximised Observability with Extensions

**Implementation**: Enabled performance monitoring extensions

Extensions installed via `01-create-extensions.sql`:

- **pg_stat_statements**: Query performance tracking
- **pgcrypto**: Cryptographic functions
- **uuid-ossp**: Legacy UUID generation (uuid_generate_v4(), etc.)
- **citext**: Case-insensitive text (for emails)

**Note**: PostgreSQL 18+ includes native `uuidv7()` function without requiring extensions. UUID v7 provides time-ordered UUIDs which improve database performance for indexed primary keys.

Configuration in `postgresql.conf`:

```conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
```

**Query Performance Monitoring**:

```sql
-- View slowest queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

### 10. 🔄 Docker Secrets (Not Implemented - See Below)

**Status**: Not implemented (requires Docker Swarm)

**Why**: Docker Compose in standard mode doesn't support Docker secrets. They require Docker Swarm mode.

**Current Approach**: Environment variables with `.env` file (gitignored)

**For Production**: Consider:

- Docker Swarm with secrets

---

## Configuration Files

### `docker-compose.yml`

- Resource limits and reservations
- Custom network configuration
- Health checks
- Volume mappings for config and WAL
- Shared memory size

### `postgres-config/postgresql.conf`

- Memory settings (optimized for 2GB limit)
- WAL configuration
- Query logging (development mode)
- Performance tuning
- Extension preloading

### `init-scripts/`

- `01-create-extensions.sql` - PostgreSQL extensions
- `02-create-schema.sql` - Initial database schema

### `.env.example`

- PostgreSQL credentials
- Initialization arguments

## Usage

### First-Time Setup

1. **Copy environment file**:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Start PostgreSQL**:

   ```bash
   docker compose up -d
   ```

3. **Verify initialization**:

   ```bash
   docker compose logs -f
   ```

   Look for:
   - "PostgreSQL extensions initialized successfully"
   - "Database schema initialized successfully"

4. **Check health status**:
   ```bash
   docker compose ps
   ```
   Status should show "healthy"

### Monitoring

**View query statistics**:

```bash
docker compose exec postgres psql -U postgres -d norbertsSpark -c "
  SELECT query, calls, mean_exec_time, total_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"
```

**Check resource usage**:

```bash
docker stats norbertsSpark-postgres
```

**View logs**:

```bash
docker compose logs -f postgres
```

### Backup and Restore

**Backup database**:

```bash
docker compose exec postgres pg_dump -U postgres -d norbertsSpark > backup.sql
```

**Restore database**:

```bash
docker compose exec -T postgres psql -U postgres -d norbertsSpark < backup.sql
```

**Backup with WAL archiving** (when enabled):
The WAL archive volume `postgres_wal` contains point-in-time recovery data.

## Performance Tuning

### Current Settings (for 2GB container)

- `shared_buffers`: 512MB (25% of RAM)
- `effective_cache_size`: 1536MB (75% of RAM)
- `work_mem`: 16MB
- `maintenance_work_mem`: 128MB

### Adjust for Production

Edit `postgres-config/postgresql.conf`:

1. **For more memory** (4GB container):

   ```conf
   shared_buffers = 1GB
   effective_cache_size = 3GB
   maintenance_work_mem = 256MB
   ```

2. **Enable WAL archiving**:

   ```conf
   archive_mode = on
   archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
   ```

3. **Enable SSL** (see section 5 above)

4. **Restart container**:
   ```bash
   docker compose restart postgres
   ```

## Security Checklist

- ✅ Using specific version tag (18.1-alpine)
- ✅ Custom network isolation
- ✅ Resource limits prevent DoS
- ✅ Health checks enabled
- ✅ Init scripts are read-only
- ✅ Environment variables in `.env` (gitignored)
- ⚠️ SSL/TLS ready but disabled for development
- ⚠️ Default password (change in production!)
- ⚠️ Port exposed to host (restrict in production)

## Production Recommendations

1. **Change default credentials** in `.env`
2. **Enable SSL/TLS** for encrypted connections
3. **Use Docker secrets or external secret management**
4. **Enable WAL archiving** for backups
5. **Restrict network access** (remove port mapping, use only Docker network)
6. **Set up monitoring** (Prometheus + Grafana)
7. **Configure automated backups** (pg_dump + cron or cloud backup service)
8. **Review and adjust memory settings** based on workload
9. **Enable connection pooling** (PgBouncer) for high traffic
10. **Set up replication** for high availability

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs postgres

# Common issues:
# - Invalid postgresql.conf syntax
# - Permissions on mounted volumes
# - Port 5432 already in use
```

### Out of memory errors

```bash
# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G

# Or reduce PostgreSQL memory settings in postgresql.conf
```

### Slow queries

```bash
# Enable slow query logging in postgresql.conf
log_min_duration_statement = 1000  # Log queries > 1 second

# View with pg_stat_statements (already enabled)
docker compose exec postgres psql -U postgres -d norbertsSpark -c "
  SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
"
```

## References

- [PostgreSQL Docker Best Practices (Sliplane)](https://sliplane.io/blog/best-practices-for-postgres-in-docker)
- [PostgreSQL Official Docker Image](https://hub.docker.com/_/postgres)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [pg_stat_statements Documentation](https://www.postgresql.org/docs/current/pgstatstatements.html)
