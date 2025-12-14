// WMC Soluciones Metálicas - Google Sheets Configuration (PUBLIC)
// Configuración para GitHub Pages
// IMPORTANTE: Este archivo es público y está en el repositorio

export const GOOGLE_CONFIG = {
    // OAuth 2.0 Client ID - Configurado para metrik360.github.io
    CLIENT_ID: '582664242546-559ubl5mhefbudn4gn6tltu470ergprh.apps.googleusercontent.com',

    // API Key - Pública (solo lectura de Sheets API)
    API_KEY: 'AIzaSyB9NZZk6MWzlGyVB5yQVh0Q4qbKc6lUHTk',

    // ID del spreadsheet de Google Sheets
    SPREADSHEET_ID: '1s6rPZ_-sT3MB-LWKqG7-ErvO9E-ygpBgOy0HYuZfkkU',

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
