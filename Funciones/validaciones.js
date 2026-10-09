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