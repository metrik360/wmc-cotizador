// WMC Soluciones Metálicas - Main App
// Inicialización y configuración principal

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏗️ Iniciando WMC Cotizador...');

    // 1. Inicializar datos
    initData();

    // 2. Configurar event listeners de navegación
    setupNavigation();

    // 3. Configurar tabs
    setupTabs();

    // 4. Cargar vista inicial (Dashboard)
    switchView('dashboard');

    // 5. Mensaje de bienvenida
    console.log('✅ WMC Cotizador listo');
});

// Configurar navegación del sidebar
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', function() {
            const viewName = this.dataset.view;
            switchView(viewName);
        });
    });

    // Setup PDF tabs
    document.querySelectorAll('[data-pdftab]').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.pdftab;
            switchPDFTab(tabName);
        });
    });
}

// Prevenir submit de formularios (usamos botones onclick)
document.addEventListener('submit', function(e) {
    e.preventDefault();
});

// Debug helpers (solo para desarrollo)
window.WMC = {
    // Acceso rápido a datos
    data: () => appData,
    clients: getAllClients,
    materials: getAllMaterials,
    labor: getAllLabor,
    quotes: getAllQuotes,
    config: getConfig,

    // Acceso a funciones útiles
    exportData: exportData,
    importData: importData,
    resetData: resetData,

    // UI helpers
    toast: showToast,
    switchView: switchView,

    // Stats
    stats: getDashboardStats,

    // Versión
    version: '1.0.0-MVP'
};

console.log('💡 Tip: Usa WMC en la consola para debug (ej: WMC.stats())');
