#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/home/kamil/winqo/backup"
mkdir -p "$BACKUP_DIR"

stamp="$(date +%F_%H%M%S)"
outfile="$BACKUP_DIR/winqo_${stamp}.dump"

# Dump Postgres database from the running container
PGPASSWORD="app" docker exec -i winqo-db-1 pg_dump -U app -F c app > "$outfile"

# Keep only 3 most recent backups
cd "$BACKUP_DIR"
ls -1t winqo_*.dump 2>/dev/null | tail -n +4 | xargs -r rm -f
