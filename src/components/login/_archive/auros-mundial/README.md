# Login Auros × La Mundial (archivado)

Copia congelada del login **terminal Auros** con paleta La Mundial (commit `e35ac87`, mar-2026).

- Esfera de partículas (`LoginParticleSphere`)
- Overlay con mini-esfera
- `data-login-theme="auros-mundial-v1"`

## Restaurar

1. Copiar `LoginPage.auros-mundial.tsx` → `src/pages/LoginPage.tsx`
2. Copiar `LoginLoadingOverlay.tsx`, `LoginParticleSphere.tsx`, `LoginMoleculeDecor.tsx` → `src/components/login/`
3. `body.portal-login-auros` en `LoginPage` (ver archivo archivado).
4. CSS: bloque `.login-auros-*` en `src/index.css` (se mantiene en main aunque el login activo sea otro).

## Login activo

**AuthKit** (primera variante animada) — ver `_archive/authkit/README.md`.
