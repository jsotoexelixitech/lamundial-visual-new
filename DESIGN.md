---
name: La Mundial de Seguros — Vitrina de emisión
description: Catálogo ilustrado por línea comercial para que canales e intermediarios encuentren el producto, lo muestren al cliente y emitan en segundos.
colors:
  pennsylvania: "#0F1A5A"
  pennsylvania-deep: "#091133"
  pennsylvania-bright: "#162A7F"
  imperial: "#E84F51"
  imperial-cta: "#D4403F"
  imperial-cta-hover: "#BF3534"
  plata: "#ACACAC"
  escaparate: "#F4F5F8"
  papel: "#FFFFFF"
  tinta-suave: "#5E6275"
  filete: "#E3E5EC"
  sobre-navy: "#C9D1EE"
  sobre-navy-suave: "#AFBBE4"
  azul-senal: "#2E6DBF"
  escena-autos-suave: "#1C2A78"
  escena-autos-detalle: "#7FA7E0"
  escena-personas: "#E4ECF9"
  escena-personas-suave: "#CCDBF2"
  escena-viajes: "#D3E3F7"
  escena-viajes-suave: "#B7CFEF"
  escena-funerario: "#131A45"
  escena-funerario-suave: "#222B62"
  escena-patrimoniales: "#EAEBF0"
  escena-patrimoniales-suave: "#D8DAE2"
  error-fondo: "#FDECEC"
  error-tinta: "#8F2A2D"
  aviso-fondo: "#FFF7E6"
  aviso-tinta: "#7A4B00"
typography:
  display:
    fontFamily: "Libre Baskerville, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.4rem, 1.6rem + 3.4vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Libre Baskerville, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.9rem, 1.4rem + 1.6vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  greeting:
    fontFamily: "Libre Baskerville, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.6rem, 1.2rem + 1.4vw, 2.2rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  price:
    fontFamily: "Libre Baskerville, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.1rem, 1.5rem + 2vw, 3.1rem)"
    fontWeight: 700
    lineHeight: 1.05
    fontFeature: "tnum"
  price-card:
    fontFamily: "Libre Baskerville, Georgia, 'Times New Roman', serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.15
    fontFeature: "tnum"
  title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.5
  body-ficha:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
  label-strong:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.15
  button:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "0.6rem"
  md: "0.75rem"
  cta: "0.85rem"
  lg: "1rem"
  card: "1.1rem"
  panel: "1.25rem"
  pill: "9999px"
spacing:
  gutter: "max(1rem, calc((100% - 80rem) / 2))"
  rail-gap: "0.75rem"
  gallery-gap: "1.25rem"
  gallery-gap-compact: "0.75rem"
  card-body: "0.9rem 1rem 1rem"
  ficha-pad: "clamp(1.5rem, 1rem + 1.5vw, 2.25rem)"
  ficha-pad-client: "clamp(1.75rem, 1rem + 3vw, 3.5rem)"
components:
  button-emit:
    backgroundColor: "{colors.imperial-cta}"
    textColor: "{colors.papel}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 0.95rem"
    height: "2.5rem"
  button-emit-hover:
    backgroundColor: "{colors.imperial-cta-hover}"
  button-cta:
    backgroundColor: "{colors.imperial-cta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.cta}"
    padding: "0 1.5rem"
    height: "3.4rem"
  button-cta-hover:
    backgroundColor: "{colors.imperial-cta-hover}"
  button-ficha-link:
    backgroundColor: "transparent"
    textColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "0 0.85rem"
    height: "2.25rem"
  search-field:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.pennsylvania-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 0.9rem"
    height: "2.75rem"
  rail-tab:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.pennsylvania-deep}"
    rounded: "{rounded.lg}"
    padding: "0.45rem 0.45rem 0.6rem"
  rail-tab-active:
    backgroundColor: "{colors.pennsylvania}"
    textColor: "{colors.papel}"
  product-card:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.pennsylvania-deep}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-body}"
  card-badge:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.pennsylvania}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.55rem"
  ficha:
    backgroundColor: "{colors.pennsylvania}"
    textColor: "{colors.papel}"
    rounded: "{rounded.panel}"
    padding: "{spacing.ficha-pad}"
---

# Design System: La Mundial de Seguros — Vitrina de emisión

## Overview

**Creative North Star: "El escaparate por líneas"**

La vitrina es el mundo del catálogo de operadores (`/dashboard` del portal). Cada línea comercial (Autos, Salud y personas, Viajes, Funerario, Patrimoniales) tiene su propio escenario de color, y cada producto es una tarjeta con una escena ilustrada propia: geometría plana en blanco, Azul Pennsylvania y un único acento Rojo Imperial, dibujada en SVG en línea. El operador recorre el escaparate por pestañas ilustradas, abre la ficha del producto sobre un panel Pennsylvania y pulsa Emitir; la misma ficha se amplía a pantalla completa para mostrarla al cliente.

La densidad es de catálogo comercial, no de tarifario: pocas palabras por tarjeta (nombre, línea y N.º, precio, Emitir), la escena ocupa la mitad superior en proporción 16:10 y el precio se canta en serifa. El fondo es un plata azulado muy claro (#F4F5F8) sobre el que las tarjetas blancas descansan con un filete de 1px y una sombra casi imperceptible que solo crece al pasar el cursor. El movimiento es breve y con una sola curva de desaceleración: las tarjetas entran escalonadas y se elevan al hover; las escenas responden levantando su sujeto.

Rechazos confirmados por el usuario en el build: la lista larga tipo tarifario con ficha fija y los iconos planos del marketplace. Nunca aparecen nombres internos de la plataforma en la interfaz.

Alcance: las pantallas de login y administración (menú lateral) son anteriores a este mundo y siguen llevando Inter/DM Sans, easing con rebote y texto con degradado; no forman parte de este sistema ni deben tomarse como referencia.

**Key Characteristics:**
- Escena SVG propia por producto, teñida por línea comercial; nunca fotos ni iconos sueltos.
- Rojo Imperial reservado a la acción de emitir y a un solo acento dentro de cada ilustración.
- Poppins para todo lo operativo; Libre Baskerville solo para saludo, título de ficha y precio.
- Superficies blancas con filete sobre plata azulada; sombras tintadas en Pennsylvania que aparecen como respuesta.
- Una sola curva de movimiento, cubic-bezier(0.16, 1, 0.3, 1), con entrada escalonada de tarjetas.

## Colors

Paleta del manual de identidad: Pennsylvania domina como tinta y como escenario profundo, Plata y los azules claros tiñen los escenarios, e Imperial queda como la única voz cálida.

### Primary
- **Azul Pennsylvania** (#0F1A5A): color de marca principal. Fondo de la ficha, pestaña de línea activa, escenario de Autos, precio en tarjeta, cierre de modal. En la ficha se ilumina con un halo radial de **Pennsylvania Brillante** (#162A7F) en la esquina superior derecha.
- **Pennsylvania Profundo** (#091133): tinta de texto de todo el mundo (nunca negro puro), fondo del modo "Mostrar al cliente" y base de todas las sombras (rgba(9,17,51,…)).

### Secondary
- **Rojo Imperial** (#E84F51): acento de marca dentro de las ilustraciones (escudo, corazón, llama, vela, marcador) y extremo del filete superior de la barra marketplace.
- **Imperial de Acción** (#D4403F): relleno de todos los botones Emitir. Es la variante AA del Imperial para texto blanco; al hover baja a **Imperial Presionado** (#BF3534).

### Tertiary
- **Plata** (#ACACAC): terciario del manual; aparece como detalle en el escenario de Funerario. Los escenarios claros usan su versión azulada: **Plata Patrimonial** (#EAEBF0 / suave #D8DAE2).

### Escenarios por línea
Cada ilustración define fondo, plano suave, blanco, tinta, acento Imperial y un color de detalle:
- **Autos**: fondo Pennsylvania, plano #1C2A78, detalle #7FA7E0.
- **Salud y personas**: fondo #E4ECF9, plano #CCDBF2, detalle Azul Señal.
- **Viajes**: fondo #D3E3F7, plano #B7CFEF, detalle Azul Señal.
- **Funerario**: fondo #131A45, plano #222B62, detalle Plata.
- **Patrimoniales**: fondo #EAEBF0, plano #D8DAE2, detalle #8A93B8.

### Neutral
- **Escaparate** (#F4F5F8): tono base de la vitrina. Sobre él va el telón `VitrinaBackdrop` (SVG fijo, detrás de todo el contenido, incluido el saludo): degradado #E3EBF8→#F1F4FA, halo y anillo #D5E1F4 arriba a la derecha, arco #D9E4F5 abajo a la izquierda, colina #CFDCF2, banda blanca diagonal, estela punteada blanca que termina en un solo punto Imperial, y cruces y puntos #2E6DBF muy tenues. Son los mismos planos de las escenas, a escala de página.
- **Papel** (#FFFFFF): tarjetas, pestañas, encabezado, barra marketplace, buscador.
- **Tinta Suave** (#5E6275): meta de tarjeta, conteos, resumen del canal, etiqueta de precio.
- **Filete** (#E3E5EC): bordes de 1px en tarjetas, pestañas, encabezado y barra.
- **Sobre Navy** (#C9D1EE) y **Sobre Navy Suave** (#AFBBE4): texto secundario sobre Pennsylvania (descripción, meta, notas de la ficha, conteo de pestaña activa).
- **Azul Señal** (#2E6DBF): anillos de foco, borde del buscador enfocado, enlace de "restablecer" en vacío, detalle de ilustraciones claras.
- **Alertas**: error #FDECEC con tinta #8F2A2D; aviso #FFF7E6 con tinta #7A4B00.

### Named Rules
**The Un Solo Rojo Rule.** Imperial es la acción. En la interfaz solo rellena Emitir (#D4403F con texto blanco); dentro de cada escena aparece una única forma Imperial. Nada decorativo más en rojo.

**The Escenario por Línea Rule.** El color de una escena lo decide su línea comercial, no el producto: dos productos de la misma línea comparten telón y se distinguen por el sujeto y el plano de fondo.

## Typography

**Display Font:** Libre Baskerville (con Georgia, serif)
**Body Font:** Poppins (con system-ui, sans-serif)

**Character:** Poppins geométrica y amable lleva toda la operación; Libre Baskerville aporta la voz de aseguradora establecida en tres lugares: el saludo, el nombre del producto en la ficha y el precio.

### Hierarchy
- **Display** (700, clamp(2.4rem → 4.5rem), 1.1): título del producto en "Mostrar al cliente".
- **Headline** (700, clamp(1.9rem → 2.75rem), 1.1, balanceado): título de la ficha en modal u hoja.
- **Greeting** (700, clamp(1.6rem → 2.2rem), 1.15): "Hola, {nombre}" del encabezado.
- **Price** (700, clamp(2.1rem → 3.1rem), 1.05, cifras tabulares): monto "Desde" de la ficha; en tarjeta baja a 1.35rem (1.15rem en móvil). Cuando el precio es texto ("Según cotización") pasa a Poppins 600.
- **Title** (Poppins 600, 1rem, 1.3): nombre del producto en tarjeta (0.875rem en móvil).
- **Body** (Poppins 400, 0.9rem, 1.5): resumen del canal, alertas; en la ficha 15px/1.55 con máximo 46ch.
- **Label** (Poppins 500–600, 0.6875–0.75rem): "Desde"/"Precio", meta "Línea · N.º", conteos. En sentence case, sin tracking.

### Named Rules
**The Precio en Serifa Rule.** Libre Baskerville solo para saludo, título de ficha y montos. Cualquier otro texto, incluidos botones y etiquetas, es Poppins.

**The Cifras Alineadas Rule.** Precios, números de producto y conteos llevan `font-variant-numeric: tabular-nums`.

## Layout

Columna centrada de 80rem con gutter fluido `max(1rem, calc((100% - 80rem) / 2))`, compartido por la barra marketplace, el encabezado y el cuerpo. Orden fijo: barra marketplace blanca, encabezado blanco (saludo + resumen del canal a la izquierda, buscador de 20rem a la derecha desde 768px; apilado en móvil), fila de pestañas ilustradas y galería.

- **Fila de pestañas:** scroll horizontal con snap, gap 0.75rem, pestañas de base 9.5rem (8.75rem bajo 768px, donde la fila sangra hasta el borde de pantalla) y máximo 16rem. Primera pestaña "Todos" con el isotipo; luego una por línea con su escena 16:9 y conteo.
- **Galería:** `repeat(auto-fill, minmax(min(100%, 15.5rem), 1fr))` con gap 1.25rem, que da 4 columnas en escritorio y 2–3 en tableta; bajo 480px, 2 columnas fijas con gap 0.75rem.
- **Ficha:** modal centrado de hasta 38rem; bajo 640px se convierte en hoja inferior a ancho completo (máx. 92dvh, respeta safe-area). "Mostrar al cliente" ocupa la pantalla sobre Pennsylvania Profundo con la ficha a máx. 60rem.
- **Operadores sin menú lateral:** el catálogo es toda la aplicación; solo el administrador conserva el menú lateral (fuera de este mundo).

Breakpoints observados: 480px, 640px, 768px, 1024px.

## Elevation & Depth

Sistema híbrido: superficies planas blancas con filete de 1px y sombra mínima en reposo; la elevación aparece como respuesta (hover, pestaña activa) y en los paneles superpuestos. Todas las sombras están tintadas en Pennsylvania Profundo y usan dispersión negativa para quedarse debajo del objeto.

### Shadow Vocabulary
- **Reposo** (`box-shadow: 0 1px 2px rgba(9, 17, 51, 0.05)`): tarjetas y pestañas en reposo.
- **Elevación de tarjeta** (`box-shadow: 0 22px 40px -24px rgba(9, 17, 51, 0.5)`): tarjeta al hover, junto con translateY(-4px).
- **Pestaña** (`0 8px 18px -12px rgba(9,17,51,0.35)` hover; `0 12px 24px -14px rgba(9,17,51,0.6)` activa).
- **Ficha** (`box-shadow: 0 24px 48px -24px rgba(9, 17, 51, 0.55)`): panel Pennsylvania.
- **Brillo de acción** (`0 8px 16px -10px rgba(212, 64, 63, 0.9)` en Emitir de tarjeta; `0 12px 24px -12px rgba(212, 64, 63, 0.85)` en el CTA de ficha): sombra roja solo bajo botones Emitir.
- **Velo de modal** (`rgba(9, 17, 51, 0.55)` con `backdrop-filter: blur(3px)`).

### Named Rules
**The Sombra Tintada Rule.** Ninguna sombra es gris ni negra: la base es siempre rgba(9,17,51,…), salvo el brillo Imperial debajo de Emitir.

**The Elevación como Respuesta Rule.** En reposo la galería es plana; solo el hover, la pestaña activa y los paneles superpuestos ganan profundidad.

## Shapes

Esquinas generosas y consistentes por escala: 0.6rem en enlaces de ficha, 0.75rem en buscador y botones Emitir, 0.85rem en el CTA de ficha, 1rem en pestañas (0.7rem en su escena interior), 1.1rem en tarjetas y 1.25rem en ficha y modal (solo arriba en la hoja móvil). Píldora completa para la insignia "Marketplace", el cierre del modal y el botón de salida del modo cliente. Las escenas se recortan dentro del contenedor (overflow hidden) sin borde propio. Dentro de las ilustraciones, la geometría es plana: círculos, arcos y trazos redondeados, sin contornos ni degradados.

## Components

### Buttons
Acción cálida y compacta, la única superficie roja de la interfaz.
- **Shape:** esquina suave (0.75rem en tarjeta, 0.85rem en ficha).
- **Emitir (tarjeta):** Imperial de Acción con texto blanco Poppins 600 0.875rem, alto mínimo 2.5rem, ancho mínimo 5.75rem, flecha (en línea) o icono de enlace externo (marketplace). Queda por encima del área clicable de la tarjeta.
- **CTA de ficha:** mismo color, alto 3.4rem, 16px 700, ancho completo del panel.
- **Hover / Focus:** fondo #BF3534; la tarjeta desplaza 2px a la derecha, el CTA sube 1px. Foco: contorno Pennsylvania de 2px en tarjeta; contorno blanco de 3px en la ficha. Deshabilitado a opacidad 0.55 mientras se abre una emisión (spinner en el botón activo).
- **Enlace de ficha (secundario):** transparente sobre Pennsylvania, borde blanco al 24%, alto 2.25rem, 13px 600; hover con velo blanco al 8%. Usado para "Ver presentación" y "Mostrar al cliente".

### Chips
- **Insignia Marketplace:** píldora blanca al 94% sobre la escena, 11px 600 en Pennsylvania, con icono de enlace externo; marca los productos que se emiten en el marketplace.

### Cards / Containers
- **Corner Style:** 1.1rem.
- **Background:** Papel, con escena 16:10 arriba y cuerpo con padding 0.9rem 1rem 1rem (0.75rem en móvil).
- **Shadow Strategy:** Reposo → Elevación de tarjeta al hover (ver Elevation & Depth).
- **Border:** Filete 1px; #C9D1E6 al hover, Azul Señal con foco interior.
- **Comportamiento:** toda la tarjeta abre la ficha; el pie alinea precio a la izquierda y Emitir a la derecha (apilados en móvil). Al hover el sujeto de la escena sube 4px y escala 1.03, y la insignia de la escena gira -6°.

### Inputs / Fields
- **Style:** buscador blanco, borde #D9DCE5, radio 0.75rem, alto 2.75rem, icono de lupa en gris, placeholder #6F7488, cursor de texto Imperial.
- **Focus:** borde Azul Señal con halo `0 0 0 3px rgba(46, 109, 191, 0.18)`.

### Navigation
- **Barra marketplace:** blanca, filete inferior y un filete superior de 3px en degradado Pennsylvania → Azul Señal → Imperial. Logotipo oficial a la izquierda; nombre y canal a la derecha (ocultos bajo 640px) y botón "Cerrar sesión" blanco con borde rosado #F0D0D0 (solo icono en móvil).
- **Pestañas de línea:** tarjeta blanca con escena de línea 16:9, etiqueta Poppins 600 0.875rem y conteo tabular. Activa: fondo Pennsylvania, texto blanco, conteo Sobre Navy (`aria-pressed`). Al cambiar de línea la galería se vuelve a montar y repite la entrada escalonada.

### Ficha del producto
Panel Pennsylvania con halo radial Brillante, escena a sangre arriba (2:1 en modal, 16:7 en modo cliente), título en Baskerville, meta "Línea · Producto N.º", descripción Sobre Navy, bloque de precio separado por filete blanco al 14%, CTA Emitir, nota de apertura en pestaña nueva y enlaces secundarios. Tres presentaciones de un mismo componente: modal centrado, hoja inferior (móvil) y pantalla completa para el cliente con toda la tipografía escalada.

### Estados
- **Carga:** esqueletos 4:5 con radio 1.1rem y barrido #ECEEF4 → #F6F7FA (1.4s lineal).
- **Vacío:** caja blanca con filete, icono gris #B5B9C7, título Poppins 600 y enlace de restablecer en Azul Señal subrayado.
- **Error / aviso:** alertas con radio 0.8rem en los tonos de error y aviso.

### Motion
- **Curva única:** cubic-bezier(0.16, 1, 0.3, 1) para toda transición y entrada del mundo.
- **Entrada de tarjeta:** 0.55s desde translateY(14px) scale(0.98) blur(4px), escalonada 45ms por índice (tope en 12 tarjetas).
- **Ficha:** 0.4s desde opacidad 0.35 y blur(3px) en modal; subida desde el borde inferior en la hoja móvil; fundido 0.3s en modo cliente.
- **Reduced motion:** se anulan entradas, elevaciones y movimientos de escena.

## Do's and Don'ts

### Do:
- **Do** dar a cada producto nuevo una escena SVG de 320×200 con el tema de su línea: fondo, plano suave, sujeto en blanco/tinta y una sola forma Imperial.
- **Do** rellenar Emitir con #D4403F (hover #BF3534) y texto blanco; es el único botón rojo.
- **Do** escribir precios y títulos de ficha en Libre Baskerville 700 con cifras tabulares, y todo lo demás en Poppins.
- **Do** tintar todas las sombras con rgba(9,17,51,…) y reservar la elevación para hover, pestaña activa y paneles.
- **Do** usar cubic-bezier(0.16, 1, 0.3, 1) y respetar prefers-reduced-motion.
- **Do** mantener la ficha como un solo componente con variantes modal, hoja inferior y cliente.

### Don't:
- **Don't** volver a la lista larga tipo tarifario con ficha fija; el usuario la rechazó.
- **Don't** representar productos con iconos planos sueltos del marketplace ni con fotografía inventada.
- **Don't** usar #E84F51 como relleno de botón con texto blanco (no llega a AA); para acción usa Imperial de Acción.
- **Don't** mostrar nombres internos de la plataforma en tarjetas, fichas o avisos.
- **Don't** tomar el login ni el panel de administración como referencia: Inter, rebotes y texto en degradado son de un mundo anterior.
