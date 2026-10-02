const https = require('https');

// CONFIGURACIÓN DE TUS SERVICIOS
const FIREBASE_URL = "https://panel-ejecutivo-b2cfb-default-rtdb.firebaseio.com/polizas.json?auth=GcodP2EQZtnTpArRIzEsd62pVgYcbRO3M1qjlEnq";
const EMAILJS_SERVICE_ID = "service_sbvs893";
const EMAILJS_TEMPLATE_ID = "template_gffiwwf";
const EMAILJS_PUBLIC_KEY = "-Ed9Y1UQA95iBMfTZ";
const CORREO_DESTINO = "foxandinaec@gmail.com";

function hacerPeticion(urlObj, options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(urlObj, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', (err) => reject(err));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function enviarCorreoEmailJS(paramsTemplate) {
    console.log(`📤 Enviando correo a ${paramsTemplate.to_email}...`);

    const payload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: paramsTemplate
    };

    const options = {
        hostname: 'api.emailjs.com',
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const res = await hacerPeticion('https://api.emailjs.com/api/v1.0/email/send', options, payload);
        if (res.status === 200) {
            console.log(" Correo enviado con éxito a través de EmailJS.");
        } else {
            console.log(` Error al enviar correo EmailJS. Código HTTP: ${res.status}, Respuesta: ${res.body}`);
        }
    } catch (err) {
        console.error(" Error de red al conectar con EmailJS:", err);
    }
}

async function ejecutarChequeoDiario() {
    console.log("Iniciando chequeo diario de pólizas en GitHub Actions...");

    try {
        const urlFirebase = new URL(FIREBASE_URL);
        const options = {
            hostname: urlFirebase.hostname,
            path: urlFirebase.pathname + urlFirebase.search,
            method: 'GET'
        };

        const res = await hacerPeticion(urlFirebase, options);

        if (res.status !== 200 || !res.body) {
            console.log(` No se pudieron obtener las pólizas de Firebase. (Código HTTP: ${res.status})`);
            return;
        }

        const datos = JSON.parse(res.body);
        if (!datos) {
            console.log(" Base de datos de pólizas vacía en Firebase.");
            return;
        }

        // Calcular fecha actual ajustada a la zona horaria de Ecuador (UTC-5)
        const ahora = new Date();
        const offsetEcuadorMs = 5 * 60 * 60 * 1000;
        const fechaEcuador = new Date(ahora.getTime() - offsetEcuadorMs);
        const hoyStr = fechaEcuador.toISOString().split("T")[0]; // YYYY-MM-DD

        const [hAno, hMes, hDia] = hoyStr.split("-").map(Number);
        const fechaHoy = new Date(hAno, hMes - 1, hDia);

        console.log(`Fecha del servidor ajustada a Ecuador: ${hoyStr}`);

        const keys = Object.keys(datos);
        let alertasEnviadas = 0;

        for (const key of keys) {
            const p = datos[key];
            const estadoNorm = String(p.estadoPoliza || "").toLowerCase();

            // Descartar pólizas inactivas/gestionadas
            if (estadoNorm.includes("renovad") || estadoNorm.includes("cancelad") || estadoNorm.includes("gestionad")) {
                continue;
            }

            const fechaFinStr = p.finVigencia || p.fechaFin;
            if (!fechaFinStr) continue;

            const partes = fechaFinStr.split("-");
            if (partes.length !== 3) continue;

            const fechaFin = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));

            // Diferencia en días
            const diffTime = fechaFin.getTime() - fechaHoy.getTime();
            const diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

            const numPoliza = p.numeroPoliza || p.numPoliza || p.poliza || "S/N";
            const clienteNombre = p.cliente || p.nombreCliente || "Cliente Registrado";

            console.log(`Póliza N° ${numPoliza} (${clienteNombre}): Faltan ${diasRestantes} días (Vence: ${fechaFinStr}).`);

            // Evaluar alertas exactas (10, 5 o 0 días)
            if (diasRestantes === 10 || diasRestantes === 5 || diasRestantes === 0) {
                console.log(` ¡Coincidencia de alerta hallada! Enviando correo para póliza N° ${numPoliza}...`);

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
                    datosCorreo.mensaje_cabecera = `Le recordamos que la póliza del cliente ${clienteNombre} está a 10 días de vencer.`;
                    datosCorreo.badge_estado = "Vence en 10 días";
                    datosCorreo.mensaje_pie = "Por favor, iniciar la gestión con el cliente.";
                } else if (diasRestantes === 5) {
                    datosCorreo.asunto_correo = `[Prioridad Alta] Póliza de ${clienteNombre} vence en 5 días`;
                    datosCorreo.nivel_urgencia = "AVISO PRIORITARIO";
                    datosCorreo.mensaje_cabecera = `Atención: Quedan únicamente 5 días para el vencimiento de la póliza de ${clienteNombre}.`;
                    datosCorreo.badge_estado = "Vence en 5 días";
                    datosCorreo.mensaje_pie = "Contactar directamente al cliente.";
                } else if (diasRestantes === 0) {
                    datosCorreo.asunto_correo = `[URGENTE HOY] La póliza de ${clienteNombre} vence HOY`;
                    datosCorreo.nivel_urgencia = "¡ALERTA DE VENCIMIENTO HOY!";
                    datosCorreo.mensaje_cabecera = `Alerta crítica: La póliza de ${clienteNombre} vence el día de hoy.`;
                    datosCorreo.badge_estado = "¡VENCE HOY!";
                    datosCorreo.mensaje_pie = "Realizar llamada o gestión prioritaria hoy mismo.";
                }

                await enviarCorreoEmailJS(datosCorreo);
                alertasEnviadas++;
            }
        }

        console.log(`Chequeo finalizado. Total de alertas enviadas: ${alertasEnviadas}`);

    } catch (error) {
        console.error(" Error inesperado durante el chequeo:", error);
    }
}

ejecutarChequeoDiario();

