#!/usr/bin/env bash
# Build del portal en srv001 — instala devDependencies (tsc, vite).
set -euo pipefail
cd "$(dirname "$0")/.."
unset PORT VITE_APP_BASE NODE_ENV NPM_CONFIG_PRODUCTION npm_config_production
npm ci --include=dev
npm run build
if grep -q 'login-orbit-ring' dist/assets/*.js 2>/dev/null; then
  echo "AVISO: bundle aún referencia login-orbit-ring (legacy)."
fi
if ! grep -q 'login-apple-m-display' dist/assets/*.css 2>/dev/null; then
  echo "ERROR: CSS login Apple Mundial (login-apple-m-display) no encontrado en dist."
  exit 1
fi
echo "OK: dist listo ($(git log -1 --oneline))"
