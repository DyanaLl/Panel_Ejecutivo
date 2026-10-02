const https = require('https');

// CONFIGURACIÓN DE TUS SERVICIOS (Credenciales actualizadas)
const FIREBASE_URL = "https://pagi-e6b7b-default-rtdb.firebaseio.com/polizas.json";
const EMAILJS_SERVICE_ID = "service_sbvs893";
const EMAILJS_TEMPLATE_ID = "template_gffiwwf";
const EMAILJS_PUBLIC_KEY = "-Ed9Y1UQA95iBMfTZ";
const CORREO_DESTINO = "foxandinaec@gmail.com";

function hacerPeticion(url, options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function enviarCorreoEmailJS(datosCorreo) {
    const data = JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: datosCorreo
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    try {
        const res = await hacerPeticion('https://api.emailjs.com/api/v1.0/email/send', options, data);
        if (res.status === 200) {
            console.log(`✅ Correo enviado con éxito para póliza: ${datosCorreo.numero_poliza}`);
        } else {
            console.error(`❌ Error al enviar correo EmailJS (${res.status}): ${res.body}`);
        }
    } catch (err) {
        console.error("❌ Error de red al conectar con EmailJS:", err);
    }
}

async function ejecutarChequeoDiario() {
    console.log("⏰ Iniciando chequeo diario de pólizas...");

    try {
        const res = await hacerPeticion(FIREBASE_URL, { method: 'GET' });
        if (res.status !== 200 || !res.body) {
            console.log("No se encontraron pólizas o hubo un error al consultar Firebase.");
            return;
        }

        const datos = JSON.parse(res.body);
        if (!datos) {
            console.log("Base de datos de pólizas vacía.");
            return;
        }

        // Crear la fecha de HOY a medianoche ajustada a Ecuador (UTC-5)
        const hoy = new Date();
        const fechaHoyEcuador = new Date(hoy.getTime() - (5 * 60 * 60 * 1000));
        const hoyStr = fechaHoyEcuador.toISOString().split("T")[0]; // "YYYY-MM-DD"
        const [hAno, hMes, hDia] = hoyStr.split("-").map(Number);
        const fechaHoy = new Date(hAno, hMes - 1, hDia);

        console.log(`📅 Fecha base de comparación (Ecuador): ${hoyStr}`);

        const keys = Object.keys(datos);

        for (const key of keys) {
            const p = datos[key];
            const estadoNorm = String(p.estadoPoliza || "").toLowerCase();

            // 🛑 Omitir si la póliza ya fue gestionada, renovada o cancelada
            if (estadoNorm.includes("renovad") || estadoNorm.includes("cancelad") || estadoNorm.includes("gestionad")) {
                continue;
            }

            const fechaFinStr = p.finVigencia || p.fechaFin;
            if (!fechaFinStr) continue;

            // Formato esperado YYYY-MM-DD
            const partes = fechaFinStr.split("-");
            if (partes.length !== 3) continue;

            const fechaFin = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));

            const diffTime = fechaFin.getTime() - fechaHoy.getTime();
            const diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

            console.log(`🔍 Evaluando Póliza N° ${p.numeroPoliza || p.numPoliza}: Quedan ${diasRestantes} días.`);

            // Evaluamos alertas exactas de 10, 5 o 0 días
            if (diasRestantes === 10 || diasRestantes === 5 || diasRestantes === 0) {
                console.log(`📌 Póliza N° ${p.numeroPoliza} requiere notificación (${diasRestantes} días restantes).`);

                const clienteNombre = p.cliente || p.nombreCliente || "Cliente Registrado";
                const numPoliza = p.numeroPoliza || p.numPoliza || p.poliza || "-";

                const datosCorreo = {
                    to_email: CORREO_DESTINO,
                    id_firebase: key,
                    nombre_cliente: clienteNombre,
                    tipo_seguro: p.tipoPoliza || p.tipoSeguro || "-",
                    aseguradora: p.aseguradora || "-",
                    numero_poliza: numPoliza,
                    placa_detalle: p.placaDetalle || p.placa || p.detalle || "-",
                    fin_vigencia: fechaFinStr
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

                await enviarCorreoEmailJS(datosCorreo);
            }
        }

        console.log("Chequeo completado exitosamente.");

    } catch (error) {
        console.error("Error en el proceso diario:", error);
    }
}

ejecutarChequeoDiario();