// WMC Soluciones Metálicas - Quote Actions Helper
// Funciones globales para acciones de cotizaciones

console.log('✅ quote-actions.js cargado');

// Estas funciones están en el scope global para que onclick funcione
window.handleQuoteAction = function(quoteId, action, event) {
    console.log('handleQuoteAction llamado:', quoteId, action, event);
    if (event) {
        event.stopPropagation();
    }

    // Cerrar todos los dropdowns
    document.querySelectorAll('.dropdown.active').forEach(d => {
        d.classList.remove('active');
    });

    switch(action) {
        case 'view':
        case 'pdf':
            viewQuotePDF(quoteId);
            break;
        case 'edit':
            openEditQuote(quoteId);
            break;
        case 'duplicate':
            duplicateQuoteAction(quoteId);
            break;
        case 'delete':
            deleteQuoteAction(quoteId);
            break;
    }
};

window.toggleQuoteDropdown = function(element, event) {
    console.log('toggleQuoteDropdown llamado, element:', element, 'event:', event);
    if (event) {
        event.stopPropagation();
    }

    const dropdown = element.nextElementSibling;
    console.log('dropdown encontrado:', dropdown);

    // Cerrar otros dropdowns
    document.querySelectorAll('.dropdown.active').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
            d.style.position = '';
            d.style.top = '';
            d.style.left = '';
        }
    });

    // Toggle actual
    const isActive = dropdown.classList.contains('active');

    if (!isActive) {
        // Abrir dropdown
        dropdown.classList.add('active');

        // Posicionar usando position: fixed
        const rect = element.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 4) + 'px';
        dropdown.style.left = (rect.right - 160) + 'px'; // 160px es el min-width del dropdown
        dropdown.style.right = 'auto';

        console.log('dropdown posicionado en:', dropdown.style.top, dropdown.style.left);
    } else {
        // Cerrar dropdown
        dropdown.classList.remove('active');
        dropdown.style.position = '';
        dropdown.style.top = '';
        dropdown.style.left = '';
    }

    console.log('dropdown ahora tiene clase active:', dropdown.classList.contains('active'));
};

// Test que las funciones están disponibles
console.log('window.toggleQuoteDropdown está definido:', typeof window.toggleQuoteDropdown);
console.log('window.handleQuoteAction está definido:', typeof window.handleQuoteAction);
