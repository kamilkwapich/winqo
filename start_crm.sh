#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ROOT_DIR}/startcrm.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}" >&2
  exit 1
fi

docker run -d \
  --name crm \
  -p 8000:8000 \
  -v /srv/crm-data:/root/.crm-camillo \
  --env-file "${ENV_FILE}" \
  crm-app:latest
