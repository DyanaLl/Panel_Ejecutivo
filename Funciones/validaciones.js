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
    const telefonoCliente = document.getElementById('telefonoCliente').value.trim();
    const emailCliente = document.getElementById('emailCliente').value.trim();
    const numeroPoliza = document.getElementById('numeroPoliza').value.trim();
    const placaDetalle = document.getElementById('placaDetalle').value.trim();
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
        telefono: telefonoCliente, 
        email: emailCliente,       
        numeroPoliza,
        placaDetalle,
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
    const telVal = document.getElementById("telefonoCliente").value.trim().toLowerCase();
    const emailVal = document.getElementById("emailCliente").value.trim().toLowerCase();
    const numPolizaVal = document.getElementById("numeroPoliza").value.trim().toLowerCase();
    const detalleVal = document.getElementById("placaDetalle").value.trim().toLowerCase();
    const codigoVal = document.getElementById("codigoPoliza").value.trim().toLowerCase();

    const sugCliente = document.getElementById("sugerencia-cliente");
    const sugCedula = document.getElementById("sugerencia-cedula");
    const sugTel = document.getElementById("sugerencia-telefono");
    const sugEmail = document.getElementById("sugerencia-email");
    const sugPoliza = document.getElementById("sugerencia-poliza");
    const sugDetalle = document.getElementById("sugerencia-detalle");
    const sugCodigo = document.getElementById("sugerencia-codigo");
    const btnRegistrar = document.getElementById("btn-registrar");

    let bloquearRegistro = false;

    // Limpiar sugerencias previas en cada pulsación
    const contenedores = [sugCliente, sugCedula, sugTel, sugEmail, sugPoliza, sugDetalle, sugCodigo];
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
        const pTel = String(p.telefono || p.telefonoCliente || "").toLowerCase();
        const pEmail = String(p.email || p.correo || "").toLowerCase();
        const pNumPoliza = String(p.numeroPoliza || "").toLowerCase();
        const pDetalle = String(p.placaDetalle || "").toLowerCase();
        const pCodigo = String(p.codigo || p.codigoPoliza || "").toLowerCase();

        // 1. Cliente (Sugerencia informativa - NO bloquea)
        if (clienteVal.length > 2 && pCliente.includes(clienteVal)) {
            if (sugCliente) {
                sugCliente.textContent = `ℹ️ Sugerencia: Ya existe un cliente similar ("${p.cliente}").`;
                sugCliente.style.display = "block";
            }
        }

        // 2. Cédula o RUC (Sugerencia informativa de cliente recurrente - NO bloquea)
        if (cedulaVal.length > 4 && pCedula.includes(cedulaVal)) {
            if (sugCedula) {
                sugCedula.textContent = `ℹ️ Sugerencia: Esta Cédula/RUC ya está registrada para ${p.cliente}.`;
                sugCedula.style.display = "block";
            }
        }

        // 3. Teléfono (Sugerencia - NO bloquea)
        if (telVal.length > 5 && pTel.includes(telVal)) {
            if (sugTel) {
                sugTel.textContent = `ℹ️ Sugerencia: Este teléfono pertenece a ${p.cliente}.`;
                sugTel.style.display = "block";
            }
        }

        // 4. Correo Electrónico (Sugerencia - NO bloquea)
        if (emailVal.length > 4 && pEmail.includes(emailVal)) {
            if (sugEmail) {
                sugEmail.textContent = `ℹ️ Sugerencia: Este correo ya fue usado antes.`;
                sugEmail.style.display = "block";
            }
        }

        // 5. Número de Póliza (BLOQUEO ESTRICTO - Jamás se puede repetir)
        if (numPolizaVal && pNumPoliza === numPolizaVal) {
            bloquearRegistro = true;
            if (sugPoliza) {
                sugPoliza.textContent = `⛔ ¡Bloqueo! Este N° de Póliza ya existe en el sistema.`;
                sugPoliza.style.display = "block";
            }
        }

        // 6. Placa o Detalle (Sugerencia - NO bloquea)
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

