#!/usr/bin/env bash
# Build portal para acceso por IP en srv001 (120)
set -e
unset PORT

export VITE_APP_BASE=/
export VITE_NEXUS_API_URL=http://192.168.8.120:3092
export VITE_PORTAL_OCR_URL=http://192.168.8.120:5181/
export VITE_PORTAL_EMISION_URL=http://192.168.8.120:5183/
export VITE_PORTAL_FORM_URL=http://192.168.8.120:5182/
export VITE_PORTAL_PAGOS_URL=http://192.168.8.120:5184/
export VITE_SSO_CPRODUCTOR=80080
export VITE_SSO_CUSUARIO=4

npm run build
pm2 reload portal-lamundial 2>/dev/null || pm2 start ecosystem.config.cjs
echo "OK → http://192.168.8.120:5190/"
