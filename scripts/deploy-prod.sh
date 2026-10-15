#!/usr/bin/env bash
# Producción — Srv-Gcia-proyect · 172.30.149.75 · usuario proyect
# Se sirve en la raíz de su propio subdominio (base /), detrás de Apache → 127.0.0.1:5190.
set -euo pipefail
export DEPLOY_ENV="PRODUCCIÓN (GCIA)"
export DEPLOY_BRANCH="main"
export PORTAL_BASE="/"
export PORTAL_NEXUS_API_URL="https://nexus-api.exelixitech.com"
export PORTAL_OCR_URL="https://ocr.exelixitech.com/"
export PORTAL_FORM_URL="https://formulario.exelixitech.com/"
export PORTAL_EMISION_URL="https://emision.exelixitech.com/"
export PORTAL_PAGOS_URL="https://pagos.exelixitech.com/"
exec bash "$(dirname "$0")/deploy-common.sh"
