// WMC Soluciones Metálicas - PDF Generation Module (Product-Based)
// Generación de PDFs de cotización con productos/servicios

// Variable global para rastrear la cotización actual del PDF
window.currentPDFQuoteId = null;

/**
 * Abre el modal de vista previa del PDF
 * @param {number} quoteId - ID de la cotización
 */
function viewQuotePDF(quoteId) {
    const quote = getQuote(quoteId);
    if (!quote) {
        showToast('Cotización no encontrada', 'error');
        return;
    }

    const client = getClient(quote.clientId);
    const config = getConfig();

    // Guardar ID de cotización actual
    window.currentPDFQuoteId = quoteId;

    // Generar contenido del PDF en el modal
    document.getElementById('pdf-content').innerHTML = generatePDFHTML(quote, client, config);

    openModal('modal-pdf');
}

/**
 * Genera el HTML para el PDF con diseño limpio enfocado en productos
 * @param {Object} quote - Cotización
 * @param {Object} client - Cliente
 * @param {Object} config - Configuración
 * @returns {string} HTML del PDF
 */
function generatePDFHTML(quote, client, config) {
    const date = formatDate(quote.date);
    const validUntil = new Date(quote.date);
    validUntil.setDate(validUntil.getDate() + config.vigencia);

    return `
        <div style="font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; padding: 20px; background: white;">
            <!-- Header -->
            <div style="border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="background: white; padding: 8px; border-radius: 8px; border: 1px solid #e5e5e5;">
                        <img src="https://i.ibb.co/zVRsqhBp/Picture1.jpg" alt="WMC Logo" style="height: 60px; width: auto; display: block;">
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; color: #333; font-size: 18px;">COTIZACIÓN</h2>
                        <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600; font-family: monospace;">${quote.number}</p>
                        <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Fecha: ${date}</p>
                        <p style="margin: 2px 0 0 0; color: #666; font-size: 11px;">Válida hasta: ${formatDate(validUntil.toISOString().split('T')[0])}</p>
                    </div>
                </div>
            </div>

            <!-- Información del Cliente -->
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 12px 0; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Información del Cliente</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <p style="margin: 0; color: #666; font-size: 11px;">EMPRESA</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600;">${client.name}</p>
                    </div>
                    <div>
                        <p style="margin: 0; color: #666; font-size: 11px;">NIT</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; font-family: monospace;">${client.nit}</p>
                    </div>
                    <div>
                        <p style="margin: 0; color: #666; font-size: 11px;">PROYECTO</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600;">${quote.project}</p>
                    </div>
                    <div>
                        <p style="margin: 0; color: #666; font-size: 11px;">CONTACTO</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px;">${client.contact || client.email || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <!-- Detalle de Productos y Servicios -->
            <div style="margin-bottom: 25px;">
                <h3 style="margin: 0 0 12px 0; color: #333; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px;">DETALLE DE LA OFERTA</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">ITEM</th>
                            <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; width: 80px;">TIPO</th>
                            <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; width: 60px;">CANT</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 100px;">PRECIO UNIT.</th>
                            ${quote.items.some(item => item.discount > 0) ? '<th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; width: 60px;">DESC.</th>' : ''}
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 110px;">SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quote.items.map((item, index) => {
                            const typeBadge = item.type === 'servicio'
                                ? '<span style="background:#3b82f6;color:white;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;">SERVICIO</span>'
                                : '<span style="background:#10b981;color:white;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;">PRODUCTO</span>';

                            const hasDiscount = quote.items.some(i => i.discount > 0);
                            const discountCell = item.discount > 0
                                ? `<td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee; color: #dc2626; font-weight: 600;">${item.discount}%</td>`
                                : (hasDiscount ? '<td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">-</td>' : '');

                            return `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                                    <strong style="display:block;margin-bottom:2px;">${index + 1}. ${item.name}</strong>
                                </td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${typeBadge}</td>
                                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee; font-family: monospace; font-weight: 600;">${item.qty}</td>
                                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee; font-family: monospace;">${formatCurrency(item.unitPrice)}</td>
                                ${discountCell}
                                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee; font-family: monospace; font-weight: 600;">${formatCurrency(item.subtotal)}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Totales -->
            <div style="margin-top: 30px;">
                <div style="display: flex; justify-content: flex-end;">
                    <div style="width: 350px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e5e5;">
                            <span style="color: #666; font-size: 12px;">Subtotal:</span>
                            <span style="font-family: monospace; font-size: 13px; font-weight: 600;">${formatCurrency(quote.totals.itemsSubtotal)}</span>
                        </div>
                        ${quote.generalDiscount > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e5e5;">
                            <span style="color: #dc2626; font-size: 12px;">Descuento General (${quote.generalDiscount}%):</span>
                            <span style="font-family: monospace; font-size: 13px; font-weight: 600; color: #dc2626;">-${formatCurrency(quote.totals.generalDiscountAmount)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e5e5;">
                            <span style="color: #666; font-size: 12px;">Subtotal con Descuento:</span>
                            <span style="font-family: monospace; font-size: 13px; font-weight: 600;">${formatCurrency(quote.totals.afterDiscount)}</span>
                        </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 2px solid #333; margin-bottom: 8px;">
                            <span style="color: #666; font-size: 12px;">IVA (${config.iva}%):</span>
                            <span style="font-family: monospace; font-size: 13px; font-weight: 600;">${formatCurrency(quote.totals.iva)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                            <span style="color: #333; font-size: 14px; font-weight: 700;">TOTAL:</span>
                            <span style="font-family: monospace; font-size: 18px; font-weight: 700; color: #f97316;">${formatCurrency(quote.totals.grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Observaciones -->
            ${quote.observations ? `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e5e5;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Observaciones</h3>
                <p style="margin: 0; color: #666; font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${quote.observations}</p>
            </div>
            ` : ''}

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
                <p style="margin: 0; color: #999; font-size: 10px;">WMC Soluciones Metálicas - Bogotá, Colombia</p>
                <p style="margin: 4px 0 12px 0; color: #999; font-size: 10px;">Esta cotización es válida por ${config.vigencia} días</p>
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
                    <span style="font-size: 9px; color: #aaa; font-weight: 500;">Powered by</span>
                    <img src="https://i.ibb.co/sdb3Bpq5/M-trik-logo-iso.png" alt="MéTRIK" style="height: 18px; width: auto; opacity: 0.7;">
                </div>
            </div>
        </div>
    `;
}

/**
 * Exportar PDF desde modal de vista previa
 */
function exportPDF() {
    if (!window.currentPDFQuoteId) {
        showToast('Error: no hay cotización seleccionada', 'error');
        return;
    }

    const quote = getQuote(window.currentPDFQuoteId);
    const client = getClient(quote.clientId);

    if (!quote || !client) {
        showToast('Error al cargar datos de la cotización', 'error');
        return;
    }

    // Usar el contenido que ya está renderizado en el modal
    const pdfContent = document.getElementById('pdf-content');

    if (!pdfContent || !pdfContent.innerHTML.trim()) {
        showToast('Error: contenido del PDF vacío', 'error');
        return;
    }

    showLoading('Generando PDF...');

    // Configuración de html2pdf
    const opt = {
        margin: [15, 15, 15, 15],
        filename: `${quote.number}_${client.name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    // Generar PDF desde el contenido del modal
    html2pdf().set(opt).from(pdfContent).save().then(() => {
        hideLoading();
        closeModal('modal-pdf');
        showToast('PDF generado exitosamente', 'success');
    }).catch(err => {
        console.error('Error al generar PDF:', err);
        hideLoading();
        showToast('Error al generar PDF: ' + err.message, 'error');
    });
}

/**
 * Cambiar entre tabs del PDF
 * @param {string} tabName - 'resumen' o 'detalle'
 */
function switchPDFTab(tabName) {
    const quote = getQuote(window.currentPDFQuoteId);
    if (!quote) return;

    const client = getClient(quote.clientId);
    const config = getConfig();

    // Actualizar tabs activos
    document.querySelectorAll('[data-pdftab]').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-pdftab="${tabName}"]`).classList.add('active');

    // Generar contenido según el tab
    const contentDiv = document.getElementById('pdf-content');
    if (tabName === 'resumen') {
        contentDiv.innerHTML = generatePDFHTML(quote, client, config);
    } else if (tabName === 'detalle') {
        contentDiv.innerHTML = generateBOMHTML(quote, client, config);
    }
}

/**
 * Genera HTML del BOM (Bill of Materials) para uso interno
 * @param {Object} quote - Cotización
 * @param {Object} client - Cliente
 * @param {Object} config - Configuración
 * @returns {string} HTML del BOM
 */
function generateBOMHTML(quote, client, config) {
    const date = formatDate(quote.date);

    // Recopilar todos los materiales y mano de obra de todos los items
    const allMaterials = {};
    const allLabor = {};

    quote.items.forEach(item => {
        const product = getProduct(item.productId);
        if (!product) return;

        // Agregar materiales
        if (product.materials && product.materials.length > 0) {
            product.materials.forEach(m => {
                const materialId = m.materialId;
                const material = getMaterial(materialId);
                if (!material) return;

                const qtyNeeded = m.qty * item.qty; // cantidad del material * cantidad del producto

                if (!allMaterials[materialId]) {
                    allMaterials[materialId] = {
                        ...material,
                        totalQty: 0,
                        totalCost: 0
                    };
                }

                allMaterials[materialId].totalQty += qtyNeeded;
                allMaterials[materialId].totalCost += qtyNeeded * material.price;
            });
        }

        // Agregar mano de obra
        if (product.labor && product.labor.length > 0) {
            product.labor.forEach(l => {
                const laborId = l.laborId;
                const labor = getLabor(laborId);
                if (!labor) return;

                const qtyNeeded = l.qty * item.qty;

                if (!allLabor[laborId]) {
                    allLabor[laborId] = {
                        ...labor,
                        totalQty: 0,
                        totalCost: 0
                    };
                }

                allLabor[laborId].totalQty += qtyNeeded;
                allLabor[laborId].totalCost += qtyNeeded * labor.cost;
            });
        }
    });

    const materialsArray = Object.values(allMaterials);
    const laborArray = Object.values(allLabor);

    const totalMaterialsCost = materialsArray.reduce((sum, m) => sum + m.totalCost, 0);
    const totalLaborCost = laborArray.reduce((sum, l) => sum + l.totalCost, 0);
    const grandTotal = totalMaterialsCost + totalLaborCost;

    return `
        <div style="font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; padding: 20px; background: white;">
            <!-- Header -->
            <div style="border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="background: white; padding: 8px; border-radius: 8px; border: 1px solid #e5e5e5;">
                            <img src="https://i.ibb.co/zVRsqhBp/Picture1.jpg" alt="WMC Logo" style="height: 60px; width: auto; display: block;">
                        </div>
                        <div>
                            <h2 style="margin: 0; color: #333; font-size: 18px;">DETALLE TÉCNICO (USO INTERNO)</h2>
                            <p style="margin: 6px 0 0 0; color: #666; font-size: 11px;">Bill of Materials - BOM</p>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 16px; font-weight: 600; font-family: monospace;">${quote.number}</p>
                        <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Fecha: ${date}</p>
                    </div>
                </div>
            </div>

            <!-- Info básica -->
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #dc2626;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <p style="margin: 0; color: #666; font-size: 11px;">CLIENTE</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600;">${client.name}</p>
                    </div>
                    <div>
                        <p style="margin: 0; color: #666; font-size: 11px;">PROYECTO</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600;">${quote.project}</p>
                    </div>
                </div>
            </div>

            <!-- Resumen de productos -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #333; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px;">PRODUCTOS/SERVICIOS A FABRICAR</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">ITEM</th>
                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; width: 80px;">CANTIDAD</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quote.items.map(item => {
                            const product = getProduct(item.productId);
                            return `
                                <tr style="border-bottom: 1px solid #e5e5e5;">
                                    <td style="padding: 8px;">${product?.name || 'Producto no encontrado'}</td>
                                    <td style="padding: 8px; text-align: center; font-family: monospace;">${item.qty}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- MATERIALES -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">MATERIALES REQUERIDOS</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
                    <thead>
                        <tr style="background: #fef2f2;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">CÓDIGO</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">DESCRIPCIÓN</th>
                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; width: 60px;">UND</th>
                            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 80px;">CANTIDAD</th>
                            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 100px;">COSTO UNIT.</th>
                            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 110px;">COSTO TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${materialsArray.length > 0 ? materialsArray.map(mat => `
                            <tr style="border-bottom: 1px solid #e5e5e5;">
                                <td style="padding: 8px; font-family: monospace; font-size: 10px;">${mat.code}</td>
                                <td style="padding: 8px;">${mat.desc}</td>
                                <td style="padding: 8px; text-align: center; font-family: monospace;">${mat.unit}</td>
                                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;">${mat.totalQty.toFixed(2)}</td>
                                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatCurrency(mat.price)}</td>
                                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;">${formatCurrency(mat.totalCost)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="6" style="padding: 15px; text-align: center; color: #999;">No hay materiales</td></tr>'}
                        ${materialsArray.length > 0 ? `
                            <tr style="background: #fef2f2; font-weight: 600;">
                                <td colspan="5" style="padding: 10px; text-align: right;">SUBTOTAL MATERIALES:</td>
                                <td style="padding: 10px; text-align: right; font-family: monospace;">${formatCurrency(totalMaterialsCost)}</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>

            <!-- MANO DE OBRA -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">MANO DE OBRA REQUERIDA</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
                    <thead>
                        <tr style="background: #fef2f2;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">CÓDIGO</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600;">ACTIVIDAD</th>
                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; width: 80px;">TIPO</th>
                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd; font-weight: 600; width: 60px;">UND</th>
                            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 80px;">CANTIDAD</th>
                            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 100px;">COSTO UNIT.</th>
                            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; width: 110px;">COSTO TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${laborArray.length > 0 ? laborArray.map(lab => `
                            <tr style="border-bottom: 1px solid #e5e5e5;">
                                <td style="padding: 8px; font-family: monospace; font-size: 10px;">${lab.code}</td>
                                <td style="padding: 8px;">${lab.desc}</td>
                                <td style="padding: 8px; text-align: center;">
                                    <span style="background: ${lab.type === 'fabricacion' ? '#3b82f6' : '#10b981'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600;">
                                        ${lab.type === 'fabricacion' ? 'FAB' : 'INST'}
                                    </span>
                                </td>
                                <td style="padding: 8px; text-align: center; font-family: monospace;">${lab.unit}</td>
                                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;">${lab.totalQty.toFixed(2)}</td>
                                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatCurrency(lab.cost)}</td>
                                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 600;">${formatCurrency(lab.totalCost)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="7" style="padding: 15px; text-align: center; color: #999;">No hay mano de obra</td></tr>'}
                        ${laborArray.length > 0 ? `
                            <tr style="background: #fef2f2; font-weight: 600;">
                                <td colspan="6" style="padding: 10px; text-align: right;">SUBTOTAL MANO DE OBRA:</td>
                                <td style="padding: 10px; text-align: right; font-family: monospace;">${formatCurrency(totalLaborCost)}</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>

            <!-- TOTALES -->
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; border: 2px solid #dc2626;">
                <table style="width: 100%; font-size: 12px;">
                    <tr>
                        <td style="padding: 6px 0; color: #666;">Costo total materiales:</td>
                        <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 600;">${formatCurrency(totalMaterialsCost)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #666;">Costo total mano de obra:</td>
                        <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 600;">${formatCurrency(totalLaborCost)}</td>
                    </tr>
                    <tr style="border-top: 2px solid #dc2626;">
                        <td style="padding: 12px 0 0 0; font-size: 14px; font-weight: 700; color: #dc2626;">COSTO DIRECTO TOTAL:</td>
                        <td style="padding: 12px 0 0 0; text-align: right; font-family: monospace; font-size: 16px; font-weight: 700; color: #dc2626;">${formatCurrency(grandTotal)}</td>
                    </tr>
                </table>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e5e5; text-align: center;">
                <p style="margin: 0; color: #999; font-size: 10px;">DOCUMENTO DE USO INTERNO - NO COMPARTIR CON EL CLIENTE</p>
                <div style="margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="font-size: 9px; color: #999;">Powered by</span>
                    <img src="https://i.ibb.co/sdb3Bpq5/M-trik-logo-iso.png" alt="MéTRIK" style="height: 16px;">
                </div>
            </div>
        </div>
    `;
}
