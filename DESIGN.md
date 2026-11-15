---
project: PROJECT E.D.E.N. — Bio-Sync OS
theme: NASA Artemis Flight-Deck (Dark)
density: balanced
variance: low
motion: gpu-subtle (transform, opacity only)
colors:
  canvas: "#05070C"
  surface: "#0B0F17"
  surface-elevated: "#111824"
  border: "#1C2433"
  text-primary: "#F1F5F9"
  text-secondary: "#94A3B8"
  primary: "#38BDF8"
  primary-contrast: "#04101A"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
typography:
  sans: "'Inter', system-ui, -apple-system, sans-serif"
  mono: "'JetBrains Mono', ui-monospace, monospace"
radius:
  sm: "4px"
  md: "6px"
  lg: "8px"
---

# DESIGN.md — PROJECT E.D.E.N. (NASA Artemis Flight-Deck)

## 1. Principio Rector: Instrumentación de Vuelo Real
Estética inspirada en pantallas de aviónica Orion / Crew Dragon: negro carbón mate (`#05070C`), paneles acero (`#0B0F17`), bordes quirúrgicos de `1px` (`#1C2433`), radios contenidos (`6px–8px`) y códigos de módulo (`MOD-01`..`MOD-05`). Cero neón difuso o decoración gratuita.

## 2. Layout Blueprint (5 Ventanas)
- **Sidebar Izquierdo (`272px` desktop, drawer `< 768px`)**:
  - `MOD-01` Astronaut Data
  - `MOD-02` Medical Consultation
  - `MOD-03` Dispenser
  - `MOD-04` Capsule Inventory
  - `MOD-05` Plant Status
  - Pie separado: Perfil activo + botón `Switch Profile` (`DEMO PROFILES`).
- **Visualización de Instrumento**:
  - `AstronautView`: Barras de rango nominal en constantes vitales.
  - `InventoryView` y `PlantStatusView`: Anillos radiales SVG para viabilidad genómica y progreso de cultivo.
