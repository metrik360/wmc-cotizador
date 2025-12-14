// WMC Soluciones Metálicas - Google Sync Manager
// Sincronización bidireccional entre localStorage y Google Sheets

import { GoogleSheetsManager } from './google-sheets.js';

/**
 * Manager de sincronización offline-first
 */
export class SyncManager {
    constructor(spreadsheetId, sheetNames) {
        this.sheetsManager = new GoogleSheetsManager(spreadsheetId, sheetNames);
        this.syncQueue = this.loadSyncQueue();
        this.lastSyncTime = this.getLastSyncTime();
        this.isSyncing = false;
        this.syncCallbacks = {
            onStart: null,
            onSuccess: null,
            onError: null,
            onProgress: null
        };
    }

    /**
     * Registrar callbacks para eventos de sincronización
     */
    on(event, callback) {
        if (this.syncCallbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
            this.syncCallbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
        }
    }

    /**
     * Cargar cola de sincronización desde localStorage
     */
    loadSyncQueue() {
        const queue = localStorage.getItem('wmc-sync-queue');
        return queue ? JSON.parse(queue) : [];
    }

    /**
     * Guardar cola de sincronización a localStorage
     */
    saveSyncQueue() {
        localStorage.setItem('wmc-sync-queue', JSON.stringify(this.syncQueue));
    }

    /**
     * Obtener timestamp de última sincronización
     */
    getLastSyncTime() {
        const time = localStorage.getItem('wmc-last-sync-time');
        return time ? new Date(time) : null;
    }

    /**
     * Establecer timestamp de última sincronización
     */
    setLastSyncTime(time) {
        localStorage.setItem('wmc-last-sync-time', time.toISOString());
        this.lastSyncTime = time;
    }

    /**
     * Agregar operación a la cola de sincronización
     */
    queueOperation(operation) {
        this.syncQueue.push({
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...operation
        });
        this.saveSyncQueue();
        console.log('Operation queued:', operation.type, operation.dataType);
    }

    /**
     * Guardar datos en localStorage
     */
    saveToLocalStorage(dataType, data) {
        // El sistema usa una sola key 'wmc_data' con todo el appData
        const appDataStr = localStorage.getItem('wmc_data');
        let appData = appDataStr ? JSON.parse(appDataStr) : {
            version: '2.0',
            config: {},
            clients: {},
            materials: {},
            labor: {},
            products: {},
            quotes: {},
            metadata: {}
        };

        // Convertir array a objeto {id: item} si es necesario
        if (Array.isArray(data)) {
            const dataObj = {};
            data.forEach(item => {
                if (item.id) {
                    dataObj[item.id] = item;
                }
            });
            appData[dataType] = dataObj;
        } else {
            appData[dataType] = data;
        }

        // Actualizar timestamp
        appData.metadata = appData.metadata || {};
        appData.metadata.lastSync = new Date().toISOString();

        localStorage.setItem('wmc_data', JSON.stringify(appData));
    }

    /**
     * Cargar datos desde localStorage
     */
    loadFromLocalStorage(dataType) {
        // El sistema usa una sola key 'wmc_data' con todo el appData
        const appDataStr = localStorage.getItem('wmc_data');
        if (!appDataStr) return [];

        try {
            const appData = JSON.parse(appDataStr);
            const data = appData[dataType];

            // Convertir de objeto {id: item} a array [item]
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                return Object.values(data);
            }

            return data || [];
        } catch (error) {
            console.error(`Error loading ${dataType} from localStorage:`, error);
            return [];
        }
    }

    /**
     * Obtener tiempo de modificación local
     */
    getLocalModifiedTime(dataType) {
        const appDataStr = localStorage.getItem('wmc_data');
        if (!appDataStr) return null;

        try {
            const appData = JSON.parse(appDataStr);
            const time = appData.metadata?.lastSync;
            return time ? new Date(time) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Guardar ítem localmente y encolar para sincronización
     */
    async saveItem(dataType, item) {
        // Agregar/actualizar timestamp
        item.lastModified = new Date().toISOString();

        // Cargar datos existentes
        const existingData = this.loadFromLocalStorage(dataType);

        // Encontrar y actualizar o agregar nuevo
        const index = existingData.findIndex(i => i.id === item.id);
        if (index >= 0) {
            existingData[index] = item;
        } else {
            existingData.push(item);
        }

        // Guardar en localStorage
        this.saveToLocalStorage(dataType, existingData);

        // Encolar para sincronización
        this.queueOperation({
            type: 'upsert',
            dataType: dataType,
            item: item
        });

        // Intentar sincronizar inmediatamente si está online
        if (navigator.onLine) {
            this.sync();
        }

        return item;
    }

    /**
     * Eliminar ítem localmente y encolar para sincronización
     */
    async deleteItem(dataType, itemId) {
        // Cargar datos existentes
        const existingData = this.loadFromLocalStorage(dataType);

        // Remover ítem
        const filtered = existingData.filter(i => i.id !== itemId);

        // Guardar en localStorage
        this.saveToLocalStorage(dataType, filtered);

        // Encolar para sincronización
        this.queueOperation({
            type: 'delete',
            dataType: dataType,
            itemId: itemId
        });

        // Intentar sincronizar inmediatamente si está online
        if (navigator.onLine) {
            this.sync();
        }

        return true;
    }

    /**
     * Sincronización principal
     */
    async sync() {
        if (this.isSyncing) {
            console.log('Sync already in progress');
            return { success: false, message: 'Sync already in progress' };
        }

        if (!navigator.onLine) {
            console.log('Offline - sync queued');
            return { success: false, message: 'Offline - changes will sync when online' };
        }

        this.isSyncing = true;

        if (this.syncCallbacks.onStart) {
            this.syncCallbacks.onStart();
        }

        try {
            // Paso 1: Pull desde Google Sheets
            console.log('Pulling from Google Sheets...');
            if (this.syncCallbacks.onProgress) {
                this.syncCallbacks.onProgress('Descargando datos desde Google Sheets...');
            }

            const remoteData = await this.sheetsManager.readAll();

            // Paso 2: Resolver conflictos con datos locales
            console.log('Resolving conflicts...');
            if (this.syncCallbacks.onProgress) {
                this.syncCallbacks.onProgress('Resolviendo conflictos...');
            }

            const mergedData = this.mergeData(remoteData);

            // Paso 3: Aplicar operaciones encoladas
            console.log('Applying queued operations...');
            if (this.syncCallbacks.onProgress) {
                this.syncCallbacks.onProgress('Aplicando cambios locales...');
            }

            const updatedData = this.applyQueuedOperations(mergedData);

            // Paso 4: Push de vuelta a Google Sheets
            console.log('Pushing to Google Sheets...');
            if (this.syncCallbacks.onProgress) {
                this.syncCallbacks.onProgress('Subiendo cambios a Google Sheets...');
            }

            await this.sheetsManager.writeAll(updatedData);

            // Paso 5: Actualizar localStorage con datos mergeados
            console.log('Updating local storage...');
            this.saveToLocalStorage('clients', updatedData.clients);
            this.saveToLocalStorage('materials', updatedData.materials);
            this.saveToLocalStorage('labor', updatedData.labor);
            this.saveToLocalStorage('products', updatedData.products);
            this.saveToLocalStorage('quotes', updatedData.quotes);

            // Paso 6: Limpiar cola y actualizar tiempo de sync
            this.syncQueue = [];
            this.saveSyncQueue();
            this.setLastSyncTime(new Date());

            console.log('Sync completed successfully');

            if (this.syncCallbacks.onSuccess) {
                this.syncCallbacks.onSuccess({
                    timestamp: new Date(),
                    itemsSync: this.calculateTotalItems(updatedData)
                });
            }

            return {
                success: true,
                timestamp: new Date(),
                data: updatedData
            };

        } catch (error) {
            console.error('Sync failed:', error);

            if (this.syncCallbacks.onError) {
                this.syncCallbacks.onError(error);
            }

            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Merge de datos remotos con datos locales (Last-Write-Wins)
     */
    mergeData(remoteData) {
        const dataTypes = ['clients', 'materials', 'labor', 'products', 'quotes'];
        const merged = {};

        dataTypes.forEach(dataType => {
            const localData = this.loadFromLocalStorage(dataType);
            const remoteItems = remoteData[dataType] || [];

            // Crear un mapa para búsqueda eficiente
            const localMap = new Map(localData.map(item => [item.id, item]));
            const mergedItems = [];

            // Procesar ítems remotos
            remoteItems.forEach(remoteItem => {
                const localItem = localMap.get(remoteItem.id);

                if (!localItem) {
                    // Nuevo ítem desde remoto
                    mergedItems.push(remoteItem);
                } else {
                    // Resolución de conflictos: usar timestamp
                    const remoteTime = new Date(remoteItem.lastModified || 0);
                    const localTime = new Date(localItem.lastModified || 0);

                    if (remoteTime > localTime) {
                        mergedItems.push(remoteItem);
                        console.log(`Conflict resolved for ${dataType} ${remoteItem.id}: using remote (newer)`);
                    } else {
                        mergedItems.push(localItem);
                        console.log(`Conflict resolved for ${dataType} ${localItem.id}: using local (newer)`);
                    }

                    // Remover del mapa local
                    localMap.delete(remoteItem.id);
                }
            });

            // Agregar ítems locales restantes (no en remoto)
            localMap.forEach(item => {
                mergedItems.push(item);
            });

            merged[dataType] = mergedItems;
        });

        return merged;
    }

    /**
     * Aplicar operaciones encoladas a datos mergeados
     */
    applyQueuedOperations(data) {
        this.syncQueue.forEach(operation => {
            const dataType = operation.dataType;

            if (operation.type === 'upsert') {
                const index = data[dataType].findIndex(i => i.id === operation.item.id);
                if (index >= 0) {
                    data[dataType][index] = operation.item;
                } else {
                    data[dataType].push(operation.item);
                }
            } else if (operation.type === 'delete') {
                data[dataType] = data[dataType].filter(i => i.id !== operation.itemId);
            }
        });

        return data;
    }

    /**
     * Pull inicial desde Google Sheets (primera sincronización)
     */
    async initialPull() {
        console.log('Performing initial pull from Google Sheets...');

        try {
            const remoteData = await this.sheetsManager.readAll();

            // Guardar todo en localStorage
            this.saveToLocalStorage('clients', remoteData.clients);
            this.saveToLocalStorage('materials', remoteData.materials);
            this.saveToLocalStorage('labor', remoteData.labor);
            this.saveToLocalStorage('products', remoteData.products);
            this.saveToLocalStorage('quotes', remoteData.quotes);

            this.setLastSyncTime(new Date());
            console.log('Initial pull completed');

            return { success: true, data: remoteData };
        } catch (error) {
            console.error('Initial pull failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Push inicial a Google Sheets (migrar datos locales)
     */
    async initialPush() {
        console.log('Performing initial push to Google Sheets...');

        try {
            const localData = {
                clients: this.loadFromLocalStorage('clients'),
                materials: this.loadFromLocalStorage('materials'),
                labor: this.loadFromLocalStorage('labor'),
                products: this.loadFromLocalStorage('products'),
                quotes: this.loadFromLocalStorage('quotes')
            };

            // Agregar timestamps si no existen
            ['clients', 'materials', 'labor', 'products', 'quotes'].forEach(type => {
                localData[type] = localData[type].map(item => ({
                    ...item,
                    lastModified: item.lastModified || new Date().toISOString()
                }));
            });

            await this.sheetsManager.writeAll(localData);

            this.setLastSyncTime(new Date());
            console.log('Initial push completed');

            return { success: true };
        } catch (error) {
            console.error('Initial push failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calcular total de ítems en los datos
     */
    calculateTotalItems(data) {
        return (data.clients?.length || 0) +
               (data.materials?.length || 0) +
               (data.labor?.length || 0) +
               (data.products?.length || 0) +
               (data.quotes?.length || 0);
    }

    /**
     * Generar ID único
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtener estado de sincronización
     */
    getStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            pendingOperations: this.syncQueue.length,
            isOnline: navigator.onLine
        };
    }
}

/**
 * Configurar sincronización automática
 */
export function setupAutoSync(syncManager, intervalMinutes = 5) {
    // Sincronizar al volver online
    window.addEventListener('online', () => {
        console.log('Back online - syncing...');
        syncManager.sync();
    });

    // Sincronización periódica
    setInterval(() => {
        if (navigator.onLine && !syncManager.isSyncing) {
            syncManager.sync();
        }
    }, intervalMinutes * 60 * 1000);

    // Sincronizar antes de cerrar página (si hay cambios pendientes)
    window.addEventListener('beforeunload', () => {
        if (navigator.onLine && syncManager.syncQueue.length > 0) {
            // Intentar sincronizar pero no bloquear el cierre
            syncManager.sync();
        }
    });

    console.log(`Auto-sync enabled (interval: ${intervalMinutes} minutes)`);
}
