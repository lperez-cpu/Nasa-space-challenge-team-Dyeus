# PROJECT_STATUS.md — PROJECT E.D.E.N. (Bio-Sync OS)

## 1. Arquitectura y Estado del Backend
*(Sección reservada para `@programador-python` / Supabase API)*

---

## 2. Arquitectura y Características del Frontend (Carol)
- **Framework / Stack UI:** React 19 + Vite 6 + Tailwind CSS v4 (`@tailwindcss/vite`) + `lucide-react`.
- **Contrato `DESIGN.md` Activo:** Tema **Swiss Orbital Light (Crew Dragon Day Mode)** — lienzo `#F4F6F9`, tarjetas `#FFFFFF`, tinta `#0F172A`, acento primario NASA `#E14D2A`, info `#0284C7`, nominal `#059669`, alerta `#DC2626`, tipografía `Inter` + `JetBrains Mono` (`tabular-nums`).
- **Branch Activo en Producción (Vercel):** `main` (`https://nasa-space-challenge-team-dyeus.vercel.app`). Respaldo histórico en `feature/ui-redesign` (oscuro) y `feature/ui-swiss-light`.
- **Secuencia de Ventanas (Blueprint 5 Módulos):**
  1. **MOD-01 · Astronaut Data** (`AstronautView.jsx`): Ficha de identidad (`ISS / Deep Space Habitat // Veggie Bio-Bay`), constantes vitales con barras de rango nominal, `Data source: ... · simulated feed` y re-escaneo biométrico.
  2. **MOD-02 · Medical Consultation** (`MedicalView.jsx`): Alertas clínicas activas + **Dietary Therapeutics (Food as Medicine)** con `{rx.habitatLabel}`, `ISS CONSUMPTION` (`rx.consumptionMethod`) y **Natural Consumption Protocol** (Infusion Space Tea, Direct Consumption, Dehydrated Powder).
  3. **MOD-03 · Dispenser** (`DispenserView.jsx`): Selector multi-especie sobre `seedPods` reales con delineado **verde** (disponible) / **rojo** (extraído), anatomía de 3 partes del **Seed Pod**, extracción única bloqueada (`extractedPodIds` + `status === 'growing'`) sin botón `Reset`, e instrucción Plug & Play para el **NASA Veggie Module**.
  4. **MOD-04 · Seed Pod Vault** (`InventoryView.jsx`): Auditoría genética del Seed Vault con `RadialGauge` SVG y cálculo de radiación acumulada.
  5. **MOD-05 · Plant Status** (`PlantStatusView.jsx`): Progreso de cultivos activos en el bio-bay, estado vacío honesto y `Therapeutic Species for Active Cycle`.
- **Navegación, Perfiles y Fuentes:** Sidebar vertical compacto (`SidebarNav.jsx`, colapsable `< 768px`) con `Switch Profile` visible sin recorte (`ProfileSwitcherModal.jsx` + `NewProfileModal.jsx`), favicon SVG inline y pie de página **Data sources** renderizando `DATA_SOURCES` de `src/data/api.js`.
- **Arquitectura Proyectada — Acceso Dual & Roles (Carol Frontend + Claude Backend):** Entrada directa en **Modo Demo / Astronaut View** (sin muro de login bloqueante para jueces/video) + botón **`Sign In / Switch Profile`** en header (`AuthContext.jsx` + `AuthModal.jsx` con `Mission Credentials`, `Quick Demo Roles` y `Request Access`) para desbloquear vistas de `Doctor`, `Engineer` y `Admin` (`AccessRequestsView.jsx` / `UsersView.jsx`).
- **Notas de Carol y Segundas Opiniones:** Cero lenguaje farmacéutico ("pastillas / capsule / Living Pharmacy") para blindar viabilidad técnica ante jueces NASA; honestidad total con `· simulated feed` y hardware Veggie/ISS existente. Se analizó en solo lectura `dyeus_app CODIGO APARTE NO MESCLAR` y se descartó copiar su `seed.sql` (destructivo) y su `App.jsx` monolítico.
- **Integración API:** Consume `useSolutionData()`, `logDispense()`, `DATA_SOURCES` y `harvestDays` / `plantCatalog` de `src/data/api.js` (capa exclusiva de Claude, intacta). Próxima integración: funciones Auth/Profiles en `api.js`.

---

## 3. Entorno y Dependencias
- Node.js / Vite 6 (`npm run dev`, `npm run build`)
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `lucide-react`

---

## 4. Variables de Entorno
- Configuradas en `.env` (ver `.env.example`) y en Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## 5. Bitácora de Ejecución
| Paso | Descripción | Estado |
| :--- | :--- | :--- |
| Paso 1 [Carol] | Commit de cambios pendientes en `main` (`753dc95`) y creación de branch `feature/ui-redesign` | Completado |
| Paso 2 [Carol] | Creación de `DESIGN.md` y separación del frontend en ventanas con sidebar vertical izquierdo y selector de perfil al fondo | Completado |
| Paso 3 [Carol] | Diseño e integración de **Swiss Orbital Light (Crew Dragon Day Mode)** en `main` (`159484a`) + corrección de recorte de `Switch Profile` y ancho `max-w-6xl` | Completado |
| Paso 4 [Carol] | Implementación de etiquetas `Data Source` + `DATA_SOURCES` footer + enfoque **Dietary Therapeutics / Seed Pods / NASA Veggie / Consumo Natural** (`4ebbaf6`) | Completado |
| Paso 5 [Carol] | Resolución de los 7 hallazgos de `Claude-Tester` (`#3, #5, #6, #7, #9, #11, #12`) y enlace de `rx.consumptionMethod` (`a2f06bb`, `a9e93dc`) | Completado |
| Paso 6 [Carol] | Selector multi-especie de `seedPods`, bloqueo de extracción ilimitada (sin `Reset`) y delineado verde/rojo de disponibilidad en `DispenserView.jsx` (`b61ab0a`, `71910cc`, `2447697`) | Completado |
| Paso 7 [Carol] | Auditoría final + E2E en Vercel (`0` excepciones, `0` HTTP errors), conexión `harvestDays`/`plantCatalog` en `PlantStatusView.jsx` (`6ad578b`) | Completado |
| Paso 8 [Carol] | Análisis solo-lectura de `dyeus_app` + diseño conjunto Acceso Dual (Perfiles & Login) en `COORDINACION.md` (`7eefaab`, `2a1b0bd`) e inicio de Frontend Auth | En progreso |

---

## 6. Historial y Backlog
- [x] `[Frontend - Carol]` Separar dashboard en 5 módulos (`Astronaut Data`, `Medical Consultation`, `Dispenser`, `Seed Pod Vault`, `Plant Status`)
- [x] `[Frontend - Carol]` Implementar menú lateral izquierdo vertical + botón separado "Switch Profile" visible sin recorte
- [x] `[Frontend - Carol]` Adoptar **Swiss Orbital Light** en `main` y desplegar en Vercel
- [x] `[Frontend - Carol]` Integrar `Data source`, `· simulated feed`, `habitatLabel`, `DATA_SOURCES` y `consumptionMethod`
- [x] `[Auditoría - Carol]` Resolver hallazgos de `Claude-Tester` y bloquear re-extracción ilimitada de Seed Pods con delineado verde/rojo
- [x] `[Frontend - Carol]` Verificar limpieza final de dosis formato alimento (`pod_status_update.sql` + `harvestDays`/`plantCatalog` conectados)
- [ ] `[Frontend - Carol]` Construir `AuthContext.jsx`, `AuthModal.jsx` (Acceso Dual + Request Access), botón en header y vistas de rol (`AccessRequestsView.jsx`, `UsersView.jsx`)
- [ ] `[Backend - Claude]` Implementar SQL aditivo (`user_profiles`, `access_requests`, `profile_views`, RLS compatible con modo demo) y exportar funciones Auth en `src/data/api.js`

---

## 7. Lecciones Aprendidas
| Fecha | Error / Hallazgo | Solución | Regla Preventiva |
| :--- | :--- | :--- | :--- |
| 2026-11-15 | Icono `Capsule` inexistente en `lucide-react` | Reemplazado por `Pill` y luego `ShieldCheck` | Verificar existencia de iconos en `lucide-react` antes de compilar |
| 2026-11-15 | Terminología farmacéutica ("capsule / Rx / extract") vulnera viabilidad ante jueces NASA | Migrado a **Dietary Therapeutics (Food as Medicine)**, **Seed Pods** y **Natural Consumption Protocol** | Auditar todo copy contra hardware real existente de la ISS (Veggie, dispensador de agua caliente) |
| 2026-11-15 | Botón `Reset` y `.find()` único en `DispenserView` permitían extracciones infinitas de una sola especie | Selector sobre `seedPods` completos + bloqueo por `extractedPodIds`/`growing` y delineado verde/rojo | Nunca dejar botones `Reset` de demo sobre flujos de inventario físico |
| 2026-11-15 | `dyeus_app/supabase/seed.sql` borra `plants` y `seed_cartridges` y tiene mismatch de columnas en `access_requests` | No ejecutar ni copiar `seed.sql`; crear migración aditiva aparte y blindar `dyeus_app` en `.gitignore` | Auditar cualquier SQL externo en solo lectura antes de tocar el Supabase activo |
