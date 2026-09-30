# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Canales alternos, gestores e intermediarios de La Mundial de Seguros. Entran varias veces al día para emitir pólizas a sus clientes, muchas veces desde el teléfono o en mostrador. Los administradores corporativos de La Mundial gestionan usuarios desde el mismo portal.

## Product Purpose

Portal corporativo de La Mundial de Seguros: un solo acceso donde cada canal ve los productos habilitados para él (según su canal/productor en Sis2000) y abre la emisión en un clic. Éxito = encontrar el producto y abrir la emisión en segundos, y a la vez que el catálogo se vea como una vitrina comercial de La Mundial que se pueda mostrar al cliente.

## Positioning

El catálogo es exactamente el del marketplace de La Mundial para ese canal (mismos planes y productos), con emisión en línea para los productos con flujo digital y enlace al marketplace para el resto.

## Operating Context

- Login con el mismo usuario/clave del marketplace La Mundial (`/login-pasarela`) o con usuario corporativo (`/login`).
- Cada emisión se abre en una pestaña nueva (SSO a módulos de emisión o formulario del marketplace).
- Bitácora de acciones y administración de usuarios para administradores.

## Capabilities and Constraints

- Tarjetas por producto con monto desde, fraccionamiento, presentación (enlace), QR para el cliente y modo de apertura (`sso` en línea / `sysip` marketplace).
- Búsqueda y filtro por línea comercial; estados de carga, vacío y error.
- React 19 + Tailwind v4 + Vite; servido en `/portal-lm/`.

## Brand Commitments

- Colores del manual de identidad (`manual de marca la mundial/`): Azul Pennsylvania #0F1A5A (principal), Rojo Imperial #E84F51 (secundario), Plata #ACACAC (terciario).
- Logos oficiales en `public/brand/`.
- Nunca mostrar nombres internos (Exélixi, Sis2000, Nexus, SysIP) al usuario final.

## Evidence on Hand

- Catálogo real por canal desde el marketplace (ej. canal 27: 10 productos).
- Manual de identidad en PDF (páginas en imagen, sin texto extraíble).
- No hay testimonios, métricas ni fotografía de producto; no inventarlos.

## Product Principles

1. Emitir primero: el camino producto → emisión nunca compite con la decoración.
2. Vitrina honesta: mostrar solo lo que el canal realmente puede emitir, con datos reales.
3. Marca La Mundial, no la de la plataforma.
4. Funciona igual de bien en teléfono que en escritorio.
