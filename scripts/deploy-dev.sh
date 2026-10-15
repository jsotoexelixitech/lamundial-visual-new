#!/usr/bin/env bash
# Desarrollo — srv001 · 120 · usuario jsoto · https://cierrelmds.exelixitech.com/portal-lm/
set -euo pipefail
export DEPLOY_ENTRY="deploy-dev.sh"
export DEPLOY_ENV="DESARROLLO (120)"
export DEPLOY_BRANCH="${PORTAL_DEV_BRANCH:-feat/portal-login-sis2000}"
export PORTAL_BASE="/portal-lm/"
export PORTAL_NEXUS_API_URL="https://cierrelmds.exelixitech.com/nexus-api"
export PORTAL_OCR_URL="https://cierrelmds.exelixitech.com/ocr/"
export PORTAL_FORM_URL="https://cierrelmds.exelixitech.com/formulario/"
export PORTAL_EMISION_URL="https://cierrelmds.exelixitech.com/emision/"
export PORTAL_PAGOS_URL="https://cierrelmds.exelixitech.com/pagos/"
exec bash "$(dirname "$0")/deploy-common.sh"
