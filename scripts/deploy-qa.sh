#!/usr/bin/env bash
# QA — srv001qa · 121 · usuario proyect · https://nexusqa.exelixitech.com/portal-lm/
set -euo pipefail
export DEPLOY_ENTRY="deploy-qa.sh"
export DEPLOY_ENV="QA (121)"
export DEPLOY_BRANCH="${PORTAL_QA_BRANCH:-feat/portal-login-sis2000}"
export PORTAL_BASE="/portal-lm/"
export PORTAL_NEXUS_API_URL="https://nexusqa.exelixitech.com/nexus-api"
export PORTAL_OCR_URL="https://nexusqa.exelixitech.com/ocr/"
export PORTAL_FORM_URL="https://nexusqa.exelixitech.com/formulario/"
export PORTAL_EMISION_URL="https://nexusqa.exelixitech.com/emision/"
export PORTAL_PAGOS_URL="https://nexusqa.exelixitech.com/pagos/"
exec bash "$(dirname "$0")/deploy-common.sh"
