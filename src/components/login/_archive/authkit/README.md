# Login AuthKit (archivado)

Copia congelada del login **oscuro AuthKit** (commit ~ac1af2e, sep-2026).

## Restaurar

1. Copiar `LoginPage.authkit.tsx` → `src/pages/LoginPage.tsx`
2. Copiar `LoginLoadingOverlay.tsx`, `LoginAmbientLayer.tsx`, `LoginBrandShowcase.tsx` → `src/components/login/`
3. En `LoginPage`, imports desde `@/components/login/...` como hoy.
4. `body.portal-login-route` en CSS (fondo `#05060f`).

## Variante activa

La variante **orgánica / bioluminescent** vive en los mismos paths fuera de `_archive/`.
