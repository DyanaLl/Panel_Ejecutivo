// Configuración de credenciales de EmailJS
const EMAILJS_CONFIG = {
    SERVICE_ID: "service_sbvs893",    // Tu Service ID
    TEMPLATE_ID: "template_gffiwwf",   // Tu Template ID
    PUBLIC_KEY: "-Ed9Y1UQA95iBMfTZ",   // Tu Public Key
    CORREO_DESTINO: "foxandinaec@gmail.com"
};

// Inicializar EmailJS con la clave pública
(function () {
    if (typeof emailjs !== "undefined") {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
})();

/**
 * Función principal que recorre las pólizas y envía alertas
 * @param {Array} listaPolizas - Arreglo con todos los objetos de pólizas
 */

function verificarYEnviarNotificacionesPolizas(listaPolizas) {
    
    // Registro de correos enviados en la sesión actual para no repetir
    const notificacionesEnviadas = JSON.parse(localStorage.getItem("notificaciones_enviadas") || "{}");

    listaPolizas.forEach(p => {
        const estadoNorm = String(p.estadoPoliza || "").toLowerCase();
        // 🛑 Si la póliza ya fue Renovada, Cancelada o Gestionada, no enviar correos
        if (estadoNorm.includes("renovad") || estadoNorm.includes("cancelad")) {
            return;
        }
        const fechaFinStr = p.finVigencia || p.fechaFin;
        if (!fechaFinStr) return;

        // Convertir string de fecha a objeto Date
        const fechaFin = new Date(fechaFinStr + "T00:00:00");

        // Calcular diferencia en días
        const diffTiempo = fechaFin.getTime() - hoy.getTime();
        const diasRestantes = Math.round(diffTiempo / (1000 * 3600 * 24));

        const numPoliza = p.numeroPoliza || p.numPoliza || p.poliza || "S/N";
        const clienteNombre = p.nombreCliente || p.cliente || "Cliente Sin Nombre";

        // Evaluar solo si faltan exactamente 10, 5 o 0 días
        if (diasRestantes === 10 || diasRestantes === 5 || diasRestantes === 0) {

            // Crear una clave única para no enviar múltiples veces el mismo día la misma alerta
            const fechaHoyStr = hoy.toISOString().split("T")[0];
            const claveNotificacion = `${numPoliza}_${diasRestantes}_${fechaHoyStr}`;

            if (notificacionesEnviadas[claveNotificacion]) {
                console.log(`Notificación ya enviada hoy para la póliza N° ${numPoliza} (${diasRestantes} días restante/s).`);
                return;
            }

            // Construir los parámetros del correo de acuerdo a los días
            let datosCorreo = {
                to_email: EMAILJS_CONFIG.CORREO_DESTINO,
                id_firebase: p.idFirebase,
                nombre_cliente: clienteNombre,
                tipo_seguro: p.tipoPoliza || p.tipoSeguro || "-",
                aseguradora: p.aseguradora || "-",
                numero_poliza: numPoliza,
                placa_detalle: p.placaDetalle || p.placa || p.detalle || "-",
                fin_vigencia: fechaFinStr,
            };

            if (diasRestantes === 10) {
                datosCorreo.asunto_correo = `[Recordatorio Interno] Póliza de ${clienteNombre} vence en 10 días`;
                datosCorreo.nivel_urgencia = "RECORDATORIO PREVENTIVO";
                datosCorreo.mensaje_cabecera = `Le recordamos que la póliza del cliente ${clienteNombre} está a 10 días de vencer. Se recomienda coordinar la primera toma de contacto.`;
                datosCorreo.badge_estado = "Vence en 10 días";
                datosCorreo.mensaje_pie = "Por favor, iniciar la gestión con el cliente para revisar su proceso de renovación.";
            } else if (diasRestantes === 5) {
                datosCorreo.asunto_correo = `[Prioridad Alta] Póliza de ${clienteNombre} vence en 5 días`;
                datosCorreo.nivel_urgencia = "AVISO PRIORITARIO";
                datosCorreo.mensaje_cabecera = `Atención: Quedan únicamente 5 días para el vencimiento de la póliza de ${clienteNombre}. Se requiere seguimiento urgente.`;
                datosCorreo.badge_estado = "Vence en 5 días";
                datosCorreo.mensaje_pie = "Contactar directamente al cliente para confirmar si procederá con la renovación.";
            } else if (diasRestantes === 0) {
                datosCorreo.asunto_correo = `[URGENTE HOY] La póliza de ${clienteNombre} vence HOY`;
                datosCorreo.nivel_urgencia = "¡ALERTA DE VENCIMIENTO HOY!";
                datosCorreo.mensaje_cabecera = `Alerta crítica: La póliza de ${clienteNombre} vence el día de hoy. Es necesario gestionar la renovación de inmediato para no perder la cobertura.`;
                datosCorreo.badge_estado = "¡VENCE HOY!";
                datosCorreo.mensaje_pie = "Realizar llamada o gestión prioritaria hoy mismo con el cliente.";
            }

            // Enviar correo a través de EmailJS
            emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, datosCorreo)
                .then(response => {
                    console.log(` Correo enviado exitosamente para la póliza N° ${numPoliza} (${diasRestantes} días).`, response.status, response.text);
                    // Marcar como enviado en la sesión
                    notificacionesEnviadas[claveNotificacion] = true;
                    localStorage.setItem("notificaciones_enviadas", JSON.stringify(notificacionesEnviadas));
                })
                .catch(error => {
                    console.error(` Error al enviar el correo para la póliza N° ${numPoliza}:`, error);
                });
        }
    });
}