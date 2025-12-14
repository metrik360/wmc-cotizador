# WMC Soluciones Metálicas - Sistema de Cotización

Sistema web para gestión de cotizaciones de productos y servicios metálicos, con sincronización automática a Google Sheets.

## Características Principales

- ✅ **Gestión de Catálogos**: Clientes, materiales, mano de obra
- ✅ **Productos y Servicios**: Creación de productos con materiales y mano de obra
- ✅ **Cotizaciones**: Sistema completo con AIU (Administración, Imprevistos, Utilidad)
- ✅ **Generación de PDF**: Exportación profesional con logos WMC y MéTRIK
- ✅ **Sincronización Google Sheets**: Backup automático en la nube (opcional)
- ✅ **Modo Offline**: Funciona completamente sin internet
- ✅ **Responsive**: Optimizado para desktop

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript Vanilla (ES6+)
- **Storage**: localStorage + Google Sheets (opcional)
- **PDF**: html2pdf.js
- **API**: Google Sheets API v4
- **Autenticación**: OAuth 2.0

## Inicio Rápido

### Opción 1: Sin Google Sheets (Solo local)

1. Abre `index.html` directamente en tu navegador
2. Los datos se guardan automáticamente en localStorage
3. ¡Listo para usar!

### Opción 2: Con Google Sheets (Recomendado)

1. **Lee la [Guía Completa de Configuración](GOOGLE_SHEETS_SETUP.md)** 📖
2. Configura tus credenciales en `js/google-config.js`
3. Inicia un servidor local:
   ```bash
   python3 -m http.server 8080
   ```
4. Abre `http://localhost:8080`
5. Conecta tu cuenta de Google
6. ¡Tus datos se sincronizarán automáticamente!

## Sincronización con Google Sheets

La integración con Google Sheets te permite:

- **Backup automático** en la nube
- **Acceso desde múltiples dispositivos**
- **Colaboración** en tiempo real
- **Modo offline-first** con sincronización automática
- **Resolución de conflictos** inteligente

### Archivos de la Integración

- `js/google-config.example.js` - Plantilla de configuración
- `js/google-config.js` - ⚠️ TU CONFIGURACIÓN (no en git)
- `js/google-auth.js` - Autenticación OAuth 2.0
- `js/google-sheets.js` - Operaciones con Sheets API
- `js/google-sync.js` - Sincronización bidireccional
- `js/google-integration.js` - Integración completa con UI
- `GOOGLE_SHEETS_SETUP.md` - Guía paso a paso

## Resumen del Proyecto

Sistema MVP de cotización para WMC Soluciones Metálicas, empresa colombiana de estructuras metálicas y campamentos itinerantes para obras civiles.

**Estado actual:** Prototipo HTML incompleto - requiere completar el JavaScript.

## Contexto del Negocio

| Aspecto | Detalle |
|---------|---------|
| Empresa | WMC Soluciones Metálicas |
| Ubicación | Bogotá, Colombia |
| Giro | Fabricación de estructuras metálicas y campamentos itinerantes |
| Clientes | Constructoras (Prodesa, Constructora Bolívar, Amarilo, etc.) |
| Volumen | 5-7 cotizaciones/mes |
| Usuario | Dueño único (escalable a equipo) |

## Arquitectura

### Plataforma objetivo
- **MVP actual:** HTML + JavaScript + localStorage
- **Producción futura:** Google Sheets (base de datos) + Apps Script (backend)

### Módulos

1. **Dashboard** - Estadísticas y cotizaciones recientes
2. **Cotizaciones** - CRUD completo, búsqueda, filtros
3. **Clientes** - Catálogo de clientes
4. **Materiales** - Catálogo con precios
5. **Mano de Obra** - Actividades de fabricación e instalación
6. **Productos** - Productos estándar preconfigurados (futuro)
7. **Configuración** - AIU, márgenes, observaciones por defecto

## Modelo de Datos

### Cotización (estructura principal)

```javascript
{
  id: Number,           // Timestamp único
  number: String,       // "COT-2025-001"
  clientId: Number,     // FK a cliente
  project: String,      // Nombre del proyecto
  date: String,         // ISO date
  status: String,       // "pending" | "approved" | "rejected"
  
  // Líneas de detalle
  materials: [{
    materialId: Number,
    desc: String,
    qty: Number,
    unit: String,
    price: Number
  }],
  laborFab: [{          // Mano de obra fabricación
    laborId: Number,
    desc: String,
    qty: Number,
    unit: String,
    price: Number
  }],
  laborInst: [{         // Mano de obra instalación
    laborId: Number,
    desc: String,
    qty: Number,
    unit: String,
    price: Number
  }],
  
  // Márgenes y AIU
  marginSupply: Number,     // % margen suministro (default 30)
  marginInstall: Number,    // % margen instalación (default 45)
  aiuAdmin: Number,         // % administración (default 7)
  aiuImprevistos: Number,   // % imprevistos (default 7)
  aiuUtilidad: Number,      // % utilidad (default 5)
  
  // Totales calculados
  supplyCost: Number,       // Costo directo suministro
  supplyTotal: Number,      // Con margen
  supplyIva: Number,        // IVA 19%
  supplyFinal: Number,      // Total suministro
  
  installCost: Number,      // Costo directo instalación
  installTotal: Number,     // Con margen
  installAiu: Number,       // AIU total
  installIva: Number,       // IVA sobre utilidad
  installFinal: Number,     // Total instalación
  
  grandTotal: Number,       // supplyFinal + installFinal
  
  observations: String      // Texto de condiciones
}
```

### Cliente

```javascript
{
  id: Number,
  name: String,       // Empresa
  nit: String,        // "800.200.598-2"
  contact: String,    // Nombre contacto
  phone: String,
  email: String,
  city: String
}
```

### Material

```javascript
{
  id: Number,
  code: String,       // "MAT-001"
  desc: String,       // "COLUMNAS 70 X 70 2.5 MM"
  unit: String,       // "M" | "UND" | "M2" | "KG"
  price: Number       // Precio unitario sin IVA
}
```

### Mano de Obra

```javascript
{
  id: Number,
  code: String,       // "MO-001"
  desc: String,       // "CORTE TUBERIA"
  type: String,       // "fabricacion" | "instalacion"
  unit: String,       // "JOR" | "M2" | "UND"
  cost: Number        // Costo base (default 25000 COP/jornal)
}
```

### Configuración

```javascript
{
  admin: 7,                    // % Administración
  imprevistos: 7,              // % Imprevistos
  utilidad: 5,                 // % Utilidad
  iva: 19,                     // % IVA Colombia
  vigencia: 20,                // Días validez cotización
  margenSuministro: 30,        // % margen default suministro
  margenInstalacion: 45,       // % margen default instalación
  consecutivo: 1,              // Último consecutivo usado
  observaciones: String        // Texto por defecto (ver abajo)
}
```

## Fórmulas de Cálculo

### Suministro
```
Costo Directo = Σ(materiales) + Σ(mano obra fabricación)
Precio Venta = Costo Directo / (1 - margen%)
IVA = Precio Venta * 19%
Total Suministro = Precio Venta + IVA
```

### Instalación (con AIU)
```
Costo Directo = Σ(mano obra instalación)
Precio Base = Costo Directo / (1 - margen%)
Subtotal = Precio Base
Administración = Subtotal * admin%
Imprevistos = Subtotal * imprevistos%
Utilidad = Subtotal * utilidad%
IVA = Utilidad * 19%  // Solo sobre utilidad
Total Instalación = Subtotal + Adm + Imp + Util + IVA
```

### Total Oferta
```
Total Oferta = Total Suministro + Total Instalación
```

## Observaciones por Defecto

```
La instalación no incluye trabajos de obra civil, acometidas eléctricas para la conexión de Equipos, o adicionales de material,transporte, u otro concepto diferente al mencionado en esta cotización.
El proyecto debe suministrar punto electrico de 110 V y 220 V a menos de 50 metros de la losa donde se instalara el campamento.
El proyecto suministra una losa en concreto pulida con espesor por lo menos 15 cm y un subre ancho al perimetro del campamento (12mx 6m), de 30 cm.  Es de vital que la placa no tenga desnivel debido a que la produccion de las piezas se hace a medida en taller.
El proyecto debe suministrar el servicio de vigilancia en el proyecto.
VALIDEZ OFERTA: 20 DIAS.
TIEMPO DE ENTREGA: 30 DÍAS UNA VEZ SE TENGA ORDEN DE COMPRA.
```

## Funcionalidades Requeridas

### Completadas (UI)
- [x] Layout con sidebar y navegación
- [x] Dashboard con estadísticas
- [x] Vista de cotizaciones con tabla
- [x] Modal de nueva/editar cotización
- [x] Tabs suministro/instalación
- [x] Line items para materiales y mano de obra
- [x] Cálculo de totales en tiempo real
- [x] Modales para CRUD de clientes, materiales, mano de obra
- [x] Dropdown de acciones (ver, editar, duplicar, eliminar)
- [x] Vista de configuración

### Pendientes (JavaScript)
- [ ] Completar función `addLaborLine()` (cortada)
- [ ] Funciones `onMaterialSelect()` y `onLaborSelect()`
- [ ] Función `calculateTotals()` completa
- [ ] Función `saveQuote()`
- [ ] Funciones `getQuoteLines()` para extraer datos del DOM
- [ ] Función `generateQuoteNumber()` 
- [ ] Funciones CRUD de clientes, materiales, mano de obra
- [ ] Render de tablas (clientes, materiales, mano de obra)
- [ ] Sistema de tabs en modal
- [ ] Autocompletado de clientes
- [ ] Vista previa PDF (resumen cliente + detalle interno)
- [ ] Exportar PDF (usar html2pdf o similar)
- [ ] Funciones auxiliares: `formatCurrency()`, `formatDate()`
- [ ] Event listeners para navegación
- [ ] Inicialización al cargar página

## Archivos del Proyecto

```
wmc-cotizador/
├── index.html      # Archivo principal (UI + JS incompleto)
├── README.md       # Esta documentación
└── (futuro)
    ├── styles.css  # Extraer CSS
    └── app.js      # Extraer JavaScript
```

## Instrucciones para Continuar

1. **Abrir** `index.html` y localizar el `<script>` al final
2. **Completar** la función `addLaborLine()` que quedó cortada
3. **Implementar** las funciones listadas en "Pendientes"
4. **Probar** en navegador con las siguientes acciones:
   - Crear cliente
   - Crear material
   - Crear actividad de mano de obra
   - Crear cotización completa
   - Verificar cálculos
   - Duplicar cotización
   - Exportar PDF

## Datos de Prueba Incluidos

El código incluye `loadSampleData()` que carga:
- 3 clientes de ejemplo
- 15 materiales típicos de estructura metálica
- 12 actividades de mano de obra (6 fabricación + 6 instalación)

## Formato de Número de Cotización

`COT-YYYY-NNN` donde:
- `YYYY` = Año actual
- `NNN` = Consecutivo con padding de 3 dígitos

Ejemplo: `COT-2025-001`

## Stack Tecnológico

- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript
- **Almacenamiento:** localStorage (key: `wmc_data`)
- **Fuentes:** DM Sans (UI) + JetBrains Mono (números)
- **Tema:** Dark mode con acentos naranjas (#f97316)
- **PDF:** Implementar con html2pdf.js o jsPDF

## Referencia Visual

El diseño está inspirado en dashboards modernos estilo Vercel/Linear:
- Fondo oscuro (#0a0a0b)
- Bordes sutiles (#2a2a2d)
- Acento naranja (#f97316)
- Tipografía limpia sin serif
- Espaciado generoso
- Animaciones sutiles en hover

## Contacto/Contexto

Este MVP es para un amigo del usuario Mauricio (COO de AutoMAS). La empresa WMC Soluciones Metálicas necesita optimizar su proceso de cotización que actualmente maneja en Excel con alto componente manual.

El objetivo es migrar eventualmente a Google Sheets + Apps Script para producción.
