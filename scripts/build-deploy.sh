#!/usr/bin/env bash
# scripts/build-deploy.sh — Build para cierre srv001 + reload PM2
set -e

echo "═══════════════════════════════════════════"
echo "  Portal La Mundial — Build + Deploy"
echo "  Entorno: cierre (srv001 / cierrelmds)"
echo "═══════════════════════════════════════════"

unset PORT

export VITE_APP_BASE=/portal/
export VITE_NEXUS_API_URL=https://cierrelmds.exelixitech.com/nexus-api
export VITE_PORTAL_OCR_URL=https://cierrelmds.exelixitech.com/ocr/
export VITE_PORTAL_EMISION_URL=https://cierrelmds.exelixitech.com/emision/
export VITE_PORTAL_FORM_URL=https://cierrelmds.exelixitech.com/formulario/
export VITE_PORTAL_PAGOS_URL=https://cierrelmds.exelixitech.com/pagos/
export VITE_LAMUNDIAL_RAMO_PATRIMONIAL=20

echo "▶  Variables:"
echo "   VITE_APP_BASE=$VITE_APP_BASE"
echo "   VITE_NEXUS_API_URL=$VITE_NEXUS_API_URL"

echo "▶  Instalando dependencias..."
npm install --legacy-peer-deps

echo "▶  Build producción..."
npm run build

echo "▶  Verificando dist/..."
ls -lah dist/

echo "▶  Recargando PM2 portal-lamundial..."
pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs

pm2 save

echo "═══════════════════════════════════════════"
echo "  ✅ Deploy completo."
echo "  URL: https://cierrelmds.exelixitech.com/portal/"
echo "═══════════════════════════════════════════"
