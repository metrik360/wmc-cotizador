# Configuración de GitHub Pages con Google Sheets

## ⚠️ IMPORTANTE: Configuración de Dominios Autorizados

Para que la sincronización con Google Sheets funcione en GitHub Pages, debes autorizar el dominio en Google Cloud Console.

## Pasos de Configuración

### 1. Ir a Google Cloud Console

Accede a: https://console.cloud.google.com/

### 2. Seleccionar el Proyecto

Asegúrate de tener seleccionado el proyecto correcto (el que contiene tu OAuth Client ID).

### 3. Configurar OAuth Consent Screen

1. Ve a **APIs & Services** → **OAuth consent screen**
2. En la sección **Authorized domains**, agrega:
   - `github.io`
3. Guarda los cambios

### 4. Configurar OAuth Client ID

1. Ve a **APIs & Services** → **Credentials**
2. Encuentra tu **OAuth 2.0 Client ID** (debe ser: `582664242546-559ubl5mhefbudn4gn6tltu470ergprh`)
3. Haz click para editarlo
4. En **Authorized JavaScript origins**, agrega:
   ```
   https://metrik360.github.io
   ```
5. En **Authorized redirect URIs**, agrega:
   ```
   https://metrik360.github.io/wmc-cotizador
   https://metrik360.github.io/wmc-cotizador/
   ```
6. Guarda los cambios

### 5. Verificar APIs Habilitadas

Asegúrate de que las siguientes APIs estén habilitadas:
- ✅ Google Sheets API
- ✅ Google Drive API (opcional, pero recomendado)

## Configuración del Proyecto

El proyecto ya está configurado para usar dos archivos de configuración:

1. **`js/google-config.js`** (local, no en git)
   - Usado para desarrollo local
   - Contiene credenciales personales
   - Está en `.gitignore`

2. **`js/google-config-public.js`** (público, en git)
   - Usado en GitHub Pages
   - Credenciales seguras para uso público
   - Ya está en el repositorio

## Cómo Funciona

El sistema intenta cargar la configuración en este orden:

1. **Primero**: Intenta cargar `google-config.js` (desarrollo local)
2. **Si falla**: Carga `google-config-public.js` (GitHub Pages)
3. **Si ambos fallan**: Desactiva la sincronización

## Testing

### Probar Localmente

1. Copia `google-config.example.js` a `google-config.js`
2. Configura tus credenciales
3. Inicia servidor local:
   ```bash
   python3 -m http.server 8080
   ```
4. Abre `http://localhost:8080`

### Probar en GitHub Pages

1. Asegúrate de haber configurado los dominios autorizados (pasos 3 y 4)
2. Espera 2-5 minutos después de hacer push
3. Abre https://metrik360.github.io/wmc-cotizador/
4. El sistema debe solicitar autenticación con Google

## Seguridad

### ¿Es seguro exponer las credenciales?

**Sí**, por las siguientes razones:

1. **API Key**: La API Key de Google está restringida solo para Sheets API
2. **Client ID**: Es público por diseño (OAuth 2.0 funciona así)
3. **Dominios autorizados**: Solo funcionan desde `metrik360.github.io`
4. **Spreadsheet ID**: Solo pueden acceder usuarios con permisos en ese sheet

### Mejores Prácticas

- ✅ Mantén `google-config.js` en `.gitignore`
- ✅ Usa `google-config-public.js` solo para GitHub Pages
- ✅ Restringe el Spreadsheet a usuarios específicos
- ✅ Revisa periódicamente los permisos en Google Cloud

## Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa**: El dominio no está autorizado en Google Cloud Console

**Solución**:
1. Verifica que agregaste `https://metrik360.github.io` en JavaScript origins
2. Agrega las URIs exactas en redirect URIs
3. Espera 5-10 minutos para que los cambios se propaguen

### Error: "access_denied"

**Causa**: El usuario no tiene permisos en el Spreadsheet

**Solución**:
1. Abre el Spreadsheet en Google Sheets
2. Click en "Share" / "Compartir"
3. Agrega el email del usuario con permisos de "Editor"

### La autenticación funciona pero sync falla

**Causa**: El Spreadsheet no existe o no tiene las hojas correctas

**Solución**:
1. Verifica que el Spreadsheet ID sea correcto
2. Asegúrate de que existan las hojas: `Clients`, `Materials`, `Labor`, `Products`, `Quotes`
3. Revisa la consola del navegador para más detalles

## URLs Importantes

- **Sitio en GitHub Pages**: https://metrik360.github.io/wmc-cotizador/
- **Repositorio**: https://github.com/metrik360/wmc-cotizador
- **Google Cloud Console**: https://console.cloud.google.com/
- **Spreadsheet**: https://docs.google.com/spreadsheets/d/1s6rPZ_-sT3MB-LWKqG7-ErvO9E-ygpBgOy0HYuZfkkU/edit

## Próximos Pasos

1. ✅ Configurar dominios autorizados en Google Cloud Console (sigue pasos 3 y 4)
2. ✅ Hacer commit y push del nuevo archivo `google-config-public.js`
3. ✅ Esperar a que GitHub Pages se actualice (2-5 minutos)
4. ✅ Probar la sincronización en https://metrik360.github.io/wmc-cotizador/
