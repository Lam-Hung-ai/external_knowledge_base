#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
OUTPUT_FILE="$BACKEND_DIR/src/api/routes/generated/tables.py"

set -a
source "$BACKEND_DIR/.env"
set +a

: "${BACKEND_DATABASE_URL:?BACKEND_DATABASE_URL is not set in backend/.env}"

mkdir -p "$(dirname "$OUTPUT_FILE")"

cd "$BACKEND_DIR"

uv run sqlacodegen \
  --generator tables \
  "$BACKEND_DATABASE_URL" \
  --outfile "$OUTPUT_FILE"

uv run ruff format "$OUTPUT_FILE"

echo "✓ SQLAlchemy tables generated at backend/src/api/routes/generated/tables.py"
