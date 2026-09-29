let instGraficoInicio = null;
let instGraficoSeccion = null;

function renderizarGraficoMovimiento() {
    // Renderiza la gráfica en la casita y en la sección de estadísticas
    dibujarGraficoEnCanvas("graficoInicio", "instGraficoInicio");
    dibujarGraficoEnCanvas("graficoVolumenSeguros", "instGraficoSeccion");
}

function dibujarGraficoEnCanvas(idCanvas, nombreInstancia) {
    const canvas = document.getElementById(idCanvas);
    if (!canvas) return;

    // 1. Tipos de seguro
    const tipos = [
        "Vehículos Livianos",
        "Vehículos Pesados",
        "Incendio",
        "Responsabilidad Civil"
    ];

    // 2. Calcular la suma TOTAL de pólizas por cada tipo desde el arreglo global 'polizas'
    const listaPolizas = typeof polizas !== "undefined" ? polizas : [];
    const totalesPorTipo = tipos.map(tipo => {
        return listaPolizas.filter(p => p.tipoPoliza === tipo).length;
    });

    // 3. Destruir gráfica previa si ya existía para evitar superposiciones
    if (nombreInstancia === "instGraficoInicio" && instGraficoInicio) {
        instGraficoInicio.destroy();
    } else if (nombreInstancia === "instGraficoSeccion" && instGraficoSeccion) {
        instGraficoSeccion.destroy();
    }

    // 4. Renderizar la gráfica de barras
    const ctx = canvas.getContext("2d");
    const nuevaGrafica = new Chart(ctx, {
        type: "bar",
        data: {
            labels: tipos,
            datasets: [{
                label: "Total de Pólizas",
                data: totalesPorTipo,
                backgroundColor: [
                    "rgba(37, 99, 235, 0.75)",   // Azul
                    "rgba(15, 23, 42, 0.75)",    // Oscuro
                    "rgba(217, 119, 6, 0.75)",   // Ámbar
                    "rgba(16, 185, 129, 0.75)"   // Verde
                ],
                borderColor: [
                    "#2563eb",
                    "#0f172a",
                    "#d97706",
                    "#10b981"
                ],
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Pólizas registradas: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 }
                    },
                    grid: { color: "#f1f5f9" }
                },
                x: {
                    ticks: { font: { size: 11, weight: "bold" } },
                    grid: { display: false }
                }
            }
        }
    });

    // Guardar referencia
    if (nombreInstancia === "instGraficoInicio") {
        instGraficoInicio = nuevaGrafica;
    } else {
        instGraficoSeccion = nuevaGrafica;
    }
}