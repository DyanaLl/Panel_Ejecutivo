const https = require('https');

// CONFIGURACIÓN DE TUS SERVICIOS
const FIREBASE_URL = "https://pagi-e6b7b-default-rtdb.firebaseio.com/polizas.json";
const EMAILJS_SERVICE_ID = "service_0l481se";
const EMAILJS_TEMPLATE_ID = "template_gffiwwf";
const EMAILJS_PUBLIC_KEY = "M3Yd5O6e614G0_6_N"; 
const CORREO_DESTINO = "milenalro2001@gmail.com";

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
    console.log("⏰ Iniciando chequeo de pólizas a las 11:00 AM...");

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

        const hoy = new Date();
        // Ajuste a zona horaria de Ecuador (UTC-5)
        const hoyEcuadorStr = hoy.toLocaleDateString("en-US", { timeZone: "America/Guayaquil" });
        const fechaHoy = new Date(hoyEcuadorStr);
        fechaHoy.setHours(0, 0, 0, 0);

        const keys = Object.keys(datos);

        for (const key of keys) {
            const p = datos[key];
            const estadoNorm = String(p.estadoPoliza || "").toLowerCase();

            // 🛑 Omitir si la póliza ya fue gestionada, renovada o cancelada
            if (estadoNorm.includes("renovad") || estadoNorm.includes("cancelad") || estadoNorm.includes("gestionad")) {
                continue;
            }

            if (!p.finVigencia) continue;

            // Formato esperado YYYY-MM-DD
            const partes = p.finVigencia.split("-");
            if (partes.length !== 3) continue;

            const fechaFin = new Date(partes[0], partes[1] - 1, partes[2]);
            fechaFin.setHours(0, 0, 0, 0);

            const diffTime = fechaFin.getTime() - fechaHoy.getTime();
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Evaluamos alertas exactas de 10, 5 o 0 días
            if (diasRestantes === 10 || diasRestantes === 5 || diasRestantes === 0) {
                console.log(`📌 Póliza N° ${p.numeroPoliza} requiere notificación (${diasRestantes} días restantes).`);

                const clienteNombre = p.cliente || p.nombreCliente || "Cliente Registrado";
                const numPoliza = p.numeroPoliza || p.numPoliza || p.poliza || "-";
                const fechaFinStr = p.finVigencia || "-";

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

                await enviarCorreoEmailJS(datosCorreo);
            }
        }

        console.log("Chequeo completado exitosamente.");

    } catch (error) {
        console.error("Error en el proceso diario:", error);
    }
}

ejecutarChequeoDiario();
