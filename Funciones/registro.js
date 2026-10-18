function calcularEstadoPoliza(poliza) {
    const estadoGuardado = String(poliza.estadoPoliza || "").trim();
    const estadoMinus = estadoGuardado.toLowerCase();

    // 1. Si la póliza ya fue renovada o cancelada explícitamente, se respeta
    if (estadoMinus.includes("renovad")) return "Renovada";
    if (estadoMinus.includes("cancelad")) return "Cancelada";

    // Si no tiene fecha de fin registrada, se mantiene el estado seleccionado o 'Pendiente'
    if (!poliza.finVigencia) return estadoGuardado || "Pendiente";

    // 2. Obtener fecha de hoy sin tomar en cuenta horas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Convertir fecha de fin de vigencia (YYYY-MM-DD)
    const fechaFin = new Date(poliza.finVigencia + "T00:00:00");

    // Calcular la diferencia en días
    const diferenciaMs = fechaFin - hoy;
    const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    // 3. Reglas dinámicas e intuitivas de estado
    if (diasRestantes <= 0) {
        return "Vencida";
    } else if (diasRestantes <= 10) {
        return "Próxima a Vencer";
    } else {
        return "Activa";
    }
}

// Estado global 
let polizas = []; // Contendrá las pólizas con su ID asignado por Firebase
let polizaSeleccionadaIndex = null;

// CARGAR PÓLIZAS EN TIEMPO REAL DESDE FIREBASE
function cargarPolizasGuardadas() {
    db.ref("polizas").on("value", (snapshot) => {
        const datos = snapshot.val();
        polizas = [];

        if (datos) {
            // Convertimos el objeto devuelto por Firebase en un arreglo con sus IDs
            Object.keys(datos).forEach((key) => {
                const polizaOriginal = datos[key];

                // Calcula el estado actual basándonos en la fecha finVigencia
                const estadoCalculado = calcularEstadoPoliza(polizaOriginal);

                // Se guarda la póliza en la lista global con su nuevo estado calculado
                polizas.push({
                    idFirebase: key,
                    ...polizaOriginal,
                    estadoPoliza: estadoCalculado // Sobrescribe o asigna el estado dinámico
                });
            });
        }

        // Renderizado automático ante cambios
        if (typeof renderizarTablasVencimiento === "function") renderizarTablasVencimiento();
        if (typeof renderizarHistorialCompleto === "function") renderizarHistorialCompleto();
        if (typeof renderizarResumenGeneral === "function") renderizarResumenGeneral();
        if (typeof renderizarGraficoMovimiento === "function") renderizarGraficoMovimiento();

        // Analiza si alguna poliza esta próxima a vencer 10-5-0 días 
        if (typeof verificarYEnviarNotificacionesPolizas === "function") verificarYEnviarNotificacionesPolizas(polizas);

    }, (error) => {
        console.error("Error al escuchar cambios en Firebase:", error);
    });
}
// Iniciar la escucha al cargar el archivo
cargarPolizasGuardadas();

// PROCESAR ACCIÓN DE CORREO ELECTRONICO
function procesarAccionDesdeCorreo() {
    const urlParams = new URLSearchParams(window.location.search);
    const idPoliza = urlParams.get('id');
    const accion = urlParams.get('accion');

    if (idPoliza && accion) {
        let nuevoEstado = "";

        if (accion === "renovar") nuevoEstado = "Renovada";
        if (accion === "cancelar") nuevoEstado = "Cancelada";

        if (nuevoEstado !== "") {
            db.ref("polizas/" + idPoliza).update({
                estadoPoliza: nuevoEstado
            }).then(() => {
                alert(`Póliza actualizada con éxito a estado: "${nuevoEstado}". Se han desactivado las notificaciones subsecuentes.`);
                // Limpia los parámetros de la URL sin recargar la página para evitar repetidos alert al refrescar
                window.history.replaceState({}, document.title, window.location.pathname);
            }).catch((error) => {
                console.error("Error al actualizar la póliza desde la URL del correo:", error);
            });
        }
    }
}

// Escuchar si la página abrió por medio de un clic desde el correo
document.addEventListener("DOMContentLoaded", () => {
    procesarAccionDesdeCorreo();
});

// 1. REGISTRAR NUEVA PÓLIZA
function registrarPoliza() {
    // Llama a la función de validación en validaciones.js
    const nuevaPoliza = typeof obtenerYValidarDatosFormulario === "function"
        ? obtenerYValidarDatosFormulario()
        : null;

    // Si la validación falla (devuelve null), interrumpe el registro
    if (!nuevaPoliza) {
        return false;
    }

    // Guardar registro validado en Firebase
    db.ref("polizas").push(nuevaPoliza)
        .then(() => {
            limpiarFormularioRegistro();
        })
        .catch((error) => {
            console.error("Error al registrar en Firebase:", error);
            alert("Ocurrió un error al guardar en la nube.");
        });

    return true;
}

// ACTUALIZAR PÓLIZA
function seleccionarPolizaParaEdicion(index) {
    if (index < 0 || index >= polizas.length) return;

    polizaSeleccionadaIndex = index;
    const poliza = polizas[index];

    // Cargar datos seleccionados en los inputs del formulario
    const inputCodigo = document.getElementById("codigoPoliza") || document.getElementById("codigo");
    if (inputCodigo) {
        inputCodigo.value = poliza.codigo || poliza.codigoPoliza || "";
    }

    // Cargar datos seleccionados en los inputs del formulario
    document.getElementById("tipoPoliza").value = poliza.tipoPoliza;
    document.getElementById("aseguradora").value = poliza.aseguradora;
    document.getElementById("cliente").value = poliza.cliente;
    document.getElementById("cedulaRuc").value = poliza.cedulaRuc;
    document.getElementById("solicitante").value = poliza.solicitante;
    document.getElementById("cedulaRuc1").value = poliza.cedulaRuc1;
    document.getElementById("telefonoCliente").value = poliza.telefono || "";
    document.getElementById("emailCliente").value = poliza.email || "";
    document.getElementById("numeroPoliza").value = poliza.numeroPoliza;
    document.getElementById("placaDetalle").value = poliza.placaDetalle;
    document.getElementById("valorAsigurado").value = poliza.valorAsigurado || "";
    document.getElementById("primaNeta").value = poliza.primaNeta || "";
    document.getElementById("endosoBeneficiario").value = poliza.endosoBeneficiario || "No";
    document.getElementById("inicioVigencia").value = poliza.inicioVigencia;
    document.getElementById("finVigencia").value = poliza.finVigencia;
    document.getElementById("estadoPoliza").value = poliza.estadoPoliza || "Pendiente";

    // --- CAMBIO AÑADIDO: REDIRECCIÓN/DESPLAZAMIENTO Y ENFOQUE ---

    const botonRegistroSidebar = document.querySelector('.menu-lateral a[data-pantalla="pantalla-registro"]');

    if (botonRegistroSidebar) {
        botonRegistroSidebar.click();
    }
}

// 3. ACTUALIZAR PÓLIZA SELECCIONADA
function actualizarPolizaSeleccionada() {
    if (polizaSeleccionadaIndex === null) {
        alert("Selecciona primero una póliza de la tabla para modificarla.");
        return false;
    }

    // Llama a la función de validación en validaciones.js
    const datosActualizados = typeof obtenerYValidarDatosFormulario === "function"
        ? obtenerYValidarDatosFormulario()
        : null;

    // Si la validación falla (devuelve null), interrumpe la actualización
    if (!datosActualizados) {
        return false;
    }

    const polizaActual = polizas[polizaSeleccionadaIndex];
    const idFirebase = polizaActual.idFirebase;

    // Actualizar registro validado en Firebase
    db.ref("polizas/" + idFirebase).update(datosActualizados)
        .then(() => {
            limpiarFormularioRegistro();
            polizaSeleccionadaIndex = null;
        })
        .catch((error) => {
            console.error("Error al actualizar en Firebase:", error);
            alert("No se pudo actualizar la póliza.");
        });

    return true;
}

// 4. LIMPIAR CAMPOS DEL FORMULARIO
function limpiarFormularioRegistro() {
    const inputCodigo = document.getElementById("codigoPoliza") || document.getElementById("codigo");
    if (inputCodigo) inputCodigo.value = "";

    document.getElementById("tipoPoliza").value = "";
    document.getElementById("aseguradora").value = "";
    document.getElementById("cliente").value = "";
    document.getElementById("cedulaRuc").value = "";
    document.getElementById("solicitante").value = "";
    document.getElementById("cedulaRuc1").value = "";
    document.getElementById("telefonoCliente").value = "";
    document.getElementById("emailCliente").value = "";
    document.getElementById("numeroPoliza").value = "";
    document.getElementById("placaDetalle").value = "";
    document.getElementById("valorAsigurado").value = "";
    document.getElementById("primaNeta").value = "";
    document.getElementById("endosoBeneficiario").value = "No";
    document.getElementById("inicioVigencia").value = "";
    document.getElementById("finVigencia").value = "";
    document.getElementById("estadoPoliza").value = "Pendiente";
    polizaSeleccionadaIndex = null;
}

//Exportar Excel
function exportarPolizasAExcel() {
    if (polizas.length === 0) {
        alert("No hay pólizas registradas para exportar.");
        return;
    }

    if (typeof XLSX === "undefined") {
        console.error("La librería XLSX no está cargada.");
        return;
    }

    const libro = XLSX.utils.book_new();

    // 1. Datos de las pólizas (17 columnas en orden exacto al HTML)
    const datosExcel = [
        [
            "Código",
            "Cliente",
            "Cédula / RUC",
            "Solicitante",
            "Cédula / RUC",
            "Teléfono",
            "Correo",
            "Aseguradora",
            "Tipo de Póliza",
            "N° Póliza",
            "Placa / Detalle",
            "Valor Asegurado",
            "Prima Neta",
            "Endoso Beneficiario",
            "Inicio Vigencia",
            "Fin Vigencia",
            "Estado"
        ]
    ];

    polizas.forEach(p => {
        datosExcel.push([
            p.codigo || p.codigoPoliza || "N/A",
            p.cliente || "N/A",
            p.cedulaRuc || "N/A",
            p.solicitante || "N/A",
            p.cedulaRuc1 || "N/A",
            p.telefono || p.telefonoCliente || "N/A",
            p.email || p.correo || p.emailCliente || "N/A",
            p.aseguradora || "N/A",
            p.tipoPoliza || "N/A",
            p.numeroPoliza || "N/A",
            p.placaDetalle || "N/A",
            p.valorAsigurado || "0.00",
            p.primaNeta || "0.00",
            p.endosoBeneficiario || "No",
            p.inicioVigencia || "N/A",
            p.finVigencia || "N/A",
            p.estadoPoliza || "Pendiente"
        ]);
    });

    const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

    // 2. Ancho de las 17 columnas
    hoja["!cols"] = [
        { wch: 14 }, // Código
        { wch: 25 }, // Cliente
        { wch: 16 }, // Cédula/RUC
        { wch: 25 }, // Solicitante
        { wch: 16 }, // Cédula/RUC 1
        { wch: 16 }, // Teléfono
        { wch: 22 }, // Correo
        { wch: 18 }, // Aseguradora
        { wch: 22 }, // Tipo de Póliza
        { wch: 14 }, // N° Póliza
        { wch: 16 }, // Placa / Detalle
        { wch: 16 }, // Valor Asegurado
        { wch: 14 }, // Prima Neta
        { wch: 18 }, // Endoso Beneficiario
        { wch: 15 }, // Inicio Vigencia
        { wch: 15 }, // Fin Vigencia
        { wch: 18 }  // Estado
    ];

    // 3. Filtro automático ajustado a las 17 columnas (A hasta Q)
    hoja["!autofilter"] = { ref: `A1:Q${datosExcel.length}` };

    // 4. Configuración de Estilos
    const estiloEncabezado = {
        font: { name: "Calibri", bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        fill: { fgColor: { rgb: "1F4E78" } }, // Azul corporativo
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D9E1F2" } },
            bottom: { style: "thin", color: { rgb: "D9E1F2" } },
            left: { style: "thin", color: { rgb: "D9E1F2" } },
            right: { style: "thin", color: { rgb: "D9E1F2" } }
        }
    };

    const estiloCeldaBase = {
        font: { name: "Calibri", sz: 11 },
        alignment: { vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
        }
    };

    // Aplicar estilo a Encabezados (17 columnas: índice 0 al 16)
    for (let c = 0; c < 17; c++) {
        const dir = XLSX.utils.encode_cell({ r: 0, c });
        if (hoja[dir]) hoja[dir].s = estiloEncabezado;
    }

    // Aplicar estilo a Filas de Datos
    for (let f = 1; f < datosExcel.length; f++) {
        for (let c = 0; c < 17; c++) {
            const dir = XLSX.utils.encode_cell({ r: f, c });
            if (!hoja[dir]) continue;

            // Centrar código, cédula, póliza, placa, valores y fechas
            const esCentro = [0, 2, 4, 9, 10, 11, 12, 13, 14, 15].includes(c);

            hoja[dir].s = {
                ...estiloCeldaBase,
                alignment: { horizontal: esCentro ? "center" : "left", vertical: "center" },
                fill: { fgColor: { rgb: f % 2 === 0 ? "F2F4F7" : "FFFFFF" } }
            };
        }

        // Estilo Estado (Columna 16, que es la última)
        const dirEstado = XLSX.utils.encode_cell({ r: f, c: 16 });
        const celdaEst = hoja[dirEstado];

        if (celdaEst) {
            const val = String(celdaEst.v).toLowerCase();

            if (val.includes("activo") || val.includes("vigente")) {
                celdaEst.s = {
                    ...estiloCeldaBase,
                    font: { bold: true, color: { rgb: "276A3C" } },
                    fill: { fgColor: { rgb: "E2F0D9" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            } else if (val.includes("vencid") || val.includes("cancelad")) {
                celdaEst.s = {
                    ...estiloCeldaBase,
                    font: { bold: true, color: { rgb: "9C0006" } },
                    fill: { fgColor: { rgb: "FFC7CE" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            } else {
                celdaEst.s = {
                    ...estiloCeldaBase,
                    font: { bold: true, color: { rgb: "7F6000" } },
                    fill: { fgColor: { rgb: "FFF2CC" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            }
        }
    }

    // Alto de filas
    hoja["!rows"] = [
        { hpt: 25 },
        ...Array(datosExcel.length - 1).fill({ hpt: 20 })
    ];

    XLSX.utils.book_append_sheet(libro, hoja, "Historial Pólizas");
    XLSX.writeFile(libro, "Historial_Polizas_Fox.xlsx");
}

// Polizas a descargar por MES
function exportarPolizasPorMesAExcel(numeroMes) {
    if (typeof polizas === "undefined" || polizas.length === 0) {
        alert("No hay pólizas registradas para exportar.");
        return;
    }

    if (typeof XLSX === "undefined") {
        console.error("La librería XLSX no está cargada.");
        return;
    }

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const nombreMes = nombresMeses[numeroMes - 1] || "Mes";

    // 1. Filtrar pólizas por el MES de FIN DE VIGENCIA
    const polizasDelMes = polizas.filter(p => {
        const fechaFinStr = p.finVigencia || p.fechaFin || "";
        if (!fechaFinStr) return false;
        
        const partes = fechaFinStr.split("-");
        if (partes.length >= 2) {
            const mesPoliza = parseInt(partes[1], 10);
            return mesPoliza === numeroMes;
        }
        return false;
    });

    if (polizasDelMes.length === 0) {
        alert(`No hay pólizas que vencen en el mes de ${nombreMes} para exportar.`);
        return;
    }

    // 2. Ordenar cronológicamente por el DÍA de FIN DE VIGENCIA (del día más cercano al 1 en adelante)
    polizasDelMes.sort((a, b) => {
        const fechaFinA = new Date(a.finVigencia || a.fechaFin || 0);
        const fechaFinB = new Date(b.finVigencia || b.fechaFin || 0);
        return fechaFinA - fechaFinB;
    });

    const libro = XLSX.utils.book_new();

    // 3. Estructura idéntica de 17 columnas
    const datosExcel = [
        [
            "Código",
            "Cliente",
            "Cédula / RUC",
            "Solicitante",
            "Cédula / RUC",
            "Teléfono",
            "Correo",
            "Aseguradora",
            "Tipo de Póliza",
            "N° Póliza",
            "Placa / Detalle",
            "Valor Asegurado",
            "Prima Neta",
            "Endoso Beneficiario",
            "Inicio Vigencia",
            "Fin Vigencia",
            "Estado"
        ]
    ];

    polizasDelMes.forEach(p => {
        datosExcel.push([
            p.codigo || p.codigoPoliza || "N/A",
            p.cliente || "N/A",
            p.cedulaRuc || "N/A",
            p.solicitante || "N/A",
            p.cedulaRuc1 || "N/A",
            p.telefono || p.telefonoCliente || "N/A",
            p.email || p.correo || p.emailCliente || "N/A",
            p.aseguradora || "N/A",
            p.tipoPoliza || "N/A",
            p.numeroPoliza || "N/A",
            p.placaDetalle || "N/A",
            p.valorAsigurado || "0.00",
            p.primaNeta || "0.00",
            p.endosoBeneficiario || "No",
            p.inicioVigencia || "N/A",
            p.finVigencia || "N/A",
            p.estadoPoliza || "Pendiente"
        ]);
    });

    const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

    // 4. Ancho de las 17 columnas
    hoja["!cols"] = [
        { wch: 14 }, // Código
        { wch: 25 }, // Cliente
        { wch: 16 }, // Cédula/RUC
        { wch: 25 }, // Solicitante
        { wch: 16 }, // Cédula/RUC 1
        { wch: 16 }, // Teléfono
        { wch: 22 }, // Correo
        { wch: 18 }, // Aseguradora
        { wch: 22 }, // Tipo de Póliza
        { wch: 14 }, // N° Póliza
        { wch: 16 }, // Placa / Detalle
        { wch: 16 }, // Valor Asegurado
        { wch: 14 }, // Prima Neta
        { wch: 18 }, // Endoso Beneficiario
        { wch: 15 }, // Inicio Vigencia
        { wch: 15 }, // Fin Vigencia
        { wch: 18 }  // Estado
    ];

    // 5. Autofiltro
    hoja["!autofilter"] = { ref: `A1:Q${datosExcel.length}` };

    // 6. Estilos exactamente iguales al Excel original
    const estiloEncabezado = {
        font: { name: "Calibri", bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        fill: { fgColor: { rgb: "1F4E78" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D9E1F2" } },
            bottom: { style: "thin", color: { rgb: "D9E1F2" } },
            left: { style: "thin", color: { rgb: "D9E1F2" } },
            right: { style: "thin", color: { rgb: "D9E1F2" } }
        }
    };

    const estiloCeldaBase = {
        font: { name: "Calibri", sz: 11 },
        alignment: { vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
        }
    };

    // Aplicar estilo a Encabezados
    for (let c = 0; c < 17; c++) {
        const dir = XLSX.utils.encode_cell({ r: 0, c });
        if (hoja[dir]) hoja[dir].s = estiloEncabezado;
    }

    // Aplicar estilo a Filas de Datos
    for (let f = 1; f < datosExcel.length; f++) {
        for (let c = 0; c < 17; c++) {
            const dir = XLSX.utils.encode_cell({ r: f, c });
            if (!hoja[dir]) continue;

            const esCentro = [0, 2, 4, 9, 10, 11, 12, 13, 14, 15].includes(c);

            hoja[dir].s = {
                ...estiloCeldaBase,
                alignment: { horizontal: esCentro ? "center" : "left", vertical: "center" },
                fill: { fgColor: { rgb: f % 2 === 0 ? "F2F4F7" : "FFFFFF" } }
            };
        }

        // Estilo según estado
        const dirEstado = XLSX.utils.encode_cell({ r: f, c: 16 });
        const celdaEst = hoja[dirEstado];

        if (celdaEst) {
            const val = String(celdaEst.v).toLowerCase();

            if (val.includes("activo") || val.includes("vigente")) {
                celdaEst.s = {
                    ...estiloCeldaBase,
                    font: { bold: true, color: { rgb: "276A3C" } },
                    fill: { fgColor: { rgb: "E2F0D9" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            } else if (val.includes("vencid") || val.includes("cancelad")) {
                celdaEst.s = {
                    ...estiloCeldaBase,
                    font: { bold: true, color: { rgb: "9C0006" } },
                    fill: { fgColor: { rgb: "FFC7CE" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            } else {
                celdaEst.s = {
                    ...estiloCeldaBase,
                    font: { bold: true, color: { rgb: "7F6000" } },
                    fill: { fgColor: { rgb: "FFF2CC" } },
                    alignment: { horizontal: "center", vertical: "center" }
                };
            }
        }
    }

    hoja["!rows"] = [
        { hpt: 25 },
        ...Array(datosExcel.length - 1).fill({ hpt: 20 })
    ];

    XLSX.utils.book_append_sheet(libro, hoja, `Vencimientos ${nombreMes}`);
    XLSX.writeFile(libro, `Historial_Polizas_Vencimiento_${nombreMes}_Fox.xlsx`);
}

// TABLA DE PÓLIZAS-MES DE VENCIMIENTO

// Función auxiliar para calcular días restantes de una póliza
function obtenerDiasRestantesPoliza(poliza) {
    if (!poliza.finVigencia) return 999999;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaFin = new Date(poliza.finVigencia + "T00:00:00");
    const diffMs = fechaFin - hoy;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 1. Pólizas que vencen ESTE MES
function obtenerPolizasVencenEsteMes() {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const filtradas = polizas.filter(poliza => {
        if (!poliza.finVigencia) return false;

        // Validar que el estado no sea Renovada ni Cancelada
        const estadoNorm = String(poliza.estadoPoliza || "").toLowerCase();
        if (estadoNorm.includes("renovad") || estadoNorm.includes("cancelad")) {
            return false;
        }

        const fechaFin = new Date(poliza.finVigencia + "T00:00:00");
        if (fechaFin.getMonth() !== mesActual || fechaFin.getFullYear() !== anioActual) {
            return false;
        }

        // Verificar umbral de aparición según Endoso Beneficiario
        const tieneEndoso = String(poliza.endosoBeneficiario || "").toLowerCase() === "sí" || String(poliza.endosoBeneficiario || "").toLowerCase() === "si";
        const diasRestantes = obtenerDiasRestantesPoliza(poliza);
        const umbralPermitido = tieneEndoso ? 45 : 10;

        // Aparece si ya venció, es hoy, o está dentro del umbral de días permitido (o si por calendario cae este mes pero supera el umbral, se muestra solo si ya está muy cerca o vencida)
        return diasRestantes <= umbralPermitido;
    });

    // Ordenar por prioridad (las que tengan menos días restantes o estén vencidas van primero)
    return filtradas.sort((a, b) => obtenerDiasRestantesPoliza(a) - obtenerDiasRestantesPoliza(b));
}

// 2. Pólizas que vencen EL PRÓXIMO MES
function obtenerPolizasVencenProximoMes() {
    const hoy = new Date();

    // Calculamos el mes y año del próximo mes
    let mesProximo = hoy.getMonth() + 1;
    let anioProximo = hoy.getFullYear();

    if (mesProximo > 11) { // Si estamos en diciembre, el próximo mes es enero del siguiente año
        mesProximo = 0;
        anioProximo++;
    }

    const filtradas = polizas.filter(poliza => {
        if (!poliza.finVigencia) return false;

        // Validar que el estado no sea Renovada ni Cancelada
        const estadoNorm = String(poliza.estadoPoliza || "").toLowerCase();
        if (estadoNorm.includes("renovad") || estadoNorm.includes("cancelad")) {
            return false;
        }

        const fechaFin = new Date(poliza.finVigencia + "T00:00:00");
        if (fechaFin.getMonth() !== mesProximo || fechaFin.getFullYear() !== anioProximo) {
            return false;
        }

        // Verificar umbral de aparición según Endoso Beneficiario
        const tieneEndoso = String(poliza.endosoBeneficiario || "").toLowerCase() === "sí" || String(poliza.endosoBeneficiario || "").toLowerCase() === "si";
        const diasRestantes = obtenerDiasRestantesPoliza(poliza);
        const umbralPermitido = tieneEndoso ? 45 : 10;

        // Solo se muestran si los días restantes caen dentro del umbral correspondiente (ej. 45 días para endoso, 10 para normales)
        return diasRestantes <= umbralPermitido;
    });

    // Ordenar por prioridad (menor cantidad de días restantes primero)
    return filtradas.sort((a, b) => obtenerDiasRestantesPoliza(a) - obtenerDiasRestantesPoliza(b));
}

// Rendizar-Tablas de Vencimiento

function renderizarTablasVencimiento() {
    const tablaEsteMes = document.getElementById("tabla-vencen-este-mes");
    const tablaProximoMes = document.getElementById("tabla-vencen-proximo-mes");

    if (!tablaEsteMes || !tablaProximoMes) return;

    // 1. Dibujar pólizas que vencen ESTE MES
    const listaEsteMes = obtenerPolizasVencenEsteMes();
    tablaEsteMes.innerHTML = construirFilasTabla(listaEsteMes);

    // 2. Dibujar pólizas que vencen EL PRÓXIMO MES
    const listaProximoMes = obtenerPolizasVencenProximoMes();
    tablaProximoMes.innerHTML = construirFilasTabla(listaProximoMes);
}

// Función auxiliar para construir la estructura HTML de cada fila (<tr>)
function construirFilasTabla(lista) {
    if (lista.length === 0) {
        return `<tr><td colspan="6" class="sin-datos">No hay pólizas registradas para este periodo.</td></tr>`;
    }

    return lista.map(p => {
        let claseEstado = "badge-pendiente";
        const estadoNorm = String(p.estadoPoliza).toLowerCase();

        if (estadoNorm.includes("activo")) claseEstado = "badge-activo";
        else if (estadoNorm.includes("renovad")) claseEstado = "badge-activo";
        else if (estadoNorm.includes("vencid") || estadoNorm.includes("cancelad")) claseEstado = "badge-vencido";

        return `
            <tr>
                <td><strong>${p.cliente}</strong></td>
                <td>${p.tipoPoliza}</td>
                <td>${p.aseguradora}</td>
                <td>${p.numeroPoliza}</td>
                <td>${p.finVigencia}</td>
                <td><span class="badge ${claseEstado}">${p.estadoPoliza}</span></td>
            </tr>
        `;
    }).join("");
}

// ACCIONES: ELIMINAR PÓLIZA

function eliminarPoliza(index) {
    if (index < 0 || index >= polizas.length) return;

    const poliza = polizas[index];
    const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la póliza N° "${poliza.numeroPoliza}" de ${poliza.cliente}?`);

    if (confirmacion) {
        db.ref("polizas/" + poliza.idFirebase).remove()
            .then(() => {
                if (polizaSeleccionadaIndex === index) {
                    limpiarFormularioRegistro();
                }
            })
            .catch((error) => {
                console.error("Error al eliminar en Firebase:", error);
                alert("No se pudo eliminar la póliza.");
            });
    }
}

// RENDERIZADO TABLA HISTORIAL COMPLETO
// Variable de estado para controlar la letra seleccionada actualmente en el abecedario (por defecto null o "TODOS")
let letraSeleccionadaHistorial = null;

function renderizarHistorialCompleto() {
    const tablaHistorial = document.getElementById("tabla-historial-completo");
    const comboFiltro = document.getElementById("filtroTipoSeguro");
    const inputBusqueda = document.getElementById("inputBusquedaHistorial");
    const contenedorAbecedario = document.getElementById("contenedor-abecedario-historial");
    const contenedorResumen = document.getElementById("contenedor-resumen-clientes");
    const contenedorTabla = document.getElementById("seccion-tabla-historial");

    if (!tablaHistorial || !comboFiltro) return;

    // 1. Renderizar la barra de abecedario (A-Z) si aún está vacía
    if (contenedorAbecedario && contenedorAbecedario.children.length === 0) {
        let letrasHTML = `<button type="button" class="btn-letra-abc ${letraSeleccionadaHistorial === null ? 'activa' : ''}" onclick="filtrarPorLetraHistorial(null)">TODOS</button>`;
        for (let i = 65; i <= 90; i++) {
            const letra = String.fromCharCode(i);
            const activa = letraSeleccionadaHistorial === letra ? 'activa' : '';
            letrasHTML += `<button type="button" class="btn-letra-abc ${activa}" onclick="filtrarPorLetraHistorial('${letra}')">${letra}</button>`;
        }
        contenedorAbecedario.innerHTML = letrasHTML;
    }

    const tipoSeleccionado = comboFiltro.value;
    const textoBusqueda = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : "";

    // REGLA DE VISTA LIMPIA: Si no se ha escrito nada en la búsqueda, 
    // no se ha elegido un tipo de seguro específico, ni se ha presionado ninguna letra del abecedario,
    // Ocultamos por completo tanto el resumen de tarjetas como la tabla principal.
    const hayFiltroActivo = (tipoSeleccionado !== "TODOS" && tipoSeleccionado !== "") || 
                          (textoBusqueda !== "") || 
                          (letraSeleccionadaHistorial !== null);

    if (!hayFiltroActivo) {
        if (contenedorResumen) contenedorResumen.classList.add("pantalla-oculta");
        if (contenedorTabla) contenedorTabla.classList.add("pantalla-oculta");
        return;
    }

    if (polizas.length === 0) {
        tablaHistorial.innerHTML = `<tr><td colspan="10" class="sin-datos">No hay pólizas registradas en el sistema.</td></tr>`;
        if (contenedorResumen) contenedorResumen.classList.add("pantalla-oculta");
        if (contenedorTabla) contenedorTabla.classList.remove("pantalla-oculta");
        return;
    }

    const polizasConIndice = polizas.map((p, index) => ({ ...p, indexReal: index }));

    // Filtrar pólizas por tipo de seguro
    const polizasFiltradas = polizasConIndice.filter(p => {
        // 1. Filtro por Select de Tipo de Seguro
        const coincideTipo = (tipoSeleccionado === "TODOS" || tipoSeleccionado === "" || p.tipoPoliza === tipoSeleccionado);
        if (!coincideTipo) return false;

        // 2. Filtro por Letra Inicial del Cliente 
        if (letraSeleccionadaHistorial !== null) {
            const nombreCliente = String(p.cliente || "").trim().toUpperCase();
            if (!nombreCliente.startsWith(letraSeleccionadaHistorial)) {
                return false;
            }
        }

        // 2. Filtro por Texto en Todos los Campos
        if (textoBusqueda === "") return true;

        const codigo = String(p.codigo || p.codigoPoliza || "").toLowerCase();
        const cliente = String(p.cliente || "").toLowerCase();
        const cedulaRuc = String(p.cedulaRuc || "").toLowerCase();
        const solicitante = String(p.solicitante || "").toLowerCase();
        const cedulaRuc1 = String(p.cedulaRuc1 || "").toLowerCase();
        const telefono = String(p.telefono || p.telefonoCliente || "").toLowerCase();
        const email = String(p.email || p.correo || p.emailCliente || "").toLowerCase();
        const aseguradora = String(p.aseguradora || "").toLowerCase();
        const tipoPoliza = String(p.tipoPoliza || "").toLowerCase();
        const numeroPoliza = String(p.numeroPoliza || "").toLowerCase();
        const placaDetalle = String(p.placaDetalle || "").toLowerCase();
        const valorAsigurado = String(p.valorAsigurado || "").toLowerCase();
        const primaNeta = String(p.primaNeta || "").toLowerCase();
        const endosoBeneficiario = String(p.endosoBeneficiario || "").toLowerCase();
        const inicioVigencia = String(p.inicioVigencia || "").toLowerCase();
        const finVigencia = String(p.finVigencia || "").toLowerCase();
        const estadoPoliza = String(p.estadoPoliza || "").toLowerCase();

        return codigo.includes(textoBusqueda) ||
            cliente.includes(textoBusqueda) ||
            cedulaRuc.includes(textoBusqueda) ||
            solicitante.includes(textoBusqueda) ||
            cedulaRuc1.includes(textoBusqueda) ||
            telefono.includes(textoBusqueda) ||
            email.includes(textoBusqueda) ||
            aseguradora.includes(textoBusqueda) ||
            tipoPoliza.includes(textoBusqueda) ||
            numeroPoliza.includes(textoBusqueda) ||
            placaDetalle.includes(textoBusqueda) ||
            valorAsigurado.includes(textoBusqueda) ||
            primaNeta.includes(textoBusqueda) ||
            endosoBeneficiario.includes(textoBusqueda) ||
            inicioVigencia.includes(textoBusqueda) ||
            finVigencia.includes(textoBusqueda) ||
            estadoPoliza.includes(textoBusqueda);
    });

    /// LÓGICA DE NIVELES: Si se seleccionó una letra (y NO se está usando la barra de búsqueda de texto),
    // mostramos el cuadro resumido con tarjetas de Nombre y Cédula.
    if (letraSeleccionadaHistorial !== null && textoBusqueda === "" && contenedorResumen) {
        if (contenedorTabla) contenedorTabla.classList.add("pantalla-oculta");
        contenedorResumen.classList.remove("pantalla-oculta");

        if (polizasFiltradas.length === 0) {
            tablaHistorial.innerHTML = `<tr><td colspan="13" class="sin-datos">No se encontraron pólizas que coincidan con la búsqueda.</td></tr>`;
        } else {
            contenedorResumen.innerHTML = polizasFiltradas.map(p => `
                <div class="tarjeta-cliente-resumen" onclick="mostrarDetalleFilaHistorial(${p.indexReal})">
                    <div class="nombre-cliente">${p.cliente || "Sin Nombre"}</div>
                    <div class="cedula-cliente">RUC/Cédula: ${p.cedulaRuc || "N/A"}</div>
                </div>
            `).join("");
        }
        return;
    }

    // Si no hay letra seleccionada o se está usando la barra de búsqueda general, mostramos la tabla completa
    if (contenedorResumen) contenedorResumen.classList.add("pantalla-oculta");
    if (contenedorTabla) contenedorTabla.classList.remove("pantalla-oculta");

    if (polizasFiltradas.length === 0) {
        tablaHistorial.innerHTML = `<tr><td colspan="17" class="sin-datos">No se encontraron pólizas que coincidan con la búsqueda.</td></tr>`;
        return;
    }

    // Generar las filas con los 9 campos
    tablaHistorial.innerHTML = polizasFiltradas.map(p => {
        let claseEstado = "badge-pendiente";
        const estadoNorm = String(p.estadoPoliza).toLowerCase();

        if (estadoNorm.includes("activo") || estadoNorm.includes("renovad")) claseEstado = "badge-activo";
        else if (estadoNorm.includes("vencid") || estadoNorm.includes("cancelad")) claseEstado = "badge-vencido";

        return `
            <tr>
                <td><strong>${p.codigo || p.codigoPoliza || "-"}</strong></td>
                <td>${p.cliente}</td>
                <td>${p.cedulaRuc}</td>
                <td>${p.solicitante}</td>
                <td>${p.cedulaRuc1}</td>
                <td>${p.telefono}</td>
                <td>${p.email}</td>
                <td>${p.aseguradora}</td>
                <td>${p.tipoPoliza}</td>
                <td>${p.numeroPoliza}</td>
                <td>${p.placaDetalle || "-"}</td>
                <td>${p.valorAsigurado || "-"}</td>
                <td>${p.primaNeta || "-"}</td>
                <td>${p.endosoBeneficiario || "-"}</td>
                <td>${p.inicioVigencia}</td>
                <td>${p.finVigencia}</td>
                <td><span class="badge ${claseEstado}">${p.estadoPoliza}</span></td>
                <td>
                    <div class="contenedor-acciones-tabla">
                        <button type="button" class="btn-tabla btn-editar" onclick="seleccionarPolizaParaEdicion(${p.indexReal})"> + Editar</button>
                        <button type="button" class="btn-tabla btn-eliminar" onclick="eliminarPoliza(${p.indexReal})">Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Funciones auxiliares de control para los clics en el abecedario y tarjetas
function filtrarPorLetraHistorial(letra) {
    letraSeleccionadaHistorial = letra;

    // Actualizar clases activas visuales en los botones del abecedario
    const botones = document.querySelectorAll('.btn-letra-abc');
    botones.forEach(btn => {
        if ((letra === null && btn.textContent === "TODOS") || btn.textContent === letra) {
            btn.classList.add('activa');
        } else {
            btn.classList.remove('activa');
        }
    });

    renderizarHistorialCompleto();
}

function mostrarDetalleFilaHistorial(indexReal) {
    const contenedorResumen = document.getElementById("contenedor-resumen-clientes");
    const contenedorTabla = document.getElementById("seccion-tabla-historial");
    const tablaHistorial = document.getElementById("tabla-historial-completo");

    if (!contenedorResumen || !contenedorTabla || !tablaHistorial) return;

    // Ocultar tarjetas resumidas y mostrar únicamente la tabla con la fila seleccionada
    contenedorResumen.classList.add("pantalla-oculta");
    contenedorTabla.classList.remove("pantalla-oculta");

    const p = polizas[indexReal];
    if (!p) return;

    let claseEstado = "badge-pendiente";
    const estadoNorm = String(p.estadoPoliza || "").toLowerCase();
    if (estadoNorm.includes("activo") || estadoNorm.includes("renovad")) claseEstado = "badge-activo";
    else if (estadoNorm.includes("vencid") || estadoNorm.includes("cancelad")) claseEstado = "badge-vencido";

    // Renderizar solo esta fila específica para que el usuario vea su barra completa
    tablaHistorial.innerHTML = `
        <tr>
            <td><strong>${p.codigo || p.codigoPoliza || "-"}</strong></td>
            <td>${p.cliente || "-"}</td>
            <td>${p.cedulaRuc || "-"}</td>
            <td>${p.solicitante || "-"}</td>
            <td>${p.cedulaRuc1 || "-"}</td>
            <td>${p.telefono || "-"}</td>
            <td>${p.email || "-"}</td>
            <td>${p.aseguradora || "-"}</td>
            <td>${p.tipoPoliza || "-"}</td>
            <td>${p.numeroPoliza || "-"}</td>
            <td>${p.placaDetalle || "-"}</td>
            <td>${p.valorAsigurado || "-"}</td>
            <td>${p.primaNeta || "-"}</td>
            <td>${p.endosoBeneficiario || "-"}</td>
            <td>${p.inicioVigencia || "-"}</td>
            <td>${p.finVigencia || "-"}</td>
            <td><span class="badge ${claseEstado}">${p.estadoPoliza || "Registrada"}</span></td>
            <td>
                <div class="contenedor-acciones-tabla">
                    <button type="button" class="btn-tabla btn-editar" onclick="seleccionarPolizaParaEdicion(${indexReal})"> + Editar</button>
                    <button type="button" class="btn-tabla btn-eliminar" onclick="eliminarPoliza(${indexReal})">Eliminar</button>
                </div>
            </td>
        </tr>
    `;
}

// RENDERIZADO-TABLA DE RESULTADOS
function renderizarResumenGeneral() {
    const contenedorGrid = document.getElementById("grid-meses-resumen");
    if (!contenedorGrid) return;

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", 
        "Mayo", "Junio", "Julio", "Agosto", 
        "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    let htmlMeses = "";
    nombresMeses.forEach((mesNombre, index) => {
        const numeroMes = index + 1; // 1 al 12
        htmlMeses += `
            <div class="tarjeta-mes-item" onclick="abrirModalMes(${numeroMes}, '${mesNombre}')">
                <div class="nombre-mes-titulo">${mesNombre}</div>
                <div class="info-mes-badge">Ver registros</div>
            </div>
        `;
    });

    contenedorGrid.innerHTML = htmlMeses;
}

// Función para abrir el modal del mes seleccionado con orden cronológico estricto
function abrirModalMes(numeroMes, nombreMes) {
    const modal = document.getElementById("modal-detalle-mes");
    const titulo = document.getElementById("modal-mes-titulo");
    const cuerpoTabla = document.getElementById("tabla-mes-cuerpo");

    if (!modal || !cuerpoTabla) return;

    titulo.textContent = `Pólizas que vencen en ${nombreMes}`;

    const listaPolizas = typeof polizas !== "undefined" ? polizas : [];

    // Filtrar pólizas que correspondan al mes seleccionado
    const polizasDelMes = listaPolizas.filter(p => {
        const fechaFinStr = p.finVigencia || p.fechaFin || "";
        if (!fechaFinStr) return false;
        
        const partes = fechaFinStr.split("-");
        if (partes.length >= 2) {
            const mesPoliza = parseInt(partes[1], 10);
            return mesPoliza === numeroMes;
        }
        return false;
    });

    // Ordenar cronológicamente (del día más cercano al 1 hacia adelante)
    polizasDelMes.sort((a, b) => {
        const fechaFinA = new Date(a.finVigencia || a.fechaFin || 0);
        const fechaFinB = new Date(b.finVigencia || b.fechaFin || 0);
        return fechaFinA - fechaFinB;
    });

    if (polizasDelMes.length === 0) {
        cuerpoTabla.innerHTML = `<tr><td colspan="3" class="mensaje-tabla-vacia">No hay clientes registrados en ${nombreMes}.</td></tr>`;
    } else {
        let filas = "";
        polizasDelMes.forEach(p => {
            const cliente = p.cliente || p.nombreCliente || "Sin Nombre";
            const cedula = p.cedulaRuc || p.cedula || p.ruc || "N/A";
            const fechaFin = p.finVigencia || p.fechaFin || "-";

            filas += `
                <tr>
                    <td><strong>${cliente}</strong></td>
                    <td>${cedula}</td>
                    <td>${fechaFin}</td>
                </tr>
            `;
        });
        cuerpoTabla.innerHTML = filas;
    }

    modal.classList.remove("modal-oculto");
}

function cerrarModalMes() {
    const modal = document.getElementById("modal-detalle-mes");
    if (modal) {
        modal.classList.add("modal-oculto");
    }
}