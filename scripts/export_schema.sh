#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/backend"

cd "$BACKEND_DIR"

set -a
source "$BACKEND_DIR/.env"
set +a

RAW_SCHEMA="$(mktemp)"

trap 'rm -f "$RAW_SCHEMA"' EXIT

pg_dump "$BACKEND_DATABASE_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  > "$RAW_SCHEMA"

python3 "$SCRIPT_DIR/clean_schema.py" \
  "$RAW_SCHEMA" \
  "$SCRIPT_DIR/../db/schema/schema.sql"

echo "✓ Schema exported to db/schema/schema.sql"
