#!/usr/bin/env bash
# Producción — Srv-Gcia-proyect · 172.30.149.75 · usuario proyect
# https://marketplace.exelixitech.com — Apache (443 y :5190) sirve /var/www/marketplace.exelixitech.com/dist (base /).
set -euo pipefail
export PORTAL_PUBLISH_DIR="/var/www/marketplace.exelixitech.com/dist"
export DEPLOY_ENV="PRODUCCIÓN (GCIA)"
export DEPLOY_BRANCH="main"
export PORTAL_BASE="/"
export PORTAL_NEXUS_API_URL="https://nexus-api.exelixitech.com"
export PORTAL_OCR_URL="https://ocr.exelixitech.com/"
export PORTAL_FORM_URL="https://formulario.exelixitech.com/"
export PORTAL_EMISION_URL="https://emision.exelixitech.com/"
export PORTAL_PAGOS_URL="https://pagos.exelixitech.com/"
exec bash "$(dirname "$0")/deploy-common.sh"
