# Postgres Row Level Security (optional hard isolation)

This scaffold enforces tenant isolation in the API layer by filtering on `tenant_id`.
For stronger isolation, enable RLS.

## Example (Tenant table not needed in RLS; apply to business tables)
```sql
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON client
USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- In each request, set:
-- SET LOCAL app.tenant_id = '<uuid>';
```

You can set this per-request in SQLAlchemy via `session.exec(text("SET LOCAL app.tenant_id = :tid"), {"tid": tid})`.
