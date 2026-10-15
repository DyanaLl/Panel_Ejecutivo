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
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

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

        // Verificar si tiene Endoso Beneficiario
        const tieneEndoso = String(p.endosoBeneficiario || "").toLowerCase() === "sí" || String(p.endosoBeneficiario || "").toLowerCase() === "si";
        // Definir los días en los que se debe disparar la alerta según corresponda
        const diasPermitidos = tieneEndoso ? [45, 30, 15, 10, 5, 0] : [10, 5, 0];

        // Evaluar si los días restantes coinciden con alguno de los hitos permitidos
        if (diasPermitidos.includes(diasRestantes)) {

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

            if (tieneEndoso) {
                // Lógica de alertas anticipadas para pólizas con Endoso Beneficiario
                if (diasRestantes === 45) {
                    datosCorreo.asunto_correo = `[Endoso Beneficiario - 45 Días] Póliza de ${clienteNombre} requiere gestión anticipada`;
                    datosCorreo.nivel_urgencia = "GESTIÓN ANTICIPADA (ENDOSO)";
                    datosCorreo.mensaje_cabecera = `Aviso especial: La póliza de ${clienteNombre} cuenta con ENDOSO BENEFICIARIO y vence en 45 días. Requiere mayor tiempo de anticipación para su trámite.`;
                    datosCorreo.badge_estado = "Endoso | Vence en 45 días";
                    datosCorreo.mensaje_pie = "Por favor, inicie la gestión anticipada requerida por el endoso beneficiario.";
                } else if (diasRestantes === 30) {
                    datosCorreo.asunto_correo = `[Endoso Beneficiario - 30 Días] Seguimiento de póliza de ${clienteNombre}`;
                    datosCorreo.nivel_urgencia = "SEGUIMIENTO PREVENTIVO (ENDOSO)";
                    datosCorreo.mensaje_cabecera = `Recordatorio: Faltan 30 días para el vencimiento de la póliza con ENDOSO BENEFICIARIO de ${clienteNombre}. Continúe con el proceso de renovación.`;
                    datosCorreo.badge_estado = "Endoso | Vence en 30 días";
                    datosCorreo.mensaje_pie = "Realice la gestión de esta póliza con endoso.";
                } else if (diasRestantes === 15) {
                    datosCorreo.asunto_correo = `[Endoso Beneficiario - 15 Días] Alerta prioritaria póliza de ${clienteNombre}`;
                    datosCorreo.nivel_urgencia = "AVISO PRIORITARIO (ENDOSO)";
                    datosCorreo.mensaje_cabecera = `Atención: Quedan 15 días para el vencimiento de la póliza con ENDOSO BENEFICIARIO de ${clienteNombre}. Se requiere agilizar las gestiones.`;
                    datosCorreo.badge_estado = "Endoso | Vence en 15 días";
                    datosCorreo.mensaje_pie = "Realice la gestión de esta póliza con endoso.";
                } else if (diasRestantes === 10) {
                    datosCorreo.asunto_correo = `[Endoso Beneficiario] Póliza de ${clienteNombre} vence en 10 días`;
                    datosCorreo.nivel_urgencia = "RECORDATORIO URGENTE (ENDOSO)";
                    datosCorreo.mensaje_cabecera = `La póliza con ENDOSO BENEFICIARIO de ${clienteNombre} está a 10 días de vencer.`;
                    datosCorreo.badge_estado = "Endoso | Vence en 10 días";
                    datosCorreo.mensaje_pie = "Realice la gestión de esta póliza de forma prioritaria debido a las condiciones del endoso.";
                } else if (diasRestantes === 5) {
                    datosCorreo.asunto_correo = `[Endoso Beneficiario - ALTA] Póliza de ${clienteNombre} vence en 5 días`;
                    datosCorreo.nivel_urgencia = "CRÍTICO (ENDOSO BENEFICIARIO)";
                    datosCorreo.mensaje_cabecera = `Quedan únicamente 5 días para el vencimiento de la póliza con ENDOSO BENEFICIARIO de ${clienteNombre}.`;
                    datosCorreo.badge_estado = "Endoso | Vence en 5 días";
                    datosCorreo.mensaje_pie = "Urgente: Confirmar la renovación inmediata para evitar afectaciones por el endoso.";
                } else if (diasRestantes === 0) {
                    datosCorreo.asunto_correo = `[URGENTE HOY - ENDOSO] Póliza de ${clienteNombre} vence HOY`;
                    datosCorreo.nivel_urgencia = "¡ALERTA MÁXIMA VENCIMIENTO HOY!";
                    datosCorreo.mensaje_cabecera = `Alerta crítica: La póliza con ENDOSO BENEFICIARIO de ${clienteNombre} vence el día de hoy.`;
                    datosCorreo.badge_estado = "Endoso | ¡VENCE HOY!";
                    datosCorreo.mensaje_pie = "Acción inmediata requerida hoy mismo.";
                }
            } else {

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
