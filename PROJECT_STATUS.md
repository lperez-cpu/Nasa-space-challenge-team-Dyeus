# PROJECT_STATUS.md — PROJECT E.D.E.N. (Bio-Sync OS)

## 1. Arquitectura y Estado del Backend
*(Sección reservada para `@programador-python` / Supabase API)*

---

## 2. Arquitectura y Características del Frontend (Carol)
- **Framework / Stack UI:** React 19 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`) + `lucide-react`.
- **Contrato `DESIGN.md` Activo:** Tema *Calm Orbital Telemetry (Swiss-Dark)* — paleta `#060911` / `#0C1320` / `#38BDF8` (`#04101A` contraste en CTAs), tipografía `Inter` + `JetBrains Mono` (`tabular-nums`).
- **Branch de Diseño:** `feature/ui-redesign` (aislada de `main`).
- **Secuencia de Ventanas (Blueprint Multi-Ventana):**
  1. **Datos de astronauta** (`AstronautView.jsx`): Ficha de identidad, constantes vitales basales y re-escaneo biométrico.
  2. **Consulta médica** (`MedicalView.jsx`): Alertas clínicas activas + Living Pharmacy (recetas botánicas automáticas).
  3. **Dispensador** (`DispenserView.jsx`): Estación de dispensación de cartucho autorizado (`idle` -> `dispensing` -> `ready`).
  4. **Inventario de cápsulas** (`InventoryView.jsx`): Auditoría genética del Seed Vault y cálculo de dosis de radiación.
- **Navegación y Perfiles:** Menú lateral vertical a la izquierda (`SidebarNav.jsx`, colapsable en móvil `< 768px`) + botón **"Cambiar de perfil"** separado al fondo que abre `ProfileSwitcherModal.jsx` (y enlaza a `NewProfileModal.jsx`).
- **Notas de Carol y Segundas Opiniones:** Se eliminó la sobrecarga cognitiva de mostrar telemetría biométrica, recetas, inventario y dispensador simultáneamente en 2 columnas.
- **Integración API:** Consume `useSolutionData()` y `logDispense()` de `src/data/api.js` sin alterar contratos de datos.

---

## 3. Entorno y Dependencias
- Node.js / Vite 6 (`npm run dev`, `npm run build`)
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `lucide-react`

---

## 4. Variables de Entorno
- Configuradas en `.env` (ver `.env.example`).

---

## 5. Bitácora de Ejecución
| Paso | Descripción | Estado |
| :--- | :--- | :--- |
| Paso 1 [Carol] | Commit de cambios pendientes en `main` (`753dc95`) y creación de branch `feature/ui-redesign` | Completado |
| Paso 2 [Carol] | Creación de `DESIGN.md` y separación del frontend en 4 ventanas con sidebar vertical izquierdo y selector de perfil al fondo | Completado |

---

## 6. Historial y Backlog
- [x] `[Frontend - Carol]` Separar dashboard en 4 ventanas (`Datos de astronauta`, `Consulta médica`, `Dispensador`, `Inventario de cápsulas`)
- [x] `[Frontend - Carol]` Implementar menú lateral izquierdo vertical + botón separado "Cambiar de perfil" abajo
- [ ] `[Frontend - Carol]` Conectar filtro de búsqueda o historial de dispensaciones en `DispenserView` si el backend expone endpoint de logs

---

## 7. Lecciones Aprendidas
| Fecha | Error / Hallazgo | Solución | Regla Preventiva |
| :--- | :--- | :--- | :--- |
| 2026-11-15 | Icono `Capsule` inexistente en `lucide-react` | Reemplazado por `Pill` | Verificar existencia de iconos en `lucide-react` antes de compilar |
