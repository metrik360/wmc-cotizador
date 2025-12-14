// WMC Soluciones Metálicas - Calculations Module
// Fórmulas de cálculo de cotizaciones

/**
 * Calcula los totales de una cotización completa
 * @param {Object} quoteData - Datos de la cotización
 * @returns {Object} Totales calculados
 */
function calculateQuoteTotals(quoteData) {
    const {
        materials = [],
        laborFab = [],
        laborInst = [],
        marginSupply = 30,
        marginInstall = 45,
        aiuAdmin = 7,
        aiuImprevistos = 7,
        aiuUtilidad = 5
    } = quoteData;

    // === SUMINISTRO ===

    // Costo directo de materiales
    const materialsCost = materials.reduce((sum, item) => {
        return sum + (item.qty * item.price);
    }, 0);

    // Costo directo de mano de obra de fabricación
    const laborFabCost = laborFab.reduce((sum, item) => {
        return sum + (item.qty * item.price);
    }, 0);

    // Costo directo total de suministro
    const supplyCost = materialsCost + laborFabCost;

    // Precio de venta de suministro (aplicando margen)
    // Fórmula: Precio = Costo / (1 - margen%)
    const supplyTotal = supplyCost / (1 - marginSupply / 100);

    // IVA sobre suministro (19%)
    const supplyIva = supplyTotal * 0.19;

    // Total final de suministro
    const supplyFinal = supplyTotal + supplyIva;

    // === INSTALACIÓN ===

    // Costo directo de mano de obra de instalación
    const installCost = laborInst.reduce((sum, item) => {
        return sum + (item.qty * item.price);
    }, 0);

    // Precio base de instalación (aplicando margen)
    const installBase = installCost / (1 - marginInstall / 100);

    // Calcular AIU
    const aiuAdminValue = installBase * (aiuAdmin / 100);
    const aiuImprevistosValue = installBase * (aiuImprevistos / 100);
    const aiuUtilidadValue = installBase * (aiuUtilidad / 100);
    const aiuTotal = aiuAdminValue + aiuImprevistosValue + aiuUtilidadValue;

    // IVA solo sobre la utilidad
    const installIva = aiuUtilidadValue * 0.19;

    // Total final de instalación
    const installFinal = installBase + aiuTotal + installIva;

    // === TOTAL GENERAL ===
    const grandTotal = supplyFinal + installFinal;

    return {
        // Suministro
        supplyCost: roundToTwo(supplyCost),
        supplyTotal: roundToTwo(supplyTotal),
        supplyIva: roundToTwo(supplyIva),
        supplyFinal: roundToTwo(supplyFinal),

        // Instalación
        installCost: roundToTwo(installCost),
        installBase: roundToTwo(installBase),
        installTotal: roundToTwo(installBase),
        aiuAdmin: roundToTwo(aiuAdminValue),
        aiuImprevistos: roundToTwo(aiuImprevistosValue),
        aiuUtilidad: roundToTwo(aiuUtilidadValue),
        aiuTotal: roundToTwo(aiuTotal),
        installIva: roundToTwo(installIva),
        installFinal: roundToTwo(installFinal),

        // Total
        grandTotal: roundToTwo(grandTotal)
    };
}

/**
 * Calcula el subtotal de una línea de material/mano de obra
 * @param {number} qty - Cantidad
 * @param {number} price - Precio unitario
 * @returns {number} Subtotal
 */
function calculateLineSubtotal(qty, price) {
    const quantity = parseFloat(qty) || 0;
    const unitPrice = parseFloat(price) || 0;
    return roundToTwo(quantity * unitPrice);
}

/**
 * Calcula el margen de ganancia real
 * @param {number} cost - Costo directo
 * @param {number} price - Precio de venta
 * @returns {number} Porcentaje de margen
 */
function calculateMargin(cost, price) {
    if (price === 0) return 0;
    return roundToTwo(((price - cost) / price) * 100);
}

/**
 * Calcula el precio de venta dado un costo y margen deseado
 * @param {number} cost - Costo directo
 * @param {number} marginPercent - Margen deseado (%)
 * @returns {number} Precio de venta
 */
function calculatePriceFromMargin(cost, marginPercent) {
    if (marginPercent >= 100) return cost * 2; // Prevenir división por cero
    return roundToTwo(cost / (1 - marginPercent / 100));
}

/**
 * Valida que los valores de una cotización sean correctos
 * @param {Object} quoteData - Datos de la cotización
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
function validateQuoteCalculations(quoteData) {
    const errors = [];

    // Validar materiales
    if (!quoteData.materials || quoteData.materials.length === 0) {
        if ((!quoteData.laborFab || quoteData.laborFab.length === 0) &&
            (!quoteData.laborInst || quoteData.laborInst.length === 0)) {
            errors.push('Debe agregar al menos un material o actividad de mano de obra');
        }
    }

    // Validar márgenes
    if (quoteData.marginSupply < 0 || quoteData.marginSupply >= 100) {
        errors.push('El margen de suministro debe estar entre 0% y 99%');
    }

    if (quoteData.marginInstall < 0 || quoteData.marginInstall >= 100) {
        errors.push('El margen de instalación debe estar entre 0% y 99%');
    }

    // Validar AIU
    if (quoteData.aiuAdmin < 0 || quoteData.aiuAdmin > 50) {
        errors.push('El % de administración debe estar entre 0% y 50%');
    }

    if (quoteData.aiuImprevistos < 0 || quoteData.aiuImprevistos > 50) {
        errors.push('El % de imprevistos debe estar entre 0% y 50%');
    }

    if (quoteData.aiuUtilidad < 0 || quoteData.aiuUtilidad > 50) {
        errors.push('El % de utilidad debe estar entre 0% y 50%');
    }

    // Validar líneas de materiales
    if (quoteData.materials) {
        quoteData.materials.forEach((item, index) => {
            if (!item.desc || item.desc.trim() === '') {
                errors.push(`Material en línea ${index + 1}: falta descripción`);
            }
            if (!item.qty || item.qty <= 0) {
                errors.push(`Material en línea ${index + 1}: cantidad inválida`);
            }
            if (!item.price || item.price < 0) {
                errors.push(`Material en línea ${index + 1}: precio inválido`);
            }
        });
    }

    // Validar líneas de mano de obra
    const allLabor = [
        ...(quoteData.laborFab || []),
        ...(quoteData.laborInst || [])
    ];

    allLabor.forEach((item, index) => {
        if (!item.desc || item.desc.trim() === '') {
            errors.push(`Mano de obra en línea ${index + 1}: falta descripción`);
        }
        if (!item.qty || item.qty <= 0) {
            errors.push(`Mano de obra en línea ${index + 1}: cantidad inválida`);
        }
        if (!item.price || item.price < 0) {
            errors.push(`Mano de obra en línea ${index + 1}: precio inválido`);
        }
    });

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Calcula estadísticas de márgenes para reporte
 * @param {Object} totals - Totales calculados de la cotización
 * @param {Object} quoteData - Datos originales de la cotización
 * @returns {Object} Estadísticas de márgenes
 */
function calculateMarginStats(totals, quoteData) {
    return {
        supplyMarginPercent: calculateMargin(totals.supplyCost, totals.supplyTotal),
        supplyMarginValue: roundToTwo(totals.supplyTotal - totals.supplyCost),
        installMarginPercent: calculateMargin(totals.installCost, totals.installBase),
        installMarginValue: roundToTwo(totals.installBase - totals.installCost),
        totalCost: roundToTwo(totals.supplyCost + totals.installCost),
        totalRevenue: roundToTwo(totals.grandTotal),
        totalProfit: roundToTwo(totals.grandTotal - (totals.supplyCost + totals.installCost)),
        overallMarginPercent: calculateMargin(
            totals.supplyCost + totals.installCost,
            totals.grandTotal
        )
    };
}

/**
 * Calcula el desglose de impuestos
 * @param {Object} totals - Totales de la cotización
 * @returns {Object} Desglose de impuestos
 */
function calculateTaxBreakdown(totals) {
    return {
        ivaSupply: totals.supplyIva,
        ivaInstall: totals.installIva,
        ivaTotal: roundToTwo(totals.supplyIva + totals.installIva),
        taxableBaseSupply: totals.supplyTotal,
        taxableBaseInstall: totals.aiuUtilidad, // Solo utilidad es base gravable
        beforeTaxTotal: roundToTwo(totals.supplyTotal + totals.installBase + totals.aiuTotal),
        afterTaxTotal: totals.grandTotal
    };
}

/**
 * Compara dos cotizaciones
 * @param {Object} quote1 - Primera cotización
 * @param {Object} quote2 - Segunda cotización
 * @returns {Object} Comparación
 */
function compareQuotes(quote1, quote2) {
    const totals1 = calculateQuoteTotals(quote1);
    const totals2 = calculateQuoteTotals(quote2);

    return {
        difference: roundToTwo(totals2.grandTotal - totals1.grandTotal),
        percentChange: roundToTwo(((totals2.grandTotal - totals1.grandTotal) / totals1.grandTotal) * 100),
        cheaper: totals1.grandTotal < totals2.grandTotal ? 'quote1' : 'quote2',
        supplyDiff: roundToTwo(totals2.supplyFinal - totals1.supplyFinal),
        installDiff: roundToTwo(totals2.installFinal - totals1.installFinal)
    };
}
