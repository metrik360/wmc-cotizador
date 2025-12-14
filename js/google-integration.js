// WMC Soluciones Metálicas - Google Sheets Integration Main
// Integración completa con UI y manejo de eventos

// Nota: Este archivo debe importarse como módulo type="module"
// o convertirse a vanilla JS sin imports

// Variables globales
let syncManager = null;
let isGoogleEnabled = false;
let selectedSyncOption = null;

/**
 * Inicializar Google Sheets (llamar al cargar la aplicación)
 */
async function initializeGoogleIntegration() {
    try {
        // Intentar cargar configuración
        const configResponse = await fetch('/js/google-config.js');

        if (!configResponse.ok) {
            console.log('Google config not found - sync disabled');
            return false;
        }

        // Importar configuración dinámicamente
        const { GOOGLE_CONFIG } = await import('./google-config.js');
        const { initGoogleAuth, isReady } = await import('./google-auth.js');
        const { SyncManager, setupAutoSync } = await import('./google-sync.js');

        // Inicializar autenticación
        await initGoogleAuth(
            GOOGLE_CONFIG,
            onAuthSuccess,
            onAuthFailure
        );

        // Crear sync manager
        syncManager = new SyncManager(
            GOOGLE_CONFIG.SPREADSHEET_ID,
            GOOGLE_CONFIG.SHEET_NAMES
        );

        // Configurar callbacks
        syncManager.on('start', onSyncStart);
        syncManager.on('success', onSyncSuccess);
        syncManager.on('error', onSyncError);
        syncManager.on('progress', onSyncProgress);

        // Verificar si ya está autenticado
        const { isAuthenticated, requestAuth } = await import('./google-auth.js');
        if (isAuthenticated()) {
            onAuthSuccess();
        } else {
            // Solicitar autenticación automáticamente al inicio
            console.log('Requesting automatic authentication...');
            showToast('Conectando con Google Sheets...', 'info');
            requestAuth('');
        }

        isGoogleEnabled = true;
        console.log('Google Sheets integration enabled');
        return true;

    } catch (error) {
        console.error('Failed to initialize Google integration:', error);
        return false;
    }
}

/**
 * Callback: autenticación exitosa
 */
async function onAuthSuccess() {
    console.log('Auth successful');

    // Actualizar UI
    updateAuthUI(true);

    // Mostrar opciones de sync si es primera vez
    const lastSync = syncManager.getLastSyncTime();
    if (!lastSync) {
        document.getElementById('google-sync-options').style.display = 'block';
        document.getElementById('google-initialize-btn').style.display = 'block';
    } else {
        // Ya está configurado - cerrar modal y sincronizar
        closeModal('modal-google-setup');
        await syncManager.sync();

        // Importar y configurar auto-sync
        const { setupAutoSync } = await import('./google-sync.js');
        setupAutoSync(syncManager, 5); // Sync cada 5 minutos
    }

    // Mostrar status en sidebar
    document.getElementById('sync-status').style.display = 'block';
    updateSyncStatusUI(syncManager.getStatus());

    // Mostrar mensaje de conexión exitosa
    // Nota: getUserInfo() está bloqueado por Google, por lo que usamos mensaje genérico
    const emailElement = document.getElementById('google-user-email');
    if (emailElement) {
        emailElement.textContent = 'Sincronización activa';
    }
}

/**
 * Callback: fallo de autenticación
 */
function onAuthFailure(error) {
    console.error('Auth failed:', error);
    showToast('Error al autenticar con Google: ' + error, 'error');
    updateAuthUI(false);
}

/**
 * Callback: inicio de sincronización
 */
function onSyncStart() {
    console.log('Sync started');
    const statusDiv = document.getElementById('sync-status');
    if (statusDiv) {
        statusDiv.className = 'sync-status syncing';
        document.getElementById('sync-status-text').textContent = 'Sincronizando...';
    }
}

/**
 * Callback: sincronización exitosa
 */
function onSyncSuccess(data) {
    console.log('Sync successful:', data);

    const statusDiv = document.getElementById('sync-status');
    if (statusDiv) {
        statusDiv.className = 'sync-status success';
        document.getElementById('sync-status-text').textContent = 'Sincronizado';

        const details = document.getElementById('sync-details');
        if (details) {
            const now = new Date();
            details.textContent = `Última sync: ${now.toLocaleTimeString()} - ${data.itemsSync || 0} items`;
        }
    }

    showToast('Datos sincronizados exitosamente', 'success');

    // Recargar vistas si es necesario
    const currentView = document.querySelector('.view.active');
    if (currentView) {
        const viewName = currentView.id.replace('view-', '');
        switchView(viewName); // Recargar vista actual
    }
}

/**
 * Callback: error de sincronización
 */
function onSyncError(error) {
    console.error('Sync error:', error);

    const statusDiv = document.getElementById('sync-status');
    if (statusDiv) {
        statusDiv.className = 'sync-status error';
        document.getElementById('sync-status-text').textContent = 'Error al sincronizar';

        const details = document.getElementById('sync-details');
        if (details) {
            details.textContent = error.message || 'Error desconocido';
        }
    }

    showToast('Error al sincronizar: ' + error.message, 'error');
}

/**
 * Callback: progreso de sincronización
 */
function onSyncProgress(message) {
    console.log('Sync progress:', message);

    const details = document.getElementById('sync-details');
    if (details) {
        details.textContent = message;
    }
}

/**
 * Actualizar UI de autenticación
 */
function updateAuthUI(isAuthenticated) {
    document.getElementById('google-not-authenticated').style.display = isAuthenticated ? 'none' : 'block';
    document.getElementById('google-authenticated').style.display = isAuthenticated ? 'block' : 'none';
}

/**
 * Actualizar UI de estado de sincronización
 */
function updateSyncStatusUI(status) {
    const statusDiv = document.getElementById('sync-status');
    if (!statusDiv) return;

    // Actualizar clase según estado
    if (status.isSyncing) {
        statusDiv.className = 'sync-status syncing';
        document.getElementById('sync-status-text').textContent = 'Sincronizando...';
    } else if (!status.isOnline) {
        statusDiv.className = 'sync-status';
        document.getElementById('sync-status-text').textContent = 'Sin conexión';
    } else if (status.pendingOperations > 0) {
        statusDiv.className = 'sync-status';
        document.getElementById('sync-status-text').textContent = `${status.pendingOperations} cambios pendientes`;
    } else {
        statusDiv.className = 'sync-status success';
        document.getElementById('sync-status-text').textContent = 'Sincronizado';
    }

    // Actualizar detalles
    const details = document.getElementById('sync-details');
    if (details && status.lastSyncTime) {
        const time = new Date(status.lastSyncTime);
        details.textContent = `Última sync: ${time.toLocaleTimeString()}`;
    }
}

/**
 * Abrir modal de configuración de Google Sheets
 */
function openGoogleSetup() {
    openModal('modal-google-setup');
}

/**
 * Iniciar sesión con Google
 */
async function signInGoogle() {
    if (!isGoogleEnabled) {
        showToast('Google Sheets no está configurado', 'error');
        return;
    }

    try {
        const { requestAuth } = await import('./google-auth.js');
        requestAuth('consent');
    } catch (error) {
        console.error('Sign in error:', error);
        showToast('Error al iniciar sesión: ' + error.message, 'error');
    }
}

/**
 * Cerrar sesión con Google
 */
async function signOutGoogle() {
    if (!isGoogleEnabled) return;

    try {
        const { signOut } = await import('./google-auth.js');
        signOut();

        updateAuthUI(false);
        document.getElementById('sync-status').style.display = 'none';

        showToast('Sesión cerrada', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Error al cerrar sesión: ' + error.message, 'error');
    }
}

/**
 * Seleccionar opción de sincronización inicial
 */
function selectSyncOption(option) {
    selectedSyncOption = option;

    // Actualizar UI
    document.querySelectorAll('[id^="option-"]').forEach(el => {
        el.style.borderColor = 'var(--border)';
    });

    document.getElementById(`option-${option}`).style.borderColor = 'var(--accent)';
    document.querySelector(`input[value="${option}"]`).checked = true;

    document.getElementById('google-initialize-btn').style.display = 'block';
}

/**
 * Inicializar sincronización con Google Sheets
 */
async function initializeGoogleSync() {
    if (!selectedSyncOption) {
        showToast('Selecciona una opción de sincronización', 'error');
        return;
    }

    if (!syncManager) {
        showToast('Sync manager no inicializado', 'error');
        return;
    }

    showLoading('Inicializando sincronización...');

    try {
        if (selectedSyncOption === 'pull') {
            // Descargar desde Google Sheets
            const result = await syncManager.initialPull();
            if (result.success) {
                showToast('Datos descargados exitosamente', 'success');

                // Recargar la aplicación con los nuevos datos
                location.reload();
            } else {
                showToast('Error al descargar datos: ' + result.error, 'error');
            }
        } else if (selectedSyncOption === 'push') {
            // Subir a Google Sheets
            const result = await syncManager.initialPush();
            if (result.success) {
                showToast('Datos subidos exitosamente', 'success');
            } else {
                showToast('Error al subir datos: ' + result.error, 'error');
            }
        }

        // Configurar auto-sync
        const { setupAutoSync } = await import('./google-sync.js');
        setupAutoSync(syncManager, 5);

        // Cerrar modal
        closeModal('modal-google-setup');

        // Mostrar status
        document.getElementById('sync-status').style.display = 'block';
        updateSyncStatusUI(syncManager.getStatus());

    } catch (error) {
        console.error('Initialize sync error:', error);
        showToast('Error al inicializar: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Sincronización manual
 */
async function manualSync() {
    if (!syncManager) {
        showToast('Sync no configurado', 'error');
        return;
    }

    const result = await syncManager.sync();
    if (!result.success && result.message) {
        showToast(result.message, 'info');
    }
}

/**
 * Integrar con funciones de data.js existentes
 * Interceptar operaciones de CRUD para encolar sincronización
 */
function integrateWithDataModule() {
    if (!syncManager) return;

    // Verificar si ya está integrado
    if (window._googleIntegrationEnabled) {
        console.log('Data module already integrated');
        return;
    }

    // Interceptar saveClient
    const originalSaveClient = window.saveClient;
    if (originalSaveClient) {
        window.saveClient = function(client) {
            const result = originalSaveClient(client);
            if (result && syncManager) {
                syncManager.saveItem('clients', { ...client, id: result });
            }
            return result;
        };
    }

    // Interceptar saveMaterial
    const originalSaveMaterial = window.saveMaterial;
    if (originalSaveMaterial) {
        window.saveMaterial = function(material) {
            const result = originalSaveMaterial(material);
            if (result && syncManager) {
                syncManager.saveItem('materials', { ...material, id: result });
            }
            return result;
        };
    }

    // Interceptar saveLabor
    const originalSaveLabor = window.saveLabor;
    if (originalSaveLabor) {
        window.saveLabor = function(labor) {
            const result = originalSaveLabor(labor);
            if (result && syncManager) {
                syncManager.saveItem('labor', { ...labor, id: result });
            }
            return result;
        };
    }

    // Interceptar saveProduct
    const originalSaveProduct = window.saveProduct;
    if (originalSaveProduct) {
        window.saveProduct = function(product) {
            const result = originalSaveProduct(product);
            if (result && syncManager) {
                syncManager.saveItem('products', { ...product, id: result });
            }
            return result;
        };
    }

    // Interceptar saveQuote
    const originalSaveQuote = window.saveQuote;
    if (originalSaveQuote) {
        window.saveQuote = function(quote) {
            const result = originalSaveQuote(quote);
            if (result && syncManager) {
                syncManager.saveItem('quotes', { ...quote, id: result });
            }
            return result;
        };
    }

    // Interceptar funciones de delete
    ['deleteClient', 'deleteMaterial', 'deleteLabor', 'deleteProduct', 'deleteQuote'].forEach(funcName => {
        const original = window[funcName];
        if (original) {
            const dataType = funcName.replace('delete', '').toLowerCase() + 's';
            window[funcName] = function(id) {
                const result = original(id);
                if (result && syncManager) {
                    syncManager.deleteItem(dataType, id);
                }
                return result;
            };
        }
    });

    // Marcar como integrado
    window._googleIntegrationEnabled = true;
    console.log('Data module integration complete');
}

// Exponer funciones globalmente
window.openGoogleSetup = openGoogleSetup;
window.signInGoogle = signInGoogle;
window.signOutGoogle = signOutGoogle;
window.selectSyncOption = selectSyncOption;
window.initializeGoogleSync = initializeGoogleSync;
window.manualSync = manualSync;

// Inicializar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeGoogleIntegration().then(success => {
            if (success) {
                integrateWithDataModule();
            }
        });
    });
} else {
    initializeGoogleIntegration().then(success => {
        if (success) {
            integrateWithDataModule();
        }
    });
}
