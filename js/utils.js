// WMC Soluciones Metálicas - Utility Functions
// Funciones auxiliares y formatters

/**
 * Formatea un número como moneda COP
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado (ej: "$1.250.000")
 */
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '$0';
    }

    const num = Math.round(value);
    return '$' + num.toLocaleString('es-CO');
}

/**
 * Formatea una fecha ISO a formato DD/MM/YYYY
 * @param {string} isoDate - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada
 */
function formatDate(isoDate) {
    if (!isoDate) return '';

    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha para input type="date"
 * @param {string} displayDate - Fecha en formato DD/MM/YYYY
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function formatDateForInput(displayDate) {
    if (!displayDate) return '';

    const [day, month, year] = displayDate.split('/');
    return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha actual en formato ISO
 * @returns {string} Fecha actual (YYYY-MM-DD)
 */
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Parsea un valor de moneda a número
 * @param {string} currencyStr - String con formato "$1.250.000"
 * @returns {number} Valor numérico
 */
function parseCurrency(currencyStr) {
    if (!currencyStr) return 0;

    return parseFloat(currencyStr.replace(/[$.,]/g, '')) || 0;
}

/**
 * Redondea un número a 2 decimales
 * @param {number} value - Valor a redondear
 * @returns {number} Valor redondeado
 */
function roundToTwo(value) {
    return Math.round(value * 100) / 100;
}

/**
 * Valida si un string es un email válido
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function isValidEmail(email) {
    if (!email) return true; // Email es opcional

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida si un NIT tiene formato correcto
 * @param {string} nit - NIT a validar
 * @returns {boolean} True si es válido
 */
function isValidNIT(nit) {
    if (!nit) return false;

    // Formato: XXX.XXX.XXX-X o XXXXXXXXX-X
    const regex = /^[\d.]+\-\d{1,2}$/;
    return regex.test(nit);
}

/**
 * Formatea un NIT agregando puntos y guión
 * @param {string} nit - NIT sin formato
 * @returns {string} NIT formateado
 */
function formatNIT(nit) {
    if (!nit) return '';

    // Remover caracteres no numéricos excepto el guión
    let clean = nit.replace(/[^\d-]/g, '');

    // Si no tiene guión, agregarlo antes del último dígito
    if (!clean.includes('-')) {
        clean = clean.slice(0, -1) + '-' + clean.slice(-1);
    }

    // Agregar puntos cada 3 dígitos
    const parts = clean.split('-');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return parts.join('-');
}

/**
 * Sanitiza un string para evitar XSS
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
function sanitizeHTML(str) {
    if (!str) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Genera un ID único basado en timestamp
 * @returns {number} ID único
 */
function generateID() {
    return Date.now();
}

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Error al copiar:', error);
        return false;
    }
}

/**
 * Debounce function para optimizar búsquedas
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Milisegundos de espera
 * @returns {Function} Función debounced
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Muestra una notificación toast (simple)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'info') {
    // Crear elemento toast si no existe
    let toast = document.getElementById('toast-notification');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 16px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(toast);
    }

    // Definir colores según tipo
    const colors = {
        success: { bg: '#22c55e', text: '#fff' },
        error: { bg: '#ef4444', text: '#fff' },
        warning: { bg: '#eab308', text: '#000' },
        info: { bg: '#3b82f6', text: '#fff' }
    };

    const color = colors[type] || colors.info;
    toast.style.backgroundColor = color.bg;
    toast.style.color = color.text;
    toast.textContent = message;

    // Animar entrada
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // Animar salida después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
    }, 3000);
}

/**
 * Valida que un objeto tenga los campos requeridos
 * @param {Object} obj - Objeto a validar
 * @param {Array<string>} requiredFields - Campos requeridos
 * @returns {Object} { valid: boolean, missing: Array<string> }
 */
function validateRequired(obj, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
        if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
            missing.push(field);
        }
    }

    return {
        valid: missing.length === 0,
        missing: missing
    };
}

/**
 * Convierte un string a formato slug (URL-friendly)
 * @param {string} str - String a convertir
 * @returns {string} String en formato slug
 */
function slugify(str) {
    if (!str) return '';

    return str
        .toLowerCase()
        .trim()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Calcula el porcentaje de un valor
 * @param {number} value - Valor base
 * @param {number} percentage - Porcentaje (ej: 19 para 19%)
 * @returns {number} Resultado
 */
function calculatePercentage(value, percentage) {
    return (value * percentage) / 100;
}

/**
 * Obtiene el nombre del mes en español
 * @param {number} monthIndex - Índice del mes (0-11)
 * @returns {string} Nombre del mes
 */
function getMonthName(monthIndex) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex] || '';
}

/**
 * Convierte un número a palabras (solo para miles)
 * @param {number} num - Número a convertir
 * @returns {string} Número en palabras (simplificado)
 */
function numberToWords(num) {
    if (num === 0) return 'cero';
    if (num < 1000) return num.toString();

    const thousands = Math.floor(num / 1000);
    const hundreds = num % 1000;

    let result = '';
    if (thousands === 1) {
        result = 'mil';
    } else {
        result = thousands + ' mil';
    }

    if (hundreds > 0) {
        result += ' ' + hundreds;
    }

    return result;
}
