// WMC Soluciones Metálicas - Google Sheets Manager
// Operaciones CRUD con Google Sheets API v4

/**
 * Clase para manejar operaciones con Google Sheets
 */
export class GoogleSheetsManager {
    constructor(spreadsheetId, sheetNames) {
        this.spreadsheetId = spreadsheetId;
        this.sheetNames = sheetNames;
        this.backoff = new ExponentialBackoff();
    }

    /**
     * Leer todos los datos de todas las hojas
     * @returns {Promise<Object>} - Datos organizados por tipo
     */
    async readAll() {
        const ranges = [
            `${this.sheetNames.clients}!A2:Z`,
            `${this.sheetNames.materials}!A2:Z`,
            `${this.sheetNames.labor}!A2:Z`,
            `${this.sheetNames.products}!A2:Z`,
            `${this.sheetNames.quotes}!A2:Z`
        ];

        try {
            const response = await this.backoff.execute(async () => {
                return await gapi.client.sheets.spreadsheets.values.batchGet({
                    spreadsheetId: this.spreadsheetId,
                    ranges: ranges,
                });
            });

            const valueRanges = response.result.valueRanges;

            return {
                clients: this.parseClients(valueRanges[0].values || []),
                materials: this.parseMaterials(valueRanges[1].values || []),
                labor: this.parseLabor(valueRanges[2].values || []),
                products: this.parseProducts(valueRanges[3].values || []),
                quotes: this.parseQuotes(valueRanges[4].values || [])
            };
        } catch (error) {
            console.error('Error reading from Google Sheets:', error);
            throw error;
        }
    }

    /**
     * Escribir todos los datos a todas las hojas
     * @param {Object} data - Datos organizados por tipo
     */
    async writeAll(data) {
        const updates = [
            { range: `${this.sheetNames.clients}!A2:Z`, values: this.formatClients(data.clients || []) },
            { range: `${this.sheetNames.materials}!A2:Z`, values: this.formatMaterials(data.materials || []) },
            { range: `${this.sheetNames.labor}!A2:Z`, values: this.formatLabor(data.labor || []) },
            { range: `${this.sheetNames.products}!A2:Z`, values: this.formatProducts(data.products || []) },
            { range: `${this.sheetNames.quotes}!A2:Z`, values: this.formatQuotes(data.quotes || []) }
        ];

        try {
            // Primero limpiar las hojas
            await this.clearAllSheets();

            // Luego escribir datos
            const response = await this.backoff.execute(async () => {
                return await gapi.client.sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: {
                        valueInputOption: 'USER_ENTERED',
                        data: updates
                    }
                });
            });

            console.log(`${response.result.totalUpdatedCells} cells updated`);
            return response.result;
        } catch (error) {
            console.error('Error writing to Google Sheets:', error);
            throw error;
        }
    }

    /**
     * Limpiar todas las hojas (excepto headers)
     */
    async clearAllSheets() {
        const ranges = [
            `${this.sheetNames.clients}!A2:Z`,
            `${this.sheetNames.materials}!A2:Z`,
            `${this.sheetNames.labor}!A2:Z`,
            `${this.sheetNames.products}!A2:Z`,
            `${this.sheetNames.quotes}!A2:Z`
        ];

        try {
            await this.backoff.execute(async () => {
                return await gapi.client.sheets.spreadsheets.values.batchClear({
                    spreadsheetId: this.spreadsheetId,
                    resource: { ranges: ranges }
                });
            });
        } catch (error) {
            console.error('Error clearing sheets:', error);
            throw error;
        }
    }

    // === CLIENTS ===

    /**
     * Parsear filas de clientes a objetos
     */
    parseClients(rows) {
        return rows.map(row => ({
            id: parseInt(row[0]),
            name: row[1] || '',
            nit: row[2] || '',
            contact: row[3] || '',
            phone: row[4] || '',
            email: row[5] || '',
            city: row[6] || '',
            lastModified: row[7] || new Date().toISOString()
        })).filter(c => c.id);
    }

    /**
     * Formatear clientes a filas
     */
    formatClients(clients) {
        return clients.map(c => [
            c.id,
            c.name,
            c.nit,
            c.contact || '',
            c.phone || '',
            c.email || '',
            c.city || '',
            c.lastModified || new Date().toISOString()
        ]);
    }

    // === MATERIALS ===

    /**
     * Parsear filas de materiales a objetos
     */
    parseMaterials(rows) {
        return rows.map(row => ({
            id: parseInt(row[0]),
            code: row[1] || '',
            desc: row[2] || '',
            type: row[3] || '',
            unit: row[4] || '',
            price: parseFloat(row[5]) || 0,
            lastModified: row[6] || new Date().toISOString()
        })).filter(m => m.id);
    }

    /**
     * Formatear materiales a filas
     */
    formatMaterials(materials) {
        return materials.map(m => [
            m.id,
            m.code,
            m.desc,
            m.type || '',
            m.unit,
            m.price,
            m.lastModified || new Date().toISOString()
        ]);
    }

    // === LABOR ===

    /**
     * Parsear filas de mano de obra a objetos
     */
    parseLabor(rows) {
        return rows.map(row => ({
            id: parseInt(row[0]),
            code: row[1] || '',
            desc: row[2] || '',
            type: row[3] || '',
            unit: row[4] || '',
            cost: parseFloat(row[5]) || 0,
            lastModified: row[6] || new Date().toISOString()
        })).filter(l => l.id);
    }

    /**
     * Formatear mano de obra a filas
     */
    formatLabor(labor) {
        return labor.map(l => [
            l.id,
            l.code,
            l.desc,
            l.type || '',
            l.unit,
            l.cost,
            l.lastModified || new Date().toISOString()
        ]);
    }

    // === PRODUCTS ===

    /**
     * Parsear filas de productos a objetos
     */
    parseProducts(rows) {
        return rows.map(row => ({
            id: parseInt(row[0]),
            code: row[1] || '',
            name: row[2] || '',
            type: row[3] || 'producto',
            materials: this.parseJSON(row[4], []),
            labor: this.parseJSON(row[5], []),
            unitPrice: parseFloat(row[6]) || 0,
            lastModified: row[7] || new Date().toISOString()
        })).filter(p => p.id);
    }

    /**
     * Formatear productos a filas
     */
    formatProducts(products) {
        return products.map(p => [
            p.id,
            p.code,
            p.name,
            p.type || 'producto',
            JSON.stringify(p.materials || []),
            JSON.stringify(p.labor || []),
            p.unitPrice || 0,
            p.lastModified || new Date().toISOString()
        ]);
    }

    // === QUOTES ===

    /**
     * Parsear filas de cotizaciones a objetos
     */
    parseQuotes(rows) {
        return rows.map(row => ({
            id: parseInt(row[0]),
            number: row[1] || '',
            clientId: parseInt(row[2]) || 0,
            project: row[3] || '',
            date: row[4] || new Date().toISOString().split('T')[0],
            items: this.parseJSON(row[5], []),
            generalDiscount: parseFloat(row[6]) || 0,
            totals: this.parseJSON(row[7], {}),
            observations: row[8] || '',
            status: row[9] || 'pending',
            lastModified: row[10] || new Date().toISOString()
        })).filter(q => q.id);
    }

    /**
     * Formatear cotizaciones a filas
     */
    formatQuotes(quotes) {
        return quotes.map(q => [
            q.id,
            q.number,
            q.clientId,
            q.project || '',
            q.date,
            JSON.stringify(q.items || []),
            q.generalDiscount || 0,
            JSON.stringify(q.totals || {}),
            q.observations || '',
            q.status || 'pending',
            q.lastModified || new Date().toISOString()
        ]);
    }

    // === UTILITIES ===

    /**
     * Parsear JSON de manera segura
     */
    parseJSON(str, defaultValue = null) {
        if (!str || str === '') return defaultValue;
        try {
            return JSON.parse(str);
        } catch (error) {
            console.error('Error parsing JSON:', str, error);
            return defaultValue;
        }
    }

    /**
     * Inicializar hoja con headers si no existe
     */
    async initializeSheet(sheetName, headers) {
        try {
            await this.backoff.execute(async () => {
                return await gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [headers]
                    }
                });
            });
            console.log(`Sheet ${sheetName} initialized with headers`);
        } catch (error) {
            console.error(`Error initializing sheet ${sheetName}:`, error);
            throw error;
        }
    }

    /**
     * Inicializar todas las hojas con headers
     */
    async initializeAllSheets() {
        await this.initializeSheet(this.sheetNames.clients, [
            'ID', 'Nombre', 'NIT', 'Contacto', 'Teléfono', 'Email', 'Ciudad', 'LastModified'
        ]);

        await this.initializeSheet(this.sheetNames.materials, [
            'ID', 'Código', 'Descripción', 'Tipo', 'Unidad', 'Precio', 'LastModified'
        ]);

        await this.initializeSheet(this.sheetNames.labor, [
            'ID', 'Código', 'Descripción', 'Tipo', 'Unidad', 'Costo', 'LastModified'
        ]);

        await this.initializeSheet(this.sheetNames.products, [
            'ID', 'Código', 'Nombre', 'Tipo', 'Materials (JSON)', 'Labor (JSON)', 'Precio Unitario', 'LastModified'
        ]);

        await this.initializeSheet(this.sheetNames.quotes, [
            'ID', 'Número', 'ClientID', 'Proyecto', 'Fecha', 'Items (JSON)', 'Descuento General', 'Totals (JSON)', 'Observaciones', 'Estado', 'LastModified'
        ]);

        console.log('All sheets initialized');
    }
}

/**
 * Clase para implementar exponential backoff en reintentos
 */
class ExponentialBackoff {
    constructor(maxRetries = 5, baseDelay = 1000, maxDelay = 32000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    async execute(fn) {
        let lastError;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Verificar si es error de rate limiting
                if (error.status === 429 || error.status === 503) {
                    const delay = Math.min(
                        Math.pow(2, attempt) * this.baseDelay + Math.random() * 1000,
                        this.maxDelay
                    );

                    console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
                    await this.sleep(delay);
                    continue;
                }

                // Para otros errores, lanzar inmediatamente
                throw error;
            }
        }

        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
