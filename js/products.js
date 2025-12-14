// WMC Soluciones Metálicas - Products Module
// CRUD de productos y servicios

let currentProductId = null;

// Abrir modal de producto
function openProductModal(productId = null) {
    currentProductId = productId;

    if (productId) {
        const product = getProduct(productId);
        if (!product) return;

        document.getElementById('product-modal-title').textContent = product.type === 'servicio' ? 'Editar Servicio' : 'Editar Producto';
        document.getElementById('product-edit-id').value = product.id;
        document.getElementById('product-code').value = product.code;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-type').value = product.type;

        // Limpiar líneas
        document.getElementById('product-materials-lines').innerHTML = '';
        document.getElementById('product-labor-lines').innerHTML = '';

        // Cargar materiales (solo si es producto)
        if (product.type === 'producto' && product.materials) {
            product.materials.forEach(item => {
                addProductMaterialLine(item);
            });
        }

        // Cargar mano de obra
        if (product.labor) {
            product.labor.forEach(item => {
                addProductLaborLine(item);
            });
        }

        // Mostrar/ocultar sección de materiales
        toggleMaterialsSection(product.type);

        // Calcular precio
        calculateProductPrice();
    } else {
        document.getElementById('product-modal-title').textContent = 'Nuevo Producto';
        document.getElementById('product-edit-id').value = '';
        document.getElementById('product-code').value = 'Auto-generado';
        document.getElementById('product-name').value = '';
        document.getElementById('product-type').value = 'producto';

        // Limpiar líneas
        document.getElementById('product-materials-lines').innerHTML = '';
        document.getElementById('product-labor-lines').innerHTML = '';

        toggleMaterialsSection('producto');
    }

    openModal('modal-product');
}

// Toggle sección de materiales según el tipo
function toggleMaterialsSection(type) {
    const materialsSection = document.getElementById('product-materials-section');
    if (type === 'servicio') {
        materialsSection.style.display = 'none';
    } else {
        materialsSection.style.display = 'block';
    }
}

// Event listener para cambio de tipo
function onProductTypeChange() {
    const type = document.getElementById('product-type').value;
    toggleMaterialsSection(type);

    // Si cambia a servicio, limpiar materiales
    if (type === 'servicio') {
        document.getElementById('product-materials-lines').innerHTML = '';
    }

    calculateProductPrice();
}

// Agregar línea de material al producto
function addProductMaterialLine(data = null) {
    const container = document.getElementById('product-materials-lines');
    const lineId = 'pmat-' + Date.now();

    const line = document.createElement('div');
    line.className = 'line-item';
    line.id = lineId;

    // Obtener nombre del material si hay data
    let materialName = '';
    if (data?.materialId) {
        const material = getMaterial(data.materialId);
        if (material) {
            materialName = material.desc;
        }
    }

    line.innerHTML = `
        <div class="autocomplete-container" style="position: relative; flex: 1;">
            <input type="text"
                   class="material-search"
                   placeholder="Buscar material..."
                   value="${materialName}"
                   oninput="searchProductMaterials(this, '${lineId}')"
                   onfocus="searchProductMaterials(this, '${lineId}')">
            <input type="hidden" class="material-id" value="${data?.materialId || ''}">
            <div class="autocomplete-list" id="mat-auto-${lineId}"></div>
        </div>
        <input type="number" class="qty" value="${data?.qty || 1}" min="0" step="0.01" oninput="calculateProductPrice()">
        <input type="text" class="unit" value="${data?.unit || 'UND'}" readonly>
        <input type="number" class="price" value="${data?.price || 0}" min="0" step="1" oninput="calculateProductPrice()">
        <input type="text" class="subtotal mono" value="$0" readonly>
        <div class="remove-btn" onclick="removeProductLine('${lineId}')">×</div>
    `;

    container.appendChild(line);

    if (data) {
        calculateProductLineSubtotal(lineId);
    }

    calculateProductPrice();
}

// Agregar línea de mano de obra al producto
function addProductLaborLine(data = null) {
    const container = document.getElementById('product-labor-lines');
    const lineId = 'plab-' + Date.now();

    const line = document.createElement('div');
    line.className = 'line-item';
    line.id = lineId;

    // Obtener nombre de la actividad si hay data
    let laborName = '';
    if (data?.laborId) {
        const labor = getLabor(data.laborId);
        if (labor) {
            laborName = labor.desc;
        }
    }

    line.innerHTML = `
        <div class="autocomplete-container" style="position: relative; flex: 1;">
            <input type="text"
                   class="labor-search"
                   placeholder="Buscar actividad..."
                   value="${laborName}"
                   oninput="searchProductLabor(this, '${lineId}')"
                   onfocus="searchProductLabor(this, '${lineId}')">
            <input type="hidden" class="labor-id" value="${data?.laborId || ''}">
            <div class="autocomplete-list" id="lab-auto-${lineId}"></div>
        </div>
        <input type="number" class="qty" value="${data?.qty || 1}" min="0" step="0.01" oninput="calculateProductPrice()">
        <input type="text" class="unit" value="${data?.unit || 'JOR'}" readonly>
        <input type="number" class="price" value="${data?.price || 0}" min="0" step="1" oninput="calculateProductPrice()">
        <input type="text" class="subtotal mono" value="$0" readonly>
        <div class="remove-btn" onclick="removeProductLine('${lineId}')">×</div>
    `;

    container.appendChild(line);

    if (data) {
        calculateProductLineSubtotal(lineId);
    }

    calculateProductPrice();
}

// Búsqueda de materiales con autocomplete
function searchProductMaterials(input, lineId) {
    const query = input.value.trim();
    const autocomplete = document.getElementById(`mat-auto-${lineId}`);

    // Si el campo está vacío, mostrar todos los materiales
    let materials;
    if (!query || query.length === 0) {
        materials = getAllMaterials();
    } else {
        materials = getAllMaterials().filter(m =>
            m.desc.toLowerCase().includes(query.toLowerCase()) ||
            (m.type && m.type.toLowerCase().includes(query.toLowerCase()))
        );
    }

    if (materials.length === 0) {
        autocomplete.innerHTML = '<div class="autocomplete-item" style="color: #999;">No se encontraron materiales</div>';
        autocomplete.classList.add('active');
        return;
    }

    // Agrupar por tipo
    const materialsByType = {};
    materials.forEach(m => {
        const type = m.type || 'Otro';
        if (!materialsByType[type]) {
            materialsByType[type] = [];
        }
        materialsByType[type].push(m);
    });

    // Generar HTML agrupado
    const html = Object.keys(materialsByType).sort().map(type => {
        const items = materialsByType[type].map(m => `
            <div class="autocomplete-item" onclick="selectProductMaterial(${m.id}, '${lineId}')">
                <strong>${m.desc}</strong>
                <small>${m.unit} - ${formatCurrency(m.price)}</small>
            </div>
        `).join('');
        return `<div style="padding: 8px 12px; background: #f5f5f5; font-size: 11px; font-weight: 600; color: #666; border-bottom: 1px solid #ddd;">${type}</div>${items}`;
    }).join('');

    autocomplete.innerHTML = html;
    autocomplete.classList.add('active');
}

// Seleccionar material del autocomplete
function selectProductMaterial(materialId, lineId) {
    const material = getMaterial(materialId);
    if (!material) return;

    const line = document.getElementById(lineId);
    const searchInput = line.querySelector('.material-search');
    const hiddenInput = line.querySelector('.material-id');
    const autocomplete = document.getElementById(`mat-auto-${lineId}`);

    searchInput.value = material.desc;
    hiddenInput.value = material.id;
    line.querySelector('.unit').value = material.unit;
    line.querySelector('.price').value = material.price;

    autocomplete.classList.remove('active');
    calculateProductPrice();
}

// Búsqueda de actividades con autocomplete
function searchProductLabor(input, lineId) {
    const query = input.value.trim();
    const autocomplete = document.getElementById(`lab-auto-${lineId}`);

    // Si el campo está vacío, mostrar todas las actividades
    let laborList;
    if (!query || query.length === 0) {
        laborList = getAllLabor();
    } else {
        laborList = getAllLabor().filter(l =>
            l.desc.toLowerCase().includes(query.toLowerCase())
        );
    }

    if (laborList.length === 0) {
        autocomplete.innerHTML = '<div class="autocomplete-item" style="color: #999;">No se encontraron actividades</div>';
        autocomplete.classList.add('active');
        return;
    }

    autocomplete.innerHTML = laborList.map(l => `
        <div class="autocomplete-item" onclick="selectProductLabor(${l.id}, '${lineId}')">
            <strong>${l.desc}</strong>
            <small>${l.unit} - ${formatCurrency(l.cost)}</small>
        </div>
    `).join('');

    autocomplete.classList.add('active');
}

// Seleccionar actividad del autocomplete
function selectProductLabor(laborId, lineId) {
    const labor = getLabor(laborId);
    if (!labor) return;

    const line = document.getElementById(lineId);
    const searchInput = line.querySelector('.labor-search');
    const hiddenInput = line.querySelector('.labor-id');
    const autocomplete = document.getElementById(`lab-auto-${lineId}`);

    searchInput.value = labor.desc;
    hiddenInput.value = labor.id;
    line.querySelector('.unit').value = labor.unit;
    line.querySelector('.price').value = labor.cost;

    autocomplete.classList.remove('active');
    calculateProductPrice();
}

// Remover línea
function removeProductLine(lineId) {
    const line = document.getElementById(lineId);
    if (line) {
        line.remove();
        calculateProductPrice();
    }
}

// Calcular subtotal de línea
function calculateProductLineSubtotal(lineId) {
    const line = document.getElementById(lineId);
    if (!line) return;

    const qty = parseFloat(line.querySelector('.qty').value) || 0;
    const price = parseFloat(line.querySelector('.price').value) || 0;
    const subtotal = qty * price;

    line.querySelector('.subtotal').value = formatCurrency(subtotal);
    return subtotal;
}

// Calcular precio unitario del producto
function calculateProductPrice() {
    // Calcular subtotales de cada línea
    document.querySelectorAll('#product-materials-lines .line-item').forEach(line => {
        calculateProductLineSubtotal(line.id);
    });
    document.querySelectorAll('#product-labor-lines .line-item').forEach(line => {
        calculateProductLineSubtotal(line.id);
    });

    // Obtener materiales y MO
    const materials = getProductMaterialLines();
    const labor = getProductLaborLines();
    const type = document.getElementById('product-type').value;

    // Calcular costo base
    let materialsCost = materials.reduce((sum, m) => sum + (m.qty * m.price), 0);
    let laborCost = labor.reduce((sum, l) => sum + (l.qty * l.price), 0);

    // Obtener configuración
    const config = getConfig();

    // Calcular precio según el tipo
    let unitPrice = 0;

    if (type === 'producto') {
        // Producto: aplica margen de suministro
        const totalCost = materialsCost + laborCost;
        const margin = config.margenSuministro / 100;
        unitPrice = totalCost / (1 - margin);
    } else {
        // Servicio: solo MO con AIU
        const aiuTotal = (config.admin + config.imprevistos + config.utilidad) / 100;
        unitPrice = laborCost / (1 - aiuTotal);
    }

    // Mostrar en UI
    const priceElement = document.getElementById('product-unit-price');
    if (priceElement) {
        priceElement.textContent = formatCurrency(Math.round(unitPrice));
    }

    // Actualizar nota del precio según el tipo
    const noteElement = document.getElementById('product-price-note');
    if (noteElement) {
        if (type === 'servicio') {
            noteElement.textContent = 'Incluye AIU (Administración, Imprevistos, Utilidad)';
        } else {
            noteElement.textContent = 'Incluye margen de suministro';
        }
    }
}

// Obtener líneas de materiales del DOM
function getProductMaterialLines() {
    const lines = [];
    const container = document.getElementById('product-materials-lines');
    const lineItems = container.querySelectorAll('.line-item');

    lineItems.forEach(line => {
        const hiddenInput = line.querySelector('.material-id');
        const materialId = parseInt(hiddenInput.value);

        if (materialId) {
            lines.push({
                materialId: materialId,
                qty: parseFloat(line.querySelector('.qty').value) || 0,
                price: parseFloat(line.querySelector('.price').value) || 0
            });
        }
    });

    return lines;
}

// Obtener líneas de MO del DOM
function getProductLaborLines() {
    const lines = [];
    const container = document.getElementById('product-labor-lines');
    const lineItems = container.querySelectorAll('.line-item');

    lineItems.forEach(line => {
        const hiddenInput = line.querySelector('.labor-id');
        const laborId = parseInt(hiddenInput.value);

        if (laborId) {
            lines.push({
                laborId: laborId,
                qty: parseFloat(line.querySelector('.qty').value) || 0,
                price: parseFloat(line.querySelector('.price').value) || 0
            });
        }
    });

    return lines;
}

// Guardar producto
function saveProductFromModal() {
    const name = document.getElementById('product-name').value.trim();
    const type = document.getElementById('product-type').value;

    if (!name) {
        showToast('El nombre es obligatorio', 'error');
        return;
    }

    const materials = getProductMaterialLines();
    const labor = getProductLaborLines();

    // Validar que tenga al menos un componente
    if (materials.length === 0 && labor.length === 0) {
        showToast('Debe agregar al menos un material o actividad', 'error');
        return;
    }

    // Validar que productos tengan materiales
    if (type === 'producto' && materials.length === 0) {
        showToast('Un producto debe tener al menos un material', 'error');
        return;
    }

    // Validar que servicios tengan MO
    if (type === 'servicio' && labor.length === 0) {
        showToast('Un servicio debe tener al menos una actividad', 'error');
        return;
    }

    // Calcular precio unitario
    const priceText = document.getElementById('product-unit-price').textContent;
    const unitPrice = parseCurrency(priceText);

    const product = {
        id: currentProductId || undefined,
        name: name,
        type: type,
        materials: materials,
        labor: labor,
        unitPrice: unitPrice
    };

    const id = saveProduct(product);
    if (id) {
        showToast('Producto guardado exitosamente', 'success');
        closeModal('modal-product');
        renderProductsTable();
    } else {
        showToast('Error al guardar producto', 'error');
    }
}

// Renderizar tabla de productos
function renderProductsTable() {
    filterProducts();
}

function filterProducts() {
    const typeFilter = document.getElementById('filter-products-type')?.value || '';
    const products = getAllProducts();

    const filtered = products.filter(p => {
        const matchesType = !typeFilter || p.type === typeFilter;
        return matchesType;
    });

    const tbody = document.getElementById('products-table');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No se encontraron productos con los filtros seleccionados</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const typeBadge = p.type === 'producto' ? 'badge-approved' : 'badge-pending';
        const typeText = p.type === 'producto' ? 'Producto' : 'Servicio';
        const matCount = p.materials?.length || 0;
        const labCount = p.labor?.length || 0;

        return `
        <tr>
            <td class="mono">${p.code}</td>
            <td><strong>${p.name}</strong></td>
            <td><span class="badge ${typeBadge}">${typeText}</span></td>
            <td>${matCount > 0 ? matCount + ' items' : '-'}</td>
            <td>${labCount > 0 ? labCount + ' act.' : '-'}</td>
            <td class="mono"><strong>${formatCurrency(p.unitPrice)}</strong></td>
            <td class="actions-cell">
                <div class="actions-btn" onclick="toggleDropdown(this, event)">⋮</div>
                <div class="dropdown">
                    <div class="dropdown-item" onclick="executeDropdownAction(() => openProductModal(${p.id}), event)">✏️ Editar</div>
                    <div class="dropdown-item" onclick="executeDropdownAction(() => duplicateProductAction(${p.id}), event)">📋 Duplicar</div>
                    <div class="dropdown-item danger" onclick="executeDropdownAction(() => deleteProductAction(${p.id}), event)">🗑️ Eliminar</div>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function clearProductFilters() {
    if (document.getElementById('filter-products-type')) {
        document.getElementById('filter-products-type').value = '';
    }
    filterProducts();
}

// Duplicar producto
function duplicateProductAction(id) {
    const newId = duplicateProduct(id);
    if (newId) {
        showToast('Producto duplicado exitosamente', 'success');
        renderProductsTable();
    } else {
        showToast('Error al duplicar producto', 'error');
    }
}

// Eliminar producto
function deleteProductAction(id) {
    const product = getProduct(id);
    if (!product) return;

    if (confirm(`¿Está seguro de eliminar "${product.name}"?`)) {
        if (deleteProduct(id)) {
            showToast('Producto eliminado exitosamente', 'success');
            renderProductsTable();
        } else {
            showToast('Error al eliminar producto', 'error');
        }
    }
}
