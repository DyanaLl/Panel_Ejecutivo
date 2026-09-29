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
                polizas.push({
                    idFirebase: key,
                    ...datos[key]
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

// 1. REGISTRAR NUEVA PÓLIZA
function registrarPoliza() {
    // Ejecuta validaciones del archivo validaciones.js 
    if (typeof validarFormularioPoliza === "function" && !validarFormularioPoliza()) {
        return false;
    }

    const inputCodigo = document.getElementById("codigoPoliza") || document.getElementById("codigo");

    // Captura datos desde el formulario de HTML - IDs
    const nuevaPoliza = {
        codigo: inputCodigo ? inputCodigo.value.trim() : "",
        tipoPoliza: document.getElementById("tipoPoliza").value,
        aseguradora: document.getElementById("aseguradora").value,
        cliente: document.getElementById("cliente").value.trim(),
        cedulaRuc: document.getElementById("cedulaRuc").value.trim(),
        telefono: document.getElementById("telefonoCliente").value.trim(),
        email: document.getElementById("emailCliente").value.trim(),
        numeroPoliza: document.getElementById("numeroPoliza").value.trim(),
        placaDetalle: document.getElementById("placaDetalle").value.trim(),
        inicioVigencia: document.getElementById("inicioVigencia").value,
        finVigencia: document.getElementById("finVigencia").value,
        estadoPoliza: document.getElementById("estadoPoliza").value
    };

    // Guardar registro en Firebase
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
    document.getElementById("telefonoCliente").value = poliza.telefono || "";
    document.getElementById("emailCliente").value = poliza.email || "";
    document.getElementById("numeroPoliza").value = poliza.numeroPoliza;
    document.getElementById("placaDetalle").value = poliza.placaDetalle;
    document.getElementById("inicioVigencia").value = poliza.inicioVigencia;
    document.getElementById("finVigencia").value = poliza.finVigencia;
    document.getElementById("estadoPoliza").value = poliza.estadoPoliza || "Pendiente";
}

// 3. ACTUALIZAR PÓLIZA SELECCIONADA
function actualizarPolizaSeleccionada() {
    if (polizaSeleccionadaIndex === null) {
        alert("Selecciona primero una póliza de la tabla para modificarla.");
        return false;
    }

    if (typeof validarFormularioPoliza === "function" && !validarFormularioPoliza()) {
        return false;
    }

    const polizaActual = polizas[polizaSeleccionadaIndex];
    const idFirebase = polizaActual.idFirebase;
    const inputCodigo = document.getElementById("codigoPoliza") || document.getElementById("codigo");

    const datosActualizados = {
        codigo: inputCodigo ? inputCodigo.value.trim() : "",
        tipoPoliza: document.getElementById("tipoPoliza").value,
        aseguradora: document.getElementById("aseguradora").value,
        cliente: document.getElementById("cliente").value.trim(),
        cedulaRuc: document.getElementById("cedulaRuc").value.trim(),
        telefono: document.getElementById("telefonoCliente").value.trim(),
        email: document.getElementById("emailCliente").value.trim(),
        numeroPoliza: document.getElementById("numeroPoliza").value.trim(),
        placaDetalle: document.getElementById("placaDetalle").value.trim(),
        inicioVigencia: document.getElementById("inicioVigencia").value,
        finVigencia: document.getElementById("finVigencia").value,
        estadoPoliza: document.getElementById("estadoPoliza").value
    };

    // Actualizar registro en Firebase
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
    document.getElementById("telefonoCliente").value = "";
    document.getElementById("emailCliente").value = "";
    document.getElementById("numeroPoliza").value = "";
    document.getElementById("placaDetalle").value = "";
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

    // 1. Datos de las pólizas
    const datosExcel = [
        [
            "Código",
            "Cliente",
            "Cédula / RUC",
            "Teléfono",
            "Correo",
            "Aseguradora",
            "Tipo de Póliza",
            "N° Póliza",
            "Placa / Detalle",
            "Inicio Vigencia",
            "Fin Vigencia",
            "Estado"
        ]
    ];

    polizas.forEach(p => {
        datosExcel.push([
            p.codigo || p.codigoPoliza || "N/A",
            p.cliente,
            p.cedulaRuc,
            p.aseguradora,
            p.tipoPoliza,
            p.numeroPoliza,
            p.placaDetalle,
            p.inicioVigencia,
            p.finVigencia,
            p.estadoPoliza
        ]);
    });

    const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

    // 2. Ancho de las 9 columnas de pólizas
    hoja["!cols"] = [
        { wch: 14 }, // Código
        { wch: 25 }, // Cliente
        { wch: 16 }, // RUC
        { wch: 18 }, // Aseguradora
        { wch: 22 }, // Tipo
        { wch: 14 }, // N° Póliza
        { wch: 16 }, // Placa
        { wch: 15 }, // Inicio
        { wch: 15 }, // Fin
        { wch: 18 }  // Estado
    ];

    // 3. Filtro automático
    hoja["!autofilter"] = { ref: `A1:I${datosExcel.length}` };

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

    // Aplicar estilo a Encabezados
    for (let c = 0; c < 10; c++) {
        const dir = XLSX.utils.encode_cell({ r: 0, c });
        if (hoja[dir]) hoja[dir].s = estiloEncabezado;
    }

    // Aplicar estilo a Filas de Datos
    for (let f = 1; f < datosExcel.length; f++) {
        for (let c = 0; c < 10; c++) {
            const dir = XLSX.utils.encode_cell({ r: f, c });
            if (!hoja[dir]) continue;

            // Centrar código, cédula, póliza, placa y fechas
            const esCentro = [0, 2, 5, 6, 7, 8].includes(c);

            hoja[dir].s = {
                ...estiloCeldaBase,
                alignment: { horizontal: esCentro ? "center" : "left", vertical: "center" },
                fill: { fgColor: { rgb: f % 2 === 0 ? "F2F4F7" : "FFFFFF" } }
            };
        }

        // Estilo Estado
        const dirEstado = XLSX.utils.encode_cell({ r: f, c: 9 });
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

// TABLA DE PÓLIZAS-MES DE VENCIMIENTO

// 1. Pólizas que vencen ESTE MES
function obtenerPolizasVencenEsteMes() {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    return polizas.filter(poliza => {
        if (!poliza.finVigencia) return false;

        // Convertimos la fecha (YYYY-MM-DD)
        const fechaFin = new Date(poliza.finVigencia + "T00:00:00");

        return fechaFin.getMonth() === mesActual && fechaFin.getFullYear() === anioActual;
    });
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

    return polizas.filter(poliza => {
        if (!poliza.finVigencia) return false;

        const fechaFin = new Date(poliza.finVigencia + "T00:00:00");

        return fechaFin.getMonth() === mesProximo && fechaFin.getFullYear() === anioProximo;
    });
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
        else if (estadoNorm.includes("vencid")) claseEstado = "badge-vencido";

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

function renderizarHistorialCompleto() {
    const tablaHistorial = document.getElementById("tabla-historial-completo");
    const comboFiltro = document.getElementById("filtroTipoSeguro");

    if (!tablaHistorial || !comboFiltro) return;

    const tipoSeleccionado = comboFiltro.value;

    if (polizas.length === 0) {
        tablaHistorial.innerHTML = `<tr><td colspan="10" class="sin-datos">No hay pólizas registradas en el sistema.</td></tr>`;
        return;
    }

    const polizasConIndice = polizas.map((p, index) => ({ ...p, indexReal: index }));

    // Filtrar pólizas por tipo de seguro
    const polizasFiltradas = polizasConIndice.filter(p => {
        if (tipoSeleccionado === "TODOS" || tipoSeleccionado === "") return true;
        return p.tipoPoliza === tipoSeleccionado;
    });

    if (polizasFiltradas.length === 0) {
        tablaHistorial.innerHTML = `<tr><td colspan="10" class="sin-datos">No hay pólizas registradas para este tipo de seguro.</td></tr>`;
        return;
    }

    // Generar las filas con los 9 campos
    tablaHistorial.innerHTML = polizasFiltradas.map(p => {
        let claseEstado = "badge-pendiente";
        const estadoNorm = String(p.estadoPoliza).toLowerCase();

        if (estadoNorm.includes("activo")) claseEstado = "badge-activo";
        else if (estadoNorm.includes("vencid")) claseEstado = "badge-vencido";

        return `
            <tr>
                <td><strong>${p.codigo || p.codigoPoliza || "-"}</strong></td>
                <td>${p.cliente}</td>
                <td>${p.cedulaRuc}</td>
                <td>${p.telefono}</td>
                <td>${p.email}</td>
                <td>${p.aseguradora}</td>
                <td>${p.tipoPoliza}</td>
                <td>${p.numeroPoliza}</td>
                <td>${p.placaDetalle || "-"}</td>
                <td>${p.inicioVigencia}</td>
                <td>${p.finVigencia}</td>
                <td><span class="badge ${claseEstado}">${p.estadoPoliza}</span></td>
                <td>
                    <div class="contenedor-acciones-tabla">
                        <button type="button" class="btn-tabla btn-editar" onclick="seleccionarPolizaParaEdicion(${p.indexReal})">Editar</button>
                        <button type="button" class="btn-tabla btn-eliminar" onclick="eliminarPoliza(${p.indexReal})">Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// RENDERIZADO-TABLA DE RESULTADOS

function renderizarResumenGeneral() {
    const tablaResumen = document.getElementById("tabla-resumen-general");
    if (!tablaResumen) return;

    // Tipos de Seguros
    const tipos = [
        "Vehículos Livianos",
        "Vehículos Pesados",
        "Responsabilidad Civil",
        "Accidentes Personales",
        "Cumplimiento de Contrato",
        "Equipo Electrónico",
        "Equipo y Maquinaria de Contratistas",
        "Incendio",
        "Multiriesgo",
        "Vida Individual",
    ];

    let htmlFilas = "";

    tipos.forEach(tipo => {
        // Filtrar pólizas que pertenecen a determinado tipo de seguro
        const polizasDelTipo = typeof polizas !== "undefined" ? polizas.filter(p => p.tipoPoliza === tipo) : [];

        // Contar por estados
        let activos = 0;
        let porVencer = 0;
        let vencidos = 0;

        polizasDelTipo.forEach(p => {
            const estado = String(p.estadoPoliza).toLowerCase();
            if (estado.includes("activo") || estado.includes("vigente")) {
                activos++;
            } else if (estado.includes("próximo") || estado.includes("proximo") || estado.includes("pendiente")) {
                porVencer++;
            } else if (estado.includes("vencid") || estado.includes("cancelad")) {
                vencidos++;
            }
        });

        htmlFilas += `
            <tr>
                <td><strong>${tipo}</strong></td>
                <td>
                    <span class="badge badge-activo contador-interactivo" 
                          onclick="abrirModalDetalle('${tipo}', 'Activo')">${activos}</span>
                </td>
                <td>
                    <span class="badge badge-pendiente contador-interactivo" 
                          onclick="abrirModalDetalle('${tipo}', 'Por Vencer')">${porVencer}</span>
                </td>
                <td>
                    <span class="badge badge-vencido contador-interactivo" 
                          onclick="abrirModalDetalle('${tipo}', 'Vencido')">${vencidos}</span>
                </td>
            </tr>
        `;
    });

    tablaResumen.innerHTML = htmlFilas;
}
