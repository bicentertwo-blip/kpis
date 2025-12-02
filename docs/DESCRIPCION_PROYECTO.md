# 📊 KPIs - Inteligencia de Negocios - Descripción Detallada del Proyecto

## Índice

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Sistema de Diseño (Glass Design)](#sistema-de-diseño-glass-design)
6. [Módulos y Páginas](#módulos-y-páginas)
7. [Sistema de Permisos](#sistema-de-permisos)
8. [Gestión de KPIs](#gestión-de-kpis)
9. [Servicios y Hooks](#servicios-y-hooks)
10. [Flujo de Usuario](#flujo-de-usuario)

---

## Visión General

**KPIs - Inteligencia de Negocios** es una aplicación web empresarial desarrollada en React para la gestión, captura y supervisión de Indicadores Clave de Rendimiento (KPIs) organizacionales. La aplicación está diseñada con una estética moderna utilizando efectos de cristal (glassmorphism), gradientes sutiles y animaciones fluidas.

### Propósito Principal
- Permitir a usuarios capturar datos de 13 KPIs diferentes de manera estructurada
- Soportar tanto captura manual (resúmenes) como importación masiva (CSV)
- Proveer un sistema de permisos granular por usuario y vista
- Ofrecer supervisión ejecutiva del progreso de todos los usuarios

### Usuarios Objetivo
- **Ejecutivos/Administradores**: Supervisión y configuración de permisos
- **Analistas/Operadores**: Captura de datos de KPIs asignados
- **Supervisores**: Monitoreo de avance por usuario

---

## Stack Tecnológico

### Frontend Core
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.2.0 | Framework UI principal |
| TypeScript | ~5.9.3 | Tipado estático |
| Vite | 7.2.4 | Build tool y dev server |
| React Router DOM | 7.9.6 | Enrutamiento SPA |

### Estado y Datos
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Zustand | 5.0.8 | Estado global (auth, permissions, progress) |
| React Hook Form | 7.66.1 | Manejo de formularios |
| Zod | 4.1.13 | Validación de esquemas |

### Backend como Servicio
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Supabase | 2.86.0 | Auth, Base de datos PostgreSQL, RLS |

### UI/UX
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Tailwind CSS | 3.4.13 | Framework de estilos utilitarios |
| Framer Motion | 12.23.24 | Animaciones y transiciones |
| Lucide React | 0.555.0 | Iconografía |
| clsx + tailwind-merge | - | Utilidades de clases CSS |

### Utilidades
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| PapaParse | 5.5.3 | Parsing de archivos CSV |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Páginas    │  │ Componentes  │  │    Layout System     │   │
│  │  - Login     │  │  - GlassCard │  │  - AppShell          │   │
│  │  - Dashboard │  │  - Button    │  │  - Sidebar           │   │
│  │  - KPIs      │  │  - DynamicForm│ │  - TopBar            │   │
│  │  - Config    │  │  - Templates │  │  - RouteGuards       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    ESTADO (Zustand Stores)                 │  │
│  │  - authStore (sesión, perfil)                             │  │
│  │  - permissionsStore (vistas permitidas)                   │  │
│  │  - progressStore (estado de cada KPI)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                          SUPABASE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │     Auth     │  │  PostgreSQL  │  │   Row Level Security │   │
│  │  (email/pwd) │  │   + 40 tablas│  │   (por owner_id)     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
src/
├── components/
│   ├── base/              # Componentes atómicos reutilizables
│   │   ├── Button.tsx     # Botón con variantes (primary, ghost, glass, outline)
│   │   ├── GlassCard.tsx  # Panel con efecto glassmorphism
│   │   └── IconAura.tsx   # Contenedor de iconos con aura
│   │
│   ├── forms/             # Componentes de formulario
│   │   ├── DynamicForm.tsx       # Formulario dinámico basado en configuración
│   │   ├── AutosaveIndicator.tsx # Indicador visual de autoguardado
│   │   └── ImportExportPanel.tsx # Panel para importación/exportación CSV
│   │
│   ├── kpi/               # Componentes específicos de KPIs
│   │   ├── KpiPageTemplate.tsx   # Template maestro para páginas de KPI
│   │   ├── KpiSummaryForm.tsx    # Formulario de resumen
│   │   ├── KpiDetailImporter.tsx # Importador de CSV
│   │   ├── KpiHeader.tsx         # Cabecera con info del KPI
│   │   └── iconMap.ts            # Mapeo de nombres a componentes de iconos
│   │
│   ├── navigation/        # Navegación
│   │   ├── Sidebar.tsx    # Barra lateral con menú
│   │   └── TopBar.tsx     # Barra superior con búsqueda
│   │
│   └── status/            # Componentes de estado
│       ├── ProgressPill.tsx      # Pill de estado (sin iniciar, en progreso, completo)
│       ├── FullScreenLoader.tsx  # Loader de pantalla completa
│       └── WelcomeEmptyState.tsx # Estado vacío para usuarios sin permisos
│
├── config/
│   └── kpi-configs.ts     # Configuración centralizada de los 13 KPIs
│
├── hooks/                 # Custom hooks
│   ├── useKpiData.ts      # Carga y guardado de datos de KPI
│   ├── useKpiExporter.ts  # Exportación a CSV
│   ├── useKpiImporter.ts  # Importación desde CSV
│   └── useKpiSummaryForm.ts # Lógica de formulario con autoguardado
│
├── layout/
│   ├── AppShell.tsx       # Layout principal con sidebar responsive
│   ├── AuthLayout.tsx     # Layout para páginas de autenticación
│   └── RouteGuards.tsx    # Guards de rutas (ProtectedRoute, PermissionGuard)
│
├── lib/
│   └── supabase.ts        # Cliente de Supabase configurado
│
├── pages/                 # Páginas de la aplicación
│   ├── login/
│   ├── reset-password/
│   ├── set-password/
│   ├── auth-callback/
│   ├── dashboard/
│   ├── configuracion/
│   ├── supervision/
│   └── [13 carpetas de KPIs]/
│
├── services/
│   └── kpiService.ts      # Operaciones CRUD contra Supabase
│
├── store/                 # Stores de Zustand
│   ├── auth.ts            # Autenticación y sesión
│   ├── permissions.ts     # Permisos por usuario
│   └── progress.ts        # Progreso de captura por KPI
│
├── types/                 # Definiciones TypeScript
│   ├── auth.ts
│   ├── kpi.ts
│   ├── kpi-definitions.ts
│   ├── permissions.ts
│   ├── progress.ts
│   └── views.ts
│
└── utils/                 # Utilidades
    ├── constants.ts       # Definiciones de vistas y KPIs
    ├── csv.ts             # Helpers para CSV
    ├── formatters.ts      # Formateo de números/fechas
    ├── progress.ts        # Cálculo de progreso
    └── ui.ts              # Utilidad cn() para clases CSS
```

---

## Sistema de Diseño (Glass Design)

### Filosofía Visual
El sistema de diseño utiliza efectos modernos de glassmorphism, con las siguientes características:

1. **Glassmorphism**: Paneles traslúcidos con blur de fondo
2. **Gradientes sutiles**: Degradados suaves en fondos y botones
3. **Sombras difusas**: Sombras suaves que dan profundidad sin ser agresivas
4. **Bordes de luz**: Bordes semitransparentes que capturan la "luz"
5. **Animaciones fluidas**: Transiciones con curvas de Bézier personalizadas

### Paleta de Colores

```css
/* Colores principales */
--vision-ink: #0f172a;        /* Texto principal (casi negro) */
--soft-slate: #94a3b8;        /* Texto secundario */
--plasma-blue: #4f46e5;       /* Acento primario (índigo) */
--plasma-indigo: #6366f1;     /* Acento secundario */
--plasma-violet: #8b5cf6;     /* Acento terciario */

/* Fondos */
--vision-glass: #fdfefe;      /* Fondo de paneles */
--vision-glow: #eef2ff;       /* Fondo con resplandor */
```

### Componentes Clave

#### GlassCard
```tsx
// Panel glassmorphism con animación de entrada
<GlassCard 
  hover        // Efecto hover con elevación
  glow         // Resplandor sutil
  padding="md" // sm | md | lg | xl
  blur="lg"    // Intensidad del blur
>
  {children}
</GlassCard>
```

#### Button
```tsx
// 4 variantes de botón
<Button variant="primary">Acción principal</Button>  // Gradiente azul
<Button variant="ghost">Acción secundaria</Button>   // Fondo blanco semitransparente
<Button variant="glass">Estilo cristal</Button>      // Blur + borde
<Button variant="outline">Solo borde</Button>        // Transparente con borde
```

### Clases CSS Globales

```css
.glass-panel      /* Panel con blur, borde y sombra */
.glass-input      /* Input con estilo glassmorphism */
.shadow-glow      /* Sombra con resplandor azul */
.shadow-glass     /* Sombra suave para paneles */
.text-gradient    /* Texto con gradiente */
```

---

## Módulos y Páginas

### 1. Autenticación
- **Login** (`/login`): Formulario email/contraseña
- **Reset Password** (`/reset-password`): Recuperación de contraseña
- **Set Password** (`/set-password`): Establecer nueva contraseña
- **Auth Callback** (`/auth/callback`): Callback para flujos OAuth/magic link

### 2. Dashboard (`/dashboard`)
Panel ejecutivo que muestra:
- **Estadísticas generales**: Total KPIs, completados, en progreso, sin iniciar
- **Grid de indicadores**: Tarjetas de cada KPI con estado visual
- **Acceso rápido**: Click para navegar a cada KPI

### 3. Supervisión (`/supervision`)
Vista de administrador para monitorear:
- **Resumen global**: Usuarios, resúmenes capturados, registros de detalle
- **Lista de usuarios expandible**: Con estadísticas por KPI
- **Última actividad**: Timestamp de última actualización

### 4. Configuración (`/configuracion`)
Gestión de permisos:
- **Acciones globales**: Activar/desactivar todo para todos
- **Por usuario**: Toggle granular de cada vista/KPI
- **Vistas base**: Dashboard, Supervisión, Configuración
- **KPIs**: 13 indicadores individuales

### 5. Páginas de KPIs (13 indicadores)
Cada KPI usa `KpiPageTemplate` que ofrece:
- **Header**: Icono, título, descripción, estado
- **Tabs**: Resumen (formulario) | Importar Detalle (CSV)
- **Navegación**: Para KPIs con múltiples secciones
- **Sidebar**: Período actual, progreso, tips, leyenda de estados

---

## Sistema de Permisos

### Estructura

```typescript
// Vista = Dashboard | Supervisión | Configuración | [13 KPIs]
type AppViewId = 
  | 'dashboard' 
  | 'supervision' 
  | 'configuracion' 
  | KpiViewId;

// Cada usuario tiene un array de vistas permitidas
interface ViewAssignment {
  user_id: string;
  email: string;
  permitted_views: AppViewId[];
  updated_at: string;
}
```

### Flujo de Autorización

1. **Login** → Se carga el perfil y permisos del usuario
2. **Sidebar** → Solo muestra vistas permitidas
3. **RouteGuards** → Bloquea acceso a rutas no autorizadas
4. **FirstAllowedRoute** → Redirige `/` a la primera vista disponible

---

## Gestión de KPIs

### Los 13 Indicadores

| ID | Nombre | Secciones Resumen | Layouts Detalle |
|----|--------|-------------------|-----------------|
| `margen-financiero` | Margen Financiero | 1 | 1 |
| `rentabilidad-operativa` | ROE y ROA | 1 | 1 |
| `indice-renovacion-creditos` | Índice de Renovación | 1 | 1 |
| `colocacion` | Colocación | 3 | 3 |
| `rentabilidad` | Rentabilidad | 4 | 4 |
| `rotacion-personal` | Rotación de Personal | 4 | 4 |
| `escalabilidad` | Escalabilidad | 3 | 3 |
| `posicionamiento-marca` | Posicionamiento de Marca | 3 | 3 |
| `innovacion-incremental` | Innovación Incremental | 1 | 1 |
| `satisfaccion-cliente` | Satisfacción Cliente | 3 | 3 |
| `cumplimiento-regulatorio` | Cumplimiento Regulatorio | 2 | 0 |
| `gestion-riesgos` | Gestión de Riesgos | 1 | 1 |
| `gobierno-corporativo` | Gobierno Corporativo | 1 | 1 |

### Tipos de Campo Soportados

```typescript
type FieldType = 
  | 'currency'    // Formato $X,XXX,XXX
  | 'percentage'  // Con sufijo %
  | 'number'      // Entero o decimal
  | 'text'        // Texto corto
  | 'long-text'   // Textarea multilinea
  | 'select'      // Dropdown con opciones
```

### Flujo de Captura

```
1. Usuario accede a KPI → Carga datos existentes (si hay)
2. Modifica formulario → Autoguardado después de 1.2s de inactividad
3. Cambia de sección → Guarda y carga nueva sección
4. Importa CSV → Parsea, valida y upsert masivo
```

---

## Servicios y Hooks

### kpiService.ts
Operaciones CRUD contra Supabase:

```typescript
// Resúmenes
getSummaryRecord(table, userId, anio, mes)
upsertSummaryRecord(table, record)
deleteSummaryRecord(table, recordId)

// Detalles (CSV)
insertDetailRecords(table, records[])
deleteDetailRecords(table, userId, { anio, mes })

// Agregación
getKpiOverallStatus(config, userId, anio, mes)
getAvailablePeriods(table, userId)
```

### Hooks Principales

| Hook | Propósito |
|------|-----------|
| `useKpiData` | Carga y guarda datos de un KPI específico |
| `useKpiSummaryForm` | Manejo de formulario con autoguardado |
| `useKpiImporter` | Parseo y validación de CSV |
| `useKpiExporter` | Generación de CSV para descarga |

---

## Flujo de Usuario

### Primera Vez (Administrador)
1. Accede con email/contraseña
2. Ve `/configuracion` vacío
3. Activa vistas para su usuario
4. Navega a Dashboard → Ve sus KPIs asignados
5. Accede a cada KPI → Captura datos

### Usuario Regular
1. Login → Redirigido a primera vista permitida
2. Sidebar muestra solo vistas autorizadas
3. Dashboard muestra solo sus KPIs
4. Captura/importa datos de KPIs asignados

### Supervisor
1. Accede a `/supervision`
2. Ve lista de usuarios con estadísticas
3. Expande para ver detalle por KPI
4. Monitorea última actividad

---

## Base de Datos (Supabase)

### Tablas Principales

```sql
-- Perfiles de usuario
profiles (user_id, email, created_at, updated_at)

-- Asignación de permisos
view_assignments (user_id, email, permitted_views[], updated_at)

-- Resúmenes (por KPI, ej: kpi_margen_financiero_resumen)
kpi_*_resumen_* (
  id, owner_id, anio, mes, 
  [campos específicos del KPI],
  created_at, updated_at
)

-- Detalles (por KPI, ej: kpi_margen_financiero_detalle)
kpi_*_detalle_* (
  id, owner_id, anio, mes,
  [columnas del layout CSV],
  created_at
)
```

### Row Level Security (RLS)
Cada tabla de KPI tiene políticas que aseguran:
- Usuario solo ve sus propios registros (`owner_id = auth.uid()`)
- Administradores pueden ver todo (si tienen rol)

---

## Responsive Design

### Breakpoints

| Breakpoint | Valor | Uso |
|------------|-------|-----|
| `sm` | 640px | Móvil landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeño |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop grande |

### Comportamiento por Dispositivo

- **Mobile (<1024px)**: 
  - Sidebar oculto → FAB flotante para abrir
  - Grid de 1-2 columnas
  - TopBar simplificado

- **Desktop (≥1024px)**:
  - Sidebar siempre visible
  - Grid de 3-4 columnas
  - Contenido con más padding

---

## Conclusión

KPIs - Inteligencia de Negocios es una aplicación moderna, escalable y visualmente atractiva para la gestión de indicadores empresariales. Su arquitectura modular basada en configuración permite agregar nuevos KPIs con mínimo código, mientras que el sistema de permisos granular ofrece flexibilidad para diferentes tipos de usuarios.

**Versión del documento**: 1.0  
**Fecha**: Diciembre 2025
