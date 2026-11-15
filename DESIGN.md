---
project: PROJECT E.D.E.N. — Bio-Sync OS
theme: Calm Orbital Telemetry (Swiss-Dark)
density: balanced
variance: low
motion: gpu-subtle (transform, opacity only)
colors:
  canvas: "#060911"
  surface: "#0C1320"
  surface-elevated: "#121B2D"
  border: "#1E293B"
  text-primary: "#F1F5F9"
  text-secondary: "#94A3B8"
  primary: "#38BDF8"
  primary-contrast: "#04101A"
  success: "#34D399"
  warning: "#FBBF24"
  danger: "#F87171"
typography:
  sans: "'Inter', system-ui, -apple-system, sans-serif"
  mono: "'JetBrains Mono', ui-monospace, monospace"
radius:
  sm: "6px"
  md: "10px"
  lg: "14px"
---

# DESIGN.md — PROJECT E.D.E.N. (Multi-Window Mission Control)

## 1. Principio Rector: Cero Sobrecarga Cognitiva
Los astronautas en tránsito de espacio profundo no deben procesar dos paneles densos simultáneamente. La interfaz se divide en **4 ventanas independientes** accesibles desde un **menú lateral izquierdo vertical**, con el selector **"Cambiar de perfil"** separado al fondo del sidebar.

## 2. Layout Blueprint
- **Shell Principal (`min-h-[100dvh]`)**:
  - **Sidebar Izquierdo Vertical (`272px` fijo en desktop, drawer en móvil `< 768px`)**:
    1. Cabecera de sistema: `PROJECT E.D.E.N.` + indicador `AUTONOMOUS`.
    2. Navegación vertical (4 ventanas):
       - `Datos de astronauta`
       - `Consulta médica`
       - `Dispensador`
       - `Inventario de cápsulas`
    3. Pie separado (`mt-auto border-t`): Tarjeta compacta del perfil activo + botón **"Cambiar de perfil"**.
  - **Área de Ventana Activa (`flex-1`)**:
    - Barra superior contextual con el título de la ventana activa y estado de telemetría (`EARTH DELAY` / `SOL`).
    - Contenido centrado (`max-w-5xl`) mostrando únicamente la ventana seleccionada.

## 3. Reglas WCAG y Calidad (Do's & Don'ts)
- **Do**: Usar `tabular-nums` en toda cifra biométrica, dosis (`mSv`) y relojes UTC.
- **Do**: Mantener contraste ≥ 4.5:1 (`#04101A` sobre botones `#38BDF8` sólidos).
- **Do**: Usar `min-h-[100dvh]` y `overflow-x: clip` en el contenedor raíz.
- **Don't**: No animar `width`/`height`/`top` salvo barras de progreso explícitas; usar `transform`/`opacity` para transiciones.
- **Don't**: No mezclar datos de inventario de cápsulas dentro de la consulta médica ni viceversa.
