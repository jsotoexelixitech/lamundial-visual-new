#!/usr/bin/env bash
# Lógica común de despliegue del portal. No ejecutar directo:
# usar deploy-dev.sh (120), deploy-qa.sh (121) o deploy-prod.sh (GCIA).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

: "${DEPLOY_ENV:?}" "${DEPLOY_BRANCH:?}" "${PORTAL_BASE:?}" "${PORTAL_NEXUS_API_URL:?}"
: "${PORTAL_OCR_URL:?}" "${PORTAL_FORM_URL:?}" "${PORTAL_EMISION_URL:?}" "${PORTAL_PAGOS_URL:?}"

echo "▶ Portal La Mundial — despliegue $DEPLOY_ENV (rama $DEPLOY_BRANCH)"

# 1. Rama correcta del ambiente (nunca desplegar otra rama por error).
current_branch="$(git branch --show-current)"
if [ "$current_branch" != "$DEPLOY_BRANCH" ]; then
  echo "ERROR: el repo está en '$current_branch' y $DEPLOY_ENV despliega '$DEPLOY_BRANCH'."
  echo "       Cambiar con: git checkout $DEPLOY_BRANCH"
  exit 1
fi
git pull --ff-only origin "$DEPLOY_BRANCH"

# 2. Limpiar variables heredadas del shell (p. ej. tras `source` de otro .env).
for v in $(compgen -e | grep -E '^VITE_' || true); do unset "$v"; done
unset PORT NODE_ENV NPM_CONFIG_PRODUCTION npm_config_production DATABASE_URL

# 3. Variables del ambiente (las únicas que lee el build).
export VITE_APP_BASE="$PORTAL_BASE"
export VITE_NEXUS_API_URL="$PORTAL_NEXUS_API_URL"
export VITE_PORTAL_OCR_URL="$PORTAL_OCR_URL"
export VITE_PORTAL_FORM_URL="$PORTAL_FORM_URL"
export VITE_PORTAL_EMISION_URL="$PORTAL_EMISION_URL"
export VITE_PORTAL_PAGOS_URL="$PORTAL_PAGOS_URL"

echo "  VITE_APP_BASE=$VITE_APP_BASE"
echo "  VITE_NEXUS_API_URL=$VITE_NEXUS_API_URL"
echo "  OCR=$VITE_PORTAL_OCR_URL  FORM=$VITE_PORTAL_FORM_URL"
echo "  EMISION=$VITE_PORTAL_EMISION_URL  PAGOS=$VITE_PORTAL_PAGOS_URL"

# 4. Build (devDependencies necesarias para tsc/vite).
npm ci --include=dev
npm run build

# 5. Verificar que el bundle apunta al ambiente correcto.
js="$(ls dist/assets/index-*.js | head -1)"
for url in "$VITE_NEXUS_API_URL" "$VITE_PORTAL_OCR_URL" "$VITE_PORTAL_FORM_URL" "$VITE_PORTAL_EMISION_URL" "$VITE_PORTAL_PAGOS_URL"; do
  if ! grep -qF "$url" "$js"; then
    echo "ERROR: el bundle no contiene $url — no se recarga PM2."
    exit 1
  fi
done
if ! grep -qF "src=\"${VITE_APP_BASE%/}/assets/" dist/index.html; then
  echo "ERROR: dist/index.html no usa la base $VITE_APP_BASE — no se recarga PM2."
  exit 1
fi
echo "✔ Bundle verificado para $DEPLOY_ENV"

# 6. Publicar.
if [ -n "${PORTAL_PUBLISH_DIR:-}" ]; then
  # Apache sirve la carpeta estática (patrón /var/www/<subdominio> del servidor); sin PM2.
  if [ ! -w "$PORTAL_PUBLISH_DIR" ]; then
    echo "ERROR: sin permiso de escritura en $PORTAL_PUBLISH_DIR (dueño: $(stat -c %U "$PORTAL_PUBLISH_DIR" 2>/dev/null))."
    echo "       Infra debe dejarla como las demás: chown -R $(whoami):$(whoami) $PORTAL_PUBLISH_DIR"
    exit 1
  fi
  if command -v rsync > /dev/null 2>&1; then
    rsync -a --delete dist/ "$PORTAL_PUBLISH_DIR/"
  else
    find "$PORTAL_PUBLISH_DIR" -mindepth 1 -delete
    cp -a dist/. "$PORTAL_PUBLISH_DIR/"
  fi
  echo "✔ Publicado en $PORTAL_PUBLISH_DIR"
  # El proceso PM2 del portal ya no se usa en este ambiente (Apache ocupa el puerto).
  if pm2 describe portal-lamundial > /dev/null 2>&1; then
    pm2 delete portal-lamundial
    pm2 save
  fi
else
  # PM2 (portal-lamundial sirve ./dist en :5190).
  if pm2 describe portal-lamundial > /dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --update-env
  else
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
fi

echo "✔ Portal $DEPLOY_ENV desplegado: $(git log -1 --format='%h %s')"
