# AeroMatch - Changelog

## V1.0 - 26 Diciembre 2025

### 🎨 Identidad de Marca / Brand Identity
- **Logo actualizado** con SVG oficial:
  - Icono "A": Dorado (#C2A359)
  - Texto "aero": Dorado (#BFA058)
  - Texto "Match": Blanco (#FFFFFF)
- **Tamaños de logo**:
  - `hero`: 280px (landing page)
  - `xl`: 220px (branding grande)
  - `lg`: 180px (auth, onboarding)
  - `md`: 140px (headers)
  - `sm`: 100px (sidebar, mobile, footer)

### 🔧 Perfil de Técnico / Technician Profile
- **Edición de perfil** (`/profile/edit`):
  - Chips azules para licencias, aeronaves, especialidades
  - Bordes dorados (4px) solo para elementos seleccionados
  - **Selector de aeronaves** con tabs por fabricante:
    - Airbus, Boeing, ATR, Embraer, Bombardier
    - Helicópteros, Jets Privados, Otros
  - Búsqueda de aeronaves
  - Soporte i18n completo (EN/ES)

- **Mi Perfil** (`/profile`):
  - Vista CV de solo lectura
  - Chips azules consistentes con Type Ratings
  - Badge de verificación

### 📄 Sistema de Documentos / Documents System
- **Estructura mejorada** (`/profile/documents`):
  - **Licencias**: EASA, UK CAA, FAA A&P
  - **Type Ratings**: Solo aeronaves seleccionadas en perfil
    - Theory + Practical (requeridos)
    - Extras opcionales: Run-up, Borescope, NDT, Engine Training
  - **Certificados generales**: HF, EWIS, FTS, etc.
- Estados claros: Missing, Uploaded, In Review, Verified

### 📅 Disponibilidad / Availability
- Calendario en la parte superior
- Lista de períodos en acordeones (Activos, Pendientes, Expirados)
- Sin errores de schema de Supabase

### 🔄 Preview (antes Demo)
- Renombrado de "Demo" a "Preview"
- **Página de preview** (`/preview`):
  - Técnico de ejemplo: AMX-00023
  - Perfil completo, disponibilidad, documentos, solicitudes
  - Modo solo lectura
  - Badge "Preview Mode"
- `/demo` redirige automáticamente a `/preview`

### 🏠 Página Principal / Homepage
- Logo tamaño `hero` para máximo impacto
- Cards de features enlazan a `/preview`
- CTAs claramente visibles

### 🗄️ Base de Datos / Database
- **Nueva migración** (`003_documents_index.sql`):
  ```sql
  CREATE INDEX idx_documents_tech_type ON documents(technician_id, doc_type);
  CREATE INDEX idx_documents_status ON documents(status);
  CREATE INDEX idx_availability_slots_dates ON availability_slots(...);
  ALTER TABLE documents ADD COLUMN file_name TEXT;
  ALTER TABLE documents ADD COLUMN extra_label TEXT;
  ```

### 🎯 CSS / Estilos
- Nueva clase `.chip-blue-selectable`
- Chips azules para licencias/aeronaves
- Bordes dorados solo para estados seleccionados/verificados

---

## Archivos Modificados / Files Changed

### Componentes
- `src/components/ui/Logo.tsx` - Logo SVG completo
- `src/components/home/HomePage.tsx` - Preview links
- `src/components/profile/MyProfileView.tsx` - Chips azules
- `src/components/ui/AppLayout.tsx` - Navegación

### Páginas
- `src/app/profile/edit/page.tsx` - Selector de aeronaves con tabs
- `src/app/profile/documents/page.tsx` - Uploads estructurados
- `src/app/profile/availability/page.tsx` - Fix errores schema
- `src/app/preview/page.tsx` - Perfil de ejemplo
- `src/app/demo/page.tsx` - Redirect a preview

### Estilos
- `src/app/globals.css` - chip-blue-selectable

### Migraciones
- `supabase/migrations/003_documents_index.sql`

---

## Para Ejecutar / To Run

```bash
cd C:\Users\rsbms\Documents\aeroMatch\aeroMatch-app
npm run dev
```

**URL**: http://localhost:3000

## Backup
- Archivo: `aeroMatch-backup-2025-12-26-0024.zip`
- Ubicación: `C:\Users\rsbms\Documents\aeroMatch\`

