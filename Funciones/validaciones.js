/**
 * Valida si un correo electrónico tiene un formato válido.
 * @param {string} email 
 * @returns {boolean}
 */
function validarEmail(email) {
    const val = email.trim();
    // Exige texto antes y después del arroba '@'
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
}

/**
 * Valida la cédula (10 dígitos) o RUC (13 dígitos) según normas de Ecuador.
 * @param {string} identificacion 
 * @returns {boolean}
 */
function validarCedulaRuc(identificacion) {
    const val = identificacion.trim();
    if (!/^\d+$/.test(val)) return false;

    // Cédula: 10 dígitos, RUC persona natural: 13 dígitos
    if (val.length === 10 || val.length === 13) {
        return true;
    }
    return false;
}

/**
 * Valida el formato de teléfono (números entre 7 y 10 dígitos).
 * @param {string} telefono 
 * @returns {boolean}
 */
function validarTelefono(telefono) {
    const val = telefono.trim();
    const regex = /^[0-9]{9,10}$/;
    return regex.test(val);
}

/**
 * Obtiene y valida todos los datos ingresados en el formulario de registro/edición.
 * Realiza comprobaciones de campos obligatorios y formatos.
 * @returns {Object|null} Retorna el objeto con datos estructurados o null si falla alguna validación.
 */
function obtenerYValidarDatosFormulario() {
    const tipoPoliza = document.getElementById('tipoPoliza').value.trim();
    const aseguradora = document.getElementById('aseguradora').value.trim();
    const cliente = document.getElementById('cliente').value.trim();
    const cedulaRuc = document.getElementById('cedulaRuc').value.trim();
    const solicitante = document.getElementById('solicitante').value.trim(); 
    const cedulaRuc1 = document.getElementById('cedulaRuc1').value.trim();
    const telefonoCliente = document.getElementById('telefonoCliente').value.trim();
    const emailCliente = document.getElementById('emailCliente').value.trim();
    const numeroPoliza = document.getElementById('numeroPoliza').value.trim();
    const placaDetalle = document.getElementById('placaDetalle').value.trim();
    const valorAsigurado = document.getElementById('valorAsigurado').value.trim()
    const primaNeta = document.getElementById('primaNeta').value.trim()
    const endosoBeneficiario = document.getElementById('endosoBeneficiario').value.trim()
    const inicioVigencia = document.getElementById('inicioVigencia').value;
    const finVigencia = document.getElementById('finVigencia').value;
    const codigoPoliza = document.getElementById('codigoPoliza').value.trim();
    const estadoPoliza = document.getElementById('estadoPoliza').value;

    // Validación de campos obligatorios básicos
    // Validación de campos estrictamente obligatorios (Teléfono, Correo y Placa/Detalle ya NO están aquí)
    if (!tipoPoliza || !aseguradora || !cliente || !numeroPoliza || !inicioVigencia || !finVigencia || !codigoPoliza) {
        alert("Por favor, completa todos los campos obligatorios del formulario.");
        return null;
    }

    // Validación de Cédula / RUC (si fue ingresado)
    if (cedulaRuc !== "" && !validarCedulaRuc(cedulaRuc)) {
        alert("El número de Cédula o RUC no tiene un formato válido (debe tener 10 o 13 dígitos).");
        return null;
    }

    if (cedulaRuc1 !== "" && !validarCedulaRuc(cedulaRuc1)) {
        alert("El número de Cédula o RUC del solicitante no tiene un formato válido.");
        return null;
    }
    
    // Validación de Teléfono (si fue ingresado)
    if (telefonoCliente !== "" && !validarTelefono(telefonoCliente)) {
        alert("El número de teléfono ingresado no es válido.");
        return null;
    }

    // Validación de Correo Electrónico (si fue ingresado)
    if (emailCliente !== "" && !validarEmail(emailCliente)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        return null;
    }

    // Validación de fechas de vigencia
    if (new Date(inicioVigencia) > new Date(finVigencia)) {
        alert("La fecha de inicio de vigencia no puede ser posterior a la fecha de fin de vigencia.");
        return null;
    }

    return {
        tipoPoliza,
        aseguradora,
        cliente,
        cedulaRuc,
        solicitante,
        cedulaRuc1,
        telefono: telefonoCliente, 
        email: emailCliente,       
        numeroPoliza,
        placaDetalle,
        valorAsigurado,    
        primaNeta,         
        endosoBeneficiario,
        inicioVigencia,
        finVigencia,
        codigoPoliza,
        estadoPoliza
    };
}

/**
 * Limpia todos los campos del formulario de registro de pólizas.
 */
function limpiarFormulario() {
    const form = document.getElementById('form-registro-polizas');
    if (form) {
        form.reset();
    }
}

function validarFormularioPoliza() {
    return true;
}

/**
 * Comprueba similitudes en tiempo real para todos los campos críticos 
 * y gestiona las sugerencias flotantes y el bloqueo por duplicados exactos.
 */
function verificarSimilitudesYBloqueo() {
    const clienteVal = document.getElementById("cliente").value.trim().toLowerCase();
    const cedulaVal = document.getElementById("cedulaRuc").value.trim().toLowerCase();
    const solicitanteVal = document.getElementById("solicitante") ? document.getElementById("solicitante").value.trim().toLowerCase() : "";
    const cedulaRuc1Val = document.getElementById("cedulaRuc1") ? document.getElementById("cedulaRuc1").value.trim().toLowerCase() : "";
    const telVal = document.getElementById("telefonoCliente").value.trim().toLowerCase();
    const emailVal = document.getElementById("emailCliente").value.trim().toLowerCase();
    const numPolizaVal = document.getElementById("numeroPoliza").value.trim().toLowerCase();
    const detalleVal = document.getElementById("placaDetalle").value.trim().toLowerCase();
    const codigoVal = document.getElementById("codigoPoliza").value.trim().toLowerCase();

    const sugCliente = document.getElementById("sugerencia-cliente");
    const sugCedula = document.getElementById("sugerencia-cedula");
    const sugSolicitante = document.getElementById("sugerencia-solicitante");
    const sugCedula1 = document.getElementById("sugerencia-cedula1");
    const sugTel = document.getElementById("sugerencia-telefono");
    const sugEmail = document.getElementById("sugerencia-email");
    const sugPoliza = document.getElementById("sugerencia-poliza");
    const sugDetalle = document.getElementById("sugerencia-detalle");
    const sugCodigo = document.getElementById("sugerencia-codigo");
    const btnRegistrar = document.getElementById("btn-registrar");

    let bloquearRegistro = false;

    // Limpiar sugerencias previas en cada pulsación
    const contenedores = [sugCliente, sugCedula, sugSolicitante, sugCedula1, sugTel, sugEmail, sugPoliza, sugDetalle, sugCodigo];
    contenedores.forEach(sug => {
        if (sug) { sug.style.display = "none"; sug.textContent = ""; }
    });

    if (typeof polizas === "undefined") return;

    polizas.forEach((p, index) => {
        // Ignorar el registro actual si estamos editando (para evitar auto-bloqueo)
        if (typeof polizaSeleccionadaIndex !== "undefined" && polizaSeleccionadaIndex === index) {
            return;
        }
        const pCliente = String(p.cliente || "").toLowerCase();
        const pCedula = String(p.cedulaRuc || "").toLowerCase();
        const pSolicitante = String(p.solicitante || "").toLowerCase();
        const pCedula1 = String(p.cedulaRuc1 || "").toLowerCase();
        const pTel = String(p.telefono || p.telefonoCliente || "").toLowerCase();
        const pEmail = String(p.email || p.correo || "").toLowerCase();
        const pNumPoliza = String(p.numeroPoliza || "").toLowerCase();
        const pDetalle = String(p.placaDetalle || "").toLowerCase();
        const pCodigo = String(p.codigo || p.codigoPoliza || "").toLowerCase();

        // 1. Cliente (Sugerencia cruzada con cliente o solicitante anterior)
        if (clienteVal.length > 2 && (pCliente.includes(clienteVal) || pSolicitante.includes(clienteVal))) {
            if (sugCliente) {
                sugCliente.textContent = `ℹ️ Sugerencia: Hay similitud con el cliente/solicitante previo ("${p.cliente || p.solicitante}").`;
                sugCliente.style.display = "block";
            }
        }

        // 2. Cédula o RUC del Cliente (Sugerencia cruzada)
        if (cedulaVal.length > 4 && (pCedula.includes(cedulaVal) || pCedula1.includes(cedulaVal))) {
            if (sugCedula) {
                sugCedula.textContent = `ℹ️ Sugerencia: Esta Cédula/RUC ya está registrada en el sistema (${p.cliente || p.solicitante}).`;
                sugCedula.style.display = "block";
            }
        }

        // 3. Solicitante (Sugerencia cruzada buscando tanto en clientes como en solicitantes previos)
        if (solicitanteVal.length > 2 && (pSolicitante.includes(solicitanteVal) || pCliente.includes(solicitanteVal))) {
            if (sugSolicitante) {
                sugSolicitante.textContent = `ℹ️ Sugerencia: El solicitante coincide con registros previos ("${p.solicitante || p.cliente}").`;
                sugSolicitante.style.display = "block";
            }
        }

        // 4. Cédula o RUC del Solicitante (Sugerencia cruzada de identificación)
        if (cedulaRuc1Val.length > 4 && (pCedula1.includes(cedulaRuc1Val) || pCedula.includes(cedulaRuc1Val))) {
            if (sugCedula1) {
                sugCedula1.textContent = `ℹ️ Sugerencia: Esta Cédula/RUC de solicitante ya figura asociada a (${p.solicitante || p.cliente}).`;
                sugCedula1.style.display = "block";
            }
        }
        
        // 5. Teléfono (Sugerencia - NO bloquea)
        if (telVal.length > 5 && pTel.includes(telVal)) {
            if (sugTel) {
                sugTel.textContent = `ℹ️ Sugerencia: Este teléfono pertenece a ${p.cliente}.`;
                sugTel.style.display = "block";
            }
        }

        // 6. Correo Electrónico (Sugerencia - NO bloquea)
        if (emailVal.length > 4 && pEmail.includes(emailVal)) {
            if (sugEmail) {
                sugEmail.textContent = `ℹ️ Sugerencia: Este correo ya fue usado antes.`;
                sugEmail.style.display = "block";
            }
        }

        // 7. Número de Póliza (BLOQUEO ESTRICTO - Jamás se puede repetir)
        if (numPolizaVal && pNumPoliza === numPolizaVal) {
            bloquearRegistro = true;
            if (sugPoliza) {
                sugPoliza.textContent = `⛔ ¡Bloqueo! Este N° de Póliza ya existe en el sistema.`;
                sugPoliza.style.display = "block";
            }
        }

        // 8. Placa o Detalle (Sugerencia - NO bloquea)
        if (detalleVal.length > 3 && pDetalle.includes(detalleVal)) {
            if (sugDetalle) {
                sugDetalle.textContent = `ℹ️ Sugerencia: Esta placa o detalle ya registra otra póliza.`;
                sugDetalle.style.display = "block";
            }
        }

        // 7. Código Interno (BLOQUEO ESTRICTO - Identificador único de control)
        if (codigoVal && pCodigo === codigoVal) {
            bloquearRegistro = true;
            if (sugCodigo) {
                sugCodigo.textContent = `⛔ ¡Bloqueo! El código interno "${codigoVal}" ya está en uso.`;
                sugCodigo.style.display = "block";
            }
        }
    });

    // Control del botón de registro: solo se desactiva si hay conflicto de Póliza o Código
    if (btnRegistrar) {
        if (bloquearRegistro) {
            btnRegistrar.disabled = true;
            btnRegistrar.style.backgroundColor = "#94a3b8";
            btnRegistrar.style.cursor = "not-allowed";
            btnRegistrar.title = "No se puede registrar: El Número de Póliza o el Código ya existen.";
        } else {
            btnRegistrar.disabled = false;
            btnRegistrar.style.backgroundColor = "";
            btnRegistrar.style.cursor = "pointer";
            btnRegistrar.title = "";
            
        }
        
    }
}

