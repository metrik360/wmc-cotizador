// WMC Soluciones Metálicas - UI Module
// Funciones de interfaz: navegación, modales, tabs, dropdowns

// === NAVEGACIÓN ===

function switchView(viewName) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Mostrar vista seleccionada
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Cargar datos específicos de la vista
    switch (viewName) {
        case 'dashboard':
            refreshDashboard();
            break;
        case 'cotizaciones':
            renderAllQuotes();
            break;
        case 'clientes':
            renderClientsTable();
            break;
        case 'productos':
            renderProductsTable();
            break;
        case 'materiales':
            renderMaterialsTable();
            break;
        case 'manoobra':
            renderLaborTable();
            break;
        case 'config':
            loadConfigForm();
            break;
    }
}

// === MODALES ===

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// Cerrar modal al hacer click fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// === TABS ===

function setupTabs() {
    // Tabs de cotización (suministro/instalación)
    document.querySelectorAll('#quote-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchQuoteTab(this.dataset.tab);
        });
    });

    // Tabs de PDF (resumen/detalle)
    document.querySelectorAll('#pdf-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchPDFTab(this.dataset.pdftab);
        });
    });
}

function switchPDFTab(tab) {
    document.querySelectorAll('#pdf-tabs .tab').forEach(t => {
        t.classList.toggle('active', t.dataset.pdftab === tab);
    });

    // Aquí iría la lógica para cambiar el contenido del PDF
    // Por ahora es placeholder
}

// === DROPDOWNS ===

function toggleDropdown(button, event) {
    if (event) {
        event.stopPropagation();
    }

    const dropdown = button.nextElementSibling;

    // Cerrar otros dropdowns
    document.querySelectorAll('.dropdown.active').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
        }
    });

    // Toggle actual
    dropdown.classList.toggle('active');
}

// Cerrar dropdowns al hacer click fuera
document.addEventListener('click', function() {
    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
});

// Helper para ejecutar acciones de dropdown
function executeDropdownAction(actionFn, event) {
    if (event) {
        event.stopPropagation();
    }

    // Cerrar todos los dropdowns
    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
        dropdown.classList.remove('active');
    });

    // Ejecutar la acción
    if (typeof actionFn === 'function') {
        actionFn();
    }
}

// === DASHBOARD ===

function refreshDashboard() {
    updateDashboardStats();
    renderRecentQuotes();
}

function updateDashboardStats() {
    const stats = getDashboardStats();

    document.getElementById('stat-month').textContent = stats.monthCount;
    document.getElementById('stat-pending').textContent = stats.pendingCount;
    document.getElementById('stat-approved').textContent = stats.approvedCount;
    document.getElementById('stat-total').textContent = formatCurrency(stats.totalValue);
}

// === AUTOCOMPLETE ===

// Cerrar autocomplete al hacer click fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.autocomplete-container')) {
        document.querySelectorAll('.autocomplete-list.active').forEach(list => {
            list.classList.remove('active');
        });
    }
});

// === UTILIDADES UI ===

// Animación suave al hacer scroll
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Confirmar antes de salir si hay cambios sin guardar
let hasUnsavedChanges = false;

function markAsChanged() {
    hasUnsavedChanges = true;
}

function markAsSaved() {
    hasUnsavedChanges = false;
}

window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// === VALIDACIÓN DE FORMULARIOS ===

function highlightInvalidField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = 'var(--danger)';
        field.focus();

        setTimeout(() => {
            field.style.borderColor = '';
        }, 2000);
    }
}

// === LOADING STATES ===

function showLoading(message = 'Cargando...') {
    let loader = document.getElementById('global-loader');

    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            flex-direction: column;
            gap: 16px;
        `;
        loader.innerHTML = `
            <div style="width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div style="color: var(--text-primary); font-size: 14px;">${message}</div>
        `;

        // Agregar animación de spin
        if (!document.getElementById('spin-animation')) {
            const style = document.createElement('style');
            style.id = 'spin-animation';
            style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        document.body.appendChild(loader);
    }
}

function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
}

// === COPY TO CLIPBOARD ===

async function copyText(text, successMessage = 'Copiado al portapapeles') {
    const success = await copyToClipboard(text);
    if (success) {
        showToast(successMessage, 'success');
    } else {
        showToast('Error al copiar', 'error');
    }
}

// === KEYBOARD SHORTCUTS ===

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K: Búsqueda rápida
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-quotes');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // Ctrl/Cmd + N: Nueva cotización (solo en vista de cotizaciones)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        const cotizacionesView = document.getElementById('view-cotizaciones');
        if (cotizacionesView && cotizacionesView.classList.contains('active')) {
            e.preventDefault();
            openNewQuote();
        }
    }
});

// === RESPONSIVE SIDEBAR ===

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-hidden');
    }
}

// Detectar si estamos en móvil
function isMobile() {
    return window.innerWidth <= 1024;
}

// === PRINT ===

function printQuote(quoteId) {
    // TODO: Implementar impresión
    showToast('Función de impresión en desarrollo', 'info');
}

// === EXPORT ===

function exportToExcel() {
    // TODO: Implementar exportación a Excel
    showToast('Función de exportación en desarrollo', 'info');
}

// === CONFIRMACIONES ===

function showConfirm(message, onConfirm, onCancel) {
    if (confirm(message)) {
        if (onConfirm) onConfirm();
    } else {
        if (onCancel) onCancel();
    }
}

// === NÚMEROS ALEATORIOS PARA DEMOS ===

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
}
