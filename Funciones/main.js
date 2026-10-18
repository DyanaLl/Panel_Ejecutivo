document.addEventListener("DOMContentLoaded", () => {

    // 1. CARGAR DATOS ALMACENADOS AL INICIAR
    if (typeof cargarPolizasGuardadas === "function") {
        cargarPolizasGuardadas();
    }

    // 2. RENDERIZADO INICIAL DE TABLAS Y GRÁFICAS
    if (typeof renderizarTablasVencimiento === "function") {
        renderizarTablasVencimiento();
    }
    if (typeof renderizarHistorialCompleto === "function") {
        renderizarHistorialCompleto();
    }
    if (typeof renderizarResumenGeneral === "function") {
        renderizarResumenGeneral();
    }

    // 3. CAPTURAR BOTONES DEL FORMULARIO Y ACCIONES
    const btnRegistrar = document.getElementById("btn-registrar");
    const btnActualizar = document.getElementById("btn-actualizar");
    const btnExportar = document.getElementById("btn-exportar");

    // Botón Registrar
    if (btnRegistrar) {
        btnRegistrar.addEventListener("click", () => {
            if (typeof registrarPoliza === "function") {
                const exito = registrarPoliza();
                if (exito) {
                    alert("¡Póliza registrada con éxito!");
                    if (typeof mostrarPolizasEnTabla === "function") {
                        mostrarPolizasEnTabla();
                    }
                }
            }
        });
    }

    // Botón Actualizar
    if (btnActualizar) {
        btnActualizar.addEventListener("click", () => {
            if (typeof actualizarPolizaSeleccionada === "function") {
                const exito = actualizarPolizaSeleccionada();
                if (exito) {
                    alert("¡Póliza actualizada correctamente!");
                    if (typeof mostrarPolizasEnTabla === "function") {
                        mostrarPolizasEnTabla();
                    }
                }
            }
        });
    }

    // Botón Exportar Excel
    if (btnExportar) {
        btnExportar.addEventListener("click", () => {
            if (typeof exportarPolizasAExcel === "function") {
                exportarPolizasAExcel();
            }
        });
    }

    // Filtro de la Tabla Historial
    const comboFiltro = document.getElementById("filtroTipoSeguro");
    if (comboFiltro) {
        comboFiltro.addEventListener("change", () => {
            if (typeof renderizarHistorialCompleto === "function") {
                renderizarHistorialCompleto();
            }
        });
    }

    // Botones de acceso rápido dentro de la Casita
    const btnIrRegistro = document.getElementById("btn-ir-registro");
    if (btnIrRegistro) {
        btnIrRegistro.addEventListener("click", () => {
            const botonMasSidebar = document.querySelector('.item-menu[data-pantalla="pantalla-registro"]');
            if (botonMasSidebar) botonMasSidebar.click();
        });
    }

    const btnIrHistorial = document.getElementById("btn-ir-historial");
    if (btnIrHistorial) {
        btnIrHistorial.addEventListener("click", () => {
            cerrarModalResumenTipos();
            const botonHistorialSidebar = document.querySelector('.item-menu[data-pantalla="pantalla-historial"]');
            if (botonHistorialSidebar) botonHistorialSidebar.click();
        });
    }

    const btnAbrirResumen = document.getElementById("btn-abrir-resumen-modal");
    if (btnAbrirResumen) {
        btnAbrirResumen.addEventListener("click", () => {
            abrirModalResumenTipos();
        });
    }

    // 4. LÓGICA DE NAVEGACIÓN ENTRE PANTALLAS (SIDEBAR)
    const botonesSidebar = document.querySelectorAll(".item-menu");
    const pantallas = document.querySelectorAll(".pantalla-modulo");

    botonesSidebar.forEach(boton => {
        boton.addEventListener("click", () => {
            // Quitar estado activo de todos los botones y ocultar pantallas
            botonesSidebar.forEach(b => b.classList.remove("active"));
            pantallas.forEach(p => p.classList.add("pantalla-oculta"));

            // Activar botón e icono presionado
            boton.classList.add("active");
            const idPantallaTarget = boton.getAttribute("data-pantalla");
            const pantallaTarget = document.getElementById(idPantallaTarget);

            if (pantallaTarget) {
                pantallaTarget.classList.remove("pantalla-oculta");
            }

            // Actualizar vistas según la pantalla seleccionada
            if (idPantallaTarget === "pantalla-inicio") {
                refrescarDashboardInicio();
            } else if (idPantallaTarget === "pantalla-vencimientos" && typeof renderizarTablasVencimiento === "function") {
                renderizarTablasVencimiento();
            } else if (idPantallaTarget === "pantalla-historial" && typeof renderizarHistorialCompleto === "function") {
                renderizarHistorialCompleto();
            } else if (idPantallaTarget === "pantalla-resumen") {
                if (typeof renderizarResumenGeneral === "function") {
                    renderizarResumenGeneral();
                }
            } else if (idPantallaTarget === "pantalla-grafica" && typeof renderizarGraficoMovimiento === "function") {
                renderizarGraficoMovimiento();
            }
        });
    });

    // 5. INICIO AUTOMÁTICO EN LA CASITA AL CARGAR LA PÁGINA
    const botonInicio = document.querySelector('.item-menu[data-pantalla="pantalla-inicio"]');
    if (botonInicio) {
        botonInicio.click(); // Simula el clic inicial en la casita
    } else {
        refrescarDashboardInicio(); // En caso de emergencia, carga los datos
    }
});

// Botón para exportar Excel filtrado por mes
const btnExportarMes = document.getElementById("btn-exportar-mes");
if (btnExportarMes) {
    btnExportarMes.addEventListener("click", () => {
        const selectMes = document.getElementById("select-mes-exportar");
        if (!selectMes || !selectMes.value) {
            alert("Por favor, seleccione un mes válido para realizar la descarga.");
            return;
        }
        const mesSeleccionado = parseInt(selectMes.value, 10);
        if (typeof exportarPolizasPorMesAExcel === "function") {
            exportarPolizasPorMesAExcel(mesSeleccionado);
        } else {
            alert("La función de exportación mensual está pendiente de integración.");
        }
    });
}

function refrescarDashboardInicio() {
    // Sincronizar Tablas de Vencimientos en la Casita
    procesarTablaParaInicio("tabla-vencen-este-mes", "tabla-vencen-este-mes-inicio");
    procesarTablaParaInicio("tabla-vencen-proximo-mes", "tabla-vencen-proximo-mes-inicio");

    // Dibujo de la gráfica en la Casita
    if (typeof renderizarGraficoMovimiento === "function") {
        renderizarGraficoMovimiento();
    }
}

function procesarTablaParaInicio(idOrigen, idDestino) {
    const origen = document.getElementById(idOrigen);
    const destino = document.getElementById(idDestino);

    if (!origen || !destino) return;

    if (origen.rows.length === 0 || origen.textContent.includes("No hay pólizas")) {
        destino.innerHTML = `<tr><td colspan="5" class="mensaje-tabla-vacia">No hay pólizas registradas para este periodo.</td></tr>`;
        return;
    }

    let filasHTML = "";
    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0); // Limpia horas para cálculo exacto en días

    Array.from(origen.rows).forEach(row => {
        const celdas = row.cells;

        if (celdas.length >= 4) {
            const cliente = celdas[0]?.textContent.trim() || "-";
            const tipoSeguro = celdas[1]?.textContent.trim() || "-";
            const aseguradora = celdas[2]?.textContent.trim() || "";
            const numPoliza = celdas[3]?.textContent.trim() || "-";
            const finVigenciaStr = celdas[4]?.textContent.trim() || "";

            const tipoYAseguradora = aseguradora ? `${tipoSeguro} / ${aseguradora}` : tipoSeguro;

            // CÁLCULO EN TIEMPO REAL DE DÍAS RESTANTES
            let diasRestantesText = "N/A";
            let claseBadge = "badge-activo"; // Por defecto verde

            if (finVigenciaStr && finVigenciaStr !== "-") {
                // Formato esperado de fecha: YYYY-MM-DD
                const partesFecha = finVigenciaStr.split("-");
                if (partesFecha.length === 3) {
                    const fechaFin = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
                    fechaFin.setHours(0, 0, 0, 0);

                    // Diferencia en milisegundos convertida a días
                    const diferenciaMs = fechaFin.getTime() - fechaHoy.getTime();
                    const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

                    diasRestantesText = diasRestantes;

                    // ASIGNACIÓN DE COLOR SEGÚN REGLAS
                    if (diasRestantes <= 5) {
                        claseBadge = "badge-rojo";     // Rojo (5 días o menos, o vencidos)
                    } else if (diasRestantes <= 15) {
                        claseBadge = "badge-amarillo"; // Amarillo (6 a 15 días)
                    } else {
                        claseBadge = "badge-verde";    // Verde (más de 15 días)
                    }
                }
            }

            filasHTML += `
                <tr class="fila-clicable" onclick="verDetalleCliente('${numPoliza}')">
                    <td><strong>${cliente}</strong></td>
                    <td>${tipoYAseguradora}</td>
                    <td>${numPoliza}</td>
                    <td>${finVigenciaStr}</td>
                    <td><span class="badge ${claseBadge}">${diasRestantesText}</span></td>
                </tr>
            `;
        }
    });

    destino.innerHTML = filasHTML;
}

// LÓGICA DE LA VENTANA FLOTANTE

function abrirModalDetalle(tipoSeguro, estadoFiltro) {
    const modal = document.getElementById("modal-detalle-polizas");
    const titulo = document.getElementById("modal-titulo");
    const cuerpoTabla = document.getElementById("tabla-modal-cuerpo");

    if (!modal || !cuerpoTabla) return;

    titulo.textContent = `Pólizas (${estadoFiltro}) - ${tipoSeguro}`;

    // Obtener lista global de pólizas
    const listaPolizas = typeof polizas !== "undefined" ? polizas : [];

    const filtradas = listaPolizas.filter(p => {
        if (p.tipoPoliza !== tipoSeguro) return false;

        const estado = String(p.estadoPoliza || "").toLowerCase().trim();

        if (estadoFiltro === "Activo") {
            return estado.includes("activ") || estado.includes("vigente");
        } else if (estadoFiltro === "Por Vencer") {
            return estado.includes("próxim") || estado.includes("proxim") || estado.includes("pendiente");
        } else if (estadoFiltro === "Vencido") {
            return estado.includes("vencid");
        } else if (estadoFiltro === "Renovada") {
            return estado.includes("renovad");
        } else if (estadoFiltro === "Cancelada") {
            return estado.includes("cancelad");
        }
        return false;
    });

    // 4. Dibujar celdas
    if (filtradas.length === 0) {
        cuerpoTabla.innerHTML = `<tr><td colspan="4" class="mensaje-tabla-vacia">No hay clientes registrados en esta categoría.</td></tr>`;
    } else {
        let filas = "";
        filtradas.forEach(p => {
            const cliente = p.nombreCliente || p.cliente || "-";
            const aseguradora = p.aseguradora || "-";
            const detalle = p.placa || p.placaDetalle || p.detalle || p.numPoliza || "-";
            const inicio = p.inicioVigencia || p.fechaInicio || "N/A";
            const fin = p.finVigencia || p.fechaFin || "N/A";

            filas += `
                <tr>
                    <td><strong>${cliente}</strong></td>
                    <td>${aseguradora}</td>
                    <td>${detalle}</td>
                    <td>${inicio} al ${fin}</td>
                </tr>
            `;
        });
        cuerpoTabla.innerHTML = filas;
    }

    modal.classList.remove("modal-oculto");
}

// FUNCIÓN DE CIERRE 
function cerrarModalDetalle() {
    const modal = document.getElementById("modal-detalle-polizas");
    if (modal) {
        modal.classList.add("modal-oculto");
    }
}

// ==========================================
// Búsqueda Global de Pólizas en Tiempo Real
// ==========================================

function buscarPolizasGlobales() {
    const input = document.getElementById('inputBusquedaGlobal');
    const btnClear = document.getElementById('btnClearSearch');
    if (!input) return;

    const termino = input.value.toLowerCase().trim();
    const seccionResultados = document.getElementById('seccionResultadosBusqueda');
    const tablaBody = document.getElementById('tablaResultadosBusquedaBody');
    const tituloResultados = document.getElementById('tituloResultadosBusqueda');

    // Seleccionamos los contenedores principales del Dashboard para ocultarlos/mostrarlos
    const elementosDashboard = document.querySelectorAll('.dashboard-grid, .grid-container, .row-cards');

    if (termino === '') {
        // Si la barra está vacía, ocultamos resultados y restauramos el Dashboard
        if (btnClear) btnClear.style.display = 'none';
        if (seccionResultados) seccionResultados.style.display = 'none';

        elementosDashboard.forEach(el => el.style.display = '');
        return;
    }

    // Mostrar el botón de limpiar (X)
    if (btnClear) btnClear.style.display = 'block';

    // Ocultar la vista normal del Dashboard y mostrar la tabla de resultados
    elementosDashboard.forEach(el => el.style.display = 'none');
    if (seccionResultados) seccionResultados.style.display = 'block';

    // Filtrar en el arreglo global 'polizas' (que viene cargado desde Firebase)
    // Se busca en CUALQUIER campo de cada póliza registrada
    const coincidencias = polizas.filter(p => {
        return Object.values(p).some(valor => {
            if (valor === null || valor === undefined) return false;
            return valor.toString().toLowerCase().includes(termino);
        });
    });

    // Renderizar la tabla con los datos filtrados
    tablaBody.innerHTML = '';
    if (tituloResultados) {
        tituloResultados.textContent = `Resultados de la Búsqueda (${coincidencias.length})`;
    }

    if (coincidencias.length === 0) {
        tablaBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #718096;">
          No se encontraron pólizas ni registros que coincidan con "${input.value}".
        </td>
      </tr>
    `;
        return;
    }

    coincidencias.forEach(p => {
        const numPol = p.numeroPoliza || p.numPoliza || p.poliza || '';
        const tr = document.createElement('tr');
        tr.className = "fila-clicable";
        tr.setAttribute("onclick", `verDetalleCliente('${numPol}')`);
        tr.innerHTML = `
  <td><strong>${p.cliente || p.nombreCliente || 'N/A'}</strong></td>
  <td>${p.tipoSeguro || p.tipoPoliza || 'N/A'} / ${p.aseguradora || 'N/A'}</td>
  <td>${numPol || 'N/A'}</td>
  <td>${p.placa || p.placaDetalle || p.detalle || p.codigo || 'N/A'}</td>
  <td>${p.inicioVigencia || 'N/A'}</td>
  <td>${p.finVigencia || 'N/A'}</td>
  <td>
    <span class="badge ${p.estado === 'Activa' ? 'badge-success' : 'badge-warning'}">
      ${p.estado || 'Registrada'}
    </span>
  </td>
`;

        tablaBody.appendChild(tr);
    });
}

// Función para limpiar el input de búsqueda
function limpiarBusquedaGlobal() {
    const input = document.getElementById('inputBusquedaGlobal');
    if (input) {
        input.value = '';
        buscarPolizasGlobales();
    }
}

// ABRIR LA FICHA/DETALLE INDIVIDUAL DEL CLIENTE

function verDetalleCliente(numPoliza) {
    if (!numPoliza || numPoliza === "-") return;

    // Obtener lista global de pólizas desde Firebase/Memoria
    const listaPolizas = typeof polizas !== "undefined" ? polizas : [];

    // Buscar el objeto del cliente por número de póliza
    const clienteEncontrado = listaPolizas.find(p => {
        const polizaObj = p.numeroPoliza || p.numPoliza || p.poliza || "";
        return String(polizaObj).trim() === String(numPoliza).trim();
    });

    if (!clienteEncontrado) {
        alert("No se encontró el detalle completo para la póliza N° " + numPoliza);
        return;
    }

    // Llenar campos del modal con los datos del Historial
    document.getElementById("ficha-codigo").textContent = clienteEncontrado.codigo || clienteEncontrado.id || "-";
    document.getElementById("ficha-cliente").textContent = clienteEncontrado.nombreCliente || clienteEncontrado.cliente || "-";
    document.getElementById("ficha-cedula").textContent = clienteEncontrado.cedulaRuc || clienteEncontrado.cedula || clienteEncontrado.ruc || "-";
    document.getElementById("ficha-telefono").textContent = clienteEncontrado.telefono || "-";
    document.getElementById("ficha-correo").textContent = clienteEncontrado.correo || clienteEncontrado.email || "-";
    document.getElementById("ficha-aseguradora").textContent = clienteEncontrado.aseguradora || "-";
    document.getElementById("ficha-tipo-poliza").textContent = clienteEncontrado.tipoPoliza || clienteEncontrado.tipoSeguro || "-";
    document.getElementById("ficha-num-poliza").textContent = clienteEncontrado.numeroPoliza || clienteEncontrado.numPoliza || clienteEncontrado.poliza || "-";
    document.getElementById("ficha-placa").textContent = clienteEncontrado.placaDetalle || clienteEncontrado.placa || clienteEncontrado.detalle || "-";
    document.getElementById("ficha-inicio-vigencia").textContent = clienteEncontrado.inicioVigencia || clienteEncontrado.fechaInicio || "-";
    document.getElementById("ficha-fin-vigencia").textContent = clienteEncontrado.finVigencia || clienteEncontrado.fechaFin || "-";
    document.getElementById("ficha-estado").textContent = clienteEncontrado.estadoPoliza || clienteEncontrado.estado || "Registrada";

    // Mostrar modal
    const modal = document.getElementById("modal-ficha-cliente");
    if (modal) {
        modal.classList.remove("modal-oculto");
    }
}

function cerrarModalFichaCliente() {
    const modal = document.getElementById("modal-ficha-cliente");
    if (modal) {
        modal.classList.add("modal-oculto");
    }
}

//SUGERENCIAS-REGISTRO
// Escuchadores en tiempo real para activar las sugerencias flotantes en cada input crítico
const camposMonitoreadosValidacion = [
    "cliente", "cedulaRuc", "solicitante", "cedulaRuc1", "telefonoCliente",
    "emailCliente", "numeroPoliza", "placaDetalle", "codigoPoliza"
];

camposMonitoreadosValidacion.forEach(id => {
    const inputElem = document.getElementById(id);
    if (inputElem) {
        inputElem.addEventListener("input", () => {
            if (typeof verificarSimilitudesYBloqueo === "function") {
                verificarSimilitudesYBloqueo();
            }
        });
    }
});

// ABRIR MODAL DE RESUMEN POR TIPO DE SEGURO
function abrirModalResumenTipos() {
    const modal = document.getElementById("modal-resumen-tipos");
    if (modal) {
        modal.classList.remove("modal-oculto");
        // Forzar renderizado inmediato al abrir
        if (typeof renderizarResumenGeneral === "function") {
            renderizarResumenGeneral();
        }
    }
}

// CERRAR MODAL DE RESUMEN POR TIPO DE SEGURO
function cerrarModalResumenTipos() {
    const modal = document.getElementById("modal-resumen-tipos");
    if (modal) {
        modal.classList.add("modal-oculto");
    }
}