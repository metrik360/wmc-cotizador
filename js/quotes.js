// WMC Soluciones Metálicas - Quotes Module (Product-Based)
// Lógica de cotizaciones basada en productos/servicios

let currentQuoteId = null;

// === MODAL DE COTIZACIÓN ===

function openNewQuote() {
    currentQuoteId = null;
    document.getElementById('quote-modal-title').textContent = 'Nueva Cotización';

    // Limpiar formulario
    document.getElementById('quote-client').value = '';
    document.getElementById('quote-client-id').value = '';
    document.getElementById('quote-nit').value = '';
    document.getElementById('quote-project').value = '';
    document.getElementById('quote-status').value = 'pending';
    document.getElementById('quote-general-discount').value = '0';

    // Limpiar items
    document.getElementById('quote-items-lines').innerHTML = '';

    // Cargar observaciones por defecto
    const config = getConfig();
    document.getElementById('quote-observations').value = config.observaciones;

    // Resetear totales
    resetQuoteTotals();

    openModal('modal-quote');
}

function openEditQuote(quoteId) {
    const quote = getQuote(quoteId);
    if (!quote) return;

    currentQuoteId = quoteId;
    document.getElementById('quote-modal-title').textContent = 'Editar Cotización';

    // Cargar datos del cliente
    const client = getClient(quote.clientId);
    if (client) {
        document.getElementById('quote-client').value = client.name;
        document.getElementById('quote-client-id').value = client.id;
        document.getElementById('quote-nit').value = client.nit;
    }

    document.getElementById('quote-project').value = quote.project;
    document.getElementById('quote-status').value = quote.status || 'pending';
    document.getElementById('quote-general-discount').value = quote.generalDiscount || 0;
    document.getElementById('quote-observations').value = quote.observations || '';

    // Limpiar y cargar items
    document.getElementById('quote-items-lines').innerHTML = '';
    quote.items?.forEach(item => {
        addQuoteItemLine(item);
    });

    calculateQuoteTotals();
    openModal('modal-quote');
}

// === LÍNEAS DE PRODUCTOS ===

function addQuoteItemLine(data = null) {
    const tbody = document.getElementById('quote-items-lines');
    const lineId = 'item-' + Date.now();

    const products = getAllProducts();
    const productOptions = products.map(p => {
        const typeLabel = p.type === 'servicio' ? '🔧' : '📦';
        const selected = data?.productId === p.id ? 'selected' : '';
        return `<option value="${p.id}" ${selected}>${typeLabel} ${p.name}</option>`;
    }).join('');

    const tr = document.createElement('tr');
    tr.id = lineId;
    tr.innerHTML = `
        <td>
            <select class="form-select" style="font-size:13px" onchange="onProductItemSelect(this, '${lineId}')">
                <option value="">Seleccionar...</option>
                ${productOptions}
            </select>
        </td>
        <td><span class="badge" id="type-${lineId}">-</span></td>
        <td><input type="number" class="form-input" style="font-size:13px" value="${data?.qty || 1}" min="0" step="0.01" oninput="calculateQuoteTotals()"></td>
        <td><input type="text" class="form-input mono" style="font-size:13px" id="price-${lineId}" value="$0" readonly></td>
        <td><input type="number" class="form-input" style="font-size:13px" value="${data?.discount || 0}" min="0" max="100" step="0.1" oninput="calculateQuoteTotals()"></td>
        <td><input type="text" class="form-input mono" style="font-size:13px" id="subtotal-${lineId}" value="$0" readonly></td>
        <td><button type="button" class="btn btn-sm" onclick="removeQuoteItemLine('${lineId}')" style="padding:4px 8px;font-size:16px">×</button></td>
    `;

    tbody.appendChild(tr);

    // Si hay datos, seleccionar el producto y calcular
    if (data && data.productId) {
        const select = tr.querySelector('select');
        select.value = data.productId;
        onProductItemSelect(select, lineId);
    }
}

function onProductItemSelect(selectElement, lineId) {
    const productId = parseInt(selectElement.value);
    if (!productId) return;

    const product = getProduct(productId);
    if (!product) return;

    // Actualizar tipo
    const typeBadge = document.getElementById(`type-${lineId}`);
    if (product.type === 'servicio') {
        typeBadge.textContent = 'Servicio';
        typeBadge.className = 'badge badge-pending';
    } else {
        typeBadge.textContent = 'Producto';
        typeBadge.className = 'badge badge-approved';
    }

    // Actualizar precio unitario
    const priceInput = document.getElementById(`price-${lineId}`);
    priceInput.value = formatCurrency(product.unitPrice);

    calculateQuoteTotals();
}

function removeQuoteItemLine(lineId) {
    const line = document.getElementById(lineId);
    if (line) {
        line.remove();
        calculateQuoteTotals();
    }
}

// === OBTENER ITEMS DE LA COTIZACIÓN ===

function getQuoteItems() {
    const items = [];
    const tbody = document.getElementById('quote-items-lines');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const select = row.querySelector('select');
        const inputs = row.querySelectorAll('input[type="number"]');

        const productId = parseInt(select.value);
        if (!productId) return;

        const product = getProduct(productId);
        if (!product) return;

        const qty = parseFloat(inputs[0].value) || 0;
        const discount = parseFloat(inputs[1].value) || 0;

        items.push({
            productId: productId,
            name: product.name,
            type: product.type,
            qty: qty,
            unitPrice: product.unitPrice,
            discount: discount,
            subtotal: qty * product.unitPrice * (1 - discount / 100)
        });
    });

    return items;
}

// === CÁLCULOS ===

function calculateQuoteTotals() {
    const items = getQuoteItems();
    const generalDiscount = parseFloat(document.getElementById('quote-general-discount').value) || 0;
    const config = getConfig();

    // Subtotal de items (después de descuentos individuales)
    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Descuento general
    const generalDiscountAmount = itemsSubtotal * (generalDiscount / 100);

    // Subtotal después de descuento general
    const afterDiscount = itemsSubtotal - generalDiscountAmount;

    // IVA
    const iva = afterDiscount * (config.iva / 100);

    // Total final
    const grandTotal = afterDiscount + iva;

    // Actualizar UI
    document.getElementById('total-items-subtotal').textContent = formatCurrency(itemsSubtotal);
    document.getElementById('total-general-discount').textContent = formatCurrency(generalDiscountAmount);
    document.getElementById('total-after-discount').textContent = formatCurrency(afterDiscount);
    document.getElementById('total-iva').textContent = formatCurrency(iva);
    document.getElementById('total-grand').textContent = formatCurrency(grandTotal);

    // Actualizar subtotales de cada línea
    const tbody = document.getElementById('quote-items-lines');
    const rows = tbody.querySelectorAll('tr');
    let itemIndex = 0;

    rows.forEach(row => {
        const select = row.querySelector('select');
        const productId = parseInt(select.value);

        if (productId && items[itemIndex]) {
            const lineId = row.id;
            const subtotalInput = document.getElementById(`subtotal-${lineId}`);
            if (subtotalInput) {
                subtotalInput.value = formatCurrency(items[itemIndex].subtotal);
            }
            itemIndex++;
        }
    });
}

function resetQuoteTotals() {
    document.getElementById('total-items-subtotal').textContent = '$0';
    document.getElementById('total-general-discount').textContent = '$0';
    document.getElementById('total-after-discount').textContent = '$0';
    document.getElementById('total-iva').textContent = '$0';
    document.getElementById('total-grand').textContent = '$0';
}

// === GUARDAR COTIZACIÓN ===

function saveQuoteFromModal() {
    const clientId = parseInt(document.getElementById('quote-client-id').value);
    const project = document.getElementById('quote-project').value.trim();

    if (!clientId) {
        showToast('Debe seleccionar un cliente', 'error');
        return;
    }

    if (!project) {
        showToast('Debe ingresar el nombre del proyecto', 'error');
        return;
    }

    const items = getQuoteItems();

    if (items.length === 0) {
        showToast('Debe agregar al menos un producto o servicio', 'error');
        return;
    }

    const generalDiscount = parseFloat(document.getElementById('quote-general-discount').value) || 0;
    const observations = document.getElementById('quote-observations').value.trim();
    const config = getConfig();

    // Calcular totales
    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const generalDiscountAmount = itemsSubtotal * (generalDiscount / 100);
    const afterDiscount = itemsSubtotal - generalDiscountAmount;
    const iva = afterDiscount * (config.iva / 100);
    const grandTotal = afterDiscount + iva;

    const status = document.getElementById('quote-status').value;

    const quote = {
        id: currentQuoteId || undefined,
        number: currentQuoteId ? getQuote(currentQuoteId).number : undefined,
        clientId: clientId,
        project: project,
        date: currentQuoteId ? getQuote(currentQuoteId).date : new Date().toISOString().split('T')[0],
        items: items,
        generalDiscount: generalDiscount,
        observations: observations,
        totals: {
            itemsSubtotal: itemsSubtotal,
            generalDiscountAmount: generalDiscountAmount,
            afterDiscount: afterDiscount,
            iva: iva,
            grandTotal: grandTotal
        },
        status: status
    };

    const id = saveQuote(quote);
    if (id) {
        showToast('Cotización guardada exitosamente', 'success');
        closeModal('modal-quote');
        refreshQuotesView();
        refreshDashboard();
    } else {
        showToast('Error al guardar cotización', 'error');
    }
}

// === RENDERIZADO DE COTIZACIONES ===

function renderAllQuotes() {
    populateQuoteClientFilter();
    filterQuotes(); // Usar la función de filtro que maneja todo
}

function renderRecentQuotes() {
    // Filtrar solo cotizaciones pendientes y tomar las primeras 5
    const quotes = getAllQuotes()
        .filter(q => q.status === 'pending')
        .slice(0, 5);
    const tbody = document.getElementById('recent-quotes');

    if (quotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay cotizaciones pendientes</td></tr>';
        return;
    }

    tbody.innerHTML = quotes.map(q => {
        const client = getClient(q.clientId);
        const statusClass = q.status === 'approved' ? 'badge-approved' :
                           q.status === 'rejected' ? 'badge-rejected' : 'badge-pending';
        const statusText = q.status === 'approved' ? 'Aprobada' :
                          q.status === 'rejected' ? 'Rechazada' : 'Pendiente';

        return `
        <tr onclick="openEditQuote(${q.id})" style="cursor:pointer">
            <td class="mono">${q.number}</td>
            <td>${client?.name || '-'}</td>
            <td>${q.project}</td>
            <td class="mono">${formatCurrency(q.totals?.grandTotal || 0)}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
        </tr>
        `;
    }).join('');
}

function refreshQuotesView() {
    if (document.getElementById('view-cotizaciones')?.classList.contains('active')) {
        renderAllQuotes();
    }
}

// === ACCIONES DE COTIZACIÓN ===

function duplicateQuoteAction(id) {
    const newId = duplicateQuote(id);
    if (newId) {
        showToast('Cotización duplicada exitosamente', 'success');
        refreshQuotesView();
        refreshDashboard();
    } else {
        showToast('Error al duplicar cotización', 'error');
    }
}

function deleteQuoteAction(id) {
    if (!id) {
        showToast('Error: ID de cotización inválido', 'error');
        return;
    }

    const quote = getQuote(id);
    if (!quote) {
        showToast('Cotización no encontrada', 'error');
        return;
    }

    if (confirm(`¿Está seguro de eliminar la cotización ${quote.number}?`)) {
        if (deleteQuote(id)) {
            showToast('Cotización eliminada exitosamente', 'success');
            refreshQuotesView();
            refreshDashboard();
        } else {
            showToast('Error al eliminar cotización', 'error');
        }
    }
}

// === BÚSQUEDA Y FILTROS ===

function filterQuotes() {
    const searchTerm = document.getElementById('search-quotes').value.toLowerCase();
    const clientFilter = document.getElementById('filter-quotes-client')?.value || '';
    const statusFilter = document.getElementById('filter-quotes-status')?.value || '';
    const dateFrom = document.getElementById('filter-quotes-date-from')?.value || '';
    const dateTo = document.getElementById('filter-quotes-date-to')?.value || '';

    const allQuotes = getAllQuotes();

    const filtered = allQuotes.filter(q => {
        // Filtro de búsqueda por texto
        const client = getClient(q.clientId);
        const searchText = `${q.number} ${client?.name || ''} ${q.project}`.toLowerCase();
        const matchesSearch = !searchTerm || searchText.includes(searchTerm);

        // Filtro por cliente
        const matchesClient = !clientFilter || q.clientId == clientFilter;

        // Filtro por estado
        const matchesStatus = !statusFilter || q.status === statusFilter;

        // Filtro por rango de fechas
        const matchesDateFrom = !dateFrom || q.date >= dateFrom;
        const matchesDateTo = !dateTo || q.date <= dateTo;

        return matchesSearch && matchesClient && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    // Renderizar solo las cotizaciones filtradas
    renderFilteredQuotes(filtered);
}

function renderFilteredQuotes(quotes) {
    const tbody = document.getElementById('all-quotes');

    if (quotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No se encontraron cotizaciones con los filtros seleccionados</td></tr>';
        return;
    }

    tbody.innerHTML = quotes.map(q => {
        const client = getClient(q.clientId);
        const statusClass = q.status === 'approved' ? 'badge-approved' :
                           q.status === 'rejected' ? 'badge-rejected' : 'badge-pending';
        const statusText = q.status === 'approved' ? 'Aprobada' :
                          q.status === 'rejected' ? 'Rechazada' : 'Pendiente';

        return `
        <tr>
            <td class="mono"><strong>${q.number}</strong></td>
            <td>${formatDate(q.date)}</td>
            <td><strong>${client?.name || 'Cliente no encontrado'}</strong></td>
            <td>${q.project}</td>
            <td>${q.items?.length || 0} items</td>
            <td class="mono"><strong>${formatCurrency(q.totals?.grandTotal || 0)}</strong></td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td class="actions-cell">
                <div class="actions-btn" onclick="toggleQuoteDropdown(this, event)">⋮</div>
                <div class="dropdown">
                    <div class="dropdown-item" onclick="handleQuoteAction(${q.id}, 'view', event)">👁️ Ver PDF</div>
                    <div class="dropdown-item" onclick="handleQuoteAction(${q.id}, 'edit', event)">✏️ Editar</div>
                    <div class="dropdown-item" onclick="handleQuoteAction(${q.id}, 'duplicate', event)">📋 Duplicar</div>
                    <div class="dropdown-item danger" onclick="handleQuoteAction(${q.id}, 'delete', event)">🗑️ Eliminar</div>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function clearQuoteFilters() {
    document.getElementById('search-quotes').value = '';
    if (document.getElementById('filter-quotes-client')) {
        document.getElementById('filter-quotes-client').value = '';
    }
    if (document.getElementById('filter-quotes-status')) {
        document.getElementById('filter-quotes-status').value = '';
    }
    if (document.getElementById('filter-quotes-date-from')) {
        document.getElementById('filter-quotes-date-from').value = '';
    }
    if (document.getElementById('filter-quotes-date-to')) {
        document.getElementById('filter-quotes-date-to').value = '';
    }
    filterQuotes();
}

function populateQuoteClientFilter() {
    const select = document.getElementById('filter-quotes-client');
    if (!select) return;

    const clients = getAllClients();
    const currentOptions = select.innerHTML;
    const newOptions = '<option value="">Todos los clientes</option>' +
        clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (currentOptions !== newOptions) {
        select.innerHTML = newOptions;
    }
}
