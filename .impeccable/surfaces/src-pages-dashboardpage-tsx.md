---
version: 1
slug: "src-pages-dashboardpage-tsx"
primary_target: "src/pages/DashboardPage.tsx"
related_targets: []
---

# Dashboard de emisión (canal)

Scope: `/dashboard` del portal La Mundial. Mode: operate (con vitrina para mostrar al cliente).
Audience: canales, gestores e intermediarios; emiten varias veces al día, a menudo en teléfono o mostrador. Los operadores ven solo este catálogo (sin menú lateral); el admin conserva el menú.
Task: encontrar el producto y abrir la emisión en segundos; poder mostrar la ficha al cliente (monto, fraccionamiento, presentación). Sin QR.
Constraints: marca La Mundial (Azul Pennsylvania, Rojo Imperial, Plata; Poppins + Libre Baskerville; logos oficiales). Nunca nombres internos. Mantener búsqueda, filtros por línea, launchMode sso/sysip, errores, carga, vacío, "Mostrar al cliente".
Rechazado por el usuario: lista larga tipo tarifario con ficha fija (crecía hacia abajo, se veía plana).

## Direction contract

THESIS: Vitrina ilustrada de La Mundial: cada línea comercial es una pestaña grande con su propia escena, y cada producto una tarjeta con ilustración propia, como un escaparate que se recorre por línea. Rechaza la lista de filas iguales y los iconos planos del marketplace.

OWN-WORLD: Fondo plata muy claro; escenarios de tarjeta en tintes de marca por línea (Pennsylvania profundo para Autos y Funerario, azules claros para Personas y Viajes, plata para Patrimoniales); ilustraciones geométricas planas en blanco, Pennsylvania y un solo acento Rojo Imperial; nombres en Poppins, precio en Libre Baskerville; botón Emitir rojo.

STORY: El operador ve su canal, elige una línea en la fila ilustrada o busca, la galería se reordena, toca una tarjeta para ver la ficha o pulsa Emitir directo.

FIRST VIEWPORT: Encabezado con saludo, canal y buscador. Debajo, fila de pestañas ilustradas (Todos + líneas con conteo). Luego galería en cuadrícula de 4 columnas en escritorio, 2 en tablet, 1-2 en móvil; cada tarjeta: escena 16:10, nombre, línea y N.º, precio y Emitir. La ficha abre en modal centrado (hoja inferior en móvil).

FORM: Líneas ilustradas + galería, posición 4 de 7 en la lista ordenada; seed 6110e0a3.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
