// WMC Soluciones Metálicas - Google Authentication Module
// Manejo de autenticación OAuth 2.0 con Google

// Importar configuración (será cargado dinámicamente)
let GOOGLE_CONFIG;

// Estado de inicialización
let gapiInited = false;
let gisInited = false;
let tokenClient = null;

// Callbacks
let onAuthSuccessCallback = null;
let onAuthFailureCallback = null;

/**
 * Inicializar el módulo de autenticación
 * @param {Object} config - Configuración de Google
 * @param {Function} onSuccess - Callback cuando auth es exitoso
 * @param {Function} onFailure - Callback cuando auth falla
 */
export async function initGoogleAuth(config, onSuccess, onFailure) {
    GOOGLE_CONFIG = config;
    onAuthSuccessCallback = onSuccess;
    onAuthFailureCallback = onFailure;

    try {
        // Cargar Google API Client Library
        await loadGapi();

        // Cargar Google Identity Services
        await loadGis();

        console.log('Google Auth initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        if (onAuthFailureCallback) {
            onAuthFailureCallback(error);
        }
        return false;
    }
}

/**
 * Cargar Google API Client Library (gapi)
 */
function loadGapi() {
    return new Promise((resolve, reject) => {
        // Verificar si ya está cargado
        if (window.gapi) {
            initializeGapiClient().then(resolve).catch(reject);
            return;
        }

        // Cargar script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('client', async () => {
                try {
                    await initializeGapiClient();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        };
        script.onerror = () => reject(new Error('Failed to load gapi'));
        document.head.appendChild(script);
    });
}

/**
 * Inicializar el cliente gapi
 */
async function initializeGapiClient() {
    await window.gapi.client.init({
        apiKey: GOOGLE_CONFIG.API_KEY,
        discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
    });
    gapiInited = true;
    console.log('gapi client initialized');
}

/**
 * Cargar Google Identity Services (GIS)
 */
function loadGis() {
    return new Promise((resolve, reject) => {
        // Verificar si ya está cargado
        if (window.google?.accounts?.oauth2) {
            initializeGisClient();
            resolve();
            return;
        }

        // Cargar script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            initializeGisClient();
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load GIS'));
        document.head.appendChild(script);
    });
}

/**
 * Inicializar cliente GIS (OAuth token)
 */
function initializeGisClient() {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        scope: GOOGLE_CONFIG.SCOPES,
        callback: handleAuthResponse,
    });
    gisInited = true;
    console.log('GIS client initialized');
}

/**
 * Manejar respuesta de autenticación
 */
function handleAuthResponse(response) {
    if (response.error !== undefined) {
        console.error('Auth error:', response);
        if (onAuthFailureCallback) {
            onAuthFailureCallback(response.error);
        }
        return;
    }

    console.log('Authentication successful');
    if (onAuthSuccessCallback) {
        onAuthSuccessCallback();
    }
}

/**
 * Solicitar autenticación al usuario
 * @param {boolean} prompt - Si mostrar selector de cuenta ('consent' o '')
 */
export function requestAuth(prompt = 'consent') {
    if (!gapiInited || !gisInited) {
        console.error('Auth not initialized');
        return;
    }

    const token = window.gapi.client.getToken();

    if (token === null) {
        // Primera vez - pedir consentimiento
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Ya autenticado - solo refrescar si es necesario
        tokenClient.requestAccessToken({ prompt: prompt });
    }
}

/**
 * Cerrar sesión
 */
export function signOut() {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            console.log('Token revoked');
        });
        window.gapi.client.setToken('');
    }
}

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} - true si está autenticado
 */
export function isAuthenticated() {
    if (!window.gapi?.client) return false;
    const token = window.gapi.client.getToken();
    return token !== null;
}

/**
 * Obtener información del usuario autenticado
 * @returns {Promise<Object>} - Información del usuario
 */
export async function getUserInfo() {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated');
    }

    try {
        const response = await window.gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v1/userinfo',
        });
        return response.result;
    } catch (error) {
        console.error('Failed to get user info:', error);
        throw error;
    }
}

/**
 * Verificar si las bibliotecas están inicializadas
 * @returns {boolean}
 */
export function isReady() {
    return gapiInited && gisInited;
}
