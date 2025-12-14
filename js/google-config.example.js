// WMC Soluciones Metálicas - Google Sheets Configuration (EXAMPLE)
// IMPORTANTE: Copiar este archivo como 'google-config.js' y configurar con tus credenciales reales
// NO subir google-config.js a GitHub (ya está en .gitignore)

export const GOOGLE_CONFIG = {
    // OAuth 2.0 Client ID - Obtener de Google Cloud Console
    CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',

    // API Key - Obtener de Google Cloud Console
    API_KEY: 'YOUR_API_KEY_HERE',

    // ID del spreadsheet de Google Sheets
    // Se obtiene de la URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',

    // Discovery doc para Google Sheets API v4
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',

    // Permisos necesarios (full access para lectura y escritura)
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',

    // Configuración de hojas (nombres de las pestañas en el spreadsheet)
    SHEET_NAMES: {
        clients: 'Clients',
        materials: 'Materials',
        labor: 'Labor',
        products: 'Products',
        quotes: 'Quotes'
    }
};
