// WMC Soluciones Metálicas - Data Management Module
// Gestión de localStorage y modelo de datos

const DATA_KEY = 'wmc_data';
const DATA_VERSION = '2.0'; // Cambio mayor: sistema de productos

// Estado global de la aplicación
let appData = {
    version: DATA_VERSION,
    config: {
        admin: 7,
        imprevistos: 7,
        utilidad: 5,
        iva: 19,
        vigencia: 20,
        margenSuministro: 30,
        margenInstalacion: 45,
        consecutivo: 1,
        observaciones: `La instalación no incluye trabajos de obra civil, acometidas eléctricas para la conexión de Equipos, o adicionales de material, transporte, u otro concepto diferente al mencionado en esta cotización.
El proyecto debe suministrar punto eléctrico de 110 V y 220 V a menos de 50 metros de la losa donde se instalará el campamento.
El proyecto suministra una losa en concreto pulida con espesor por lo menos 15 cm y un sobre ancho al perímetro del campamento (12m x 6m), de 30 cm. Es de vital que la placa no tenga desnivel debido a que la producción de las piezas se hace a medida en taller.
El proyecto debe suministrar el servicio de vigilancia en el proyecto.
VALIDEZ OFERTA: 20 DÍAS.
TIEMPO DE ENTREGA: 30 DÍAS UNA VEZ SE TENGA ORDEN DE COMPRA.`
    },
    clients: {},
    materials: {},  // Uso interno solamente
    labor: {},      // Uso interno solamente
    products: {},   // NUEVO: Catálogo de productos/servicios
    quotes: {},     // MODIFICADO: Ahora contiene items de productos
    metadata: {
        lastQuoteNumber: 0,
        lastProductNumber: 0,  // NUEVO
        lastSync: null
    }
};

// Inicializar datos desde localStorage o crear nuevo
function initData() {
    try {
        const stored = localStorage.getItem(DATA_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Verificar versión y migrar si es necesario
            if (parsed.version === DATA_VERSION) {
                appData = parsed;
            } else {
                console.warn('Versión de datos diferente, usando datos por defecto');
                saveData();
            }
        } else {
            // Primera vez, cargar datos de muestra
            loadSampleData();
            saveData();
        }
    } catch (error) {
        console.error('Error al inicializar datos:', error);
        // En caso de error, usar datos por defecto
        saveData();
    }
}

// Guardar datos en localStorage
function saveData() {
    try {
        appData.metadata.lastSync = new Date().toISOString();
        localStorage.setItem(DATA_KEY, JSON.stringify(appData));
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        if (error.name === 'QuotaExceededError') {
            alert('Almacenamiento lleno. Por favor, elimine cotizaciones antiguas.');
        }
        return false;
    }
}

// Obtener configuración
function getConfig() {
    return appData.config;
}

// Actualizar configuración
function updateConfig(newConfig) {
    appData.config = { ...appData.config, ...newConfig };
    return saveData();
}

// === CLIENTES ===

function getAllClients() {
    return Object.values(appData.clients);
}

function getClient(id) {
    return appData.clients[id];
}

function saveClient(client) {
    if (!client.id) {
        client.id = Date.now();
    }
    appData.clients[client.id] = client;
    return saveData() ? client.id : null;
}

function deleteClient(id) {
    // Verificar que no haya cotizaciones asociadas
    const hasQuotes = Object.values(appData.quotes).some(q => q.clientId === id);
    if (hasQuotes) {
        return { success: false, error: 'No se puede eliminar. Hay cotizaciones asociadas a este cliente.' };
    }
    delete appData.clients[id];
    return { success: saveData() };
}

// === MATERIALES ===

function getAllMaterials() {
    return Object.values(appData.materials);
}

function getMaterial(id) {
    return appData.materials[id];
}

function saveMaterial(material) {
    if (!material.id) {
        material.id = Date.now();
    }
    appData.materials[material.id] = material;
    return saveData() ? material.id : null;
}

function deleteMaterial(id) {
    delete appData.materials[id];
    return saveData();
}

// === MANO DE OBRA ===

function getAllLabor() {
    return Object.values(appData.labor);
}

function getLabor(id) {
    return appData.labor[id];
}

function saveLabor(labor) {
    if (!labor.id) {
        labor.id = Date.now();
    }
    appData.labor[labor.id] = labor;
    return saveData() ? labor.id : null;
}

function deleteLabor(id) {
    delete appData.labor[id];
    return saveData();
}

// === PRODUCTOS / SERVICIOS ===

function getAllProducts() {
    return Object.values(appData.products).sort((a, b) => a.name.localeCompare(b.name));
}

function getProduct(id) {
    return appData.products[id];
}

function saveProduct(product) {
    if (!product.id) {
        product.id = Date.now();
        // Generar código de producto
        appData.metadata.lastProductNumber++;
        const prefix = product.type === 'servicio' ? 'SERV' : 'PROD';
        const num = String(appData.metadata.lastProductNumber).padStart(3, '0');
        product.code = `${prefix}-${num}`;
    }
    appData.products[product.id] = product;
    return saveData() ? product.id : null;
}

function deleteProduct(id) {
    delete appData.products[id];
    return saveData();
}

function duplicateProduct(id) {
    const original = appData.products[id];
    if (!original) return null;

    const duplicate = JSON.parse(JSON.stringify(original));
    duplicate.id = Date.now();

    // Generar nuevo código
    appData.metadata.lastProductNumber++;
    const prefix = duplicate.type === 'servicio' ? 'SERV' : 'PROD';
    const num = String(appData.metadata.lastProductNumber).padStart(3, '0');
    duplicate.code = `${prefix}-${num}`;
    duplicate.name = duplicate.name + ' (Copia)';

    appData.products[duplicate.id] = duplicate;
    return saveData() ? duplicate.id : null;
}

// === COTIZACIONES ===

function getAllQuotes() {
    return Object.values(appData.quotes).sort((a, b) => b.date.localeCompare(a.date));
}

function getQuote(id) {
    return appData.quotes[id];
}

function saveQuote(quote) {
    if (!quote.id) {
        quote.id = Date.now();
        // Generar número de cotización
        appData.metadata.lastQuoteNumber++;
        const year = new Date().getFullYear();
        const num = String(appData.metadata.lastQuoteNumber).padStart(3, '0');
        quote.number = `COT-${year}-${num}`;
        quote.date = new Date().toISOString().split('T')[0];
        quote.status = 'pending';
    }
    appData.quotes[quote.id] = quote;
    return saveData() ? quote.id : null;
}

function deleteQuote(id) {
    delete appData.quotes[id];
    return saveData();
}

function duplicateQuote(id) {
    const original = appData.quotes[id];
    if (!original) return null;

    const duplicate = JSON.parse(JSON.stringify(original));
    duplicate.id = Date.now();

    // Generar nuevo número
    appData.metadata.lastQuoteNumber++;
    const year = new Date().getFullYear();
    const num = String(appData.metadata.lastQuoteNumber).padStart(3, '0');
    duplicate.number = `COT-${year}-${num}`;
    duplicate.date = new Date().toISOString().split('T')[0];
    duplicate.status = 'pendiente';

    appData.quotes[duplicate.id] = duplicate;
    return saveData() ? duplicate.id : null;
}

function updateQuoteStatus(id, status) {
    if (appData.quotes[id]) {
        appData.quotes[id].status = status;
        return saveData();
    }
    return false;
}

// === ESTADÍSTICAS ===

function getDashboardStats() {
    const quotes = getAllQuotes();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const monthQuotes = quotes.filter(q => q.date.startsWith(currentMonth));
    const pending = quotes.filter(q => q.status === 'pending').length;
    const approved = quotes.filter(q => q.status === 'approved').length;
    // Total solo de cotizaciones pendientes
    const totalValue = quotes
        .filter(q => q.status === 'pending')
        .reduce((sum, q) => sum + (q.totals?.grandTotal || 0), 0);

    return {
        monthCount: monthQuotes.length,
        pendingCount: pending,
        approvedCount: approved,
        totalValue: totalValue
    };
}

// === DATOS DE MUESTRA ===

function loadSampleData() {
    // Clientes de ejemplo
    const sampleClients = [
        {
            id: 1701001,
            name: 'Prodesa Constructora',
            nit: '800.200.598-2',
            contact: 'Carlos Martínez',
            phone: '3101234567',
            email: 'cmartinez@prodesa.co',
            city: 'Bogotá'
        },
        {
            id: 1701002,
            name: 'Constructora Bolívar',
            nit: '860.034.313-1',
            contact: 'Ana Rodríguez',
            phone: '3209876543',
            email: 'arodriguez@bolivar.co',
            city: 'Medellín'
        },
        {
            id: 1701003,
            name: 'Amarilo S.A.',
            nit: '900.123.456-7',
            contact: 'Luis Gómez',
            phone: '3156789012',
            email: 'lgomez@amarilo.co',
            city: 'Cali'
        }
    ];

    // Materiales de ejemplo
    const sampleMaterials = [
        { id: 2001, code: 'MAT-001', desc: 'COLUMNAS 70 X 70 2.5 MM', type: 'Perfil', unit: 'M', price: 85000 },
        { id: 2002, code: 'MAT-002', desc: 'VIGA IPE 100', type: 'Viga', unit: 'M', price: 120000 },
        { id: 2003, code: 'MAT-003', desc: 'LAMINA GALVANIZADA CAL 24', type: 'Lámina', unit: 'M2', price: 45000 },
        { id: 2004, code: 'MAT-004', desc: 'PERFIL C 100X50X15X2MM', type: 'Perfil', unit: 'M', price: 35000 },
        { id: 2005, code: 'MAT-005', desc: 'TUBO CUADRADO 40X40X2MM', type: 'Perfil', unit: 'M', price: 28000 },
        { id: 2006, code: 'MAT-006', desc: 'ANGULO 2" X 2" X 1/8"', type: 'Perfil', unit: 'M', price: 25000 },
        { id: 2007, code: 'MAT-007', desc: 'PLATINA 1/4" X 2"', type: 'Platina', unit: 'M', price: 18000 },
        { id: 2008, code: 'MAT-008', desc: 'SOLDADURA E6013', type: 'Soldadura', unit: 'KG', price: 12000 },
        { id: 2009, code: 'MAT-009', desc: 'PINTURA ANTICORROSIVA', type: 'Pintura', unit: 'GL', price: 95000 },
        { id: 2010, code: 'MAT-010', desc: 'TORNILLO EXPANSION 3/8"X3"', type: 'Fijación', unit: 'UND', price: 2500 },
        { id: 2011, code: 'MAT-011', desc: 'PERNO GRADO 8 1/2"X4"', type: 'Fijación', unit: 'UND', price: 3200 },
        { id: 2012, code: 'MAT-012', desc: 'DISCO CORTE METAL 14"', type: 'Herramienta', unit: 'UND', price: 18000 },
        { id: 2013, code: 'MAT-013', desc: 'LAMINA ANTIDESLIZANTE', type: 'Lámina', unit: 'M2', price: 125000 },
        { id: 2014, code: 'MAT-014', desc: 'MALLA ELECTROSOLDADA', type: 'Malla', unit: 'M2', price: 38000 },
        { id: 2015, code: 'MAT-015', desc: 'CANAL U 4" X 2MM', type: 'Perfil', unit: 'M', price: 42000 }
    ];

    // Mano de obra de ejemplo
    const sampleLabor = [
        { id: 3001, code: 'MO-FAB-001', desc: 'CORTE TUBERIA', type: 'fabricacion', unit: 'M', cost: 5000 },
        { id: 3002, code: 'MO-FAB-002', desc: 'SOLDADURA ESTRUCTURAL', type: 'fabricacion', unit: 'M', cost: 15000 },
        { id: 3003, code: 'MO-FAB-003', desc: 'ARMADO MODULO', type: 'fabricacion', unit: 'UND', cost: 250000 },
        { id: 3004, code: 'MO-FAB-004', desc: 'PINTURA Y ACABADOS', type: 'fabricacion', unit: 'M2', cost: 8000 },
        { id: 3005, code: 'MO-FAB-005', desc: 'PERFORACION', type: 'fabricacion', unit: 'UND', cost: 3000 },
        { id: 3006, code: 'MO-FAB-006', desc: 'DOBLADO LAMINA', type: 'fabricacion', unit: 'M', cost: 6000 },
        { id: 3007, code: 'MO-INS-001', desc: 'MONTAJE ESTRUCTURA', type: 'instalacion', unit: 'M2', cost: 45000 },
        { id: 3008, code: 'MO-INS-002', desc: 'ANCLAJE A LOSA', type: 'instalacion', unit: 'UND', cost: 35000 },
        { id: 3009, code: 'MO-INS-003', desc: 'INSTALACION CUBIERTA', type: 'instalacion', unit: 'M2', cost: 25000 },
        { id: 3010, code: 'MO-INS-004', desc: 'INSTALACION PUERTAS', type: 'instalacion', unit: 'UND', cost: 80000 },
        { id: 3011, code: 'MO-INS-005', desc: 'INSTALACION VENTANAS', type: 'instalacion', unit: 'UND', cost: 45000 },
        { id: 3012, code: 'MO-INS-006', desc: 'AJUSTES FINALES', type: 'instalacion', unit: 'JOR', cost: 250000 }
    ];

    // Productos de ejemplo
    const sampleProducts = [
        {
            id: 4001,
            code: 'PROD-001',
            name: 'Escalera Metálica Tipo Industrial 3m',
            type: 'producto',
            materials: [
                { materialId: 2001, qty: 6, price: 85000 },   // Columnas
                { materialId: 2004, qty: 4, price: 35000 },   // Perfil C
                { materialId: 2008, qty: 2, price: 12000 },   // Soldadura
                { materialId: 2009, qty: 0.5, price: 95000 }  // Pintura
            ],
            labor: [
                { laborId: 3001, qty: 6, price: 5000 },       // Corte
                { laborId: 3002, qty: 10, price: 15000 },     // Soldadura
                { laborId: 3004, qty: 8, price: 8000 }        // Pintura
            ],
            unitPrice: 1250000
        },
        {
            id: 4002,
            code: 'PROD-002',
            name: 'Barandal Inoxidable 1.20m Altura',
            type: 'producto',
            materials: [
                { materialId: 2005, qty: 3, price: 28000 },   // Tubo cuadrado
                { materialId: 2007, qty: 2, price: 18000 },   // Platina
                { materialId: 2010, qty: 8, price: 2500 }     // Tornillos
            ],
            labor: [
                { laborId: 3001, qty: 3, price: 5000 },       // Corte
                { laborId: 3002, qty: 5, price: 15000 },      // Soldadura
                { laborId: 3005, qty: 8, price: 3000 }        // Perforación
            ],
            unitPrice: 320000
        },
        {
            id: 4003,
            code: 'PROD-003',
            name: 'Estructura Soporte Mezzanine 20m2',
            type: 'producto',
            materials: [
                { materialId: 2002, qty: 12, price: 120000 }, // Viga IPE
                { materialId: 2001, qty: 8, price: 85000 },   // Columnas
                { materialId: 2003, qty: 20, price: 45000 },  // Lámina
                { materialId: 2011, qty: 24, price: 3200 }    // Pernos
            ],
            labor: [
                { laborId: 3002, qty: 20, price: 15000 },     // Soldadura
                { laborId: 3003, qty: 1, price: 250000 },     // Armado módulo
                { laborId: 3004, qty: 20, price: 8000 }       // Pintura
            ],
            unitPrice: 3850000
        },
        {
            id: 4004,
            code: 'SERV-001',
            name: 'Instalación y Montaje Especializado',
            type: 'servicio',
            materials: [],
            labor: [
                { laborId: 3007, qty: 2, price: 450000 },     // Instalación estructura
                { laborId: 3010, qty: 1, price: 380000 },     // Nivelación
                { laborId: 3012, qty: 1, price: 250000 }      // Ajustes finales
            ],
            unitPrice: 1580000
        },
        {
            id: 4005,
            code: 'SERV-002',
            name: 'Mantenimiento Preventivo Estructuras',
            type: 'servicio',
            materials: [],
            labor: [
                { laborId: 3006, qty: 1, price: 320000 },     // Inspección
                { laborId: 3004, qty: 10, price: 8000 },      // Pintura
                { laborId: 3012, qty: 0.5, price: 250000 }    // Ajustes
            ],
            unitPrice: 525000
        }
    ];

    // Cargar datos
    sampleClients.forEach(c => appData.clients[c.id] = c);
    sampleMaterials.forEach(m => appData.materials[m.id] = m);
    sampleLabor.forEach(l => appData.labor[l.id] = l);
    sampleProducts.forEach(p => appData.products[p.id] = p);

    // Actualizar contador de productos
    appData.metadata.lastProductNumber = 3; // PROD-001, PROD-002, PROD-003, SERV-001, SERV-002
}

// Exportar datos (para debug o backup)
function exportData() {
    return JSON.stringify(appData, null, 2);
}

// Importar datos (para restore)
function importData(jsonString) {
    try {
        const imported = JSON.parse(jsonString);
        if (imported.version && imported.config) {
            appData = imported;
            return saveData();
        }
        return false;
    } catch (error) {
        console.error('Error al importar datos:', error);
        return false;
    }
}

// Resetear datos (WARNING: destructivo)
function resetData() {
    if (confirm('⚠️ Esto eliminará TODOS los datos. ¿Estás seguro?')) {
        localStorage.removeItem(DATA_KEY);
        location.reload();
    }
}
