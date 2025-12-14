// WMC Soluciones Metálicas - Catalogs Module
// CRUD de clientes, materiales y mano de obra

// === CLIENTES ===

let currentClientId = null;

function openClientModal(clientId = null) {
    currentClientId = clientId;

    if (clientId) {
        const client = getClient(clientId);
        if (!client) return;

        document.getElementById('client-modal-title').textContent = 'Editar Cliente';
        document.getElementById('client-edit-id').value = client.id;
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-nit').value = client.nit;
        document.getElementById('client-contact').value = client.contact || '';
        document.getElementById('client-phone').value = client.phone || '';
        document.getElementById('client-email').value = client.email || '';
        document.getElementById('client-city').value = client.city || '';
    } else {
        document.getElementById('client-modal-title').textContent = 'Nuevo Cliente';
        document.getElementById('client-edit-id').value = '';
        document.getElementById('client-name').value = '';
        document.getElementById('client-nit').value = '';
        document.getElementById('client-contact').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('client-city').value = '';
    }

    openModal('modal-client');
}

function saveClientForm() {
    const name = document.getElementById('client-name').value.trim();
    const nit = document.getElementById('client-nit').value.trim();
    const email = document.getElementById('client-email').value.trim();

    if (!name) {
        showToast('El nombre de la empresa es obligatorio', 'error');
        return;
    }

    if (!nit) {
        showToast('El NIT es obligatorio', 'error');
        return;
    }

    if (email && !isValidEmail(email)) {
        showToast('Email inválido', 'error');
        return;
    }

    const client = {
        id: currentClientId || undefined,
        name: name,
        nit: nit,
        contact: document.getElementById('client-contact').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        email: email,
        city: document.getElementById('client-city').value.trim()
    };

    const id = saveClient(client);
    if (id) {
        showToast('Cliente guardado exitosamente', 'success');
        closeModal('modal-client');
        renderClientsTable();
    } else {
        showToast('Error al guardar cliente', 'error');
    }
}

function renderClientsTable() {
    const tbody = document.getElementById('clients-table');
    const clients = getAllClients();

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay clientes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = clients.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td class="mono">${c.nit}</td>
            <td>${c.contact || '-'}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.city || '-'}</td>
            <td class="actions-cell">
                <div class="actions-btn" onclick="toggleDropdown(this, event)">⋮</div>
                <div class="dropdown">
                    <div class="dropdown-item" onclick="executeDropdownAction(() => openClientModal(${c.id}), event)">✏️ Editar</div>
                    <div class="dropdown-item danger" onclick="executeDropdownAction(() => deleteClientAction(${c.id}), event)">🗑️ Eliminar</div>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteClientAction(id) {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
        const result = deleteClient(id);
        if (result.success) {
            showToast('Cliente eliminado', 'success');
            renderClientsTable();
        } else {
            showToast(result.error || 'Error al eliminar cliente', 'error');
        }
    }
}

// Autocompletado de clientes
function searchClients(query) {
    const autocomplete = document.getElementById('client-autocomplete');

    if (!query || query.length < 2) {
        autocomplete.classList.remove('active');
        return;
    }

    const clients = getAllClients().filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.nit.includes(query)
    );

    if (clients.length === 0) {
        autocomplete.classList.remove('active');
        return;
    }

    autocomplete.innerHTML = clients.map(c => `
        <div class="autocomplete-item" onclick="selectClient(${c.id})">
            <strong>${c.name}</strong>
            <small>${c.nit}</small>
        </div>
    `).join('');

    autocomplete.classList.add('active');
}

function selectClient(id) {
    const client = getClient(id);
    if (!client) return;

    document.getElementById('quote-client').value = client.name;
    document.getElementById('quote-client-id').value = client.id;
    document.getElementById('quote-nit').value = client.nit;
    document.getElementById('client-autocomplete').classList.remove('active');
}

// === MATERIALES ===

let currentMaterialId = null;

function openMaterialModal(materialId = null) {
    currentMaterialId = materialId;

    if (materialId) {
        const material = getMaterial(materialId);
        if (!material) return;

        document.getElementById('material-modal-title').textContent = 'Editar Material';
        document.getElementById('material-edit-id').value = material.id;
        document.getElementById('material-code').value = material.code;
        document.getElementById('material-desc').value = material.desc;
        document.getElementById('material-type').value = material.type || 'Perfil';
        document.getElementById('material-unit').value = material.unit;
        document.getElementById('material-price').value = material.price;
    } else {
        document.getElementById('material-modal-title').textContent = 'Nuevo Material';
        document.getElementById('material-edit-id').value = '';
        document.getElementById('material-code').value = '';
        document.getElementById('material-desc').value = '';
        document.getElementById('material-type').value = 'Perfil';
        document.getElementById('material-unit').value = 'UND';
        document.getElementById('material-price').value = '';
    }

    openModal('modal-material');
}

function saveMaterialForm() {
    let code = document.getElementById('material-code').value.trim();
    const desc = document.getElementById('material-desc').value.trim();
    const type = document.getElementById('material-type').value;
    const unit = document.getElementById('material-unit').value;
    const price = parseFloat(document.getElementById('material-price').value);

    if (!desc) {
        showToast('La descripción es obligatoria', 'error');
        return;
    }

    if (!type) {
        showToast('Debe seleccionar un tipo', 'error');
        return;
    }

    if (!price || price < 0) {
        showToast('Precio inválido', 'error');
        return;
    }

    // Generar código automático si no existe
    if (!code && !currentMaterialId) {
        const materials = getAllMaterials();
        const maxNum = materials.reduce((max, m) => {
            const match = m.code.match(/MAT-(\d+)/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        code = `MAT-${String(maxNum + 1).padStart(3, '0')}`;
    }

    const material = {
        id: currentMaterialId || undefined,
        code: code,
        desc: desc,
        type: type,
        unit: unit,
        price: price
    };

    const id = saveMaterial(material);
    if (id) {
        showToast('Material guardado exitosamente', 'success');
        closeModal('modal-material');
        renderMaterialsTable();
    } else {
        showToast('Error al guardar material', 'error');
    }
}

function renderMaterialsTable() {
    populateMaterialTypeFilter();
    filterMaterials();
}

function populateMaterialTypeFilter() {
    const select = document.getElementById('filter-materials-type');
    if (!select) return;

    const materials = getAllMaterials();
    const types = [...new Set(materials.map(m => m.type).filter(t => t))];

    const currentOptions = select.innerHTML;
    const newOptions = '<option value="">Todos</option>' +
        types.map(t => `<option value="${t}">${t}</option>`).join('');

    if (currentOptions !== newOptions) {
        select.innerHTML = newOptions;
    }
}

function filterMaterials() {
    const typeFilter = document.getElementById('filter-materials-type')?.value || '';
    const materials = getAllMaterials();

    const filtered = materials.filter(m => {
        const matchesType = !typeFilter || m.type === typeFilter;
        return matchesType;
    });

    const tbody = document.getElementById('materials-table');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No se encontraron materiales con los filtros seleccionados</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(m => `
        <tr>
            <td class="mono">${m.code}</td>
            <td>${m.desc}</td>
            <td><span class="badge badge-approved">${m.type || 'N/A'}</span></td>
            <td>${m.unit}</td>
            <td class="mono">${formatCurrency(m.price)}</td>
            <td class="actions-cell">
                <div class="actions-btn" onclick="toggleDropdown(this, event)">⋮</div>
                <div class="dropdown">
                    <div class="dropdown-item" onclick="executeDropdownAction(() => openMaterialModal(${m.id}), event)">✏️ Editar</div>
                    <div class="dropdown-item danger" onclick="executeDropdownAction(() => deleteMaterialAction(${m.id}), event)">🗑️ Eliminar</div>
                </div>
            </td>
        </tr>
    `).join('');
}

function clearMaterialFilters() {
    if (document.getElementById('filter-materials-type')) {
        document.getElementById('filter-materials-type').value = '';
    }
    filterMaterials();
}

function deleteMaterialAction(id) {
    if (confirm('¿Está seguro de eliminar este material?')) {
        if (deleteMaterial(id)) {
            showToast('Material eliminado', 'success');
            renderMaterialsTable();
        } else {
            showToast('Error al eliminar material', 'error');
        }
    }
}

// === MANO DE OBRA ===

let currentLaborId = null;

function openLaborModal(laborId = null) {
    currentLaborId = laborId;

    if (laborId) {
        const labor = getLabor(laborId);
        if (!labor) return;

        document.getElementById('labor-modal-title').textContent = 'Editar Actividad';
        document.getElementById('labor-edit-id').value = labor.id;
        document.getElementById('labor-code').value = labor.code;
        document.getElementById('labor-desc').value = labor.desc;
        document.getElementById('labor-type').value = labor.type;
        document.getElementById('labor-unit').value = labor.unit;
        document.getElementById('labor-cost').value = labor.cost;
    } else {
        document.getElementById('labor-modal-title').textContent = 'Nueva Actividad';
        document.getElementById('labor-edit-id').value = '';
        document.getElementById('labor-code').value = '';
        document.getElementById('labor-desc').value = '';
        document.getElementById('labor-type').value = 'fabricacion';
        document.getElementById('labor-unit').value = 'JOR';
        document.getElementById('labor-cost').value = '25000';
    }

    openModal('modal-labor');
}

function saveLaborForm() {
    let code = document.getElementById('labor-code').value.trim();
    const desc = document.getElementById('labor-desc').value.trim();
    const type = document.getElementById('labor-type').value;
    const unit = document.getElementById('labor-unit').value;
    const cost = parseFloat(document.getElementById('labor-cost').value);

    if (!desc) {
        showToast('La descripción es obligatoria', 'error');
        return;
    }

    if (!cost || cost < 0) {
        showToast('Costo inválido', 'error');
        return;
    }

    // Generar código automático si no existe
    if (!code && !currentLaborId) {
        const allLabor = getAllLabor();
        const prefix = type === 'fabricacion' ? 'MO-FAB-' : 'MO-INS-';
        const sameTypeLabor = allLabor.filter(l => l.code.startsWith(prefix));
        const maxNum = sameTypeLabor.reduce((max, l) => {
            const match = l.code.match(/\d+$/);
            return match ? Math.max(max, parseInt(match[0])) : max;
        }, 0);
        code = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
    }

    const labor = {
        id: currentLaborId || undefined,
        code: code,
        desc: desc,
        type: type,
        unit: unit,
        cost: cost
    };

    const id = saveLabor(labor);
    if (id) {
        showToast('Actividad guardada exitosamente', 'success');
        closeModal('modal-labor');
        renderLaborTable();
    } else {
        showToast('Error al guardar actividad', 'error');
    }
}

function renderLaborTable() {
    filterLabor();
}

function filterLabor() {
    const typeFilter = document.getElementById('filter-labor-type')?.value || '';
    const labor = getAllLabor();

    const filtered = labor.filter(l => {
        const matchesType = !typeFilter || l.type === typeFilter;
        return matchesType;
    });

    const tbody = document.getElementById('labor-table');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No se encontraron actividades con los filtros seleccionados</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(l => {
        const typeText = l.type === 'fabricacion' ? 'Fabricación' : 'Instalación';
        const typeBadge = l.type === 'fabricacion' ? 'badge-approved' : 'badge-pending';

        return `
        <tr>
            <td class="mono">${l.code}</td>
            <td>${l.desc}</td>
            <td><span class="badge ${typeBadge}">${typeText}</span></td>
            <td>${l.unit}</td>
            <td class="mono">${formatCurrency(l.cost)}</td>
            <td class="actions-cell">
                <div class="actions-btn" onclick="toggleDropdown(this, event)">⋮</div>
                <div class="dropdown">
                    <div class="dropdown-item" onclick="executeDropdownAction(() => openLaborModal(${l.id}), event)">✏️ Editar</div>
                    <div class="dropdown-item danger" onclick="executeDropdownAction(() => deleteLaborAction(${l.id}), event)">🗑️ Eliminar</div>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function clearLaborFilters() {
    if (document.getElementById('filter-labor-type')) {
        document.getElementById('filter-labor-type').value = '';
    }
    filterLabor();
}

function deleteLaborAction(id) {
    if (confirm('¿Está seguro de eliminar esta actividad?')) {
        if (deleteLabor(id)) {
            showToast('Actividad eliminada', 'success');
            renderLaborTable();
        } else {
            showToast('Error al eliminar actividad', 'error');
        }
    }
}

// === CONFIGURACIÓN ===

function loadConfigForm() {
    const config = getConfig();

    document.getElementById('config-admin').value = config.admin;
    document.getElementById('config-imprevistos').value = config.imprevistos;
    document.getElementById('config-utilidad').value = config.utilidad;
    document.getElementById('config-iva').value = config.iva;
    document.getElementById('config-vigencia').value = config.vigencia;
    document.getElementById('config-margen-suministro').value = config.margenSuministro;
    document.getElementById('config-margen-instalacion').value = config.margenInstalacion;
    document.getElementById('config-observaciones').value = config.observaciones;
}

function saveConfig() {
    const config = {
        admin: parseFloat(document.getElementById('config-admin').value),
        imprevistos: parseFloat(document.getElementById('config-imprevistos').value),
        utilidad: parseFloat(document.getElementById('config-utilidad').value),
        iva: parseFloat(document.getElementById('config-iva').value),
        vigencia: parseInt(document.getElementById('config-vigencia').value),
        margenSuministro: parseFloat(document.getElementById('config-margen-suministro').value),
        margenInstalacion: parseFloat(document.getElementById('config-margen-instalacion').value),
        observaciones: document.getElementById('config-observaciones').value
    };

    if (updateConfig(config)) {
        showToast('Configuración guardada exitosamente', 'success');
    } else {
        showToast('Error al guardar configuración', 'error');
    }
}
